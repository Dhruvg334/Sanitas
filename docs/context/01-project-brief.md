# Sanitas Project Brief

## Source requirement

The assignment asks for a deployed end-to-end AI Clinical Document Reviewer that accepts plain text, image uploads, and PDF uploads. Documents may be typed, scanned, or handwritten. The application must extract information, generate a structured clinical report, persist completed analyses, expose prior reports, handle failure cases clearly, and include architecture and AI/ML design documentation.

## Product interpretation

Sanitas is a reviewer-oriented document intelligence product rather than an LLM chat application.

### Inputs
- Plain clinical note text
- PNG / JPEG clinical document image
- PDF clinical document
- Synthetic content only

### Outputs
- Concise report summary
- Patient information where present
- Symptoms
- Diagnoses / conditions mentioned
- Medications
- Vital signs
- Allergies
- Clinical observations
- Clinical concerns
- Missing / incomplete information
- Potential inconsistencies
- Items requiring human review
- Evidence links back to source segments

### User flows
1. Submit a document.
2. See an honest processing state.
3. Receive a completed structured report or actionable failure message.
4. Inspect evidence for extracted claims.
5. Return to review history.
6. Reopen a prior completed analysis.

## Non-goals for the assignment version
- Real patient or protected health information
- Diagnosis generation
- Treatment recommendation
- Medication recommendation
- EHR integration
- User accounts
- Multi-tenant permissions
- Medical coding inference
- External medical knowledge retrieval
- RAG
- Fine-tuning
- Agentic tool use
- Production HIPAA claims

## Differentiators

Sanitas should stand out through:
- adaptive document routing
- source evidence for extracted facts
- strict structured output
- deterministic post-model validation
- explicit uncertainty states
- failure taxonomy
- latency instrumentation
- synthetic evaluation benchmark
- reproducible regression tests
- documented architectural decisions
