# Instructions for Agentic Coding Harness

## Required behavior

Before any implementation phase:
1. read all context documents
2. state the phase goal
3. state files/modules expected to change
4. identify any ADR affected
5. do not change architecture silently

## Source-of-truth order

1. original assignment
2. SRS
3. machine-readable schemas
4. ADR log
5. pipeline specification
6. API/database specs
7. current status
8. implementation code

If code conflicts with specs, stop and surface the conflict.

## Engineering rules

- Core AI logic stays in backend.
- Use typed Pydantic boundaries.
- Do not parse LLM JSON with regex.
- Use structured output schema.
- Never log raw clinical source text.
- Never persist raw file bytes.
- Never add RAG, LangGraph, vector DB, Celery, Redis, OCR engine, auth, or another external service without an ADR and user approval.
- Keep Gemini model name configurable.
- Keep prompt versions explicit.
- Every model call has timeout, bounded retry and typed failure mapping.
- Evidence references are validated in code.
- Every new failure path receives a test.
- Any routing/prompt/model change should be measurable against the evaluation suite once that suite exists.

## Frontend rules

- Product UI, not marketing landing page.
- No raw JSON output.
- Implement loading, empty and error states.
- Evidence is visible and usable.
- Do not fake backend stage progress.
- shadcn/Radix defaults must be visually customized.
- follow the supplied design-skill accessibility and anti-generic guidance where it applies.

## Git phase discipline

Use branches for multi-commit phases.
Small isolated single-commit changes may be pushed directly only when the repository workflow/user explicitly allows it.

## Documentation discipline

After each phase update:
- `18-current-status.md`
- affected ADRs
- affected technical specs
- README once repository exists

Record:
- what changed
- why
- alternatives considered
- trade-offs
- benchmark/test evidence where available
- remaining limitations
