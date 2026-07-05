# Product Requirements Document (PRD)

**Product:** AI Knowledge Hub
**Type:** Portfolio / showcase project
**Status:** Draft · **Last Updated:** 2026-07-05 · **Version:** 1.0
**Related:** [BRD.md](./BRD.md)

> A personal showcase of a production-shaped, LLM-powered knowledge
> platform. This PRD documents what the product does, how it's built, and
> **why the key engineering decisions were made** — the decisions section
> (§7) is the heart of it.

---

## 1. Overview

Users upload documents into workspaces; documents are indexed into a
vector database; users then ask questions and get context-aware, **cited**
answers via Retrieval-Augmented Generation (RAG). All knowledge and
conversation is isolated per workspace.

---

## 2. Goals & Non-Goals

**Goals**

- Query your own documents in natural language and get cited answers.
- Ground every answer in retrieved passages to reduce hallucination.
- Isolate knowledge and chat per workspace.
- Stay available under AI-provider rate limits/outages.

**Non-Goals (this build)**

- Collaborative editing · file types beyond PDF/DOCX/TXT · live billing ·
  native mobile.

---

## 3. Users & Roles

A single product with **workspace-scoped roles** rather than distinct
personas:

| Role       | Can                                                    |
| ---------- | ------------------------------------------------------ |
| **Owner**  | Create/manage workspace, manage members, upload, query |
| **Member** | Upload documents and query the workspace               |
| **Viewer** | Query the workspace (read-only)                        |

---

## 4. Key User Stories

- Register, verify email, and log in securely.
- Create a workspace and invite members with a role.
- Upload a PDF/DOCX/TXT (≤10 MB) and watch it move to _processed_.
- Ask a question in a workspace and get an answer **with source references**.
- List, view, and delete my files. Reset my password if forgotten.

---

## 5. Functional Requirements

### 5.1 Auth & Accounts

- Register (bcrypt-hashed passwords); email verification (Nodemailer +
  Handlebars templates).
- Login issuing JWT **access + refresh** tokens; refresh; logout; `GET /me`.
- Forgot / reset password; account lockout after repeated failures.
- OAuth (Google/LinkedIn) modeled for future enablement.

### 5.2 Workspaces & Membership

- CRUD workspaces (unique slug, optional settings/public flag).
- Manage members: add, list, update role, remove.
- Roles **OWNER / MEMBER / VIEWER** enforced on workspace actions.

### 5.3 Upload & Processing

- Upload PDF/DOCX/TXT, max **10 MB**.
- Creates a `File` record (`UPLOADED`) and enqueues to the `file-ready`
  queue (BullMQ/Redis).
- `FileProcessorWorker`: **extract text → chunk (1500 chars / 200 overlap)
  → Gemini embeddings → index into Qdrant** (`file-collection`).
- Status flow `UPLOADED → PROCESSING → PROCESSED | FAILED`, with error
  captured on failure and reflected live in the UI.
- List / view / delete files.

### 5.4 RAG Chat

- `POST /ai/chat` — question scoped to a workspace (auth required).
- **Workspace-filtered** similarity search in Qdrant → retrieved passages
  composed into a Gemini prompt → **answer + source references**.
- Resilience: automatic Gemini **model fallback chain**; if all models
  fail, an **offline extraction fallback** returns relevant content.

### 5.5 API Surface (`/api/v1`)

- **Auth:** `register`, `login`, `refresh`, `logout`, `me`,
  `verify-email`, `resend-verification`, `forgot-password`, `reset-password`.
- **Workspaces:** `POST|GET /workspaces`, `GET|PUT|DELETE /workspaces/:id`,
  members `POST|GET /workspaces/:id/members`,
  `PUT|DELETE /workspaces/:id/members/:memberId`.
- **Files:** `POST /files/upload`, `GET /files`, `GET /files/:id`,
  `DELETE /files/:id`.
- **AI:** `POST /ai/chat`. Interactive docs via Swagger.

---

## 6. Non-Functional Requirements

| Category            | Requirement                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Security**        | JWT auth, bcrypt, email verification, account lockout, workspace-scoped isolation, CORS allow-list, request throttling |
| **Reliability**     | Queue-based processing; model fallback + offline extraction fallback for chat                                          |
| **Performance**     | Async processing so uploads never block the user; chunking tuned for retrieval                                         |
| **Scalability**     | Stateless API, queue workers, external vector store, Redis caching                                                     |
| **Observability**   | Global exception filter, transform/logging interceptors, Swagger                                                       |
| **Maintainability** | TypeScript monorepo (pnpm workspaces + Turborepo), shared UI/config packages                                           |

