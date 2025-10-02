import os
import json
import logging
import mimetypes
import requests
from typing import List, Optional

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

def convert_paths_to_docs(file_paths):
    """
    Converts file URLs or local file paths back to documentEncryptedIds.
    Args:
        file_paths: A list of file URLs or a single file URL string.
    Returns:
        List of document IDs if input is list, or single document ID if input is string.
    """
    if isinstance(file_paths, list):
        doc_ids = []
        for path in file_paths:
            if not isinstance(path, str):
                continue
            if "/files/" in path:
                doc_ids.append(path.rstrip("/").split("/")[-1])
            else:
                # Assumes the filename without extension is the document ID
                doc_ids.append(os.path.splitext(os.path.basename(path))[0])
        return doc_ids
    elif isinstance(file_paths, str):
        if "/files/" in file_paths:
            return file_paths.rstrip("/").split("/")[-1]
        else:
            # Assumes the filename without extension is the document ID
            return os.path.splitext(os.path.basename(file_paths))[0]
    return None

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

        content_type = resp.headers.get("content-type", "").split(";")[0].strip()
        fallback_map = {
            "image/webp": ".webp",
        }

        ext = mimetypes.guess_extension(content_type) or fallback_map.get(content_type, "")

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

def update_status_via_api(file_path: str, success: bool) -> bool:
    """
    Reports the processing status of a file back to the main backend API.

    Args:
        doc_id: The ID of the file that was processed.
        success: True if processing was successful, False otherwise.

    Returns:
        True if the status was reported successfully, False otherwise.
    """

    doc_id = convert_paths_to_docs(file_path)
    try:
        url = f"{API_BASE_URL}/api/file/v1/update-status"
        payload = json.dumps({
            "documentId": doc_id,
            "status": "COMPLETED" if success else "FAILED",
        })

        headers = {
            'Content-Type': 'application/json'
        }
        # response = requests.post(endpoint, json=payload, timeout=15)
        response = requests.request("PATCH", url, headers=headers, data=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Error updating status for {doc_id}: {e}")
        return False