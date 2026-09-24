# Reliability and Error Taxonomy

## Error response

```json
{
  "error": {
    "code": "DOCUMENT_QUALITY_TOO_LOW",
    "message": "The uploaded document could not be read reliably.",
    "recoverable": true,
    "suggestion": "Upload a clearer scan or enter the note as text.",
    "correlation_id": "..."
  }
}
```

## Error codes

### Input
- `EMPTY_INPUT`
- `MULTIPLE_INPUTS`
- `TEXT_TOO_LARGE`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `FILE_SIGNATURE_MISMATCH`
- `CORRUPTED_FILE`
- `PDF_PAGE_LIMIT_EXCEEDED`
- `IMAGE_DECODE_FAILED`

### Document processing
- `PDF_PARSE_FAILED`
- `DOCUMENT_QUALITY_TOO_LOW`
- `VISUAL_TRANSCRIPTION_FAILED`
- `CANONICAL_DOCUMENT_INVALID`

### AI extraction/review
- `MODEL_RATE_LIMITED`
- `MODEL_TIMEOUT`
- `MODEL_UNAVAILABLE`
- `MODEL_RESPONSE_INVALID`
- `EVIDENCE_VALIDATION_FAILED`
- `REVIEW_QUALITY_GATE_FAILED`

### Persistence
- `DATABASE_UNAVAILABLE`
- `DATABASE_WRITE_FAILED`

### Unexpected
- `INTERNAL_ERROR`

## Retry policy

Retry only transient external failures:
- timeout
- 429 where retry-after is reasonable
- selected 5xx provider errors

Initial policy:
- maximum 2 retries after first attempt
- exponential backoff with jitter
- hard total timeout

Do not retry:
- schema mismatch caused by stable prompt behavior more than one repair attempt
- unsupported files
- poor document quality
- deterministic validation failures that require human input

## Circuit behavior

A full circuit breaker is not necessary for assignment scale.
If repeated upstream failures are observed in evaluation, revisit via ADR.

## Model repair

One Q1 repair attempt is allowed only when:
- JSON parses but violates schema/reference constraints
- repair does not require new clinical facts

No recursive repair loops.

## Logging policy

Log:
- analysis ID
- stage
- durations
- source type
- page count
- model
- retry number
- error code

Do not log:
- document text
- patient names
- medications
- diagnoses
- evidence quotes
- full prompts containing source data
