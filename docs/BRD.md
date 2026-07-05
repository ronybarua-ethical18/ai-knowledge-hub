# Business Requirements Document (BRD)

**Project:** AI Knowledge Hub
**Type:** Portfolio / showcase project
**Status:** Draft · **Last Updated:** 2026-07-05 · **Version:** 1.0
**Related:** [PRD.md](./PRD.md)

> This is a personal showcase project. It's built as a realistic,
> production-shaped SaaS to demonstrate full-stack + AI engineering, so
> this brief frames the _problem and scope_ the way a product team would —
> without inventing users, revenue, or metrics that don't exist.

---

## 1. Summary

AI Knowledge Hub turns a set of private documents into a conversational,
searchable knowledge base. Users upload documents into **workspaces**,
which are indexed into a vector database, then ask natural-language
questions and get **context-aware, cited answers** using
Retrieval-Augmented Generation (RAG).

---

## 2. Problem

Useful information is locked inside static files (PDFs, contracts,
reports, notes) that are:

- **Hard to search** — keyword search misses meaning and context.
- **Slow to consume** — you must open and skim whole files.
- **Untrustworthy via generic AI** — public LLMs answer from training
  data, not _your_ documents, and rarely cite sources.
- **Hard to govern** — teams need sensitive documents kept separate and
  access-controlled.

The goal is a private, document-grounded assistant that answers
accurately, **cites its sources**, and respects team boundaries.

---

## 3. Objectives

- Let a user go from _"I have documents"_ to _"I have answers"_ in one query.
- Ground every answer in the user's own documents and cite the passages used.
- Isolate all knowledge and conversation per workspace.
- Keep the assistant working even under AI-provider rate limits/outages.

---

## 4. Scope

### Implemented (current build)

- Email/password auth with verification, JWT access/refresh, password reset.
- Workspaces with role-based membership (owner / member / viewer).
- Document upload (PDF, DOCX, TXT, ≤10 MB) with background processing.
- Extract → chunk → embed → index pipeline into Qdrant.
- Workspace-scoped RAG chat returning answers **with source references**.
- AI resilience: Gemini model fallback chain + offline extraction fallback.
- Live document processing status in the UI.

### Modeled but not wired up

- OAuth sign-in (Google / LinkedIn) — present in the data model.
- Subscription tiers (Free / Premium / Enterprise) — modeled, not billed.

### Out of scope

- Collaborative document editing.
- File types beyond PDF / DOCX / TXT (spreadsheets, images/OCR, audio).
- Payment processing, on-prem enterprise packaging, native mobile apps.

---

## 5. Constraints & Assumptions

- Uploads limited to PDF / DOCX / TXT, 10 MB max.
- Documents must be text-extractable (no OCR for scanned images).
- AI quality/availability depends on Google Gemini and its free/paid
  tier limits.
- Requires PostgreSQL, Redis/Valkey, Qdrant, and a Gemini API key.

---

## 6. Known Limitations

- Scanned/image-only PDFs won't produce useful text (no OCR).
- Answer quality is bounded by retrieval quality and model tier.
- No billing enforcement behind the modeled subscription tiers.
- Single AI provider (Gemini); resilience is model-level, not provider-level.
