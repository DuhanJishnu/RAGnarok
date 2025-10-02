import os
import uuid
import json
import wave
from datetime import datetime
from typing import List, Dict, Any, Optional

import torch
import numpy as np
from scipy.io import wavfile
import pytesseract
import noisereduce as nr
from PIL import Image
from PyPDF2 import PdfReader
import docx
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer
from sentence_transformers import SentenceTransformer
from transformers import BlipProcessor, BlipForConditionalGeneration
from langchain_community.document_loaders import (
    PyPDFLoader, 
    UnstructuredWordDocumentLoader, 
    UnstructuredPowerPointLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings

from config import Config


class DocumentIngestor:
    """Handles ingestion and processing of various document types including text, images, and audio."""
    
    def __init__(
        self,
        upload_folder: str,
        image_embedder_name: str = "clip-ViT-B-32",
        caption_model_name: str = "Salesforce/blip-image-captioning-large",
        device: Optional[str] = None,
        audio_model_path: str = "vosk-model-small-en-us-0.15"
    ):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.upload_folder = upload_folder
        self.ts_format = "%Y%m%d_%H%M%S"
        
        os.makedirs(upload_folder, exist_ok=True)
        self._initialize_models(image_embedder_name, caption_model_name, audio_model_path)
        self._initialize_text_processor()

    def _initialize_models(self, image_embedder_name: str, caption_model_name: str, audio_model_path: str):
        """Initialize all required models and processors."""
        # Text embedding model
        self.text_embedder = OllamaEmbeddings(model=Config.EMBEDDING_MODEL)
        
        # Image models
        self.image_embedder = SentenceTransformer(image_embedder_name)
        self.caption_processor = BlipProcessor.from_pretrained(caption_model_name, use_fast=True)
        self.caption_model = BlipForConditionalGeneration.from_pretrained(caption_model_name).to(self.device)
        
        # Audio model
        print(f"🔄 Loading Vosk model from: {audio_model_path}")
        self.vosk_model = Model(audio_model_path)
        print("✅ Vosk model loaded successfully.")

    def _initialize_text_processor(self):
        """Initialize text splitting and processing components."""
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    def ingest_file(self, file_path: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and process file into structured chunks.
        
        Args:
            file_path: Path to the file to process
            file_metadata: Metadata about the file
            
        Returns:
            List of processed chunks with metadata and content
        """
        file_ext = file_path.lower().split('.')[-1]
        structured_chunks: List[Dict[str, Any]] = []

        processors = {
            'image': self._process_image_file,
            'pdf': self._extract_pdf_text,
            'docx': self._extract_docx_text,
            'audio': self._process_audio_file,
            'pptx': self._process_pptx_file,
            'txt': self._extract_txt_text
        }

        # Determine file type and process accordingly
        if file_ext in ("png", "jpg", "jpeg", "bmp", "gif", "tiff", "webp"):
            structured_chunks.extend(processors['image'](file_path, file_metadata))
        elif file_ext == "pdf":
            structured_chunks.extend(processors['pdf'](file_path, file_metadata))
        elif file_ext == "docx":
            structured_chunks.extend(processors['docx'](file_path, file_metadata))
        elif file_ext in ("wav", "mp3", "flac", "m4a"):
            structured_chunks.extend(processors['audio'](file_path, file_metadata))
        elif file_ext == "pptx":
            structured_chunks.extend(processors['pptx'](file_path, file_metadata))
        elif file_ext == "txt":
            structured_chunks.extend(processors['txt'](file_path, file_metadata))
        else:
            # Fallback processing for unsupported types
            structured_chunks.extend(self._fallback_processing(file_path, file_metadata, file_ext))

        return structured_chunks

    def _process_image_file(self, image_path: str, file_metadata: Dict) -> List[Dict]:
        """Process image file to extract caption and OCR text."""
        img = Image.open(image_path).convert("RGB")
        
        # Extract OCR text
        ocr_text = self._extract_ocr_text(img)
        
        # Generate image caption
        caption = self._generate_image_caption(img)
        
        return self._create_image_chunks(file_metadata, image_path, img, caption, ocr_text)

    def _extract_ocr_text(self, img: Image.Image) -> str:
        """Extract text from image using OCR."""
        try:
            return pytesseract.image_to_string(img).strip()
        except Exception:
            return ""

    def _generate_image_caption(self, img: Image.Image) -> str:
        """Generate caption for image using BLIP model."""
        try:
            inputs = self.caption_processor(images=img, return_tensors="pt")
            out = self.caption_model.generate(**inputs)
            return self.caption_processor.decode(out[0], skip_special_tokens=True)
        except Exception:
            return ""

    def _create_image_chunks(self, file_metadata: Dict, image_path: str, img: Image.Image, 
                           caption: str, ocr_text: str) -> List[Dict]:
        """Create structured chunks for image data."""
        chunks = []
        
        if caption:
            chunks.append(self._create_chunk(
                chunk_type="image_caption",
                content=caption,
                file_metadata=file_metadata,
                additional_metadata={"chunk_type": "image_caption"}
            ))
        
        if ocr_text:
            chunks.append(self._create_chunk(
                chunk_type="image_ocr",
                content=ocr_text,
                file_metadata=file_metadata,
                additional_metadata={"chunk_type": "image_ocr"}
            ))
        
        # Image object chunk
        chunks.append({
            "type": "image",
            "content": caption or "",
            "metadata": {
                "chunk_id": str(uuid.uuid4()),
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "chunk_type": "image_raw",
                "upload_timestamp": file_metadata["upload_timestamp"],
                "local_path": image_path,
                "source_url": f"/documents/{file_metadata['file_id']}"
            },
            "_image_obj": img
        })
        
        return chunks

    def _extract_pdf_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Extract text from PDF with page-level metadata."""
        text_blocks = []
        pdf_reader = PdfReader(file_path)
        total_pages = len(pdf_reader.pages)

        for page_num, page in enumerate(pdf_reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                docs = [{"page_content": text}]
                chunks = self._chunks_from_langchain_docs(
                    docs, file_metadata, 
                    page_number=page_num, 
                    total_pages=total_pages
                )
                text_blocks.extend(chunks)

        return text_blocks

    def _extract_docx_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Extract text from DOCX file with paragraph-level metadata."""
        doc = docx.Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        combined = "\n\n".join(paragraphs)
        docs = [{"page_content": combined}]
        
        return self._chunks_from_langchain_docs(
            docs, file_metadata, 
            total_paragraphs=len(paragraphs)
        )

    def _extract_txt_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Extract text from TXT file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return [self._create_chunk(
            chunk_type="text",
            content=content,
            file_metadata=file_metadata,
            additional_metadata={"chunk_type": "full_text"}
        )]

    def _process_audio_file(self, file_path: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process audio file and extract transcript."""
        transcript = self._transcribe_audio_vosk(file_path)
        if not transcript.strip():
            return []

        chunks = self.splitter.split_text(transcript)
        structured_chunks = []
        
        for i, chunk_text in enumerate(chunks):
            structured_chunks.append(self._create_chunk(
                chunk_type="audio_transcript",
                content=chunk_text,
                file_metadata=file_metadata,
                additional_metadata={
                    "chunk_type": "audio_transcript",
                    "chunk_id": i
                }
            ))
            
        return structured_chunks

    def _process_pptx_file(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Process PowerPoint files using LangChain loader."""
        try:
            docs = UnstructuredPowerPointLoader(file_path).load()
            return self._chunks_from_langchain_docs(docs, file_metadata)
        except Exception as e:
            print(f"Error processing PPTX file: {e}")
            return []

    def _fallback_processing(self, file_path: str, file_metadata: Dict, file_ext: str) -> List[Dict]:
        """Fallback processing for unsupported file types using LangChain loaders."""
        try:
            docs = []
            if file_ext == "pdf":
                docs = PyPDFLoader(file_path).load()
            elif file_ext == "docx":
                docs = UnstructuredWordDocumentLoader(file_path).load()
            
            if docs:
                return self._chunks_from_langchain_docs(docs, file_metadata)
        except Exception as e:
            print(f"Fallback processing failed for {file_path}: {e}")
        
        return []

    def _chunks_from_langchain_docs(self, docs: List[Dict[str, Any]], 
                                  file_metadata: Dict[str, Any], 
                                  **additional_metadata) -> List[Dict]:
        """Convert LangChain documents to structured chunks."""
        combined_content = "\n\n".join([doc["page_content"] for doc in docs])
        split_docs = self.splitter.split_text(combined_content)
        chunks = []
        
        for i, chunk_text in enumerate(split_docs):
            meta = {
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "chunk_type": "text",
                "chunk_id": str(uuid.uuid4()),
                "upload_timestamp": file_metadata["upload_timestamp"],
                **additional_metadata
            }
            
            chunks.append({
                "type": "text",
                "content": chunk_text,
                "metadata": meta
            })
            
        return chunks

    def _create_chunk(self, chunk_type: str, content: str, 
                     file_metadata: Dict, additional_metadata: Dict) -> Dict:
        """Create a standardized chunk structure."""
        return {
            "type": chunk_type,
            "content": content,
            "metadata": {
                "chunk_id": str(uuid.uuid4()),
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "upload_timestamp": file_metadata["upload_timestamp"],
                "source_url": f"/documents/{file_metadata['file_id']}",
                **additional_metadata
            }
        }

    def _transcribe_audio_vosk(self, file_path: str) -> str:
        """Transcribe audio file using Vosk speech recognition."""
        # Only convert non-WAV files or WAV files that need processing
        if not file_path.lower().endswith('.wav'):
            base = os.path.splitext(file_path)[0]
            normalized_path = base + "_16k.wav"
            AudioSegment.from_file(file_path).set_frame_rate(16000).set_channels(1).export(
                normalized_path, format="wav"
            )
            file_path = normalized_path
        else:
            # Check if WAV file needs processing
            try:
                with wave.open(file_path, 'rb') as wf:
                    if wf.getframerate() != 16000 or wf.getnchannels() != 1:
                        base = os.path.splitext(file_path)[0]
                        normalized_path = base + "_16k.wav"
                        AudioSegment.from_wav(file_path).set_frame_rate(16000).set_channels(1).export(
                            normalized_path, format="wav"
                        )
                        file_path = normalized_path
            except Exception as e:
                print(f"Error checking WAV file: {e}")

        # Apply noise reduction if needed
        file_path = self._apply_noise_reduction(file_path)

        # Perform speech recognition
        return self._recognize_speech(file_path)

    def _apply_noise_reduction(self, file_path: str) -> str:
        """Apply noise reduction to audio file if needed."""
        try:
            rate, data = wavfile.read(file_path)
            if len(data.shape) > 1:
                data = data[:, 0]

            noise_level = np.mean(np.abs(data[:rate]))
            if noise_level > 500:
                reduced = nr.reduce_noise(y=data, sr=rate)
                base = os.path.splitext(file_path)[0]
                denoised_path = base + "_denoised.wav"
                wavfile.write(denoised_path, rate, reduced.astype(np.int16))
                return denoised_path
        except Exception as e:
            print(f"Noise reduction failed: {e}")
            
        return file_path

    def _recognize_speech(self, file_path: str) -> str:
        """Perform speech recognition on audio file."""
        wf = wave.open(file_path, "rb")
        rate = wf.getframerate()
        rec = KaldiRecognizer(self.vosk_model, rate)
        rec.SetWords(True)

        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                if "text" in result and result["text"].strip():
                    results.append(result["text"])

        final = json.loads(rec.FinalResult())
        if "text" in final and final["text"].strip():
            results.append(final["text"])

        wf.close()
        return " ".join(results).strip()

    def embed_chunks(self, chunks: List[Dict[str, Any]], remove_image_obj: bool = True) -> List[Dict[str, Any]]:
        """
        Add embeddings to chunks based on their type.
        
        Args:
            chunks: List of chunks to embed
            remove_image_obj: Whether to remove PIL image objects after embedding
            
        Returns:
            List of chunks with embedded vectors
        """
        embedded_chunks = []
        
        for chunk in chunks:
            embedded_chunk = self._embed_single_chunk(chunk)
            if remove_image_obj:
                embedded_chunk.pop("_image_obj", None)
            embedded_chunks.append(embedded_chunk)
            
        return embedded_chunks

    def _embed_single_chunk(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """Embed a single chunk based on its type."""
        chunk = dict(chunk)  # Shallow copy
        chunk.pop("vector", None)  # Remove existing vector
        
        try:
            if chunk["type"] in ("text", "image_caption", "image_ocr"):
                # Text-based embedding
                vec = self.text_embedder.embed_query(chunk["content"])
                chunk["embedding"] = vec
                chunk["embedding_dim"] = len(vec)
                
            elif chunk["type"] == "image":
                # Image embedding
                img_obj = chunk.get("_image_obj")
                if img_obj is not None:
                    vec = self.image_embedder.encode(img_obj, convert_to_numpy=True)
                    chunk["embedding"] = vec.tolist()
                    chunk["embedding_dim"] = int(vec.shape[0])
                else:
                    # Fallback to text embedding
                    fallback_embedding = self.text_embedder.embed_query(chunk.get("content", ""))
                    chunk["embedding"] = fallback_embedding
                    chunk["embedding_dim"] = len(fallback_embedding)
                    
            else:
                # Default fallback
                fallback_embedding = self.text_embedder.embed_query(chunk.get("content", ""))
                chunk["embedding"] = fallback_embedding
                chunk["embedding_dim"] = len(fallback_embedding)
                
        except Exception as e:
            # Final error handling
            chunk = self._handle_embedding_error(chunk, e)
            
        return chunk

    def _handle_embedding_error(self, chunk: Dict[str, Any], error: Exception) -> Dict[str, Any]:
        """Handle embedding errors by providing fallback embeddings."""
        import numpy as np
        
        try:
            fallback_embedding = self.text_embedder.embed_query(chunk.get("content", ""))
            chunk["embedding"] = fallback_embedding
            chunk["embedding_dim"] = len(fallback_embedding)
        except Exception:
            # Ultimate fallback - zero vector
            dim = 768  # Default dimension for nomic
            chunk["embedding"] = np.zeros(dim).tolist()
            chunk["embedding_dim"] = dim
            
        chunk["embed_error"] = str(error)
        return chunk


# Example usage
if __name__ == "__main__":
    ingestor = DocumentIngestor(upload_folder="./uploads")

    # Test with sample files
    sample_image_path = "sample.jpg"
    sample_pdf_path = "sample.pdf"
    sample_audio_path = "sample.wav"

    # Create minimal metadata
    meta_image = {
        "file_id": str(uuid.uuid4()),
        "original_filename": os.path.basename(sample_image_path),
        "upload_timestamp": datetime.now().strftime(ingestor.ts_format),
        "file_extension": sample_image_path.split(".")[-1].lower()
    }

    # Process file
    if os.path.exists(sample_image_path):
        chunks = ingestor.ingest_file(sample_image_path, meta_image)
        chunks_with_vectors = ingestor.embed_chunks(chunks)
        
        for c in chunks_with_vectors:
            print(f"Chunk {c['metadata'].get('chunk_id', 'N/A')}: {c['content'][:50]}... "
                  f"Embedding dim: {c.get('embedding_dim', 'N/A')}")