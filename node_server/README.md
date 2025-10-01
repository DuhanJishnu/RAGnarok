# RAGnarok Node.js Server

This document provides detailed information about the Node.js server for the RAGnarok application. It includes an overview of the server, setup instructions, and a comprehensive API reference.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Conversation Routes](#conversation-routes)
  - [Exchange Routes](#exchange-routes)
  - [File Routes](#file-routes)

## Project Overview

The Node.js server is a core component of the RAGnarok application, responsible for handling user authentication, managing conversations and exchanges, and processing file uploads. It is built with Express.js and uses a PostgreSQL database via Prisma for data persistence.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- PostgreSQL

### Installation

1.  Clone the repository.
2.  Navigate to the `node_server` directory:
    ```bash
    cd node_server
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
4.  Set up the database by running the Prisma migrations:
    ```bash
    npx prisma migrate dev
    ```

### Running the Server

To start the server in development mode, run:

```bash
npm run dev
```

The server will be available at `http://localhost:3001`.

## API Reference

All API endpoints are prefixed with `/api`.

### Authentication Routes

Base path: `/api/auth/v1`

#### `POST /signup`

Registers a new user.

**Request Body:**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Request Body Schema:**

- `username` (string, required): Must be between 3 and 20 characters.
- `email` (string, required): Must be a valid email address.
- `password` (string, required): Must be at least 6 characters long.

**Response:**

- **200 OK:**
  ```json
  {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
  ```
- **400 Bad Request:** If the user already exists or the request body is invalid.

#### `POST /login`

Logs in an existing user.

**Request Body:**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Request Body Schema:**

- `email` (string, required): Must be a valid email address.
- `password` (string, required): Must be at least 6 characters long.

**Response:**

- **200 OK:**
  ```json
  {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
  ```
- **404 Not Found:** If the user is not found.
- **400 Bad Request:** If the credentials are incorrect.

#### `GET /refresh`

Refreshes the access token using a refresh token provided in the request body.

**Request Body:**

```json
{
  "refresh_token": "your_refresh_token"
}
```

**Response:**

- **200 OK:**
  ```json
  {
    "message": "Updated token"
  }
  ```
- **401 Unauthorized:** If the refresh token is missing.
- **403 Forbidden:** If the refresh token is invalid or expired.

#### `GET /me`

Retrieves the currently authenticated user's information.

**Authentication:** Requires a valid access token in the `access_token` cookie.

**Response:**

- **200 OK:**
  ```json
  {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
  ```

### Conversation Routes

Base path: `/api/conv/v1`

#### `GET /getrecentconv`

Retrieves a paginated list of recent conversations for the authenticated user.

**Authentication:** Requires a valid access token in the `access_token` cookie.

**Request Body:**

```json
{
  "page": 1
}
```

**Request Body Schema:**

- `page` (number, required): The page number to retrieve.

**Response:**

- **200 OK:**
  ```json
  {
    "conversations": [
      {
        "id": 1,
        "title": "A new Title",
        "userId": 1,
        "createdAt": "2025-09-30T12:00:00.000Z",
        "updatedAt": "2025-09-30T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "totalCount": 1,
      "totalPages": 1
    }
  }
  ```

### Exchange Routes

Base path: `/api/exch/v1`

#### `POST /createexch`

Creates a new exchange within a conversation. If `convId` is not provided, a new conversation is created.

**Authentication:** Requires a valid access token in the `access_token` cookie.

**Request Body:**

```json
{
  "user_query": "Hello, how are you?",
  "convId": 1,
  "convTitle": "My First Conversation"
}
```

**Request Body Schema:**

- `user_query` (string, required): The user's query for the exchange.
- `convId` (number, optional): The ID of the conversation.
- `convTitle` (string, optional): The title for a new conversation. Defaults to "A new Title".

**Response:**

- **200 OK:**
  ```json
  {
    "exchange": {
      "id": 1,
      "userQuery": "Hello, how are you?",
      "systemResponse": "I am a helpful assistant.",
      "conversationId": 1,
      "createdAt": "2025-09-30T12:00:00.000Z",
      "updatedAt": "2025-09-30T12:00:00.000Z"
    },
    "conversation": null
  }
  ```

#### `GET /getexch`

Retrieves a paginated list of exchanges for a given conversation.

**Authentication:** Requires a valid access token in the `access_token` cookie.

**Request Body:**

```json
{
  "conversationId": 1,
  "page": 1
}
```

**Request Body Schema:**

- `conversationId` (number, required): The ID of the conversation.
- `page` (number, required): The page number to retrieve.

**Response:**

- **200 OK:**
  ```json
  {
    "exchanges": [
      {
        "id": 1,
        "userQuery": "Hello, how are you?",
        "systemResponse": "I am a helpful assistant.",
        "conversationId": 1,
        "createdAt": "2025-09-30T12:00:00.000Z",
        "updatedAt": "2025-09-30T12:00:00.000Z"
      }
    ]
  }
  ```

### File Routes

Base path: `/api/file/v1`

#### `POST /upload`

Uploads one or more files. The files are processed in the background.

**Request:** `multipart/form-data`

**Form Data:**

- `files`: The file(s) to upload.

**Response:**

- **200 OK:**
  ```json
  {
    "message": "Files are being processed in background",
    "files": [
      {
        "jobId": "some-job-id",
        "fileType": "1",
        "originalName": "my-document.pdf"
      }
    ]
  }
  ```

#### `GET /job/:id`

Retrieves the status of a background job.

**URL Parameters:**

- `id` (string, required): The ID of the job.

**Query Parameters:**

- `fileType` (string, optional): The type of file. Defaults to `1`.

**Response:**

- **200 OK:**
  ```json
  {
    "status": "completed",
    "progress": 100
  }
  ```

#### `GET /files/:encryptedId`

Serves a file by its encrypted ID.

**URL Parameters:**

- `encryptedId` (string, required): The encrypted ID of the file.

**Response:**

- **200 OK:** The file content with the appropriate `Content-Type` header.

#### `GET /thumb/:encryptedId`

Serves a thumbnail for a file by its encrypted ID.

**URL Parameters:**

- `encryptedId` (string, required): The encrypted ID of the file.

**Response:**

- **200 OK:** The thumbnail image with the appropriate `Content-Type` header.
