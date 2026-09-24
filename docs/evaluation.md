# Evaluation

Current validation covers software foundation behavior only. There is no clinical benchmark, model evaluation, or measured extraction accuracy.

The backend pytest suite verifies the health response, secret-free default settings, `.env` loading, environment-variable precedence, allowed and rejected CORS origins, and startup without database/model initialization. `python -m app.smoke` separately checks application import, lifespan startup, and `/health`.

The frontend is checked with ESLint, TypeScript, and a production build. No frontend unit-test suite is configured. The exact reproducible commands are in the [README](../README.md); GitHub Actions runs the same checks on Node.js 22 and Python 3.12.

These checks do not establish database readiness, document-processing quality, clinical safety, or deployment performance.

The pinned Starlette version emits a deprecation warning for the existing `httpx` test-client integration. Tests and lifespan startup pass; the warning is not suppressed. Frontend installation also reports the ESLint 9 deprecation described in [technical decisions](technical-decisions.md).
