# run_server.py
import os
import sys
from config import Config

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    app = create_app()
    
    print("Starting RAG Pipeline Server...")
    
    app.run(host='0.0.0.0', port=5000, debug=False)