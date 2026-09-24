# Deployment and Operations

## Free-tier target

### Frontend
Vercel Hobby project A.

### Backend
Vercel Hobby project B running FastAPI/Python.

### Database
Neon Free PostgreSQL.

### AI
Gemini Developer API Free Tier.

## Why not Render Free baseline

Render Free web services currently sleep after 15 minutes without inbound traffic and may take about a minute to resume. This creates a poor evaluator first request.

Render remains a documented fallback.

## Backend runtime constraints

Sanitas intentionally sets:
- max file 10 MB
- max PDF 15 pages
- max text 50k chars
- bounded model output
- bounded retries

The system should configure Vercel's maximum duration within the Hobby-supported bound.

## Environment variables

Backend:
```text
APP_ENV
APP_VERSION
DATABASE_URL
GEMINI_API_KEY
GEMINI_MODEL
CORS_ALLOWED_ORIGINS
MAX_FILE_BYTES
MAX_PDF_PAGES
MAX_TEXT_CHARS
MODEL_TIMEOUT_SECONDS
RATE_LIMIT_HMAC_SECRET
DAILY_REQUEST_LIMIT
LOG_LEVEL
```

Frontend:
```text
NEXT_PUBLIC_API_BASE_URL
```

No other backend secrets belong in frontend variables.

## Health monitoring

`GET /health` checks application process health without calling Gemini.

Database health should not block the basic liveness endpoint. A separate readiness-style internal check may test database connectivity if useful.

## CI pipeline

Backend:
- Ruff/format check
- type check if adopted
- pytest
- migration sanity

Frontend:
- lint
- typecheck
- Vitest
- production build

E2E:
- Playwright on a controlled environment when practical

## Deployment preflight

- environment variables set
- database migrations applied
- CORS production origin exact
- model free-tier quota available
- health endpoint passes
- sample synthetic text flow passes
- sample image flow passes
- sample PDF flow passes
- history reload passes

## Free-tier caveats to disclose

- platform quotas can change
- Vercel Hobby is intended for personal/non-commercial projects
- Neon free compute may resume from idle
- Gemini Free has lower rate limits and provider data-use terms
- no uptime SLA
