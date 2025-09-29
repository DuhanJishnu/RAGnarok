import logging
import os
from typing import List, Optional

import requests

API_BASE_URL = os.environ.get("API_URL")

def get_files_from_api(batch_size: int) -> List[str]:
    """
    Fetches a batch of file paths from the main backend API.
    
    Args:
        batch_size: The maximum number of files to request.

    Returns:
        A list of file paths to process, or an empty list on failure.
    """
    try:
        endpoint = f"{API_BASE_URL}/api/get-tasks"
        params = {"batch_size": batch_size}
        response = requests.get(endpoint, params=params, timeout=15)
        
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()
        
        files = response.json()
        
        # Ensure the API returns a list
        if isinstance(files, list):
            return files
            
        logging.warning(f"API returned non-list data: {files}")
        return []
        
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching files from API: {e}")
        return []

def update_status_via_api(file_path: str, success: bool, error_msg: Optional[str] = None) -> bool:
    """
    Reports the processing status of a file back to the main backend API.

    Args:
        file_path: The path of the file that was processed.
        success: True if processing was successful, False otherwise.
        error_msg: The error message if processing failed.

    Returns:
        True if the status was reported successfully, False otherwise.
    """
    try:
        endpoint = f"{API_BASE_URL}/api/update-status"
        payload = {
            "file_path": file_path,
            "status": "completed" if success else "failed",
            "error_message": error_msg,
        }
        response = requests.post(endpoint, json=payload, timeout=15)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Error updating status for {file_path}: {e}")
        return False