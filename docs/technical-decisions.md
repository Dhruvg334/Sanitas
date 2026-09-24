# Technical Decisions

This document records the architectural decisions, trade-offs, and implementation rationales adopted across the Sanitas platform.

---

## 1. Hosting Architecture: Vercel (Frontend), Render (Backend), Neon (Database)

### Decision
Deploy the Next.js frontend (`apps/web`) to **Vercel**, the FastAPI backend (`apps/api`) to **Render**, persist state to **Neon PostgreSQL**, and utilize **Google Gemini API** for structured inference.

### Rationale
- **Vercel for Frontend:** Next.js App Router applications benefit from Vercel's native edge network, dynamic server rendering, and zero-configuration asset optimization.
- **Render for Backend:** Document processing workloads (PyMuPDF binary parsing, image decoding, multi-step LLM calls, PostgreSQL connection pooling) require a long-lived Linux container environment. Render provides persistent Uvicorn web services without serverless execution time limits or bundle size constraints.
- **Neon PostgreSQL for Persistence:** Serverless PostgreSQL provides ACID compliance, JSONB document querying, and connection pooling suitable for multi-modal analysis persistence.

---

## 2. Immediate Request Normalization: Single Ingestion Representation

### Decision
Both plain-text JSON requests (`POST /api/v1/analyses {"text": "..."}`) and multipart file uploads (`POST /api/v1/analyses` with file attachment) are normalized immediately into a unified internal dataclass `IngestedDocument` within `document_router.py`.

### Rationale
Creating parallel pipelines for different input formats leads to duplicate validation logic, divergent canonicalization paths, and inconsistent error handling. By normalizing immediately into `IngestedDocument(source_type, original_filename, text_content, file_bytes, sha256)`, subsequent processing stages (canonicalization, extraction, validation, persistence) operate against a single contract.

---

## 3. Database Fallback Policy: Explicit Error over Silent In-Memory Degradation

### Decision
In production and standard development, the backend strictly requires `DATABASE_URL`. If the database is missing or unreachable, requests fail explicitly with a typed `DATABASE_UNAVAILABLE` error. Silent fallback to SQLite or in-memory storage is strictly prohibited in non-test environments.

### Rationale
Silent fallbacks mask infrastructure misconfigurations, cause unexpected data loss across container restarts, and produce confusing behavior in production. In-memory SQLite with `StaticPool` is enabled **exclusively** during automated test execution when `is_explicit_test` is true.

---

## 4. Frontend Design System: High-Contrast Carbonly Styling

### Decision
Adopt the high-contrast **Carbonly** design system across all frontend pages (`apps/web`), characterized by:
- Deep forest primary hues (`--primary-dark: #0B3D2E`)
- Emerald accents (`--emerald: #2D6A4F`)
- Clean mint-tinted neutral surfaces (`--mint-light: #F4F9F5`)
- High-contrast, sharp border aesthetics (`--ui-border: 1px solid #1E293B`, `--ui-shadow: 3px 3px 0 #1E293B`)
- Client-side dynamic SVG Mermaid diagram rendering for technical documentation.

### Rationale
Clinical software requires exceptional legibility, clear visual hierarchy, and unambiguous demarcations between system statuses, evidence references, and clinical findings.

---

## 5. Bounded Memory for Multimodal Document Processing

### Decision
For scanned PDFs and image uploads:
- PDF page rendering is capped at 150 DPI.
- Maximum image dimension is clamped to 1600 pixels using LANCZOS antialiasing.
- Maximum page count is enforced at 15 pages per document; maximum file size is capped at 10 MB.

### Rationale
Unconstrained PDF rendering and high-resolution camera scans can quickly allocate hundreds of megabytes of RAM, triggering Out-Of-Memory (OOM) kills on standard cloud web service instances (such as Render's 512 MB free tier). Bounded rendering maintains sufficient visual fidelity for clinical transcription while keeping memory usage strictly bounded.

---

## 6. Two-Pass AI Extraction & Synthesis vs Single-Shot Prompting

### Decision
Separate clinical review into two distinct AI passes:
1. **Pass 1 (Prompt E1.1):** Schema-constrained fact extraction.
2. **Pass 2 (Prompt R1.0):** Clinical review synthesis and risk evaluation.

### Rationale
Single-shot extraction and synthesis frequently suffers from hallucinations, cognitive drift, and premature medical opinions. By first anchoring all documented facts to verbatim source quotes, deterministic rules can inspect and validate the facts before any synthesis is attempted. The synthesis pass is then strictly bounded by the grounded entities established in Pass 1.

---

## 7. Database Dialect Portability

### Decision
Use SQLAlchemy's generic `Uuid` type and `JSON().with_variant(JSONB, "postgresql")` for JSON document columns in database models.

### Rationale
This ensures that schema models and Alembic migrations execute natively against PostgreSQL in production using native UUIDs and JSONB binary storage, while allowing rapid, zero-dependency unit tests to run seamlessly against SQLite in-memory engines.
