# API Contract

Base path: `/api/v1`

## POST /analyses

Creates and processes one analysis.

Content type:
`multipart/form-data`

Fields:
- `text`: optional string
- `file`: optional binary

Constraint:
Exactly one of `text` or `file` must be present.

Success:
`201 Created`

Response:
Completed analysis object.

Failure:
Typed error response.

Why synchronous:
Free-tier architecture has no durable queue. The request is bounded by document limits and backend duration. This may change only after benchmark evidence.

## GET /analyses

Query parameters:
- `limit`: default 20, max 50
- `cursor`: optional opaque cursor
- `status`: optional

Response:
```json
{
  "items": [
    {
      "analysis_id": "uuid",
      "created_at": "ISO-8601",
      "status": "completed",
      "source_type": "digital_pdf",
      "original_filename": "synthetic-note.pdf",
      "report_summary": "..."
    }
  ],
  "next_cursor": null
}
```

## GET /analyses/{analysis_id}

Returns the persisted complete analysis.

`404` if not found.

## GET /analyses/{analysis_id}/status

Small status endpoint for refresh/recovery.

Response:
```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "updated_at": "ISO-8601",
  "error": null
}
```

## GET /health

No external AI call.

Response:
```json
{
  "status": "ok",
  "service": "sanitas-api",
  "version": "..."
}
```

## DELETE /analyses/{analysis_id}

Not required for assignment MVP.
May be added later if history management is desired.

## HTTP mapping

- 400: malformed request / exactly-one-input violation
- 413: file or text too large
- 415: unsupported file type
- 422: parseable request but invalid document structure
- 429: application usage limit or upstream model limit
- 502: upstream model malformed/unusable response
- 503: external model/database temporarily unavailable
- 504: upstream timeout
- 500: unexpected internal failure

The response body always follows `error_response.schema.json`.
