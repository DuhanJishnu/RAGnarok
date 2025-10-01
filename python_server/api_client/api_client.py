import logging
import os
from typing import List, Optional

import requests

API_BASE_URL = os.environ.get("API_URL")

def get_files_from_api(batch_size: int) -> List[str]:
    """
    Fetches a batch of doc ID from the main backend API.

    Args:
        batch_size: The maximum number of files to request.

    Returns:
        A list of file path to process, or an empty list on failure.
    """
    try:
        endpoint = f"{API_BASE_URL}/api/file/v1/unprocessed"
        params = {"batch_size": batch_size}
        response = requests.get(endpoint, params=params, timeout=15)

        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        files = response.json()

        # Ensure the API returns a list
        if isinstance(files, list):
            # file_path = [] convert doc id : file to file path
            return files

        logging.warning(f"API returned non-list data: {files}")
        return []

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching files from API: {e}")
        return []

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