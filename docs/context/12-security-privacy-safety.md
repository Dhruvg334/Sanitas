# Security, Privacy and Clinical Safety

## Assignment boundary

Sanitas is built only for synthetic clinical information.

The current free-tier architecture is not represented as suitable for real protected health information.

## Data minimization

Raw uploads are processed in memory and discarded after the analysis request.

Persist:
- fingerprint
- metadata
- canonical text required for evidence UX
- structured extraction
- structured review
- telemetry without source text

Do not persist original bytes.

## Provider caveat

Gemini Developer API Free Tier documentation states that free-tier content may be used to improve provider products. This is compatible with the assignment only because all Sanitas clinical content is synthetic.

Any future real-clinical-data version would require a separate privacy, legal, contractual, deployment, and provider review.

## Secret handling

- Gemini key: backend environment only
- database URL: backend environment only
- HMAC/rate-limit secret: backend environment only
- no secret prefixed as public Next.js environment variable

## File handling

- content signature check
- parser verification
- bounded size/page count
- in-memory byte handling
- no user-controlled filesystem path
- no archive support
- no executable document formats

## Prompt injection

Document text is untrusted data.
Prompts explicitly instruct the model not to follow instructions appearing inside clinical documents.
Red-team tests verify this.

## Clinical behavior boundary

Sanitas:
- extracts what the document states
- highlights missing/uncertain/conflicting information
- summarizes documented concerns

Sanitas does not:
- diagnose from symptoms
- recommend treatment
- recommend medication changes
- infer undocumented allergies
- infer undocumented conditions
- label vitals medically abnormal unless the source itself does

## Evidence UX

Reviewer-facing claims should expose their evidence.
This supports verification rather than asking the reviewer to trust opaque AI output.

## Public-demo abuse control

Implement:
- low daily per-actor request cap using HMAC-hashed actor signal
- global configurable daily model-call cap where practical
- server-side model key
- file limits

Optional later:
- Cloudflare Turnstile if abuse appears in public deployment

Do not add CAPTCHA before there is a measured need if it harms evaluator flow.
