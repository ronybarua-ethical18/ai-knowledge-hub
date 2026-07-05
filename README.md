# AI Knowledge Hub

AI Knowledge Hub is a knowledge management platform powered by LLMs. Users upload documents into workspaces, which are indexed into a vector database, and then ask questions and get context-aware, cited answers via Retrieval-Augmented Generation (RAG).

## Features

- Upload and index documents (PDF, DOCX, TXT) for AI-powered search
- Context-aware Q&A grounded in your own documents using RAG
- Answers returned with source references from the retrieved passages
- Workspace-scoped knowledge: documents and chat are isolated per workspace
- Background document processing (extract → chunk → embed → index) via a job queue
- JWT authentication with access/refresh tokens and email verification
- Workspace membership and roles (owner / member / viewer)
- Resilient chat with automatic Gemini model fallback and an offline extraction fallback

## Tech Stack

- **Frontend:** Next.js (App Router), React, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** NestJS (Express)
- **Database:** PostgreSQL via Prisma ORM
- **Vector Database:** Qdrant
- **Queues & Caching:** BullMQ on Redis (Valkey-compatible)
- **AI Layer:** Google Gemini (chat + embeddings) via LangChain
- **Auth:** JWT (access + refresh), Passport, bcrypt; email verification via Nodemailer + Handlebars
- **Monorepo Tooling:** pnpm workspaces + Turborepo
- **Language:** TypeScript

## Monorepo Structure

```
apps/
  backend/            NestJS API — auth, file upload, RAG, queue workers
  web/                Next.js frontend
packages/
  ui/ , ui-design/    Shared shadcn/ui + Tailwind component libraries
  eslint-config/      Shared ESLint config
  typescript-config/  Shared tsconfig
```

### Backend layout (`apps/backend/src`)

- `main.ts` — bootstraps the app: global prefix `api/v1/`, Swagger, CORS, global exception filter, transform/logging interceptors, throttler guard.
- `config/` — typed environment loader (`env.config`), CORS and Swagger setup.
- `database/` — Prisma `DatabaseService`.
- `modules/core/`
  - `auth/` — login, registration, JWT refresh, email verification, and workspace + membership management.
  - `user/` — user CRUD and password hashing.
  - `file-upload/` — validates and stores uploads, then enqueues them for processing.
- `services/`
  - `ai/` — Qdrant vector store, Gemini embeddings, and workspace-scoped RAG chat.
  - `queue/` — BullMQ queue service and the `file-processor` worker.
  - `email/` — Nodemailer provider with Handlebars templates, driven by app events.

## Core RAG Flow

```
Upload  → File record (PostgreSQL) → "file-ready" queue (BullMQ / Redis)
        → FileProcessorWorker: extract text → chunk (1500 / 200 overlap)
          → Gemini embeddings → Qdrant ("file-collection")
Chat    → workspace-filtered similarity search → Gemini prompt
          (model fallback chain; offline extraction if all models fail)
        → answer + source references
```

## Prerequisites

- Node.js >= 20
- pnpm 9
- PostgreSQL
- Redis (or Valkey) and Qdrant — provided via Docker Compose (see below)
- A Google Gemini API key

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Redis and Qdrant

`apps/backend/docker-compose.yml` provides Valkey (Redis-compatible, port `6379`) and Qdrant (port `6333`):

```bash
cd apps/backend
docker compose up -d
```

### 3. Configure environment

Copy `apps/backend/.env.example` to `apps/backend/.env` and fill in the values:

| Variable                                                                                      | Description                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`                                                                                | PostgreSQL connection string                  |
| `JWT_SECRET` / `JWT_REFRESH_SECRET`                                                           | Token signing secrets                         |
| `GEMINI_API_KEY`                                                                              | Google Gemini API key                         |
| `GEMINI_CHAT_MODEL`                                                                           | Chat model (default: `gemini-2.5-flash-lite`) |
| `QDRANT_URL`                                                                                  | Qdrant URL (default: `http://localhost:6333`) |
| `QDRANT_API_KEY`                                                                              | Qdrant API key (leave empty for local Docker) |
| `REDIS_HOST` / `REDIS_PORT`                                                                   | Redis host/port (default: `localhost:6379`)   |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`                           | Email delivery for verification links         |
| `FRONTEND_URL`                                                                                | Public web app URL, used in email links       |
| `CORS_ORIGINS`                                                                                | Allowed CORS origins                          |
| `PORT`                                                                                        | Backend port (default: `8000`)                |
| `GLOBAL_PREFIX`                                                                               | API route prefix (default: `api/v1/`)         |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | OAuth credentials                             |

### 4. Set up the database

```bash
cd apps/backend
pnpm db:generate      # generate Prisma client
pnpm db:migrate       # apply migrations
```

### 5. Run the apps

From the repo root (runs all workspaces via Turborepo):

```bash
pnpm dev
```

Or individually:

```bash
cd apps/backend && pnpm dev   # NestJS API on http://localhost:8000
cd apps/web && pnpm dev       # Next.js app on http://localhost:3000
```

API documentation (Swagger) is available once the backend is running.

## API Overview

All routes are prefixed with `/api/v1`.

### Auth (`/auth`)

- `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- `POST /verify-email`, `POST /resend-verification`
- `POST /forgot-password`, `POST /reset-password`
- Workspaces: `POST|GET /workspaces`, `GET|PUT|DELETE /workspaces/:workspaceId`
- Members: `POST|GET /workspaces/:workspaceId/members`, `PUT|DELETE /workspaces/:workspaceId/members/:memberId`

### Files (`/files`)

- `POST /upload` — upload a document (PDF, DOCX, TXT; max 10MB)
- `GET /` — list your files, `GET /:id` — file details, `DELETE /:id` — delete a file

### AI (`/ai`)

- `POST /chat` — ask a question against a workspace's documents (auth required)

## Available Scripts

Root:

- `pnpm dev` — run all apps via Turborepo
- `pnpm lint` / `pnpm lint:fix` / `pnpm format`

Backend (`apps/backend`):

- `pnpm dev` — start NestJS in watch mode
- `pnpm build` / `pnpm start:prod`
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed` / `db:reset` / `db:status`
- `pnpm test` / `test:watch` / `test:cov` / `test:e2e`

## Language & Deployment

- Written entirely in TypeScript.
- Redis and Qdrant run via Docker Compose for local development.
