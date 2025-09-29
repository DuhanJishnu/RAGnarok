import os
import uuid
from datetime import datetime
from typing import List, Dict, Any
import speech_recognition as sr
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import noisereduce as nr
import librosa
import soundfile as sf
from pydub import AudioSegment


class AudioIngestor:
    def __init__(
        self,
        upload_folder: str,
        text_embedder_name: str = "all-MiniLM-L6-v2"
    ):
        self.upload_folder = upload_folder
        os.makedirs(upload_folder, exist_ok=True)

        self.ts_format = "%Y%m%d_%H%M%S"
        self.recognizer = sr.Recognizer()
        self.text_embedder = SentenceTransformer(text_embedder_name)
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    # ---------- file saving ----------
    def save_uploaded_file(self, file) -> Dict[str, str]:
        file_id = str(uuid.uuid4())
        original_filename = file.filename
        file_extension = original_filename.split('.')[-1].lower()

        timestamp = datetime.now().strftime(self.ts_format)
        saved_filename = f"{file_id}_{timestamp}.{file_extension}"
        file_path = os.path.join(self.upload_folder, saved_filename)
        file.save(file_path)

        return {
            "file_id": file_id,
            "original_filename": original_filename,
            "saved_path": file_path,
            "file_extension": file_extension,
            "upload_timestamp": timestamp
        }

    # ---------- main ingestion ----------
    def ingest_file(self, file_path: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        ext = file_path.lower().split('.')[-1]
        if ext not in ("wav", "mp3", "flac", "m4a"):
            raise ValueError(f"Unsupported audio format: {ext}")

        transcript = self._transcribe_audio(file_path)
        chunks = self.splitter.split_text(transcript)

        structured_chunks: List[Dict[str, Any]] = []
        for i, chunk_text in enumerate(chunks):
            structured_chunks.append({
                "type": "audio_transcript",
                "content": chunk_text,
                "metadata": {
                    "file_id": file_metadata["file_id"],
                    "original_filename": file_metadata["original_filename"],
                    "chunk_type": "transcript",
                    "chunk_id": i,
                    "upload_timestamp": file_metadata["upload_timestamp"],
                    "source_url": f"/documents/{file_metadata['file_id']}"
                }
            })
        return structured_chunks

    # ---------- low-level STT ----------
    def _transcribe_audio(self, file_path: str) -> str:
        """Transcribe using Google Web Speech API with noise reduction."""

        # Convert to WAV if needed
        ext = file_path.split('.')[-1].lower()
        if ext != "wav":
            wav_path = os.path.splitext(file_path)[0] + ".wav"
            AudioSegment.from_file(file_path).export(wav_path, format="wav")
            file_path = wav_path

        # Load audio
        y, sample_rate = librosa.load(file_path, sr=None)

        # Reduce noise
        y_denoised = nr.reduce_noise(y=y, sr=sample_rate)

        # Save temporary cleaned file
        base = os.path.splitext(file_path)[0]
        temp_path = f"{base}_cleaned.wav"
        sf.write(temp_path, y_denoised, sample_rate)

        # Transcribe with speech_recognition
        with sr.AudioFile(temp_path) as source:
            audio_data = self.recognizer.record(source)

        try:
            transcript = self.recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            transcript = ""
        except sr.RequestError as e:
            raise RuntimeError(f"Speech recognition API unavailable: {e}")

        # Remove temporary file
        os.remove(temp_path)
        return transcript

    # ---------- embedding ----------
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        processed = []
        for c in chunks:
            chunk_copy = dict(c)
            try:
                vec = self.text_embedder.encode(chunk_copy["content"], convert_to_numpy=True)
                chunk_copy["vector"] = vec.tolist()
                chunk_copy["vector_dim"] = int(vec.shape[0])
            except Exception as e:
                import numpy as np
                dim = self.text_embedder.get_sentence_embedding_dimension()
                chunk_copy["vector"] = np.zeros(dim).tolist()
                chunk_copy["vector_dim"] = dim
                chunk_copy["embed_error"] = str(e)

            processed.append(chunk_copy)
        return processed


# -------------------------
# Example usage
# -------------------------
if __name__ == "__main__":
    ingestor = AudioIngestor(upload_folder="./uploads")

    sample_audio_path = "./uploads/test_audio.wav"  # replace with real path

    meta_audio = {
        "file_id": str(uuid.uuid4()),
        "original_filename": os.path.basename(sample_audio_path),
        "upload_timestamp": datetime.now().strftime(ingestor.ts_format),
        "file_extension": sample_audio_path.split(".")[-1].lower()
    }

    chunks = ingestor.ingest_file(sample_audio_path, meta_audio)
    chunks_with_vectors = ingestor.embed_chunks(chunks)

    if chunks_with_vectors:
        print(chunks_with_vectors[0])
