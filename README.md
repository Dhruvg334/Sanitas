# Sanitas

Sanitas is an AI clinical document reviewer for **synthetic data only**. This release implements the end-to-end clinical review vertical slice: synthetic plain-text clinical-note submission, deterministic canonicalization into source segments, Gemini-based schema-constrained extraction, deterministic source evidence verification, and an accessible frontend results interface with inspectable source quotes.

## Architecture & Repository Structure

- `apps/web/`: Next.js, React, and TypeScript frontend review interface.
- `apps/api/`: Python 3.12 FastAPI service with deterministic canonicalization, Gemini structured extraction, evidence verification, and typed error handling.
- `docs/`: architecture, technical decisions, AI design, and evaluation documentation.
- `.github/workflows/ci.yml`: automated GitHub Actions workflow running identical local validation checks.

## Implemented Product Slice

1. **Synthetic Clinical Note Submission:** Web interface accepting synthetic plain-text clinical notes with character limit checking (max 50,000 characters), accompanied by a pre-loaded synthetic clinical demo note.
2. **Deterministic Canonicalization:** Normalizes plain-text notes into Page 1 canonical source segments (`p1-s1`, `p1-s2`, etc.) while strictly preserving original wording for verification.
3. **Structured Extraction via Gemini:** Extracts patient information, symptoms, diagnoses/conditions, medications, vitals, allergies, clinical observations, and uncertain items using schema-constrained JSON output.
4. **Deterministic Evidence Verification:** Every extracted claim references canonical segments and is verified in application code (verifying segment ID existence, page number, and verbatim quote presence after whitespace normalization). Failing evidence references fail closed.
5. **Inspectable Results UI:** Formats extracted clinical entities into readable cards with status and certainty indicators, featuring interactive source evidence pills that highlight corresponding segments in the source document viewer.
6. **Typed Error Taxonomy:** Transparent error boundary returning actionable safe errors for empty input, oversized text, invalid requests, rate limits, timeouts, service unavailability, and validation failures.

*Note: PDF/image upload, OCR, persistence/history, and authentication are intentionally deferred from this vertical slice.*

## Requirements

- Node.js 22 with npm 10
- Python 3.12
- Google Gemini API key (for live clinical note analysis; the test suite and health checks run without credentials)

Frontend dependencies are pinned in `apps/web/package.json` and `package-lock.json`. Backend direct dependencies are in `apps/api/requirements.in`; complete cross-platform resolutions are pinned in `apps/api/requirements.txt`.

## Local Development

### 1. Backend Service (`apps/api`)

Create and activate a Python 3.12 virtual environment:

```sh
cd apps/api
# On Linux / macOS:
python3.12 -m venv .venv
source .venv/bin/activate

# On Windows PowerShell:
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install locked dependencies and run the service:

```sh
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- [GET /health](http://localhost:8000/health) returns liveness status (`status`, `service`, `version`) without external dependencies.
- [POST /api/v1/analyses](http://localhost:8000/api/v1/analyses) processes synthetic plain-text notes.
- [Swagger UI](http://localhost:8000/docs) is available locally.

### 2. Frontend Application (`apps/web`)

In a separate terminal:

```sh
cd apps/web
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Template files `.env.example` are provided in both `apps/web` and `apps/api`. Never commit `.env` files or secret keys.

### Backend (`apps/api/.env`)

- `GEMINI_API_KEY`: API key for Google Gemini model calls (leave empty for testing/health only).
- `GEMINI_MODEL`: Model name; default `gemini-3.8-flash`.
- `CORS_ALLOWED_ORIGINS`: Comma-separated allowed frontend origins; default `http://localhost:3000`.
- `MAX_TEXT_CHARS`: Maximum allowed note characters; default `50000`.
- `MODEL_TIMEOUT_SECONDS`: Extraction timeout in seconds; default `90`.
- `APP_ENV`: Application environment (`development` / `production`); default `development`.
- `APP_VERSION`: Service version; default `0.1.0`.
- `LOG_LEVEL`: Logging verbosity; default `INFO`.

### Frontend (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL`: Base URL of the FastAPI backend; defaults to `http://localhost:8000` in local development.

## Validation

Run the repository's test and build suites locally:

### Frontend (`apps/web`)

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

### Backend (`apps/api`, with virtual environment active)

```sh
python -m pip install -r requirements.txt
python -m pip check
pytest
python -m app.smoke
```

CI executes these same commands on every push and pull request. Mocked tests do not require external credentials or network connectivity.

## Deployment to Vercel

Sanitas is deployed as two independent Vercel projects from the same GitHub repository.

### 1. Backend Project (FastAPI)

1. In the Vercel Dashboard, click **Add New... > Project** and import the Sanitas repository.
2. In **Project Settings**:
   - **Framework Preset**: Other (Vercel automatically detects FastAPI via `apps/api/pyproject.toml` and `requirements.txt`).
   - **Root Directory**: `apps/api`
3. Configure **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `CORS_ALLOWED_ORIGINS`: `http://localhost:3000` (update to the production frontend URL once deployed).
   - `MAX_TEXT_CHARS`: `50000`
   - `MODEL_TIMEOUT_SECONDS`: `90`
   - `APP_ENV`: `production`
   - `APP_VERSION`: `0.1.0`
4. Click **Deploy**.
5. Once deployed, verify liveness by opening: `https://<backend-domain>.vercel.app/health`.

### 2. Frontend Project (Next.js)

1. In the Vercel Dashboard, click **Add New... > Project** and import the same Sanitas repository.
2. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
3. Configure **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<backend-domain>.vercel.app` (the production backend domain from Step 1).
4. Click **Deploy**.
5. After deployment, update `CORS_ALLOWED_ORIGINS` in the Backend Project Settings to include `https://<frontend-domain>.vercel.app`, and redeploy the backend if needed.

## Clinical Safety & Limitations

- **Synthetic Data Only:** Sanitas is built strictly for evaluation and research on synthetic clinical notes. Do not submit Protected Health Information (PHI) or real patient records.
- **No Diagnostic or Treatment Authority:** Sanitas does not provide medical advice, diagnosis, or clinical management recommendations.
- **Scope Discipline:** File uploads (PDF/images), OCR pipelines, database persistence, and user history are deferred from this vertical slice.
