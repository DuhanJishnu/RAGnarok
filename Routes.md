# Node Server Routes

## Overview
- **Base Router**: Defined in `node_server/src/routes/index.ts` and mounted in `rootRouter`.
- **Error Handling**: Every route handler is wrapped in the shared `errorHandler` to surface controller exceptions.
- **Authentication Middleware**: Endpoints that require a signed-in user include the `authMiddleware` guard.
- **Pagination Defaults**: Conversation/exchange listings default to a page size of 15 items per page.
- **File Uploads**: `fileRoutes` use `multer`'s in-memory storage and expect multipart payloads via the `files` field.

## /auth/v1 — Authentication
### POST `/auth/v1/signup`
- **Controller**: `signup`
- **Auth**: Not required
- **Request Body (JSON)**:
  ```json
  {
    "username": "string (3-20 chars)",
    "email": "valid email",
    "password": "string (min 6 chars)"
  }
  ```
- **Usage**: Registers a new user, hashing the password and returning both access and refresh tokens.
- **Example**:
  ```http
  POST /auth/v1/signup
  Content-Type: application/json

  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "secretPass1"
  }
  ```

### POST `/auth/v1/login`
- **Controller**: `login`
- **Auth**: Not required
- **Request Body (JSON)**:
  ```json
  {
    "email": "valid email",
    "password": "string (min 6 chars)"
  }
  ```
- **Usage**: Validates credentials and issues new access and refresh tokens for the user.
- **Example**:
  ```http
  POST /auth/v1/login
  Content-Type: application/json

  {
    "email": "alice@example.com",
    "password": "secretPass1"
  }
  ```

### GET `/auth/v1/refresh`
- **Controller**: `refresh`
- **Auth**: Not required (requires a valid refresh token payload)
- **Request Body (JSON)**: _Despite being a GET route, the controller expects the token in the body._
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Usage**: Verifies and rotates the refresh token, returning a fresh access/refresh token pair.
- **Example**:
  ```http
  GET /auth/v1/refresh
  Content-Type: application/json

  {
    "refresh_token": "<stored-refresh-token>"
  }
  ```
  > **Tip**: Consider switching to `POST` when integrating to avoid rejecting bodies on GET requests.

### GET `/auth/v1/me`
- **Controller**: `me`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Usage**: Returns the authenticated user's safe profile with sensitive fields removed.
- **Example**:
  ```http
  GET /auth/v1/me
  Authorization: Bearer <access_token>
  ```

## /conv/v1 — Conversations
### GET `/conv/v1/getrecentconv`
- **Controller**: `getRecentConversations`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Request Body (JSON)**: _Controller expects the page number in the body even though it's a GET route._
  ```json
  {
    "page": 1
  }
  ```
- **Usage**: Fetches the latest conversations for the authenticated user, returning pagination metadata.
- **Example**:
  ```http
  GET /conv/v1/getrecentconv
  Authorization: Bearer <access_token>
  Content-Type: application/json

  {
    "page": 1
  }
  ```
  > **Tip**: If integrating with a client that disallows bodies on GET requests, convert this call to `POST` or use query parameters.

## /exch/v1 — Exchanges
### GET `/exch/v1/getexch`
- **Controller**: `getExchanges`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Request Body (JSON)**:
  ```json
  {
    "conversationId": "uuid",
    "page": 1
  }
  ```
- **Usage**: Retrieves exchange messages for a conversation, ordered newest-first with 15 results per page.
- **Example**:
  ```http
  GET /exch/v1/getexch
  Authorization: Bearer <access_token>
  Content-Type: application/json

  {
    "conversationId": "c1b3d8...",
    "page": 1
  }
  ```

### POST `/exch/v1/createexch`
- **Controller**: `createExchange`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Request Body (JSON)**:
  ```json
  {
    "user_query": "string",          // required
    "convId": "uuid | null",         // optional, reuses an existing conversation
    "convTitle": "string | null"     // optional, defaults to "A new Title" when creating a conversation
  }
  ```
- **Usage**: Creates a message exchange. If `convId` is omitted, a new conversation is created and returned alongside the new exchange.
- **Example**:
  ```http
  POST /exch/v1/createexch
  Authorization: Bearer <access_token>
  Content-Type: application/json

  {
    "user_query": "How do I reset my password?",
    "convTitle": "Support Help"
  }
  ```

## /file/v1 — File Management
### POST `/file/v1/upload`
- **Controller**: `upload`
- **Auth**: Not enforced in the router (validate upstream if necessary)
- **Request Type**: `multipart/form-data`
  - **Fields**:
    - **files**: One or more file parts (`uploadMiddleware.array('files')`)
    - Additional optional metadata in the body or query string is passed to `FileService.processUploadedFiles`.
- **Usage**: Accepts file uploads, queues processing jobs, and returns placeholder job metadata.
- **Example**:
  ```http
  POST /file/v1/upload
  Content-Type: multipart/form-data

  uploads/2024
  --boundary
  Content-Disposition: form-data; name="files"; filename="doc.pdf"
  Content-Type: application/pdf

  <binary pdf>
  --boundary--
  ```

### GET `/file/v1/job/:id`
- **Controller**: `getJobStatus`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **id**: Job identifier returned from the upload call.
- **Query Params**:
  - **fileType** (optional, defaults to `'1'`)
- **Usage**: Polls the status of a background file-processing job.
- **Example**:
  ```http
  GET /file/v1/job/abc123?fileType=video
  ```

### GET `/file/v1/files/:encryptedId`
- **Controller**: `serveFile`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **encryptedId**: Encrypted identifier for the stored file.
- **Usage**: Streams the original file content back to the requester.
- **Example**:
  ```http
  GET /file/v1/files/ENC%2Fabcd1234
  ```

### GET `/file/v1/thumb/:encryptedId`
- **Controller**: `serveThumbnail`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **encryptedId**: Encrypted identifier for the stored thumbnail.
- **Usage**: Streams a thumbnail representation of the file.
- **Example**:
  ```http
  GET /file/v1/thumb/ENC%2Fabcd1234
  ```