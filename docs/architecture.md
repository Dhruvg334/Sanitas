# Architecture

Sanitas consists of two independently deployable applications connected via a typed HTTP API:

```text
Browser (apps/web: Next.js 16)
   │
   │  POST /api/v1/analyses {"text": "..."}
   ▼
Backend (apps/api: FastAPI on Python 3.12)
   ├── 1. Canonicalizer: deterministic segmentation into Page 1 source segments (p1-s1, p1-s2, ...)
   ├── 2. Gemini Client: structured schema-constrained clinical extraction (gemini-3.8-flash, Prompt E1.1)
   ├── 3. Evidence Gate: deterministic verification of referenced segment IDs, page numbers, and verbatim quotes
   └── 4. Response Builder: typed JSON response with Cache-Control: no-store
```

## Frontend (`apps/web`)

The frontend is built with Next.js 16 (App Router), React 19, and TypeScript. It implements an interactive clinical document workbench:
- Plain-text note entry with character boundary validation (max 50,000 characters).
- Pre-loaded synthetic demo note for end-to-end evaluation.
- Honest single-stage loading feedback during analysis requests without simulated progress timers.
- Structured extraction presentation: patient information, symptoms, diagnoses/conditions, medications, vitals, allergies, clinical observations, and uncertain items.
- Inspectable source evidence: interactive quotation pills that map directly to the canonical source segment drawer (`p1-sX`), allowing reviewers to verify evidence spans against source text.
- Typed error presentation mapping backend error responses (`SafeError`) into user-friendly messages and suggestions.

## Backend (`apps/api`)

FastAPI exposes two primary routes:
- `GET /health`: Liveness endpoint returning service status, name, and version without external dependencies or credential requirements.
- `POST /api/v1/analyses`: Synchronous analysis endpoint processing synthetic plain-text clinical notes through deterministic canonicalization, Gemini extraction, and deterministic evidence validation.

Settings are managed via Pydantic `BaseSettings` reading environment variables with support for local `.env` files. CORS is configured dynamically from `CORS_ALLOWED_ORIGINS`.

## Database Scaffold

SQLAlchemy declarative base and Alembic migration scaffolding exist in the repository to support future persistence increments. In this vertical slice, persistence is intentionally deferred; no database models, tables, or active connections are initialized during startup, health checks, or note analysis.
