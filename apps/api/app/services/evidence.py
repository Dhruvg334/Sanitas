from app.core.errors import AnalysisError, ErrorCode
from app.schemas.extraction import CanonicalDocument, ClinicalExtraction


def normalize_whitespace(value: str) -> str:
    # Deliberately preserve case, punctuation, numbers, units and negation.
    return " ".join(value.split())


def validate_evidence(extraction: ClinicalExtraction, document: CanonicalDocument) -> None:
    segments = {segment.segment_id: segment for segment in document.segments}
    items = [value for value in extraction.patient_information.model_dump().values() if value is not None]
    data = extraction.model_dump()
    for key in ("symptoms", "diagnoses", "medications", "vitals", "allergies", "clinical_observations", "uncertain_items"):
        items.extend(data[key])
    identifiers: set[str] = set()
    for item in items:
        identifier = item.get("entity_id", item.get("item_id"))
        if identifier:
            if identifier in identifiers:
                raise AnalysisError(ErrorCode.MODEL_RESPONSE_INVALID)
            identifiers.add(identifier)
        for ref in item["evidence"]:
            segment = segments.get(ref["segment_id"])
            quote = normalize_whitespace(ref["quote"])
            if (segment is None or ref["page_number"] != segment.page_number
                    or not quote or quote not in normalize_whitespace(segment.text)):
                raise AnalysisError(ErrorCode.EVIDENCE_VALIDATION_FAILED)
