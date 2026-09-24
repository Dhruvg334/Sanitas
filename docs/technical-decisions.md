# Technical Decisions

## Separate applications

Next.js/TypeScript and FastAPI/Python remain independently runnable services. This keeps the browser-facing application separate from backend configuration and document-service dependencies. The trade-off is two development processes and explicit CORS configuration; the placeholder page does not yet call the API.

## Reproducible dependencies

The frontend uses exact package versions and npm's lockfile, installed with `npm ci`. This preserves the resolved dependency tree instead of re-resolving floating `latest` declarations on each checkout. ESLint runs directly with the matching Next.js flat configuration; lint, typecheck, and build are separate checks.

The backend targets Python 3.12. `requirements.in` records exact direct dependencies and `requirements.txt` locks transitive dependencies with platform markers. A Windows-only `pip freeze` was avoided because CI runs on Linux. Ordinary installation uses pip; uv is needed only to regenerate the resolution. Updating pins is deliberate maintenance, followed by the checks in the README.

Existing database, model SDK, document parsing, retry, and logging packages are retained to preserve the selected dependency baseline. Most are not yet called by the application. No orchestration framework, queue, authentication provider, or additional service was added.

To regenerate the backend lock after changing direct pins, use uv 0.12.18 from `apps/api`:

```sh
uv pip compile --python-version 3.12 --universal requirements.in --output-file requirements.txt
```

The universal resolution preserves Windows and Linux dependency markers. uv is a maintenance tool, not an application dependency.

TypeScript 6.0.3 is used because the installed TypeScript ESLint tooling does not support TypeScript 7. ESLint 9.39.5 is deprecated upstream, but remains within the React, import, and accessibility plugins' supported peer ranges; ESLint 10 is outside those ranges. The current dependency tree installs without forcing peer overrides. Node types match the Node 22 runtime target.

## Independent liveness

`GET /health` reports application liveness without initializing database or model clients. This permits secret-free local startup and isolates process health from external-service availability. It is not a database-readiness check.

## Minimal frontend

The placeholder uses server-rendered content and plain responsive CSS. TanStack Query remains installed but unused. A component library and frontend test framework would add maintenance without exercising an existing product interaction, so neither is configured.
