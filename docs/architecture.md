# Architecture

This document will contain the public architecture description and final architecture diagram for Sanitas.

It is intentionally concise in the repository foundation. It must be updated as the implementation evolves and should describe only architecture that actually exists in code.

## Current baseline

```text
Browser
  |
  v
Next.js frontend
  |
  v
FastAPI backend
  |         |
  v         v
PostgreSQL  Multimodal AI service
```

The detailed implementation will be documented incrementally as components are added.
