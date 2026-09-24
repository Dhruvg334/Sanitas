# AI Design & Model Architecture

Sanitas implements a deterministic, evidence-grounded AI architecture built on Google Gemini models via the official `google-genai` Python SDK (`gemini-3.8-flash` or `gemini-2.5-flash`).

---

## 1. Core Principles

1. **Evidence Precedes Assertion:** Every clinical entity extracted from a document must reference at least one canonical source segment (`p{page}-s{seq}`) and contain a verbatim quote verifiable in the original text.
2. **Two-Pass Separation of Concerns:**
   - **Pass 1 (Extraction - Prompt E1.1):** Extracts documented facts (demographics, symptoms, diagnoses, medications, vitals, allergies, observations) without synthesizing opinions, risks, or clinical recommendations.
   - **Pass 2 (Synthesis - Prompt R1.0):** Reviews documented entities and identified contradictions to synthesize an executive clinical summary, clinical concerns, and actionable information gaps.
3. **Deterministic Gate Over LLM Trust:** Model structured JSON is never accepted solely on schema validity. Application code deterministically verifies evidence quotes, segment IDs, entity relationships, and absence of prescriptive directives before returning results to the client.
4. **Explicit Uncertainty & Negation:** Negative statements ("No fever", "Denies shortness of breath", "No known allergies") are preserved as negative status values and never converted into positive findings. Ambiguities are flagged as uncertain with candidate values.
5. **Prompt Injection Boundary:** User-submitted documents are strictly demarcated as untrusted data using explicit delimiters (`DATA_START` / `DATA_END`). Adversarial directives embedded in documents are parsed solely as content.

---

## 2. Multi-Pass Prompt Specifications

### Pass 1: Fact Extraction (Prompt `E1.1`)
- **Role:** Strict Clinical Data Extraction Specialist.
- **Instruction:** Reads canonical segments and populates `ClinicalExtraction` JSON Schema.
- **Forbidden:** No medical opinions, no diagnoses not documented explicitly, no inferred demographics.
- **Temperature:** `0.0`.
- **Schema Enforcement:** Strict Pydantic JSON Schema (`response_mime_type="application/json"`, `response_schema=ClinicalExtraction`).

### Pass 2: Review Synthesis (Prompt `R1.0`)
- **Role:** Clinical Documentation Reviewer.
- **Instruction:** Reads canonical document, Pass 1 extraction output, and Stage P5 inconsistency candidates. Synthesizes `ClinicalReview` JSON Schema.
- **Components:**
  - `report_summary`: Concise executive summary (max 1200 characters).
  - `clinical_concerns`: Material clinical risks directly grounded in documented findings.
  - `missing_information`: Gaps that materially limit clinical interpretation (e.g. missing drug dosages, missing lab reference units).
  - `potential_inconsistencies`: Contextualized factual contradictions identified by Stage P5 rules.
  - `requires_review`: High-importance items needing human clinician sign-off.
- **Safety Directive:** Prohibited from issuing prescriptive directives ("I prescribe", "Patient must take", "Recommend administering").

### Multimodal Visual Transcription (Prompt `V1.0`)
- **Role:** Clinical Optical Document Transcriber.
- **Instruction:** Transcribes scanned PDFs or image uploads into line-level text segments preserving reading order, table structures, and form fields.
- **Bounded Resource Handling:** Rendered at 150 DPI with a maximum dimension of 1600 pixels to eliminate memory spikes on web service containers.

---

## 3. Inconsistency & Contradiction Detection Engine (Stage P5)

Operating between Pass 1 and Pass 2, a deterministic rule engine inspects extracted entities for document-level factual contradictions:

- **Allergy Contradictions:** Flags documents where an explicit allergy status of `no_known_allergies` (or "NKDA") coexists with a documented specific drug allergy (e.g. Amoxicillin, Penicillin).
- **Medication Status Conflicts:** Flags documents where the same drug entity is simultaneously marked with `active` and `discontinued` status without clear chronological reconciliation.
- **Vital Sign Discrepancies:** Identifies conflicting vital signs recorded under identical timestamps.

---

## 4. Stage P7 Quality Gate & Secondary Safeguards

Before persisting or returning an analysis, `validate_review_quality_gate` executes three deterministic checks:

1. **Entity Cross-Referencing:** Every `related_entity_id` referenced in a review finding must exist in the Pass 1 extraction.
2. **Quote Grounding:** Every evidence quote in clinical concerns or inconsistencies must exist as a verbatim substring in the referenced canonical segment.
3. **Secondary Anti-Directive Safeguard:** Scans synthesized narrative fields against regular expressions detecting prescriptive medical advice:
   - `\b(i|we)\s+prescribe\b`
   - `\bpatient\s+(must|should)\s+take\b`
   - `\brecommend\s+administering\b`
   - `\byou\s+should\s+(take|start|stop)\b`
   *Note: This safeguard applies only to generated commentary; legitimate verbatim source quotes in clinical entities are never rejected by this filter.*

---

## 5. Resilience & Fault Mapping

- Upstream Gemini errors are caught and classified cleanly:
  - HTTP 429 -> `MODEL_RATE_LIMITED` (retried up to 2 times with exponential backoff).
  - HTTP 504 / timeout -> `MODEL_TIMEOUT`.
  - HTTP 500 / 502 / 503 -> `MODEL_UNAVAILABLE`.
  - Schema mismatch / parse error -> `MODEL_RESPONSE_INVALID`.
- All errors are wrapped into standardized `SafeError` responses with unique tracking UUIDs without leaking raw stack traces or internal prompts.
