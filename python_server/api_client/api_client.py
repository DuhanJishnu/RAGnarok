import os
import re
import uuid
import logging
import mimetypes
import requests
import urllib.parse
from typing import List, Dict, Any, Optional

API_BASE_URL = os.environ.get("API_URL")

def get_files_from_api(batch_size: int) -> List[str]:
    """
    Fetch doc metadata from backend, download each file named by its documentEncryptedId,
    and return absolute saved paths.
    """
    try:
        endpoint = f"{API_BASE_URL}/api/file/v1/unprocessed"
        params = {"batch_size": batch_size}
        resp = requests.get(endpoint, params=params, timeout=15)
        resp.raise_for_status()

        files = resp.json()
        if not isinstance(files, list):
            logging.warning("API returned non-list data: %s", files)
            return []

        saved_paths = []
        for doc in files:
            if not isinstance(doc, dict):
                continue
            doc_id = doc.get("documentEncryptedId")
            doc_type = doc.get("documentType")
            if not doc_id:
                logging.warning("Skipping doc without documentEncryptedId: %s", doc)
                continue

            url = f"{API_BASE_URL}/api/file/v1/files/{doc_id}"
            saved = download_file(url, doc_id, doc_type)
            if saved:
                saved_paths.append(saved)

        return saved_paths

    except requests.RequestException as e:
        logging.error("Error fetching files from API: %s", e)
        return []

def convert_docs_to_paths(files):
    if isinstance(files, list):
        file_paths = [
            f"{API_BASE_URL}/api/file/v1/files/{doc['documentEncryptedId']}"
            for doc in files if isinstance(doc, dict) and "documentEncryptedId" in doc
        ]
        return file_paths
    return files


def download_file(url: str, document_id: str, document_type: str) -> Optional[str]:
    """
    Download `url` and save it to uploads/<document_id>{.ext_if_detected}.
    Returns absolute path to saved file or None on failure.
    """
    try:
        resp = requests.get(url, stream=True, timeout=60)
        resp.raise_for_status()

        # uploads folder relative to project root (one level up from this file)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        uploads_folder = os.path.join(project_root, "uploads")
        doc_type_upload_folder = os.path.join(uploads_folder, str(document_type) or "others")
        os.makedirs(doc_type_upload_folder, exist_ok=True)

        content_type = resp.headers.get("content-type", "")
        ext = mimetypes.guess_extension(content_type.split(";")[0].strip() or "") or ""

        # Build filename using document id
        filename = f"{document_id}{ext}"
        save_path = os.path.join(doc_type_upload_folder, filename)

        # Write stream to disk
        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        logging.info("Saved file %s", save_path)
        return save_path

    except requests.RequestException as e:
        logging.error("HTTP error while downloading %s: %s", url, e)
        return None
    except OSError as e:
        logging.error("Filesystem error while saving file %s: %s", document_id, e)
        return None

def update_status_via_api(doc_id: str, success: bool, error_msg: Optional[str] = None) -> bool:
    """
    Reports the processing status of a file back to the main backend API.

    Args:
        doc_id: The ID of the file that was processed.
        success: True if processing was successful, False otherwise.
        error_msg: The error message if processing failed.

    Returns:
        True if the status was reported successfully, False otherwise.
    """
    try:
        endpoint = f"{API_BASE_URL}/api/file/v1/update-status"
        payload = {
            "documentID": doc_id,
            "status": "COMPLETED" if success else "FAILED",
            "error_message": error_msg,
        }
        response = requests.patch(endpoint, json=payload, timeout=15)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Error updating status for {doc_id}: {e}")
        return False