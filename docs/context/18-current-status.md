# Current Status

Project: Sanitas
Stage: Architecture / specification complete
Date: 2026-09-24

## Completed decisions
- product name: Sanitas
- scope interpreted
- baseline stack selected
- free-tier deployment architecture selected
- document routing strategy designed
- canonical data model designed
- extraction and review schemas defined
- AI prompt contracts versioned
- API contract drafted
- database schema drafted
- failure taxonomy defined
- evaluation plan defined
- security/privacy boundaries documented
- interview-defense notes created

## No implementation started

There is intentionally no application code in this starter context.

## Next implementation stage

Foundation:
1. initialize monorepo
2. create frontend and backend packages
3. configure lint/format/test
4. create FastAPI health endpoint
5. configure SQLAlchemy + Neon
6. create Alembic migration for baseline schema
7. create Pydantic models from machine-readable contracts
8. configure CI
9. deploy skeleton frontend/backend
10. verify CORS and database connection

Do not implement Gemini/document processing until the foundation is deployed and tested.

## Known open questions to resolve through evidence

- exact Gemini SDK parameters for current stable API at coding time
- practical visual-transcription quality on synthetic handwriting
- optimal PyMuPDF digital-PDF route threshold
- whether Vercel Python bundle/dependency behavior needs adjustment
- benchmark p95 and whether synchronous request remains acceptable
- whether a dedicated OCR fallback provides measurable gain
