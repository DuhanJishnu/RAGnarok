# run_server.py
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs("./uploads", exist_ok=True)
    
    app = create_app()
    
    print("Starting RAG Pipeline Server...")
    print("API Endpoints:")
    print("  POST /api/chat - Chat with documents (with 'secure_mode' option)")
    print("  POST /api/search - Search documents directly (with 'analyze' option)")
    print("  GET  /api/health - Health check")
    print("\nIngestion is handled by the ingestion_worker.py script.")
    
    app.run(host='0.0.0.0', port=5000, debug=True)