---

## 7. Engineering Decisions & Trade-offs

The design choices worth understanding — and why each was made.

**RAG instead of fine-tuning.** Grounding answers in retrieved passages
gives citations, keeps private data out of model weights, and needs no
retraining when documents change. Trade-off: answer quality depends on
retrieval quality.

**Qdrant as a dedicated vector DB.** Purpose-built ANN search with payload
filtering, which enables _workspace-scoped_ retrieval by filtering on
metadata at query time. Self-hostable via Docker for local dev. Trade-off:
another service to run vs. a pgvector-in-Postgres approach.

**Background job queue (BullMQ on Redis) for processing.** Text
extraction + embedding is slow and rate-limited, so it must not block the
upload request. The queue makes processing async, retriable, and
observable via a status state machine (`UPLOADED → PROCESSING →
PROCESSED | FAILED`). Trade-off: eventual consistency — a document isn't
queryable the instant it's uploaded.

**Chunking at 1500 chars / 200 overlap.** Balances retrieval granularity
(small enough to be specific) against context (large enough to be
coherent); the overlap preserves meaning across chunk boundaries.

**Model fallback chain + offline extraction fallback.** Built against
Gemini free-tier rate limits: if the primary chat model is throttled, the
service tries alternates; if all fail, it returns relevant retrieved
content rather than erroring. Keeps the core experience alive under
provider limits.

**Workspace-scoped isolation everywhere.** Multi-tenant privacy is
enforced at the retrieval filter, not just the UI — a query can only reach
its own workspace's vectors and records.

**JWT access + refresh tokens.** Stateless auth that scales horizontally;
short-lived access tokens with refresh rotation balance security and UX.

**TypeScript monorepo (Turborepo + pnpm).** One language across frontend
and backend, shared UI/config packages, and cached task orchestration.

---

## 8. Core Architecture

**Stack:** Next.js (App Router) · React · TanStack Query · Tailwind ·
shadcn/ui · NestJS · PostgreSQL/Prisma · Qdrant · BullMQ/Redis ·
Gemini (chat + embeddings) via LangChain · JWT/Passport/bcrypt · Nodemailer.

```
Upload → File record (PostgreSQL) → "file-ready" queue (BullMQ / Redis)
       → FileProcessorWorker: extract text → chunk (1500 / 200 overlap)
         → Gemini embeddings → Qdrant ("file-collection")
Chat   → workspace-filtered similarity search → Gemini prompt
         (model fallback chain; offline extraction if all models fail)
       → answer + source references
```

**Key data models (Prisma):** `User` (identity, role, verification/lockout,
subscription tier) · `Workspace` (slug, settings, owner) · `WorkspaceMember`
(user↔workspace + role, unique per pair) · `File` (mime, size, `FileType`,
`FileStatus`, extracted text, error, timestamps) · `Document` (richer model:
content, chunks, embeddings, summary) · `ChatSession` (messages per
user+workspace).

---

## 9. User Flows

1. **Onboard:** register → verify email → log in → create/join workspace.
2. **Index:** upload → `UPLOADED` + enqueue → worker extract/chunk/embed/
   index → status live-updates → queryable when `PROCESSED`.
3. **Ask:** question → workspace-scoped similarity search → Gemini (with
   fallback) → answer + source references.

---

## 10. Acceptance Criteria

- [x] Register, verify email, log in.
- [x] Create a workspace and add members with roles.
- [x] Upload PDF/DOCX/TXT (≤10 MB) and see it reach `PROCESSED`.
- [x] Content is searchable only within its own workspace.
- [x] A question returns an answer with source references when relevant
      content exists.
- [x] Chat degrades gracefully (fallback) when the primary model is
      unavailable.
- [x] List and delete files.

---

## 11. Future Work

- Persist and surface full chat history in the UI.
- Additional file types (spreadsheets, images/OCR, HTML).
- Activate OAuth sign-in (already modeled).
- Enforce subscription tiers with billing.
- Per-workspace AI settings (model, temperature, retrieval depth).
