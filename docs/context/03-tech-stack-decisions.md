# Technology Stack and Decision Record

## Final baseline

| Layer | Choice | Why it fits Sanitas | Main trade-off |
|---|---|---|---|
| Frontend | Next.js + TypeScript | mature React ecosystem, Vercel-first deployment, route-level UX, strong accessibility/component ecosystem | more framework surface than Vite |
| Frontend hosting | Vercel Hobby | free, CDN, CI/CD, ideal evaluator experience | non-commercial Hobby terms and free limits |
| Backend | FastAPI + Python 3.12 | typed APIs, Pydantic integration, strong document/AI Python ecosystem | separate Python deploy |
| Backend hosting | Separate Vercel project | free Hobby supports Python/FastAPI; 300 s function duration and standard 2 GB memory are materially better for the demo than a sleeping Render Free service | serverless runtime, bounded duration, no durable local filesystem |
| Database | Neon PostgreSQL Free | real Postgres, serverless scale-to-zero, branching-friendly, clean SQLAlchemy integration | cold resume and free quota |
| ORM | SQLAlchemy 2.x | explicit data layer, portable PostgreSQL, interview-familiar | more boilerplate than direct driver |
| Migrations | Alembic | reviewable schema history | migration discipline required |
| Primary model | Gemini 3.8 Flash | free API tier, multimodal PDF/image support, structured JSON schemas, strong latency/cost fit | free-tier inputs can be used to improve provider products; use synthetic data only |
| AI SDK | `google-genai` | official current SDK | vendor-specific API |
| Validation | Pydantic v2 | same schema language for API and model output | Python-specific |
| PDF | PyMuPDF | fast native text extraction and rendering, easy in-memory processing | reading order can require care |
| Images | Pillow | lightweight verification, EXIF rotation and resizing | not a full CV toolkit |
| MIME | `filetype` + parser verification | pure-Python signature check without libmagic deployment dependency | smaller signature catalog |
| Retry | Tenacity | bounded exponential backoff for transient model/network failures | must not hide persistent failures |
| Logging | structlog | structured JSON event logs | another dependency |
| Frontend async state | TanStack Query | retries/polling/cache for report/history calls | not needed for purely local state |
| UI primitives | shadcn/ui + Radix, customized | accessible primitives with owned component code | defaults must be visually redesigned |
| Backend tests | pytest | Python standard for API/service testing | none material |
| Frontend tests | Vitest + Playwright | unit/component plus end-to-end browser coverage | additional CI runtime |
| CI | GitHub Actions | free for public repo and familiar hiring signal | minute quotas for private repos |

## Why Vercel backend instead of Render Free

Render Free currently spins web services down after 15 minutes of no inbound traffic and documents a wake-up time around one minute. That is a poor first interaction for a hiring evaluator.

Vercel Hobby currently supports Python/FastAPI functions with a 300-second Hobby maximum under Fluid compute and standard 2 GB memory. Sanitas imposes strict file/page limits so the pipeline is designed to finish well below this boundary.

Render remains a valid fallback if:
- Vercel Python dependency behavior becomes problematic
- a long-lived process becomes necessary
- we later add a queue/worker pattern

If Render credits are used later, this decision gets a new ADR rather than silently changing deployment.

## Why Neon instead of Supabase

Sanitas does not require authentication in the assignment version.

Neon gives us:
- PostgreSQL
- scale-to-zero
- SQLAlchemy-friendly connection strings
- branching useful for preview/test environments
- minimal product surface

Supabase would become preferable if Sanitas later requires integrated Auth, RLS, or its storage/realtime product.

## Why not store raw documents

Raw documents are not required after extraction. Persisting them would add:
- storage dependency
- deletion lifecycle
- larger privacy surface
- more security concerns
- unnecessary free-tier usage

Instead store:
- SHA-256 fingerprint
- source type
- original filename if present
- size/page count
- validated canonical/extraction/report data needed for review
- timings and errors

For the assignment, all content is synthetic. The design nevertheless demonstrates minimization.

## Why not OCR libraries initially

Tesseract requires system packaging and PaddleOCR is heavier than warranted for a free serverless deployment. Gemini already supports PDF/image document understanding and OCR-like transcription.

We first benchmark:
1. native PyMuPDF extraction for digital PDFs
2. Gemini visual transcription for scans/images

Only add a dedicated OCR dependency if the evaluation set demonstrates a measurable failure mode that justifies it.

## Why not LangGraph

The baseline workflow is a mostly deterministic directed pipeline. Plain service orchestration is easier to:
- test
- trace
- reason about
- explain
- deploy cheaply

LangGraph becomes justified only if future requirements introduce meaningful branching state, interrupt/resume human review, multiple tool-using agents, or complex recovery graphs.

## Why not RAG/vector search

No external knowledge base is required. RAG would increase hallucination and architecture surface without serving the assignment.

## Current external facts used in this decision

- Vercel Hobby pricing: https://vercel.com/pricing
- Vercel function limits update: https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute
- Vercel FastAPI guidance: https://vercel.com/kb/fastapi
- Render Free behavior: https://render.com/docs/free
- Neon free architecture/pricing background: https://neon.com/blog/new-usage-based-pricing
- Supabase Free limits: https://supabase.com/pricing
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini structured output: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Gemini document understanding: https://ai.google.dev/gemini-api/docs/document-processing
- PyMuPDF text extraction: https://pymupdf.readthedocs.io/en/latest/recipes-text.html

Platform limits must be rechecked immediately before final deployment because free tiers change.
