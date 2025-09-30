# RAGnarok Client Documentation

## Project Overview

This document provides a detailed overview of the client-side application for RAGnarok, a powerful assistant for multi-format data interpretation and analysis. The client is a modern, responsive web application built with Next.js and React, designed to provide a seamless and intuitive user experience.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1.  Clone the repository.
2.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Folder Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── (auth)/         # Authentication pages (login, signup)
│   │   ├── (main)/         # Main application pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ChatInput.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── Header.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── Sidebar.tsx
│   │   └── withAuth.tsx
│   ├── context/            # React context providers
│   │   ├── AuthContext.tsx
│   │   └── ChatContext.tsx
│   ├── lib/                # Library functions and utilities
│   │   ├── db.ts
│   │   └── utils.ts
│   ├── models/             # Data models
│   │   └── User.ts
│   └── service/            # API service layer
│       ├── api.ts
│       ├── auth.ts
│       ├── conv.ts
│       ├── exch.ts
│       └── file.ts
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
└── package.json            # Project dependencies and scripts
```

## Core Technologies

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **State Management:** React Context API
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Linting:** [ESLint](https://eslint.org/)

## Authentication Flow

The authentication system is designed to be secure and robust, providing a seamless experience for users while protecting sensitive data and routes.

### 1. Login and Signup

- **User Credentials:** Users can sign up for a new account or log in with their existing credentials (email and password).
- **Token Issuance:** Upon successful authentication, the backend server issues two tokens:
  - `access_token`: A short-lived (15 minutes) JWT used to authenticate API requests.
  - `refresh_token`: A long-lived (7 days) token used to obtain a new `access_token` when the current one expires.
- **Cookie Storage:** Both tokens are sent as **HttpOnly cookies**, which means they are automatically and securely stored by the browser and are not accessible to client-side JavaScript. This is a critical security measure to prevent Cross-Site Scripting (XSS) attacks.

### 2. Session Management

- **`AuthContext`:** The `AuthContext` is the cornerstone of session management on the client. It provides the authentication state (`isAuthenticated`, `user`, `loading`) to all components wrapped within the `AuthProvider`.
- **Initial Load:** When the application first loads, the `AuthProvider` makes a request to the `/auth/v1/me` endpoint. Since the authentication tokens are stored in HttpOnly cookies, the browser automatically includes them in the request. If the request is successful, the user's data is stored in the context, and the `isAuthenticated` state is set to `true`.

### 3. Protected Routes

Route protection is implemented at two levels:

- **Middleware (`middleware.ts`):** A Next.js middleware runs on the server side before any page is rendered. It checks for the presence of the `accessToken` cookie. If the cookie is not present, the user is immediately redirected to the `/login` page. This provides a strong, server-side guard for all protected routes.
- **`withAuth` HOC:** The `withAuth` Higher-Order Component provides an additional layer of protection on the client side. It wraps protected pages and ensures that the user is authenticated before rendering the component. It also displays a loading state while the authentication status is being verified.

### 4. Automated Token Refresh

To provide a seamless user experience, the application automatically refreshes the `access_token` without requiring the user to log in again.

- **Axios Interceptor:** An Axios interceptor is configured in `src/service/api.ts`. This interceptor automatically catches any API request that fails with a `401 Unauthorized` status code.
- **Refresh Process:**
  1. When a `401` error is detected, the interceptor pauses the original request and sends a new request to the `/auth/v1/refresh` endpoint.
  2. The browser automatically includes the `refresh_token` cookie in this request.
  3. If the `refresh_token` is valid, the backend responds with a new `access_token`.
  4. The interceptor updates the `Authorization` header of the original failed request with the new `access_token` and retries the request.
- **Refresh Failure:** If the `refresh_token` is also expired or invalid, the refresh request will fail. In this case, the interceptor will automatically redirect the user to the `/login` page, effectively logging them out.

## API Interaction

The client communicates with the backend via a RESTful API. All API-related logic is centralized in the `src/service` directory.

- **`api.ts`:** This file contains the main Axios instance, including the base URL and the response interceptor for token refreshing.
- **`auth.ts`:** This service handles all authentication-related API calls, including `login`, `signup`, `logout`, `refreshToken`, and `getMe`.
- **`conv.ts`:** This service is responsible for fetching conversation data, such as the list of recent conversations.
- **`exch.ts`:** This service manages the chat exchanges, including fetching previous messages and creating new ones.

## State Management

The application uses React's Context API for global state management, ensuring a clear and predictable data flow.

- **`AuthContext`:** Manages the global authentication state, including the user's profile and authentication status.
- **`ChatContext`:** Manages the state of the chat interface, including the current conversation ID, title, and the list of exchanges.

## Component Structure

The UI is built with a modular and reusable component architecture.

- **`Sidebar.tsx`:** Displays the list of recent conversations and includes a "New Chat" button. It features infinite scrolling to load more conversations as the user scrolls.
- **`ChatWindow.tsx`:** The main chat interface where users interact with the assistant. It displays the conversation history and includes the chat input field. It also features infinite scrolling to load older messages.
- **`ChatInput.tsx`:** A controlled component for typing and sending messages, including support for image uploads.
- **`MessageBubble.tsx`:** Renders individual chat messages for both the user and the assistant.
- **`Header.tsx`:** The main application header, which includes a button to toggle the sidebar.
- **`withAuth.tsx`:** A Higher-Order Component that protects routes by ensuring the user is authenticated before rendering the component.
- **`ui/`:** This directory contains the `shadcn/ui` components, which are used throughout the application for building the user interface.