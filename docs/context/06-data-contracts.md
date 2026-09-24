# Data Contracts

Machine-readable JSON Schemas in `schemas/` are authoritative. This document explains field semantics.

## Common enums

### `source_type`
- `plain_text`
- `digital_pdf`
- `scanned_or_visual_pdf`
- `image`

### `support_status`
- `supported`
- `uncertain`
- `conflicting`

### `certainty`
- `high`
- `medium`
- `low`

### `analysis_status`
- `received`
- `validating`
- `canonicalizing`
- `extracting`
- `validating_extraction`
- `generating_review`
- `quality_gate`
- `completed`
- `failed`

### `document_quality`
- `good`
- `degraded`
- `poor`

### `importance`
- `low`
- `moderate`
- `high`

## EvidenceRef

Every extracted fact uses:

```json
{
  "segment_id": "p2-s4",
  "page_number": 2,
  "quote": "Metformin 500 mg BID"
}
```

Rules:
- `segment_id` must exist in the canonical document.
- `page_number` must match the referenced segment.
- `quote` must be a short verbatim span from the segment.
- Model-generated paraphrases are not accepted in `quote`.

## CanonicalDocument

```json
{
  "schema_version": "1.0",
  "source_type": "digital_pdf",
  "document_quality": "good",
  "quality_issues": [],
  "pages": [
    {
      "page_number": 1,
      "segments": [
        {
          "segment_id": "p1-s1",
          "text": "Synthetic patient note...",
          "segment_type": "paragraph",
          "certainty": "high"
        }
      ],
      "unreadable_regions": []
    }
  ]
}
```

`segment_type` enum:
- `paragraph`
- `heading`
- `table_row`
- `list_item`
- `form_field`
- `other`

## ClinicalExtraction

Every entity has a stable `entity_id`.

### Patient information

Fields:
- `name`
- `date_of_birth`
- `age`
- `sex`
- `medical_record_number`

Each is either `null` or a `SupportedValue`.

### SupportedValue

```json
{
  "value": "Aarav Mehta",
  "support_status": "supported",
  "certainty": "high",
  "evidence": [
    {
      "segment_id": "p1-s1",
      "page_number": 1,
      "quote": "Patient: Aarav Mehta"
    }
  ]
}
```

### Symptom

Fields:
- `entity_id`
- `name`
- `description`
- `onset`
- `duration`
- `severity`
- `support_status`
- `certainty`
- `evidence`

### Diagnosis

Fields:
- `entity_id`
- `name`
- `code`
- `diagnosis_status`
- `support_status`
- `certainty`
- `evidence`

`diagnosis_status`:
- `documented`
- `suspected`
- `historical`
- `ruled_out`
- `unknown`

The model may only select a status explicitly supported by document wording.

### Medication

Fields:
- `entity_id`
- `name`
- `dose_value`
- `dose_unit`
- `route`
- `frequency`
- `medication_status`
- `support_status`
- `certainty`
- `evidence`

`medication_status`:
- `active`
- `discontinued`
- `historical`
- `planned`
- `unknown`

### Vital

Fields:
- `entity_id`
- `vital_type`
- `value`
- `unit`
- `qualifier`
- `observed_at`
- `support_status`
- `certainty`
- `evidence`

No abnormal/normal classification is added unless explicitly stated in the source.

### Allergy

Fields:
- `entity_id`
- `substance`
- `reaction`
- `allergy_status`
- `support_status`
- `certainty`
- `evidence`

`allergy_status`:
- `present`
- `no_known_allergies`
- `uncertain`

### ClinicalObservation

Fields:
- `entity_id`
- `category`
- `observation`
- `support_status`
- `certainty`
- `evidence`

### UncertainItem

Fields:
- `item_id`
- `field`
- `candidate_values`
- `reason`
- `evidence`

## ClinicalReview

```json
{
  "schema_version": "1.0",
  "report_summary": "...",
  "clinical_concerns": [],
  "missing_information": [],
  "potential_inconsistencies": [],
  "requires_review": []
}
```

### ClinicalConcern

Fields:
- `finding_id`
- `title`
- `description`
- `importance`
- `related_entity_ids`
- `evidence`

### MissingInformation

Fields:
- `finding_id`
- `field`
- `reason`
- `importance`

No evidence is required because the finding represents absence.

### PotentialInconsistency

Fields:
- `finding_id`
- `description`
- `importance`
- `related_entity_ids`
- `evidence`

### ReviewItem

Fields:
- `finding_id`
- `title`
- `reason`
- `importance`
- `related_entity_ids`
- `evidence`

## Final API result

The completed analysis returns:

```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "created_at": "ISO-8601",
  "completed_at": "ISO-8601",
  "source": {
    "source_type": "digital_pdf",
    "original_filename": "synthetic-note.pdf",
    "sha256": "...",
    "size_bytes": 12345,
    "page_count": 2
  },
  "document_quality": {
    "level": "good",
    "issues": []
  },
  "clinical_extraction": {},
  "clinical_review": {},
  "processing": {
    "model": "gemini-3.8-flash",
    "prompt_versions": {
      "visual_transcription": null,
      "clinical_extraction": "E1.0",
      "review_synthesis": "R1.0"
    },
    "timings_ms": {
      "total": 3210
    }
  }
}
```
