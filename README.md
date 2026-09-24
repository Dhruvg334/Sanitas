# Sanitas: AI Clinical Document Reviewer

Sanitas is an AI-assisted clinical document reviewer built for **synthetic medical data**. It ingests multi-modal clinical documents (plain text, digital PDFs, scanned PDFs, and document images), normalizes them into immutable canonical source segments, extracts clinical facts using schema-constrained reasoning with Google Gemini, deterministically validates source evidence and factual contradictions, and synthesizes structured clinical review reports accessible through an inspectable, evidence-linked web interface.

---

## 1. Live Deployments

- **Frontend**: [https://sanitas-peach.vercel.app](https://sanitas-peach.vercel.app) (Deployed on **Vercel**)
- **Backend API**: [https://sanitas-api.onrender.com](https://sanitas-api.onrender.com) (Deployed on **Render**)
- **Database**: **Neon PostgreSQL** (Serverless PostgreSQL for analysis persistence & audit logging)
- **AI Model**: **Google Gemini API** (`gemini-3.8-flash` / `gemini-2.5-flash`)

---

## 2. Architecture & 7-Stage Pipeline

```text
Browser / Client (Next.js 16 on Vercel)
   │
   ▼ POST /api/v1/analyses (JSON or multipart/form-data)
FastAPI Backend on Render (Python 3.12 / Uvicorn)
   ├── Stage P1: Request Normalization & Adaptive Ingestion Router
   │             (Plain text, PyMuPDF digital PDF, bounded image/scanned PDF)
   ├── Stage P2: Canonical Document Construction (p{page}-s{seq} segments)
   ├── Stage P3: Structured Fact Extraction (Pass 1 - Gemini Prompt E1.1)
   ├── Stage P4: Deterministic Evidence Verification (Verbatim quote checks)
   ├── Stage P5: Deterministic Inconsistency Engine (Contradiction rules)
   ├── Stage P6: Review Synthesis (Pass 2 - Gemini Prompt R1.0)
   └── Stage P7: Review Quality Gate (Entity cross-referencing & safeguards)
   │
   ▼ Persist State & Event Ledger
Neon PostgreSQL (Analyses & Processing Events)
```

---

## 3. Core Features

- **Multi-Modal Document Ingestion:** Supports plain-text notes, digital PDFs, scanned/visual PDFs, and JPEG/PNG document scans with strict bounds (max 10 MB, max 15 pages, max 50,000 chars).
- **Two-Pass AI Architecture:**
  - **Pass 1 (Extraction):** Strictly extracts documented entities (demographics, symptoms, diagnoses, medications, vitals, allergies, observations) with zero speculative opinion.
  - **Pass 2 (Synthesis):** Reviews extracted facts, contextualizes clinical concerns, and highlights actionable information gaps.
- **Deterministic Evidence Grounding:** Every extracted entity and concern links to exact canonical segment IDs (`p1-s1`, etc.) and is deterministically verified via normalized substring matching.
- **Factual Contradiction Engine:** Automatically flags document-level inconsistencies (e.g. "NKDA" allergy status alongside a documented penicillin allergy; active vs discontinued medication conflicts).
- **Carbonly Design System:** High-contrast UI featuring deep forest greens, emerald highlights, crisp mint surfaces, and accessible typography.
- **Interactive Technical Documentation:** Built-in documentation portal (`/docs`) with interactive tabs and dynamic SVG Mermaid architectural diagrams.
- **Durable Analysis Permalinks:** Persistent analysis review pages (`/review/[id]`) that survive browser refreshes.
- **Audit History Ledger:** Browse and reopen previous analyses at `/history`.

---

## 4. Local Development

### Prerequisites
- Node.js 22 with npm 10
- Python 3.12
- Google Gemini API key (for live model runs; test suite and health checks run without credentials)
- PostgreSQL database (or leave default for local testing)

### 1. Backend Service (`apps/api`)

```sh
cd apps/api

# Create and activate virtual environment
# Windows PowerShell:
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# python3.12 -m venv .venv && source .venv/bin/activate

# Install locked dependencies
python -m pip install -r requirements.txt

# Start backend development server
uvicorn app.main:app --reload --port 8000
```

- Liveness check: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger UI docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Application (`apps/web`)

In a separate terminal:

```sh
cd apps/web
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Configuration Reference

Template configuration files `.env.example` are provided in both `apps/web` and `apps/api`.

### Backend Settings (`apps/api/.env`)
- `GEMINI_API_KEY`: API key for Google Gemini model calls.
- `GEMINI_MODEL`: Model version; defaults to `gemini-3.8-flash`.
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql+psycopg://...`).
- `CORS_ALLOWED_ORIGINS`: Allowed origins; defaults to `http://localhost:3000`.
- `MAX_TEXT_CHARS`: Maximum text note length; default `50000`.
- `MAX_UPLOAD_BYTES`: Maximum upload size; default `10485760` (10 MB).
- `MAX_PDF_PAGES`: Maximum pages for PDF documents; default `15`.
- `MODEL_TIMEOUT_SECONDS`: Request timeout; default `90`.

### Frontend Settings (`apps/web/.env.local`)
- `NEXT_PUBLIC_API_BASE_URL`: Base URL of the FastAPI backend; defaults to `http://localhost:8000`.

---

## 6. Testing & Evaluation

### Backend Test Suite
```sh
cd apps/api
pytest -v
python -m app.smoke
```
Runs 33 automated tests covering foundation, canonicalization, input validation, multimodal routing, inconsistency rules, quality gates, and database persistence.

### Synthetic Evaluation Suite
```sh
cd apps/api

# CI Structural Validation (mocked, offline, fast)
python -m eval.runner --mock

# Live Model Benchmark (requires GEMINI_API_KEY)
python -m eval.runner --live
```

### Frontend Static Analysis & Build
```sh
cd apps/web
npm run lint
npm run typecheck
npm run build
```

---

## 7. Safety & Ethical Boundaries

- **Synthetic Clinical Data Exclusively:** Sanitas is built strictly for research and evaluation on synthetic clinical documents. Do not input real patient data or Protected Health Information (PHI).
- **No Prescriptive Authority:** Sanitas does not provide medical advice, establish clinical diagnoses, or direct patient treatment.
- **Fail-Closed Verification:** Extracted claims failing deterministic evidence verification fail closed and are not presented as verified facts.
