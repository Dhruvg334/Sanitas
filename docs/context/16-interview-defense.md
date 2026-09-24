# Interview Defense Notes

This file converts implementation choices into concise defensible explanations.

## "Why two model calls?"

Extraction and synthesis have different failure modes.

The extraction stage answers: "What does the document explicitly contain?"
The review stage answers: "How should those validated facts be organized for a reviewer?"

Keeping them separate lets us validate evidence before the report can use it and lets us measure unsupported extraction separately from review quality.

Trade-off:
More latency and quota.

## "Why no LangGraph?"

The workflow is a deterministic pipeline, not an open-ended agent.

Using plain service orchestration keeps state, retries and tests explicit. I would introduce graph orchestration only if we add genuine graph requirements such as human interruption, multi-tool routing, or complex recovery paths.

## "Why no RAG?"

The task is document review, not external knowledge retrieval. Adding medical RAG would create a new source of claims that are outside the uploaded document and complicate safety.

## "Why Gemini?"

For this assignment it provides three useful capabilities in one free-tier provider:
- multimodal image/PDF understanding
- document transcription/extraction
- schema-constrained structured output

The provider is hidden behind an application service and model name is configuration, so the domain layer is not coupled to route code.

## "Why PyMuPDF if Gemini can read PDFs?"

Latency and quota.

Digital PDFs already contain text. Native extraction is faster and cheaper than asking vision to rediscover clean text. Gemini is reserved for scans/visual documents where native extraction is weak.

## "Why not Tesseract/PaddleOCR?"

A dedicated OCR engine is an optimization candidate, not an assumption.

The free serverless target rewards small dependencies. We first measure Gemini visual transcription against the synthetic handwriting/scan benchmark. If it fails, an OCR addition has empirical justification.

## "Why Vercel for Python backend?"

Current Hobby limits are adequate for this bounded workload and avoid Render Free's documented long wake path.

I consciously accept the 300-second bound and design document limits around it.

## "Why Neon?"

Sanitas needs Postgres persistence, not an auth/storage suite. Neon keeps the data layer ordinary PostgreSQL and works cleanly with SQLAlchemy.

## "Why JSONB reports?"

The AI result is a versioned nested document. JSONB preserves that contract while lifecycle fields remain relational/indexed. For an assignment this is cleaner than normalizing every symptom/evidence record into many tables.

## "Why not store uploads?"

The application only needs them while processing. Discarding bytes reduces storage, lifecycle and privacy surface. The canonical text and evidence refs are enough for the baseline report viewer.

## "How do you address hallucinations?"

Not with one prompt.

Sanitas uses:
- extraction-only pass
- structured output
- source evidence
- deterministic evidence validation
- report generation from validated extraction
- final quality gate
- regression benchmark

## "What would you change for real clinical production?"

The assignment architecture is intentionally not represented as production clinical infrastructure.

A real deployment would require, among other things:
- legal/compliance review
- appropriate provider contracts and data-use terms
- real PHI-safe hosting configuration
- authentication/authorization
- encryption/key-management review
- audit retention policy
- stronger observability
- human clinical validation
- production SLAs
- threat modeling
- model governance
- bias/safety evaluation
- incident response
- potentially asynchronous processing

## "What evidence shows this project is more than prompt engineering?"

The repository should contain:
- versioned JSON schemas
- deterministic routing logic
- validation rules
- failure taxonomy
- benchmark ground truth
- regression metrics
- latency traces
- ADRs
- end-to-end deployment
