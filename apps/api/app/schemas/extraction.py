"""Versioned, strict boundaries for source-grounded extraction."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

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
    segment_id: str
    page_number: Literal[1] = 1
    text: str


class CanonicalDocument(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    source_type: Literal["plain_text"] = "plain_text"
    segments: list[SourceSegment]


class AnalysisRequest(StrictModel):
    text: str


class Processing(StrictModel):
    model: str
    prompt_version: str


class AnalysisResponse(StrictModel):
    analysis_id: str
    status: Literal["completed"] = "completed"
    canonical_document: CanonicalDocument
    clinical_extraction: ClinicalExtraction
    processing: Processing
