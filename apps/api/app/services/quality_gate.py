"""Stage P7: Final quality gate for synthesized clinical reviews."""

import re

from app.core.errors import AnalysisError, ErrorCode
from app.schemas.extraction import CanonicalDocument, ClinicalExtraction, ClinicalReview
from app.services.evidence import normalize_whitespace

PROHIBITED_DIRECTIVES = [
    re.compile(r"\b(i|we)\s+prescribe\b", re.IGNORECASE),
    re.compile(r"\bpatient\s+(must|should)\s+take\b", re.IGNORECASE),
    re.compile(r"\brecommend\s+administering\b", re.IGNORECASE),
    re.compile(r"\byou\s+should\s+(take|start|stop)\b", re.IGNORECASE),
]


def validate_review_quality_gate(
    review: ClinicalReview,
    extraction: ClinicalExtraction,
    document: CanonicalDocument,
) -> None:
    # 1. Collect all valid entity IDs from extraction
    valid_ids: set[str] = set()
    data = extraction.model_dump()
    for key in ("symptoms", "diagnoses", "medications", "vitals", "allergies", "clinical_observations", "uncertain_items"):
        for item in data.get(key, []):
            eid = item.get("entity_id") or item.get("item_id")
            if eid:
                valid_ids.add(eid)

    # 2. Check segment map
    segments = {s.segment_id: s for s in document.segments}

    # 3. Validate clinical concerns
    for concern in review.clinical_concerns:
        for eid in concern.related_entity_ids:
            if eid not in valid_ids:
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)
        for ref in concern.evidence:
            seg = segments.get(ref.segment_id)
            quote = normalize_whitespace(ref.quote)
            if not seg or ref.page_number != seg.page_number or not quote or quote not in normalize_whitespace(seg.text):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)

    # 4. Validate potential inconsistencies (must have at least 2 evidence refs)
    for incon in review.potential_inconsistencies:
        if len(incon.evidence) < 2:
            raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)
        for eid in incon.related_entity_ids:
            if eid not in valid_ids and not eid.startswith("incon-"):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)
        for ref in incon.evidence:
            seg = segments.get(ref.segment_id)
            quote = normalize_whitespace(ref.quote)
            if not seg or ref.page_number != seg.page_number or not quote or quote not in normalize_whitespace(seg.text):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)

    # 5. Validate requires_review items
    for item in review.requires_review:
        for eid in item.related_entity_ids:
            if eid not in valid_ids and not eid.startswith("incon-"):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)
        for ref in item.evidence:
            seg = segments.get(ref.segment_id)
            quote = normalize_whitespace(ref.quote)
            if not seg or ref.page_number != seg.page_number or not quote or quote not in normalize_whitespace(seg.text):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)

    # 6. Secondary prescriptive advice safeguard on model narrative (never on evidence quotes)
    texts_to_check = [review.report_summary]
    for c in review.clinical_concerns:
        texts_to_check.append(c.description)
    for r in review.requires_review:
        texts_to_check.append(r.reason)

    for text in texts_to_check:
        for pattern in PROHIBITED_DIRECTIVES:
            if pattern.search(text):
                raise AnalysisError(ErrorCode.REVIEW_QUALITY_GATE_FAILED)
