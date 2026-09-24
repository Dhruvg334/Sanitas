# Technical Decisions

## Hosting: Vercel for Next.js and Render for FastAPI

### Decision
Deploy the Next.js frontend (`apps/web`) to **Vercel** and the FastAPI backend (`apps/api`) to **Render**, targeting **Neon PostgreSQL** for future database persistence.

### Architectural Rationale
- **Vercel for Frontend:** Vercel is the native platform for Next.js App Router applications, providing optimized static asset delivery, incremental builds, edge routing, and simple domain/preview management.
- **Render for Backend:** Sanitas backend workloads are planned to expand toward digital PDF parsing, document image handling, multimodal inference, database persistence, and longer-running processing pipelines. A conventional Python web-service runtime is an architectural fit superior to a serverless-function model for this backend profile:
  - Render allows the FastAPI application to run as a standard long-lived Uvicorn service without serverless bundle-size limits, bespoke entrypoint shims, or aggressive execution cutoffs.
  - Dependencies such as PyMuPDF, Pillow, and database connection pools operate reliably in a standard containerized Linux environment.
- **Trade-offs & Known Limitations:**
  - Free Render web services spin down after 15 minutes of inactivity and may take 50+ seconds to cold-start on the subsequent request. This is an understood deployment limitation of the free tier.
  - Available Render evaluation credits or paid instance upgrades may be applied during reviewer evaluation to avoid or reduce cold-start latency.
  - No guarantees are claimed regarding absolute uptime or latency on free-tier infrastructure.

## Reproducible Dependencies

The frontend uses exact dependency versions pinned in `apps/web/package.json` and locked with `apps/web/package-lock.json`, installed via `npm ci`. ESLint 9.39.5 and TypeScript 6.0.3 are pinned to maintain compatibility with Next.js flat configuration without peer override flags.

The backend targets Python 3.12 with direct requirements recorded in `apps/api/requirements.in`. Complete transitive dependencies (including cross-platform markers for Linux and Windows) are pinned in `apps/api/requirements.txt` compiled using uv 0.12.18:

```sh
uv pip compile --python-version 3.12 --universal requirements.in --output-file requirements.txt
```

uv is an isolated build/maintenance tool and is not required for production deployment or ordinary developer setup.

## Synchronous Vertical Slice vs Asynchronous Workers

For this initial synthetic plain-text slice, analysis execution is synchronous:
- Plain-text note payloads are bounded to 50,000 characters.
- Structured Gemini model calls complete well within the application timeout (default 90s, bounded to 300s).
- Avoiding an external queue (Celery, Redis) keeps the initial deployment lightweight while remaining extensible to worker pools once heavier PDF/image ingestion is added.

## Deterministic Canonicalization & Evidence Verification

Rather than asking an LLM to segment text or trusting structured model outputs blindly:
- Plain text is segmented into Page 1 lines (`p1-s1`, `p1-s2`, etc.) deterministically in Python before any model call.
- After Gemini extraction, application code deterministically verifies that referenced segments exist, page numbers match, and quotes are verbatim substrings in normalized segment text.
- Claims failing evidence verification fail closed with `EVIDENCE_VALIDATION_FAILED`.

## Secret-Free Startup & Independent Liveness

Importing `app.main` or running `GET /health` never initializes the Gemini SDK or database clients. The `google.genai` SDK is imported lazily inside the extractor service only when an analysis request is received. This allows CI workflows, smoke tests, and local developer health checks to execute without API credentials.

## Safe Error Taxonomy

No raw Gemini exception messages, tracebacks, or document texts are exposed to the client. All failures are caught and mapped to a safe `SafeError` response containing:
- A standardized `ErrorCode` string
- A safe user-facing message
- An actionable suggestion
- A unique correlation ID (`uuid4`)
