import io
from uuid import uuid4

import pymupdf as fitz
from PIL import Image
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.errors import AnalysisError, ErrorCode
from app.main import app
from app.schemas.extraction import (
    CanonicalDocument,
    CanonicalPage,
    ClinicalConcern,
    ClinicalExtraction,
    ClinicalReview,
    EvidenceRef,
    Medication,
    PatientInformation,
    PotentialInconsistency,
    ReviewItem,
    SourceSegment,
    SupportedValue,
    Symptom,
    Vital,
)
from app.services.document_router import route_document
from app.services.gemini import get_ai_service
from app.services.inconsistency_rules import find_inconsistency_candidates
from app.services.quality_gate import validate_review_quality_gate


def create_sample_pdf(text: str, num_pages: int = 1) -> bytes:
    doc = fitz.open()
    for _ in range(num_pages):
        page = doc.new_page()
        page.insert_text((50, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def create_sample_image(width: int = 200, height: int = 100) -> bytes:
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_router_classifies_text():
    settings = get_settings()
    ingested = route_document(settings, text="Patient: Jane Doe\nSymptoms: Cough")
    assert ingested.source_type == "plain_text"
    assert ingested.size_bytes > 0
    assert len(ingested.sha256) == 64


def test_router_rejects_multiple_inputs():
    settings = get_settings()
    with pytest.raises(AnalysisError) as exc:
        route_document(settings, text="Some text", file_bytes=b"dummy bytes")
    assert exc.value.code == ErrorCode.MULTIPLE_INPUTS


def test_router_classifies_digital_pdf():
    settings = get_settings()
    # Meaningful text >= 80 characters
    long_text = "This is a digital PDF note containing clinical facts and substantial characters for the patient examination record."
    pdf_bytes = create_sample_pdf(long_text, num_pages=2)
    ingested = route_document(settings, file_bytes=pdf_bytes, filename="note.pdf")
    assert ingested.source_type == "digital_pdf"
    assert ingested.page_count == 2


def test_router_classifies_scanned_pdf():
    settings = get_settings()
    # Short text < 80 characters per page
    pdf_bytes = create_sample_pdf("Short", num_pages=1)
    ingested = route_document(settings, file_bytes=pdf_bytes, filename="scanned.pdf")
    assert ingested.source_type == "scanned_or_visual_pdf"


def test_router_classifies_image():
    settings = get_settings()
    img_bytes = create_sample_image()
    ingested = route_document(settings, file_bytes=img_bytes, filename="scan.png")
    assert ingested.source_type == "image"


def test_router_rejects_unsupported_file():
    settings = get_settings()
    with pytest.raises(AnalysisError) as exc:
        route_document(settings, file_bytes=b"<html>hello</html>", filename="doc.html")
    assert exc.value.code == ErrorCode.UNSUPPORTED_FILE_TYPE


def test_router_rejects_extension_mismatch():
    settings = get_settings()
    # Sending plain text bytes with a .pdf extension
    with pytest.raises(AnalysisError) as exc:
        route_document(settings, file_bytes=b"This is not a real PDF", filename="test.pdf")
    assert exc.value.code == ErrorCode.FILE_SIGNATURE_MISMATCH


def test_router_rejects_page_limit_exceeded():
    settings = get_settings()
    pdf_bytes = create_sample_pdf("Page content", num_pages=settings.max_pdf_pages + 1)
    with pytest.raises(AnalysisError) as exc:
        route_document(settings, file_bytes=pdf_bytes, filename="oversized.pdf")
    assert exc.value.code == ErrorCode.PDF_PAGE_LIMIT_EXCEEDED


def test_inconsistency_rules_detects_medication_conflict():
    extraction = ClinicalExtraction(
        medications=[
            Medication(
                entity_id="med-1",
                name="Lisinopril",
                medication_status="active",
                support_status="supported",
                certainty="high",
                evidence=[EvidenceRef(segment_id="p1-s1", page_number=1, quote="Lisinopril 10mg daily")],
            ),
            Medication(
                entity_id="med-2",
                name="Lisinopril",
                medication_status="discontinued",
                support_status="supported",
                certainty="high",
                evidence=[EvidenceRef(segment_id="p1-s2", page_number=1, quote="Lisinopril stopped last month")],
            ),
        ]
    )
    candidates = find_inconsistency_candidates(extraction)
    assert len(candidates) == 1
    assert "simultaneously documented as active and discontinued" in candidates[0].description
    assert candidates[0].related_entity_ids == ["med-1", "med-2"]


def test_quality_gate_rejects_prescriptive_directive():
    doc = CanonicalDocument(
        pages=[CanonicalPage(page_number=1, segments=[SourceSegment(segment_id="p1-s1", text="Patient has cough")])]
    )
    extraction = ClinicalExtraction(
        symptoms=[
            Symptom(
                entity_id="sym-1",
                name="Cough",
                support_status="supported",
                certainty="high",
                evidence=[EvidenceRef(segment_id="p1-s1", page_number=1, quote="Patient has cough")],
            )
        ]
    )
    bad_review = ClinicalReview(
        report_summary="Patient must take 500mg Amoxicillin daily immediately.",
        clinical_concerns=[],
        missing_information=[],
        potential_inconsistencies=[],
        requires_review=[],
    )
    with pytest.raises(AnalysisError) as exc:
        validate_review_quality_gate(bad_review, extraction, doc)
    assert exc.value.code == ErrorCode.REVIEW_QUALITY_GATE_FAILED


def test_api_full_flow_and_history_persistence():
    class MockAIService:
        async def extract(self, document: CanonicalDocument) -> ClinicalExtraction:
            return ClinicalExtraction(
                patient_information=PatientInformation(
                    name=SupportedValue(
                        value="Alice Smith",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s1", page_number=1, quote="Patient: Alice Smith")],
                    )
                ),
                symptoms=[
                    Symptom(
                        entity_id="sym-1",
                        name="Fatigue",
                        support_status="supported",
                        certainty="high",
                        evidence=[EvidenceRef(segment_id="p1-s2", page_number=1, quote="Reports fatigue")],
                    )
                ],
            )

        async def synthesize_review(self, extraction, candidates, document_quality):
            return ClinicalReview(
                schema_version="1.0",
                report_summary="Review of synthetic document for Alice Smith. Fatigue documented.",
                clinical_concerns=[
                    ClinicalConcern(
                        finding_id="concern-1",
                        title="Documented Fatigue",
                        description="Fatigue recorded in examination.",
                        importance="moderate",
                        related_entity_ids=["sym-1"],
                        evidence=[EvidenceRef(segment_id="p1-s2", page_number=1, quote="Reports fatigue")],
                    )
                ],
                missing_information=[],
                potential_inconsistencies=candidates,
                requires_review=[],
            )

    app.dependency_overrides[get_ai_service] = lambda: MockAIService()
    try:
        with TestClient(app) as client:
            # 1. POST analysis
            res = client.post(
                "/api/v1/analyses",
                json={"text": "Patient: Alice Smith\nReports fatigue for 2 weeks"},
            )
            assert res.status_code == 200
            data = res.json()
            analysis_id = data["analysis_id"]
            assert data["clinical_review"]["report_summary"] == "Review of synthetic document for Alice Smith. Fatigue documented."
            assert len(data["clinical_review"]["clinical_concerns"]) == 1

            # 2. GET list
            list_res = client.get("/api/v1/analyses")
            assert list_res.status_code == 200
            list_data = list_res.json()
            assert any(item["analysis_id"] == analysis_id for item in list_data["items"])

            # 3. GET by ID
            get_res = client.get(f"/api/v1/analyses/{analysis_id}")
            assert get_res.status_code == 200
            get_data = get_res.json()
            assert get_data["analysis_id"] == analysis_id
            assert get_data["clinical_extraction"]["patient_information"]["name"]["value"] == "Alice Smith"

            # 4. GET status
            status_res = client.get(f"/api/v1/analyses/{analysis_id}/status")
            assert status_res.status_code == 200
            assert status_res.json()["status"] == "completed"

            # 5. GET unknown ID -> 404
            unknown_res = client.get(f"/api/v1/analyses/{uuid4()}")
            assert unknown_res.status_code == 404
            assert unknown_res.json()["error"]["code"] == "NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_ai_service, None)


def test_evaluation_runner_mock():
    from eval.runner import run_mock_structural_evaluation
    assert run_mock_structural_evaluation() is True

