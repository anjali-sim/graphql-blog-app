# GraphQL Blog & CMS

A full-stack Blog & Content Management System built to demonstrate GraphQL concepts end-to-end — from schema design and resolvers to real-time subscriptions and a React client.

## Tech Stack

### Backend

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Runtime        | Node.js + TypeScript                                   |
| GraphQL Server | Apollo Server 4                                        |
| HTTP Framework | Express 4                                              |
| WebSocket      | `ws` + `graphql-ws`                                    |
| Database       | MongoDB via Mongoose                                   |
| Auth           | JWT (`jsonwebtoken`) + bcrypt                          |
| Real-time      | PubSub (`graphql-subscriptions`)                       |
| N+1 Prevention | DataLoader                                             |
| Security       | `graphql-depth-limit`, `@auth` / `@hasRole` directives |

### Frontend

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| UI Framework   | React 18 + TypeScript                   |
| GraphQL Client | Apollo Client 3                         |
| Routing        | React Router v6                         |
| Styling        | Tailwind CSS v4                         |
| Build Tool     | Vite                                    |
| Real-time      | GraphQL Subscriptions over `graphql-ws` |

---

## Features

- **Authentication** — Register, login, and JWT-based session management
- **Role-Based Access Control** — `ADMIN`, `EDITOR`, and `READER` roles enforced via custom `@auth` and `@hasRole` schema directives
- **Posts** — Create, edit, publish, and delete blog posts with categories and tags
- **Comments** — Add and delete comments with real-time updates via subscriptions
- **Likes** — Optimistic UI for liking posts
- **Pagination** — Cursor-based pagination on the post feed
- **Admin Panel** — User role management and category management
- **Real-time** — Live comment feed and post-published notifications via WebSocket subscriptions
- **DataLoader** — Batches database calls to prevent N+1 query issues

---

## Project Structure

```
├── client/                  # React frontend
│   └── src/
│       ├── apollo/          # Apollo Client setup (links, cache, policies)
│       ├── components/      # Navbar, PostCard, PostEditor, CommentSection
│       ├── context/         # Auth context (login, logout, JWT storage)
│       ├── graphql/         # Queries, mutations, subscriptions, fragments
│       └── pages/           # HomePage, PostPage, Dashboard, Admin, Auth pages
└── server/                  # Apollo Server backend
    └── src/
        ├── auth/            # JWT helpers + request context builder
        ├── dataloaders/     # DataLoader for User + Category batching
        ├── directives/      # @auth and @hasRole schema directives
        ├── models/          # Mongoose models (User, Post, Comment, Category)
        ├── resolvers/       # Query, Mutation, and Subscription resolvers
        ├── schema/          # GraphQL SDL (typeDefs)
        └── utils/           # PubSub instance + GraphQL error factories
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone <repo-url>
cd GraphQL-Practical-new
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/blog-cms
JWT_SECRET=your_jwt_secret_here
```

Start the development server:

```bash
npm run dev
```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`.

### 3. Set up the client

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

### Server

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start server with nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/`          |
| `npm start`     | Run compiled production build          |

### Client

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start Vite dev server             |
| `npm run build`   | Type-check + build for production |
| `npm run preview` | Preview the production build      |

---

## API Overview

The GraphQL API is served at `/graphql` over both HTTP and WebSocket on the same port.

**Key Queries:** `posts`, `post`, `me`, `users`, `categories`, `draftPosts`

**Key Mutations:** `register`, `login`, `createPost`, `updatePost`, `publishPost`, `deletePost`, `addComment`, `deleteComment`, `likePost`, `updateUserRole`, `createCategory`

**Subscriptions:** `commentAdded(postId)`, `postPublished`
