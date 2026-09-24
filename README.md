# Sanitas

Sanitas is a clinical document review project for **synthetic data only**. The current application contains a responsive Next.js placeholder page and a FastAPI service with a health endpoint. Document submission, clinical extraction, AI review, and report history are not implemented.

## Repository

- `apps/web/`: Next.js, React, and TypeScript frontend.
- `apps/api/`: Python 3.12 FastAPI service, settings, tests, and database scaffolding.
- `docs/`: architecture, technical decisions, AI status, and evaluation documentation.
- `.github/workflows/ci.yml`: frontend and backend checks.

## Requirements

Use Node.js 22 with npm 10 and Python 3.12. No database, model credentials, or production secrets are required to run the placeholder page or health endpoint.

Frontend dependencies are pinned in `package.json` and `package-lock.json`. Backend direct dependencies are listed in `requirements.in`; `requirements.txt` pins the complete dependency resolution, including platform-specific dependencies. Install from the lockfiles using the commands below.

## Local development

### Frontend

```sh
cd apps/web
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). To serve a production build, run `npm run build` followed by `npm start`.

### Backend

Create a Python 3.12 virtual environment in `apps/api`:

```sh
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell, use `py -3.12 -m venv .venv` and `.\.venv\Scripts\Activate.ps1` instead. With the environment active:

```sh
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

[GET /health](http://localhost:8000/health) returns `status`, `service`, and `version`. [API documentation](http://localhost:8000/docs) is available without external services. Health reports application liveness; it does not check database or model availability.

## Configuration

Defaults support local startup without environment files. The backend reads environment variables and an optional `apps/api/.env` when started from `apps/api`. Environment variables take precedence over `.env`.

- `APP_VERSION`: API metadata and health response version; default `0.1.0`.
- `CORS_ALLOWED_ORIGINS`: comma-separated allowed browser origins; default `http://localhost:3000`.
- `DATABASE_URL`: used only by the SQLAlchemy/Alembic scaffold, not application startup or health.

The `.env.example` files also contain reserved settings for capabilities that are not implemented. In particular, the frontend does not yet call the backend or consume `NEXT_PUBLIC_API_BASE_URL`. Model, upload-limit, rate-limit, and logging settings do not enable those features. Never put secrets in public frontend variables or commit `.env` files.

## Validation

From `apps/web`:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

From `apps/api`, with the Python 3.12 virtual environment active:

```sh
python -m pip install -r requirements.txt
python -m pip check
pytest
python -m app.smoke
```

CI runs these same checks. No frontend unit-test suite is configured. Backend tests cover health, default settings, environment configuration, CORS, and startup without database/model initialization.

## Documentation and limitations

See [architecture](docs/architecture.md), [technical decisions](docs/technical-decisions.md), [AI design](docs/ai-design.md), and [evaluation](docs/evaluation.md).

There are no database models or migration revisions, no document-processing endpoints, and no clinical quality measurements. The application is not suitable for real patient data or clinical decision-making.
