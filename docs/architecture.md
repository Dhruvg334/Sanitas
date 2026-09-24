# Architecture

Sanitas contains two independently runnable applications:

```text
Browser --> Next.js: static placeholder page
HTTP client --> FastAPI: GET /health and generated API documentation
```

The frontend currently makes no backend requests. Its App Router page uses server rendering and responsive CSS; it has no interactive review workflow or client-side model logic.

FastAPI loads cached Pydantic settings, configures CORS from `CORS_ALLOWED_ORIGINS`, and exposes `/health`. Liveness returns application status, service name, and version without invoking a database or external model. Configuration supports local defaults and environment overrides.

SQLAlchemy provides a declarative base and session scaffold. Alembic has an environment and revision template, but there are no models, tables, or migration revisions. The session module is not imported by application startup. No runtime `create_all()` or automatic migration runs.

No documents are accepted or persisted. Database connectivity, document processing, AI integration, and report storage are not implemented. Installed libraries do not imply active integrations.
