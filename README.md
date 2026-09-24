# Sanitas

Sanitas is an AI Clinical Document Reviewer designed to process synthetic clinical documentation from plain text, images, and PDFs and produce an evidence-grounded structured clinical review.

This repository is a monorepo containing a Next.js frontend and a FastAPI backend.

> **Important:** Sanitas is currently an engineering assignment project. All clinical information used for development, testing, evaluation, screenshots, and demonstrations must be synthetic.

## Repository structure

```text
sanitas/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # FastAPI backend
├── docs/
│   └── context/              # Architecture, SRS, prompts, schemas, ADRs
├── .github/
│   └── workflows/            # CI
├── .editorconfig
├── .gitignore
└── README.md
```

## Architecture baseline

- Frontend: Next.js + TypeScript
- Backend: FastAPI + Python
- Database: PostgreSQL (Neon planned)
- ORM: SQLAlchemy
- Migrations: Alembic
- AI: Gemini via the official `google-genai` SDK
- PDF processing: PyMuPDF
- Structured validation: Pydantic

The AI/document-processing pipeline is intentionally **not implemented in this base commit**. The architecture and implementation constraints are documented under `docs/context/`.

## Local development

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

### Backend

Create and activate a Python virtual environment, then:

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Default local API URL:

```text
http://localhost:8000
```

Health endpoint:

```text
GET http://localhost:8000/health
```

Interactive API docs:

```text
http://localhost:8000/docs
```

## Environment configuration

Copy:

```text
apps/web/.env.example  -> apps/web/.env.local
apps/api/.env.example  -> apps/api/.env
```

Do not commit real secrets.


## Documentation

Public project documentation lives in:

```text
docs/
├── architecture.md
├── ai-design.md
├── evaluation.md
└── technical-decisions.md
```

These documents are updated as the implementation evolves and describe the current tested system.

## Development status

The repository currently contains the frontend/backend foundation. Clinical document processing and AI review capabilities are added iteratively and are documented only after they exist in code.
