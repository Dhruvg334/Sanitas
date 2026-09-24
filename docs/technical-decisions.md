# Technical Decisions

## Independent Deployable Applications on Vercel

Next.js/TypeScript (`apps/web`) and FastAPI/Python (`apps/api`) are maintained in a monorepo but deploy as two independent Vercel projects:
- **Frontend Project:** Vercel Next.js framework preset targeting root directory `apps/web`. Uses `NEXT_PUBLIC_API_BASE_URL` to route requests to the deployed backend.
- **Backend Project:** Vercel Python runtime targeting root directory `apps/api`. Uses standard Vercel framework preset configuration (`[tool.vercel] entrypoint = "app.main:app"` in `pyproject.toml`) and `functions` maxDuration configuration in `vercel.json`.

This maintains loose coupling between UI presentation and backend AI processing without requiring complex server orchestration.

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
- Structured Gemini model calls complete well within the serverless function timeout (default 90s, bounded to 120s maxDuration).
- Avoiding an external queue (Celery, Redis) or persistence worker keeps the free-tier deployment operational with minimal infrastructure footprint and zero cold-start database friction.

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
