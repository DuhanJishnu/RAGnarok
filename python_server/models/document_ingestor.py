import os
import uuid
import torch
from datetime import datetime
from typing import List, Dict, Any, Optional
from PyPDF2 import PdfReader
import docx
from PIL import Image
import pytesseract
from sentence_transformers import SentenceTransformer
from transformers import BlipProcessor, BlipForConditionalGeneration
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader, UnstructuredPowerPointLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from config import Config
from vosk import Model, KaldiRecognizer
import wave
import json
from pydub import AudioSegment
import noisereduce as nr
import numpy as np
from scipy.io import wavfile

class DocumentIngestor:
    def __init__(
        self,
        upload_folder: str,
        image_embedder_name: str = "clip-ViT-B-32",
        caption_model_name: str = "Salesforce/blip-image-captioning-large",
        device: str = "cpu",
        audio_model_path: str = "vosk-model-small-en-us-0.15"
    ):
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.upload_folder = upload_folder
        os.makedirs(upload_folder, exist_ok=True)

        # timestamp format for saved files
        self.ts_format = "%Y%m%d_%H%M%S"

        # initialize models
        self.text_embedder = OllamaEmbeddings(model=Config.EMBEDDING_MODEL)
        self.image_embedder = SentenceTransformer(image_embedder_name)
        self.caption_processor = BlipProcessor.from_pretrained(caption_model_name, use_fast = True)
        self.caption_model = BlipForConditionalGeneration.from_pretrained(caption_model_name).to(device)

        # text splitter for chunking extracted text
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        print(f"🔄 Loading Vosk model from: {audio_model_path}")
        self.vosk_model = Model(audio_model_path)

        print("✅ Vosk model loaded successfully.")

    # # ---------- file saving ----------
    # def save_uploaded_file(self, file) -> Dict[str, str]:
    #     """Save uploaded file with metadata (file is expected to have .save and .filename)"""
    #     file_id = str(uuid.uuid4())
    #     original_filename = file.filename
    #     file_extension = original_filename.split('.')[-1].lower()

    #     # Create filename with timestamp
    #     timestamp = datetime.now().strftime(self.ts_format)
    #     saved_filename = f"{file_id}_{timestamp}.{file_extension}"
    #     file_path = os.path.join(self.upload_folder, saved_filename)

    #     # Save file
    #     file.save(file_path)

    #     return {
    #         "file_id": file_id,
    #         "original_filename": original_filename,
    #         "saved_path": file_path,
    #         "file_extension": file_extension,
    #         "upload_timestamp": timestamp
    #     }

    # ---------- high-level ingest ----------
    def ingest_file(self, file_path: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and process file into structured chunks. Returns list of chunks (metadata + content).
        Each chunk is a dict:
          {
            "type": "text" | "image_caption" | "image_ocr" | "image",
            "content": "...",          # string (for images 'content' may be caption or ocr)
            "metadata": { ... },       # file_id, page/paragraph etc
            # after embed_chunks() is called we add "vector" field
          }
        """
        ext = file_path.lower().split('.')[-1]
        structured_chunks: List[Dict[str, Any]] = []

        # images
        if ext in ("png", "jpg", "jpeg", "bmp", "gif", "tiff", "webp"):
            img_chunks = self._process_image_file(file_path, file_metadata)
            structured_chunks.extend(img_chunks)
            return structured_chunks

        # PDF
        if ext == "pdf":
            structured_chunks.extend(self._extract_pdf_text(file_path, file_metadata))
            # Optionally: attempt to extract images from PDF pages (omitted for brevity)
            return structured_chunks

        # DOCX
        if ext == "docx":
            structured_chunks.extend(self._extract_docx_text(file_path, file_metadata))
            return structured_chunks
        # Audio (WAV)
        if ext in ("wav", "mp3", "flac", "m4a"):
            structured_chunks.extend(self._process_audio_file(file_path, file_metadata))
            return structured_chunks
        # PPTX / other unstructured via LangChain loaders
        if ext in ("pptx",):
            # use LangChain loader which will return Document objects with .page_content
            try:
                docs = UnstructuredPowerPointLoader(file_path).load()
                structured_chunks.extend(self._chunks_from_langchain_docs(docs, file_metadata))
            except Exception:
                # fallback: no content
                pass
            return structured_chunks

        # TXT
        if ext == "txt":
            structured_chunks.extend(self._extract_txt_text(file_path, file_metadata))
            return structured_chunks

        # fallback: try LangChain PDF/DOC loader
        try:
            docs = []
            if ext == "pdf":
                docs = PyPDFLoader(file_path).load()
            elif ext == "docx":
                docs = UnstructuredWordDocumentLoader(file_path).load()
            if docs:
                structured_chunks.extend(self._chunks_from_langchain_docs(docs, file_metadata))
        except Exception:
            pass

        return structured_chunks

    # ---------- low-level extractors ----------
    def _extract_pdf_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Extract PDF text with page-level metadata and chunk pages."""
        text_blocks: List[Dict] = []
        pdf_reader = PdfReader(file_path)
        total_pages = len(pdf_reader.pages)

        for page_num, page in enumerate(pdf_reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                # split page content into chunks
                docs = [{"page_content": text}]
                chunks = self._chunks_from_langchain_docs(docs, file_metadata, page_number=page_num, total_pages=total_pages)
                text_blocks.extend(chunks)

        return text_blocks

    def _extract_docx_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Extract DOCX text with paragraph-level metadata and chunk paragraphs."""
        blocks: List[Dict] = []
        doc = docx.Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        # combine paragraphs into pseudo-documents for splitter
        combined = "\n\n".join(paragraphs)
        docs = [{"page_content": combined}]
        blocks.extend(self._chunks_from_langchain_docs(docs, file_metadata, total_paragraphs=len(paragraphs)))
        return blocks

    def _extract_txt_text(self, file_path: str, file_metadata: Dict) -> List[Dict]:
        """Return one chunk containing entire text file (you can split further if desired)."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return [{
            "type": "text",
            "content": content,
            "metadata": {
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "chunk_type": "full_text",
                "upload_timestamp": file_metadata["upload_timestamp"],
                "source_url": f"/documents/{file_metadata['file_id']}"
            }
        }]

    def _process_image_file(self, image_path: str, file_metadata: Dict) -> List[Dict]:
        """Run OCR + caption on an image and return structured chunks."""
        img = Image.open(image_path).convert("RGB")

        # OCR
        try:
            ocr_text = pytesseract.image_to_string(img)
        except Exception:
            ocr_text = ""

        # Caption (BLIP)
        caption = ""
        try:
            inputs = self.caption_processor(images=img, return_tensors="pt")
            out = self.caption_model.generate(**inputs)
            caption = self.caption_processor.decode(out[0], skip_special_tokens=True)
        except Exception:
            caption = ""

        # Build chunks: caption, ocr, and image "object"
        chunks: List[Dict[str, Any]] = []
        if caption:
            chunks.append({
                "type": "image_caption",
                "content": caption,
                "metadata": {
                    "chunk_id": str(uuid.uuid4()),
                    "file_id": file_metadata["file_id"],
                    "original_filename": file_metadata["original_filename"],
                    "chunk_type": "image_caption",
                    "upload_timestamp": file_metadata["upload_timestamp"],
                    "source_url": f"/documents/{file_metadata['file_id']}"
                }
            })
        if ocr_text and ocr_text.strip():
            chunks.append({
                "type": "image_ocr",
                "content": ocr_text,
                "metadata": {
                    "chunk_id": str(uuid.uuid4()),
                    "file_id": file_metadata["file_id"],
                    "original_filename": file_metadata["original_filename"],
                    "chunk_type": "image_ocr",
                    "upload_timestamp": file_metadata["upload_timestamp"],
                    "source_url": f"/documents/{file_metadata['file_id']}"
                }
            })

        # image-level chunk (we store minimal textual metadata so it can be re-ranked using image embeddings)
        chunks.append({
            "type": "image",
            "content": caption or "",  # keep caption as lightweight text content
            "metadata": {
                "chunk_id": str(uuid.uuid4()),
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "chunk_type": "image_raw",
                "upload_timestamp": file_metadata["upload_timestamp"],
                "local_path": image_path,
                "source_url": f"/documents/{file_metadata['file_id']}"
            },
            # store the PIL image object for later embedding (not serializable) — remove before storing to DB
            "_image_obj": img
        })

        return chunks

    def _chunks_from_langchain_docs(self, docs: List[Dict[str, Any]], file_metadata: Dict[str, Any], page_number: Optional[int] = None, total_pages: Optional[int] = None, total_paragraphs: Optional[int]=None) -> List[Dict]:
        """
        Given a list of langchain-like docs (each with 'page_content'), split into smaller chunks
        and return our chunk schema.
        """
        combined_docs = []
        for d in docs:
            combined_docs.append(d["page_content"])

        # use text splitter on combined docs
        split_docs = self.splitter.split_text("\n\n".join(combined_docs))
        chunks: List[Dict] = []
        for i, chunk_text in enumerate(split_docs):
            meta = {
                "file_id": file_metadata["file_id"],
                "original_filename": file_metadata["original_filename"],
                "chunk_type": "text",
                "chunk_id": str(uuid.uuid4()),
                "upload_timestamp": file_metadata["upload_timestamp"],
            }
            if page_number:
                meta["page_number"] = page_number
                meta["total_pages"] = total_pages
            if total_paragraphs:
                meta["total_paragraphs"] = total_paragraphs

            chunks.append({
                "type": "text",
                "content": chunk_text,
                "metadata": meta
            })
        return chunks

    # ---------- embedding helpers ----------
    def embed_chunks(self, chunks: List[Dict[str, Any]], remove_image_obj: bool = True) -> List[Dict[str, Any]]:
        """
        Add 'embedding' field to each chunk. For 'text' / 'image_caption' / 'image_ocr'
        we use text_embedder. For 'image' chunk we use image_embedder on the stored PIL
        object (in _image_obj).
        Returns new list with vectors attached.
        """
        
        text_contents = []
        text_indices = []
        
        # Separate text and image chunks
        for i, chunk in enumerate(chunks):
            c = dict(chunk)  # shallow copy
            c.pop("vector", None)  # remove any existing vector

            try:
                if c["type"] in ("text", "image_caption", "image_ocr"):
                    # encode text
                    vec = self.text_embedder.encode(c["content"], convert_to_numpy=True)
                    c["vector"] = vec.tolist()
                    c["vector_dim"] = int(vec.shape[0])
                elif c["type"] == "image":
                    # image embedding (expects np array or PIL)
                    img_obj = c.get("_image_obj")
                    if img_obj is None and "local_path" in c["metadata"]:
                        try:
                            img_obj = Image.open(c["metadata"]["local_path"]).convert("RGB")
                        except Exception:
                            img_obj = None
                    if img_obj is not None:
                        # some SentenceTransformer image models accept PIL or np.array
                        vec = self.image_embedder.encode(img_obj, convert_to_numpy=True)
                        c["vector"] = vec.tolist()
                        c["vector_dim"] = int(vec.shape[0])
                    else:
                        # fallback: embed caption/text field for image
                        vec = self.text_embedder.encode(c.get("content","", convert_to_numpy=True))
                        c["vector"] = vec.tolist()
                        c["vector_dim"] = int(vec.shape[0])
                else:
                    # Fallback for image: embed caption/text field
                    fallback_embedding = self.text_embedder.embed_query(chunk.get("content", ""))
                    chunk["embedding"] = fallback_embedding
                    chunk["embedding_dim"] = len(fallback_embedding)

            # Final check for any unprocessed chunks
            if "embedding" not in chunk:
                try:
                    fallback_embedding = self.text_embedder.embed_query(chunk.get("content", ""))
                    chunk["embedding"] = fallback_embedding
                    chunk["embedding_dim"] = len(fallback_embedding)
                except Exception as e:
                    import numpy as _np
                    dim = 768 # default for nomic
                    chunk["embedding"] = _np.zeros(dim).tolist()
                    chunk["embedding_dim"] = dim
                    chunk["embed_error"] = str(e)

            # drop the PIL image object before returning (not serializable)
            if remove_image_obj and "_image_obj" in chunk:
                chunk.pop("_image_obj", None)

        return chunks

    # ---------- audio processing ----------
    def _process_audio_file(self, file_path: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        transcript = self._transcribe_audio_vosk(file_path)
        if not transcript.strip():
            return []

        chunks = self.splitter.split_text(transcript)
        structured_chunks = []
        for i, chunk_text in enumerate(chunks):
            structured_chunks.append({
                "type": "audio_transcript",
                "content": chunk_text,
                "metadata": {
                    "file_id": file_metadata["file_id"],
                    "original_filename": file_metadata["original_filename"],
                    "chunk_type": "audio_transcript",
                    "chunk_id": i,
                    "upload_timestamp": file_metadata["upload_timestamp"],
                    "source_url": f"/documents/{file_metadata['file_id']}"
                }
            })
        return structured_chunks

    def _transcribe_audio_vosk(self, file_path: str) -> str:
        base = os.path.splitext(file_path)[0]
        normalized_path = base + "_16k.wav"
        AudioSegment.from_file(file_path).set_frame_rate(16000).set_channels(1).export(normalized_path, format="wav")
        file_path = normalized_path

        try:
            rate, data = wavfile.read(file_path)
            if len(data.shape) > 1:
                data = data[:, 0]

            noise_level = np.mean(np.abs(data[:rate]))
            if noise_level > 500:
                reduced = nr.reduce_noise(y=data, sr=rate)
                denoised_path = base + "_denoised.wav"
                wavfile.write(denoised_path, rate, reduced.astype(np.int16))
                file_path = denoised_path

        except Exception:
            pass

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

# -------------------------
# Example usage
# -------------------------
if __name__ == "__main__":
    ingestor = DocumentIngestor(upload_folder="./uploads")

    # 1) If you have a file-like object from a web framework:
    # saved = ingestor.save_uploaded_file(request.files["file"])
    # file_path = saved["saved_path"]

    # 2) If you have a local sample image/pdf:
    sample_image_path = "../python_server/uploads/sample/sample.jpg"
    sample_pdf_path = "../uploads/sample/sample.pdf"
    sample_audio_path = "../uploads/sample/smaple.mp3"
    sample_doc_path = "../uploads/sample/sample.doc"
    sample_audio_path = "sample.wav" #replace with real path

    # create minimal metadata
    meta_image = {
        "file_id": str(uuid.uuid4()),
        "original_filename": os.path.basename(sample_image_path),
        "upload_timestamp": datetime.now().strftime(ingestor.ts_format),
        "file_extension": sample_image_path.split(".")[-1].lower()
    }

    # process image
    chunks = ingestor.ingest_file(sample_image_path, meta_image)
    print(chunks)
    chunks_with_vectors = ingestor.embed_chunks(chunks)
    print(chunks_with_vectors)    
    # chunks = ingestor._process_audio_file(file_path, file_metadata)

    for c in chunks_with_vectors:
        print(f"Chunk {c['metadata'].get('chunk_id', 'N/A')}: {c['content'][:50]}... Vector dim: {c.get('vector_dim', 'N/A')}")


    # Now chunks_with_vectors contains vector-ready entries you can upsert to any vector DB.
    # Example item:
    # {
    #   "type":"image_caption",
    #   "content":"a cat on a sofa",
    #   "metadata":{...},
    #   "vector":[...],
    #   "vector_dim":384
    # }