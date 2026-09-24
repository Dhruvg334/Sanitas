# Pipeline Specification

## Pipeline overview

```text
request
  -> validate input
  -> fingerprint
  -> create analysis row
  -> classify source
  -> canonicalize document
  -> extract clinical facts
  -> deterministic validation/normalization
  -> synthesize reviewer findings
  -> final quality gate
  -> persist completed report
  -> return response
```

## Stage P0: API ingestion

Input:
- exactly one of `text` or `file`

Actions:
- assign `analysis_id`
- validate size and presence
- detect file signature
- verify PDF/image parser can open content
- calculate SHA-256
- create analysis row
- record `received_at`

No AI call.

## Stage P1: document routing

### Plain text
Route directly to canonicalization.

### PDF
Use PyMuPDF:
- open from bytes
- page count check
- extract native text page by page
- calculate per-page meaningful character count and printable-character ratio

Initial deterministic route heuristic:
- if at least 80% of pages contain >= 80 meaningful characters, classify `digital_pdf`
- otherwise classify `scanned_or_visual_pdf`

These values are configuration, not medical thresholds, and may change after benchmark evidence.

### Image
Verify with Pillow and normalize EXIF orientation.

No AI call.

## Stage P2: canonical document creation

### Plain text
Create page 1 with line/paragraph segments deterministically.

### Digital PDF
Create page segments from PyMuPDF blocks in reading order where practical. Preserve page numbers.

### Image / visual PDF
Call Prompt V1: visual transcription.
Output must validate against canonical document AI schema.
Backend adds server-generated IDs/metadata and rejects invalid segment references.

## Stage P3: clinical extraction

Call Prompt E1 with canonical document only.

The model extracts documented facts and source evidence into `ClinicalExtraction`.

No clinical concern generation occurs in this stage.

## Stage P4: deterministic validation and normalization

No AI call.

Checks include:
- schema validation
- evidence segment IDs exist
- evidence quote is present in referenced segment after normalized whitespace comparison
- duplicate entities collapsed where exact normalized identity matches
- empty strings converted to null where schema allows
- units normalized only when mechanically equivalent and original value retained
- impossible structural states rejected
- date formats normalized only when unambiguous
- review IDs unique

Important: deterministic rules do not diagnose clinical abnormality unless the source itself labels it as abnormal. The assignment is document review, not automated medical decision support.

## Stage P5: deterministic inconsistency candidates

Rules can identify document-level contradictions without medical inference, for example:
- different patient names in the same document
- conflicting DOB/age fields
- same medication explicitly listed as both active and discontinued without temporal context
- allergy field explicitly says "NKDA" while another segment explicitly names an allergy
- repeated vital type with incompatible values at same explicit timestamp

Rules create candidates; they do not silently resolve them.

## Stage P6: review synthesis

Call Prompt R1 with:
- validated extraction
- deterministic inconsistency candidates
- document quality summary

The model may:
- write concise summary
- identify document-supported clinical concerns
- identify missing/incomplete information
- identify potential inconsistencies
- list items requiring human review

The model may not introduce new patient facts.

## Stage P7: final quality gate

No AI call initially.

Checks:
- review schema valid
- every patient-specific review finding references extraction entity IDs and/or evidence refs
- no review item references missing entity IDs
- report summary length cap
- prohibited recommendation language heuristic
- no empty required arrays/objects in malformed form
- prompt/model/schema versions recorded

On quality-gate failure:
1. one bounded repair call may be attempted only for syntactic/schema/evidence-reference issues
2. if still invalid, analysis ends with a typed AI-output failure

## Stage P8: persistence

Persist:
- analysis metadata
- canonical document text only if configured; baseline stores it because evidence viewer requires it, but never original bytes
- validated extraction JSON
- final review JSON
- timings
- prompt versions
- model name
- status

Do not persist:
- uploaded raw bytes
- Gemini API key
- raw model chain-of-thought
- hidden reasoning
- full model request/response logs containing clinical document text

## Latency controls

- plain text avoids document AI
- digital PDF avoids visual transcription
- model calls use low/medium media resolution where benchmark supports it
- retries only on explicitly transient errors
- hard request timeout per model call
- page/file limits
- output token limits
- no RAG
- no agent loop
- no unbounded repair loop

## Timing events

Record milliseconds for:
- `input_validation_ms`
- `routing_ms`
- `canonicalization_ms`
- `visual_transcription_ms`
- `clinical_extraction_ms`
- `deterministic_validation_ms`
- `review_synthesis_ms`
- `quality_gate_ms`
- `persistence_ms`
- `total_ms`
