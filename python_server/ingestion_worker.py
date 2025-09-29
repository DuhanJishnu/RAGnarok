"""
Ingestion Worker for Parallel Document Processing
"""
import logging
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from api_client.api_client import get_files_from_api, update_status_via_api
from models.document_ingestor import DocumentIngestor
from models.vector_store import VectorDB

class IngestionProcessor:
    """Processes a single document for ingestion."""
    def __init__(self, ingestor: DocumentIngestor, vector_db: VectorDB):
        self.ingestor = ingestor
        self.vector_db = vector_db

    def process(self, file_path: str) -> None:
        """Process a single file and add it to the vector DB."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_metadata = {
            "file_id": os.path.basename(file_path),
            "original_filename": os.path.basename(file_path),
            "saved_path": file_path,
            "upload_timestamp": os.path.getmtime(file_path)
        }

        chunks = self.ingestor.ingest_file(file_path, file_metadata)
        embedded_chunks = self.ingestor.embed_chunks(chunks)

        if embedded_chunks:
            self.vector_db.add_documents(embedded_chunks)

def process_batch_parallel(file_paths: List[str], ingestor: DocumentIngestor, vector_db: VectorDB, max_workers: int = 4):
    """Process a batch of files in parallel."""
    processor = IngestionProcessor(ingestor, vector_db)
    successful_files = []
    failed_files = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_file = {executor.submit(processor.process, file_path): file_path for file_path in file_paths}

        for future in as_completed(future_to_file):
            file_path = future_to_file[future]
            try:
                future.result()
                successful_files.append(file_path)
            except Exception as e:
                logging.error(f"Error processing {file_path}: {e}")
                failed_files[file_path] = str(e)
    
    return successful_files, failed_files

def start_worker_service(batch_size: int = 10, poll_interval: int = 10, max_workers: int = 4):
    """Main continuous loop for the processing worker service."""
    logging.info("Ingestion worker service starting.")

    ingestor = DocumentIngestor(upload_folder="./uploads")
    vector_db = VectorDB()
    vector_db.load()

    while True:
        try:
            files_to_process = get_files_from_api(batch_size)

            if not files_to_process:
                logging.info(f"No pending files found. Sleeping for {poll_interval} seconds...")
                time.sleep(poll_interval)
                continue

            logging.info(f"Fetched {len(files_to_process)} files for processing.")

            successful_files, failed_files = process_batch_parallel(files_to_process, ingestor, vector_db, max_workers)

            # Report status back to the API
            for file_path in successful_files:
                update_status_via_api(file_path, success=True)
            for file_path, error_msg in failed_files.items():
                update_status_via_api(file_path, success=False, error_msg=error_msg)

            # Save the updated vector database to disk
            if successful_files:
                vector_db.save()

        except Exception as e:
            logging.critical(f"An unhandled exception occurred in the worker loop: {e}", exc_info=True)
            time.sleep(poll_interval)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    start_worker_service()
