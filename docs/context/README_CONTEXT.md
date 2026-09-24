# Sanitas Starter Context

Sanitas is an AI Clinical Document Reviewer built for the AI/ML Internship Technical Assignment.

This context pack is the architectural source of truth for implementation stages. An implementation agent should read this file and then read every numbered engineering document before modifying the codebase.

## Product goal

Accept synthetic clinical documentation as plain text, image, or PDF; process typed, scanned, or handwritten content; extract evidence-grounded clinical facts; identify missing, uncertain, or conflicting information; generate a structured clinical review; persist completed analyses; and present the result in a clear reviewer-oriented UI.

Sanitas is a clinical-document review assistant. It is not a diagnostic or treatment system.

## Mandatory source constraints

- All clinical information used in development, testing, screenshots, demos, and evaluation must be synthetic.
- The frontend and backend remain separate services.
- The frontend must not contain the core AI processing logic.
- Reports must be structured and human-readable, not raw model output.
- Missing, uncertain, unreadable, and conflicting information are explicit product states.
- The public deployment must support the complete workflow.

## Locked baseline architecture

- Frontend: Next.js + TypeScript, Vercel Hobby
- Backend: FastAPI + Python 3.12, separate Vercel project
- Database: Neon PostgreSQL Free
- ORM / migrations: SQLAlchemy 2.x + Alembic
- Primary AI: Gemini 3.8 Flash via `google-genai`, model name configurable by environment variable
- PDF: PyMuPDF
- Image handling: Pillow
- Validation: Pydantic v2
- External-call retry: Tenacity
- Logging: structlog JSON logs + standard timing instrumentation
- Frontend server-state: TanStack Query
- UI primitives: customized shadcn/ui / Radix primitives
- Tests: pytest + Vitest + Playwright
- CI: GitHub Actions

## Core design principle

Evidence first, generation second.

The AI pipeline must not create the final clinical review directly from an unvalidated raw upload. Document interpretation, clinical extraction, deterministic validation, inconsistency analysis, review generation, and final quality gating are distinct stages.

## Required reading order

1. `01-project-brief.md`
2. `02-SRS.md`
3. `03-tech-stack-decisions.md`
4. `04-system-architecture.md`
5. `05-pipeline-specification.md`
6. `06-data-contracts.md`
7. `07-ai-prompt-specification.md`
8. `08-api-contract.md`
9. `09-database-schema.md`
10. `10-reliability-error-taxonomy.md`
11. `11-evaluation-test-plan.md`
12. `12-security-privacy-safety.md`
13. `13-deployment-operations.md`
14. `14-ADR-log.md`
15. `15-ui-product-spec.md`
16. `16-interview-defense.md`
17. `17-research-hiring-signals.md`
18. `18-current-status.md`
19. `19-agentic-build-instructions.md`

Machine-readable contracts live in `schemas/`.
Canonical prompt templates live in `prompts/`.
The original assignment and supplied frontend design skill are copied into `references/`.

## Change discipline

Every material implementation change must update at least one architecture/decision document and append an ADR entry when it changes a technology, data contract, AI behavior, deployment assumption, safety boundary, or important trade-off.

Never silently change a schema or prompt contract.
