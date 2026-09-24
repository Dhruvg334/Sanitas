"""Versioned, strict boundaries for source-grounded extraction."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, computed_field

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class EvidenceRef(StrictModel):
    segment_id: Text
    page_number: int = Field(ge=1)
    quote: Text


class Supported(StrictModel):
    support_status: Literal["supported", "uncertain", "conflicting"]
    certainty: Literal["high", "medium", "low"]
    evidence: list[EvidenceRef] = Field(min_length=1, max_length=8)


class SupportedValue(Supported):
    value: Text


class PatientInformation(StrictModel):
    name: SupportedValue | None = None
    date_of_birth: SupportedValue | None = None
    age: SupportedValue | None = None
    sex: SupportedValue | None = None
    medical_record_number: SupportedValue | None = None


class Symptom(Supported):
    entity_id: str = Field(pattern=r"^sym-[0-9]+$")
    name: Text
    description: Text | None = None
    onset: Text | None = None
    duration: Text | None = None
    severity: Text | None = None


class Diagnosis(Supported):
    entity_id: str = Field(pattern=r"^dx-[0-9]+$")
    name: Text
    code: Text | None = None
    diagnosis_status: Literal["documented", "suspected", "historical", "ruled_out", "unknown"]


class Medication(Supported):
    entity_id: str = Field(pattern=r"^med-[0-9]+$")
    name: Text
    dose_value: Text | None = None
    dose_unit: Text | None = None
    route: Text | None = None
    frequency: Text | None = None
    medication_status: Literal["active", "discontinued", "historical", "planned", "unknown"]


class Vital(Supported):
    entity_id: str = Field(pattern=r"^vital-[0-9]+$")
    vital_type: Text
    value: Text
    unit: Text | None = None
    qualifier: Text | None = None
    observed_at: Text | None = None


class Allergy(Supported):
    entity_id: str = Field(pattern=r"^alg-[0-9]+$")
    substance: Text
    reaction: Text | None = None
    allergy_status: Literal["present", "no_known_allergies", "uncertain"]


class Observation(Supported):
    entity_id: str = Field(pattern=r"^obs-[0-9]+$")
    category: Text
    observation: Text


class UncertainItem(StrictModel):
    item_id: str = Field(pattern=r"^unc-[0-9]+$")
    field: Text
    candidate_values: list[Text] = Field(max_length=10)
    reason: Text
    evidence: list[EvidenceRef] = Field(min_length=1, max_length=8)


class ClinicalExtraction(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    patient_information: PatientInformation = Field(default_factory=PatientInformation)
    symptoms: list[Symptom] = Field(default_factory=list, max_length=100)
    diagnoses: list[Diagnosis] = Field(default_factory=list, max_length=100)
    medications: list[Medication] = Field(default_factory=list, max_length=100)
    vitals: list[Vital] = Field(default_factory=list, max_length=100)
    allergies: list[Allergy] = Field(default_factory=list, max_length=100)
    clinical_observations: list[Observation] = Field(default_factory=list, max_length=100)
    uncertain_items: list[UncertainItem] = Field(default_factory=list, max_length=100)


class SourceSegment(StrictModel):
    segment_id: str = Field(pattern=r"^p[1-9][0-9]*-s[1-9][0-9]*$")
    page_number: int = Field(default=1, ge=1)
    text: str
    segment_type: Literal["paragraph", "heading", "table_row", "list_item", "form_field", "other"] = "paragraph"
    certainty: Literal["high", "medium", "low"] = "high"


class CanonicalPage(StrictModel):
    page_number: int = Field(ge=1)
    segments: list[SourceSegment] = Field(default_factory=list)
    unreadable_regions: list[str] = Field(default_factory=list)


class CanonicalDocument(StrictModel):
    model_config = ConfigDict(extra="ignore")
    schema_version: Literal["1.0"] = "1.0"
    source_type: Literal["plain_text", "digital_pdf", "scanned_or_visual_pdf", "image"] = "plain_text"
    document_quality: Literal["good", "degraded", "poor"] = "good"
    quality_issues: list[str] = Field(default_factory=list)
    pages: list[CanonicalPage] = Field(default_factory=list)

    def __init__(self, **data):
        # Support shorthand initialization: CanonicalDocument(segments=[...])
        if "segments" in data and "pages" not in data:
            raw_segments = data.pop("segments")
            pages_dict: dict[int, list[SourceSegment]] = {}
            for s in raw_segments:
                p_num = getattr(s, "page_number", 1) if isinstance(s, SourceSegment) else s.get("page_number", 1)
                pages_dict.setdefault(p_num, []).append(s)
            data["pages"] = [
                CanonicalPage(page_number=p_num, segments=s_list)
                for p_num, s_list in sorted(pages_dict.items())
            ] or [CanonicalPage(page_number=1, segments=[])]
        super().__init__(**data)

    @computed_field
    @property
    def segments(self) -> list[SourceSegment]:
        return [seg for page in self.pages for seg in page.segments]


class ClinicalConcern(StrictModel):
    finding_id: str = Field(pattern=r"^concern-[0-9]+$")
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    importance: Literal["low", "moderate", "high"]
    related_entity_ids: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(min_length=1)


class MissingInformation(StrictModel):
    finding_id: str = Field(pattern=r"^missing-[0-9]+$")
    field: str = Field(min_length=1)
    reason: str = Field(min_length=1)
    importance: Literal["low", "moderate", "high"]


class PotentialInconsistency(StrictModel):
    finding_id: str = Field(pattern=r"^incon-[0-9]+$")
    description: str = Field(min_length=1)
    importance: Literal["low", "moderate", "high"]
    related_entity_ids: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(min_length=2)


class ReviewItem(StrictModel):
    finding_id: str = Field(pattern=r"^review-[0-9]+$")
    title: str = Field(min_length=1)
    reason: str = Field(min_length=1)
    importance: Literal["low", "moderate", "high"]
    related_entity_ids: list[str] = Field(default_factory=list)
    evidence: list[EvidenceRef] = Field(default_factory=list)


class ClinicalReview(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    report_summary: str = Field(min_length=1, max_length=1200)
    clinical_concerns: list[ClinicalConcern] = Field(default_factory=list)
    missing_information: list[MissingInformation] = Field(default_factory=list)
    potential_inconsistencies: list[PotentialInconsistency] = Field(default_factory=list)
    requires_review: list[ReviewItem] = Field(default_factory=list)


class SourceMetadata(StrictModel):
    source_type: Literal["plain_text", "digital_pdf", "scanned_or_visual_pdf", "image"]
    original_filename: str | None = None
    sha256: str
    size_bytes: int | None = None
    page_count: int | None = None


class DocumentQuality(StrictModel):
    level: Literal["good", "degraded", "poor"] = "good"
    issues: list[str] = Field(default_factory=list)


class AnalysisRequest(StrictModel):
    text: str


class Processing(StrictModel):
    model: str
    prompt_version: str = "E1.1"
    prompt_versions: dict[str, str | None] = Field(default_factory=dict)
    timings_ms: dict[str, int] = Field(default_factory=dict)


class AnalysisResponse(StrictModel):
    analysis_id: str
    status: Literal["completed", "failed", "received"] = "completed"
    created_at: str | None = None
    completed_at: str | None = None
    source: SourceMetadata | None = None
    document_quality: DocumentQuality | None = None
    canonical_document: CanonicalDocument
    clinical_extraction: ClinicalExtraction
    clinical_review: ClinicalReview | None = None
    processing: Processing


class AnalysisListItem(StrictModel):
    analysis_id: str
    created_at: str
    status: str
    source_type: str
    original_filename: str | None = None
    report_summary: str | None = None


class AnalysisListResponse(StrictModel):
    items: list[AnalysisListItem]
    next_cursor: str | None = None


class SafeError(StrictModel):
    code: str
    message: str
    recoverable: bool = True
    suggestion: str | None = None
    correlation_id: str


class ErrorResponse(StrictModel):
    error: SafeError


class AnalysisStatusResponse(StrictModel):
    analysis_id: str
    status: str
    updated_at: str
    error: SafeError | None = None

