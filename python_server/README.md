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

### Health Check

*   **Endpoint**: `GET /api/health`
*   **Description**: Check the health of the API server.
*   **Response**:
    ```json
    {
        "status": "healthy",
        "message": "RAG Pipeline Server is running"
    }
    ```

### Chat

This endpoint allows you to ask questions and get answers from the RAG pipeline.

*   **Endpoint**: `POST /api/chat`
*   **Description**: Ask a question and get an answer from the RAG pipeline. This endpoint supports both regular and streaming responses.

**Request Body**:

```json
{
    "question": "What is the main topic of the document?",
    "conv_id": "<conversation-id>",
    "secure_mode": false,
    "stream": false
}
```

*   `question` (string, required): The question you want to ask.
*   `conv_id` (string, required): A unique identifier for the conversation.
*   `secure_mode` (boolean, optional, default: `false`): Set to `true` to use the secure pipeline with enhanced safety features.
*   `stream` (boolean, optional, default: `false`): Set to `true` to receive a streaming response. When `true`, the response will be sent using Server-Sent Events (SSE).

**Standard Response (`stream: false`)**:

```json
{
    "success": true,
    "question": "What is the main topic of the document?",
    "answer": "The main topic of the document is...",
    "citations": [...]
}
```

**Streaming Response (`stream: true`)**:

The response will be a stream of Server-Sent Events (SSE). Each event is a JSON object with a `type` and `data` field.

*   `type: 'retrieval_metrics'`: Contains information about the retrieved documents.
*   `type: 'answer_chunk'`: A chunk of the answer.
*   `type: 'final'`: The final event, containing citations and retrieved documents.
*   `type: 'error'`: If an error occurs.

Example SSE stream:

```
data: {"type": "retrieval_metrics", "data": {"metrics": ..., "documents_retrieved": 5, "should_proceed": true}}

data: {"type": "answer_chunk", "data": "The main topic"}

data: {"type": "answer_chunk", "data": " of the document is..."}

data: {"type": "final", "data": {"success": true, "question": "...", "citations": [...], "retrieved_documents": [...]}}
```

### Streaming Chat

*   **Endpoint**: `POST /api/chat/stream`
*   **Description**: A dedicated endpoint for streaming chat responses using Server-Sent Events (SSE).

**Request Body**:

```json
{
    "question": "What is the main topic of the document?",
    "conv_id": "<conversation-id>",
    "secure_mode": false
}
```

*   `question` (string, required): The question you want to ask.
*   `conv_id` (string, required): A unique identifier for the conversation.
*   `secure_mode` (boolean, optional, default: `false`): Set to `true` to use the secure pipeline with enhanced safety features.

**Response**:

The response is a stream of Server-Sent Events (SSE), same as the `/api/chat` endpoint with `stream: true`.

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

Returns a list of the most relevant document chunks.

```json
{
    "success": true,
    "query": "machine learning",
    "results": [
        {
            "content": "...",
            "metadata": {...},
            "similarity_score": 0.85,
            "relevance_score": 0.9
        }
    ]
}
```

**Response (when `analyze` is `true`)**:

Returns a detailed analysis of the query, including confidence scores and whether the pipeline should proceed with generating an answer.

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

## Conversation Management

The application now supports conversation management, allowing you to maintain a history for each conversation and summarize it when it's over.

### Summarize Conversation

*   **Endpoint**: `POST /api/summarize`
*   **Description**: Summarize a conversation.

**Request Body**:

```json
{
    "conv_id": "<conversation-id>"
}
```

*   `conv_id` (string, required): The ID of the conversation to summarize.

**Response**:

```json
{
    "success": true,
    "summary": "This is a summary of the conversation."
}
```

### Load Conversation Summary

*   **Endpoint**: `POST /api/load_summary`
*   **Description**: Load a summary into a new conversation.

**Request Body**:

```json
{
    "conv_id": "<new-conversation-id>",
    "summary": "This is a summary of a previous conversation."
}
```

*   `conv_id` (string, required): The ID of the new conversation.
*   `summary` (string, required): The summary to load.

**Response**:

```json
{
    "success": true
}
```

## Ingestion Pipeline

The ingestion pipeline is handled by the `ingestion_worker.py` script. This script runs as a long-running process and does the following:

1.  **Polls for new files**: The worker periodically calls an external API (defined by the `API_URL` environment variable) to get a list of new files to process.
2.  **Processes files in parallel**: The worker uses a thread pool to process multiple files concurrently, which significantly speeds up the ingestion process.
3.  **Extracts content**: It extracts text and images from various document formats.
4.  **Generates embeddings**: It uses a sentence transformer model to generate vector embeddings for the document chunks.
5.  **Stores in Vector DB**: The embeddings are stored in **Upstash Vector**, a serverless vector database.
6.  **Reports status**: After processing each file, the worker reports the status (success or failure) back to the external API.

## Language Model

The conversational AI is powered by **Mistral** (`mistral:latest`), which is run locally using **Ollama**. You can change the model by modifying the `llm_model` parameter in the `ChatMemory` class in `models/chat_memory.py`.