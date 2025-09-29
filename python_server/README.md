# Multimodal RAG Pipeline

This project implements a Retrieval-Augmented Generation (RAG) pipeline that can process both text and image documents and answer questions based on the knowledge stored in them.

## Architecture

The project consists of two main components:

1.  **API Server**: A Flask-based web server that exposes endpoints for chatting with the RAG pipeline and searching for documents.
2.  **Ingestion Worker**: A separate Python script that runs in the background and handles the processing of new documents. It polls a remote server for new files, processes them in parallel, and adds them to the vector database.

## Getting Started

### Prerequisites

*   Python 3.8+
*   Tesseract-OCR: This is required for extracting text from images. Please see the [Tesseract installation guide](https://github.com/tesseract-ocr/tessdoc) for instructions on how to install it on your system.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Running the Pipeline

1.  **Start the API Server:**
    ```bash
    python run_server.py
    ```
    The API server will start on `http://localhost:5000`.

2.  **Start the Ingestion Worker:**
    In a separate terminal, run the ingestion worker:
    ```bash
    python ingestion_worker.py
    ```
    The ingestion worker will start polling for new documents to process.

## API Reference

### Chat

*   **Endpoint**: `POST /api/chat`
*   **Description**: Ask a question and get an answer from the RAG pipeline.

**Request Body**:

```json
{
    "question": "What is the main topic of the document?",
    "secure_mode": false
}
```

*   `question` (string, required): The question you want to ask.
*   `secure_mode` (boolean, optional, default: `false`): Set to `true` to use the secure pipeline with enhanced safety features.

**Response**:

```json
{
    "success": true,
    "question": "What is the main topic of the document?",
    "answer": "The main topic of the document is...",
    "citations": [...]
}
```

### Search

*   **Endpoint**: `POST /api/search`
*   **Description**: Directly search the vector database for relevant document chunks.

**Request Body**:

```json
{
    "query": "machine learning",
    "k": 5,
    "analyze": false
}
```

*   `query` (string, required): The search query.
*   `k` (integer, optional, default: `5`): The number of results to return.
*   `analyze` (boolean, optional, default: `false`): Set to `true` to get a detailed analysis of your query, including confidence scores.

**Response (when `analyze` is `false`)**:

```json
{
    "success": true,
    "query": "machine learning",
    "results": [...]
}
```

**Response (when `analyze` is `true`)**:

```json
{
    "success": true,
    "query": "machine learning",
    "analysis": {...},
    "should_proceed": true,
    "message": "Proceeding with LLM generation.",
    "documents_retrieved": 5
}
```

### Health Check

*   **Endpoint**: `GET /api/health`
*   **Description**: Check the health of the API server.

**Response**:

```json
{
    "status": "healthy",
    "message": "RAG Pipeline Server is running"
}
```

## Ingestion Pipeline

The ingestion pipeline is handled by the `ingestion_worker.py` script. This script runs as a long-running process and does the following:

1.  **Polls for new files**: The worker periodically calls an external API (defined by the `API_URL` environment variable) to get a list of new files to process.
2.  **Processes files in parallel**: The worker uses a thread pool to process multiple files concurrently, which significantly speeds up the ingestion process.
3.  **Extracts content**: It extracts text and images from various document formats.
4.  **Generates embeddings**: It uses a sentence transformer model to generate vector embeddings for the document chunks.
5.  **Stores in Vector DB**: The embeddings are stored in a FAISS-powered vector database.
6.  **Reports status**: After processing each file, the worker reports the status (success or failure) back to the external API.
