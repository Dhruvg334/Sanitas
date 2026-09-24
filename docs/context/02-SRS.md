# Software Requirements Specification (SRS)

## 1. Purpose

Define the functional, non-functional, interface, reliability, AI, deployment, and documentation requirements for Sanitas.

## 2. System scope

Sanitas processes synthetic clinical documents and produces evidence-grounded structured clinical reviews.

## 3. Actors

### Reviewer
A non-technical user who submits a clinical document and reviews the result.

### Developer / evaluator
A technical user who evaluates the repository, API behavior, architecture, tests, metrics, and deployment.

## 4. Functional requirements

### FR-001 Input modes
The system shall accept:
- plain text
- PDF (`application/pdf`)
- JPEG (`image/jpeg`)
- PNG (`image/png`)

### FR-002 Input validation
The backend shall validate:
- non-empty input
- declared and detected MIME compatibility
- configurable file size
- PDF parseability
- configurable PDF page count
- image parseability
- plain-text length

Initial limits:
- files: 10 MB maximum
- PDF: 15 pages maximum
- text: 50,000 Unicode characters maximum

Limits must be configurable through environment variables.

### FR-003 Synthetic-data acknowledgement
The upload surface shall clearly state that only synthetic clinical documents may be submitted.

### FR-004 Document routing
The backend shall classify the input into one of:
- `plain_text`
- `digital_pdf`
- `scanned_or_visual_pdf`
- `image`

### FR-005 Canonical document
Every accepted input shall be converted into the canonical document contract.

### FR-006 Clinical extraction
The system shall extract patient information, symptoms, diagnoses, medications, vitals, allergies, and clinical observations with source evidence when available.

### FR-007 Uncertainty
The system shall represent:
- missing information
- uncertain information
- unreadable source regions
- conflicting information

### FR-008 Clinical review
The system shall generate:
- report summary
- clinical concerns
- missing information
- potential inconsistencies
- items requiring review

### FR-009 Evidence
Extracted clinical facts and review findings shall reference source evidence or be marked as evidence unavailable.

### FR-010 Validation
AI structured output shall pass:
1. JSON-schema/Pydantic validation
2. deterministic semantic validation
3. evidence-reference validation

### FR-011 Persistence
Completed and failed analyses shall persist metadata, status, timing data, errors, extraction JSON where valid, and report JSON where completed.

Raw uploaded files shall not be persisted.

### FR-012 History
Users shall be able to:
- view previous analyses
- see processing timestamp
- see final status
- see summary for completed analyses
- reopen completed analyses

### FR-013 Errors
The UI shall present typed actionable error messages.

### FR-014 Health endpoint
The backend shall expose a lightweight health endpoint that does not call Gemini.

## 5. Non-functional requirements

### NFR-001 Architecture
Frontend and backend shall be independently deployable.

### NFR-002 Maintainability
Pipeline stages shall be implemented as explicit modules with typed boundaries.

### NFR-003 Observability
Every analysis shall produce:
- correlation ID
- stage timings
- route selected
- model name
- retry count
- final status
- typed error code if failed

No uploaded clinical text shall be emitted to application logs.

### NFR-004 Latency
The system shall optimize latency by:
- bypassing AI document transcription for plain text
- attempting native PDF text extraction before visual transcription
- calling the vision transcription path only when needed
- limiting retries
- using bounded document size/page limits

Latency is measured rather than promised. Evaluation must report p50 and p95 from the synthetic benchmark.

### NFR-005 Accessibility
Key user flows shall be keyboard usable and target WCAG AA contrast.

### NFR-006 Security
Secrets shall stay server-side.
File type shall be validated by content, not only filename.
Raw uploads shall be discarded after request processing.

### NFR-007 Cost
The assignment version shall be deployable using free-tier resources:
- Vercel Hobby
- Neon Free
- Gemini Developer API Free Tier

### NFR-008 Reproducibility
Dependencies shall be pinned by lockfiles and database migrations shall be committed.

## 6. AI requirements

### AIR-001 Grounding
The AI shall only state patient-specific facts supported by supplied document content.

### AIR-002 Non-inference
The AI shall not infer undocumented diagnoses, medications, allergies, demographics, test results, or treatment plans.

### AIR-003 Missingness
Absence shall be represented as missing/unknown rather than filled by model knowledge.

### AIR-004 Medical restraint
The AI shall not generate treatment recommendations or claim a diagnosis not stated in the document.

### AIR-005 Evidence
Every extracted entity must contain at least one valid evidence reference unless its status is `missing`.

### AIR-006 Schema
Model outputs must conform to the supplied response schema.

### AIR-007 Prompt versioning
Every persisted analysis shall store prompt-version identifiers.

## 7. Data constraints

All development and demonstration clinical content is synthetic.

The free Gemini API tier may permit submitted content to be used to improve Google products. Therefore, Sanitas must not be described or deployed as suitable for real PHI under the assignment architecture.

## 8. Acceptance criteria

The project is acceptable when:
- text, image, and PDF flows operate end-to-end
- at least one scanned/handwritten synthetic case is demonstrated
- report history works after redeploy
- invalid files fail with typed errors
- malformed AI output is caught
- benchmark metrics are generated by code
- public frontend and public backend URLs work
- repository documentation covers architecture, setup, AI workflow, decisions, trade-offs, limitations, and evaluation
