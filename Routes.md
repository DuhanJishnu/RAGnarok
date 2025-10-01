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
- **Response Body (JSON)**:
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "string",
    "access_token": "string",
    "refresh_token": "string"
  }
  ```
- **Usage**: Registers a new user, hashing the password and returning both access and refresh tokens.

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
- **Response Body (JSON)**:
  ```json
  {
    "id": "string",
    "email": "string",
    "username": "string",
    "access_token": "string",
    "refresh_token": "string"
  }
  ```
- **Usage**: Validates credentials and issues new access and refresh tokens for the user.

### GET `/auth/v1/refresh`
- **Controller**: `refresh`
- **Auth**: Not required (requires a valid refresh token payload)
- **Request Body (JSON)**: _Despite being a GET route, the controller expects the token in the body._
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Response Body (JSON)**:
  ```json
  {
    "access_token": "string",
    "refresh_token": "string"
  }
  ```
- **Usage**: Verifies and rotates the refresh token, returning a fresh access/refresh token pair.
- **Note**: Consider switching to `POST` to avoid issues with clients that disallow bodies in GET requests.

### GET `/auth/v1/me`
- **Controller**: `me`
- **Auth**: Required (`Authorization: Bearer <access_token>`)
- **Usage**: Returns the authenticated user's safe profile with sensitive fields removed.

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
- **Response Body (JSON)**:
  ```json
  {
    "conversations": [],
    "pagination": {
      "page": "number",
      "totalCount": "number",
      "totalPages": "number"
    }
  }
  ```
- **Usage**: Fetches the latest conversations for the authenticated user, returning pagination metadata.
- **Note**: If integrating with a client that disallows bodies on GET requests, convert this call to `POST` or use query parameters.

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
- **Response Body (JSON)**:
  ```json
  {
    "exchanges": []
  }
  ```
- **Usage**: Retrieves exchange messages for a conversation, ordered newest-first with 15 results per page.
- **Note**: Consider using query parameters for `conversationId` and `page` for better adherence to REST principles.

### POST `/exch/v1/createexch`
- **Controller**: `createExchange`
- **Auth**: Required (`Authorization: <access_token>`)

#### Request (Multipart Form Data)
Send as `multipart/form-data` if uploading an image.

| Field        | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `user_query` | string   | ✅ Yes   | The text query/message |
| `convId`     | string   | ❌ No    | Existing conversation ID (UUID) |
| `convTitle`  | string   | ❌ No    | Custom title if starting a new conversation |
| `image`      | file     | ❌ No    | Image file to attach |

- **Response Body (JSON)**:
  ```json
  {
    "exchange": {},
    "conversation": {}
  }
  ```
- **Usage**: Creates a message exchange. If `convId` is omitted, a new conversation is created and returned alongside the new exchange.

## /file/v1 — File Management
### POST `/file/v1/upload`
- **Controller**: `upload`
- **Auth**: Not enforced in the router (validate upstream if necessary)
- **Request Type**: `multipart/form-data`
  - **Fields**:
    - **files**: One or more file parts (`uploadMiddleware.array('files')`)
    - **projectName** (text field, required)
    - **directory** (text field, required)
- **Usage**: Accepts file uploads, queues processing jobs, and returns placeholder job metadata.

### GET `/file/v1/job/:id`
- **Controller**: `getJobStatus`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **id**: Job identifier returned from the upload call.
- **Query Params**:**
  - **fileType** (optional, defaults to `'1'`)
- **Usage**: Polls the status of a background file-processing job.

### GET `/file/v1/files/:encryptedId`
- **Controller**: `serveFile`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **encryptedId**: Encrypted identifier for the stored file.
- **Usage**: Streams the original file content back to the requester.

### GET `/file/v1/thumb/:encryptedId`
- **Controller**: `serveThumbnail`
- **Auth**: Not enforced in the router
- **Path Params**:
  - **encryptedId**: Encrypted identifier for the stored thumbnail.
- **Usage**: Streams a thumbnail representation of the file.
