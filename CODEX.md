# Codex Handoff

You are implementing **Sanitas**, an AI Clinical Document Reviewer.

Before changing code, read:

1. `docs/context/README_CONTEXT.md`
2. `docs/context/02-SRS.md`
3. `docs/context/03-tech-stack-decisions.md`
4. `docs/context/04-system-architecture.md`
5. `docs/context/05-pipeline-specification.md`
6. `docs/context/06-data-contracts.md`
7. `docs/context/07-ai-prompt-specification.md`
8. `docs/context/08-api-contract.md`
9. `docs/context/09-database-schema.md`
10. `docs/context/10-reliability-error-taxonomy.md`
11. `docs/context/11-evaluation-test-plan.md`
12. `docs/context/12-security-privacy-safety.md`
13. `docs/context/13-deployment-operations.md`
14. `docs/context/14-ADR-log.md`
15. `docs/context/15-ui-product-spec.md`
16. `docs/context/18-current-status.md`
17. `docs/context/19-agentic-build-instructions.md`

The context documents are authoritative.

## Current implementation phase

Foundation only.

Do not implement the AI pipeline yet.

The next phase should:
- validate the monorepo locally
- pin/install dependencies and generate lockfiles
- add SQLAlchemy models for the baseline database design
- create the first Alembic migration
- create Pydantic schema models matching the supplied JSON schemas
- configure structured logging
- configure frontend API client foundation
- make CI pass
- update `docs/context/18-current-status.md`

Do not add RAG, LangGraph, vector databases, Redis, Celery, auth, or a dedicated OCR engine without an ADR and explicit approval.
