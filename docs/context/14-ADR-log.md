# Architecture Decision Records

## ADR-001: Separate frontend and backend
Status: Accepted

Decision:
Next.js frontend and FastAPI backend are independent deployable services.

Reason:
Direct assignment requirement; protects AI secrets and isolates document processing.

Pros:
- clean responsibility boundary
- independent tests/deploys
- API is demonstrable

Cons:
- CORS/configuration
- two deployments

## ADR-002: FastAPI over Node backend
Status: Accepted

Decision:
Use Python/FastAPI.

Reason:
Pydantic, PyMuPDF, AI SDKs and evaluation code fit Python naturally.

Pros:
- shared Pydantic contracts
- strong document tooling
- interview-relevant AI backend

Cons:
- separate language from frontend

## ADR-003: Vercel backend over Render Free
Status: Accepted

Decision:
Deploy FastAPI as a separate Vercel Hobby project.

Reason:
Render Free sleeping/wake behavior is a poor hiring-demo characteristic. Vercel currently provides a free Python/FastAPI path with bounded execution adequate for the designed limits.

Pros:
- no Render one-minute wake path
- 2 GB standard memory
- 300-second Hobby max function duration
- same deployment ecosystem as frontend

Cons:
- serverless runtime constraints
- no durable local filesystem
- function duration remains bounded

Fallback:
Render if Vercel Python dependency/runtime constraints become problematic.

## ADR-004: Neon PostgreSQL over Supabase
Status: Accepted

Decision:
Use Neon PostgreSQL with SQLAlchemy.

Reason:
No auth requirement. We need PostgreSQL, not a backend suite.

Pros:
- clean SQL boundary
- serverless scale-to-zero
- branching

Cons:
- another external provider
- free compute constraints

## ADR-005: Do not persist raw uploads
Status: Accepted

Decision:
Process bytes in memory and discard.

Pros:
- smaller privacy and storage surface
- no object storage dependency
- lower free-tier usage

Cons:
- cannot re-run exact raw document later
- evidence viewer depends on persisted canonical text rather than original image/PDF

Revisit:
If source-image highlighting becomes a core feature.

## ADR-006: Gemini Flash multimodal
Status: Accepted

Decision:
Use Gemini 3.8 Flash as configurable baseline.

Reason:
Free tier, multimodal document understanding, structured output, PDF/image support.

Pros:
- one provider for OCR-like vision + extraction + synthesis
- free assignment path
- schema support

Cons:
- vendor dependency
- free-tier rate limits
- free-tier content-use terms
- not suitable for real PHI under this assignment configuration

## ADR-007: No dedicated OCR at baseline
Status: Accepted

Decision:
PyMuPDF native text fast path, Gemini visual transcription slow path.

Reason:
Avoid heavy serverless dependencies until benchmark shows need.

Revisit criterion:
Handwriting/scan benchmark fails materially and a free OCR alternative measurably improves results.

## ADR-008: No LangGraph
Status: Accepted

Decision:
Explicit Python pipeline service.

Reason:
The workflow is deterministic enough that graph orchestration adds complexity without current value.

Revisit:
Human interrupt/resume, multi-agent/tools, or complex graph state is introduced.

## ADR-009: No RAG
Status: Accepted

Reason:
No external knowledge retrieval requirement; Sanitas should stay document-grounded.

## ADR-010: Two semantic AI stages
Status: Accepted

Decision:
Extraction and review synthesis are separate calls.

Reason:
The review sees validated facts rather than raw source alone.

Pros:
- stronger grounding boundary
- stage-specific evaluation
- easier debugging

Cons:
- added latency and model quota

## ADR-011: Synchronous MVP
Status: Accepted

Decision:
POST request waits for analysis completion.

Reason:
Avoid unreliable free queue/worker infrastructure while inputs are tightly bounded.

Revisit:
p95 latency or timeout benchmark shows synchronous flow is unacceptable.

## ADR template for future changes

```text
## ADR-NNN: Title
Status:
Date:
Context:
Decision:
Alternatives:
Pros:
Cons:
Evidence:
Revisit trigger:
```
