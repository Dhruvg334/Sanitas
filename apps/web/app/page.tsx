"use client";

import { useState } from "react";

interface EvidenceRef {
  segment_id: string;
  page_number: number;
  quote: string;
}

interface SupportedValue {
  value: string;
  support_status: "supported" | "uncertain" | "conflicting";
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface PatientInformation {
  name?: SupportedValue | null;
  date_of_birth?: SupportedValue | null;
  age?: SupportedValue | null;
  sex?: SupportedValue | null;
  medical_record_number?: SupportedValue | null;
}

interface Symptom {
  entity_id: string;
  name: string;
  description?: string | null;
  onset?: string | null;
  duration?: string | null;
  severity?: string | null;
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface Diagnosis {
  entity_id: string;
  name: string;
  code?: string | null;
  diagnosis_status: "documented" | "suspected" | "historical" | "ruled_out" | "unknown";
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface Medication {
  entity_id: string;
  name: string;
  dose_value?: string | null;
  dose_unit?: string | null;
  route?: string | null;
  frequency?: string | null;
  medication_status: "active" | "discontinued" | "historical" | "planned" | "unknown";
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface Vital {
  entity_id: string;
  vital_type: string;
  value: string;
  unit?: string | null;
  qualifier?: string | null;
  observed_at?: string | null;
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface Allergy {
  entity_id: string;
  substance: string;
  reaction?: string | null;
  allergy_status: "present" | "no_known_allergies" | "uncertain";
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface ClinicalObservation {
  entity_id: string;
  category: string;
  observation: string;
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

interface UncertainItem {
  item_id: string;
  field: string;
  candidate_values: string[];
  reason: string;
  evidence: EvidenceRef[];
}

interface ClinicalExtraction {
  schema_version: string;
  patient_information: PatientInformation;
  symptoms: Symptom[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  vitals: Vital[];
  allergies: Allergy[];
  clinical_observations: ClinicalObservation[];
  uncertain_items: UncertainItem[];
}

interface SourceSegment {
  segment_id: string;
  page_number: number;
  text: string;
}

interface CanonicalDocument {
  schema_version: string;
  source_type: string;
  segments: SourceSegment[];
}

interface Processing {
  model: string;
  prompt_version: string;
}

interface AnalysisResponse {
  analysis_id: string;
  status: string;
  canonical_document: CanonicalDocument;
  clinical_extraction: ClinicalExtraction;
  processing: Processing;
}

interface SafeError {
  code: string;
  message: string;
  recoverable?: boolean;
  suggestion?: string | null;
  correlation_id: string;
}

interface ApiErrorResponse {
  error: SafeError;
}

const MAX_TEXT_CHARS = 50000;

const SYNTHETIC_DEMO_NOTE = `Patient: Elena Rostova
Age: 54 | DOB: 1972-04-12 | MRN: SYN-88421 | Sex: Female
Chief Complaint: Acute onset bilateral throbbing headache for past 3 days with mild photophobia.
History of Present Illness:
Patient diagnosed with Type 2 Diabetes Mellitus in 2018.
Reports no history of hypertension or migraine.
Current Medications:
Metformin 1000 mg oral tablet twice daily with meals.
Lisinopril 10 mg oral once daily, discontinued last month.
Vital Signs:
Blood Pressure: 128/82 mmHg
Heart Rate: 74 bpm
Respiratory Rate: 16 breaths/min
Temperature: 98.4 F
Oxygen Saturation: 99% on room air
Allergies:
No known drug allergies.
Clinical Observations:
Alert and oriented x4. Cranial nerves II-XII grossly intact. No focal neurological deficits.
Uncertain Items:
Patient unsure whether current headache is related to recent reduction in daily caffeine intake.`;

export default function HomePage() {
  const [noteText, setNoteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<SafeError | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleLoadDemo = () => {
    setNoteText(SYNTHETIC_DEMO_NOTE);
    setApiError(null);
    setNetworkError(null);
  };

  const handleClear = () => {
    setNoteText("");
    setApiError(null);
    setNetworkError(null);
    setAnalysis(null);
    setHighlightedSegment(null);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || isLoading) return;

    setIsLoading(true);
    setApiError(null);
    setNetworkError(null);
    setHighlightedSegment(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/analyses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: noteText }),
      });

      if (!res.ok) {
        try {
          const errorData: ApiErrorResponse = await res.json();
          if (errorData.error) {
            setApiError(errorData.error);
          } else {
            setNetworkError(`Request failed with status ${res.status}`);
          }
        } catch {
          setNetworkError(`Request failed with status ${res.status} (${res.statusText})`);
        }
        return;
      }

      const data: AnalysisResponse = await res.json();
      setAnalysis(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setNetworkError(
        `Unable to reach the Sanitas API at ${apiBaseUrl}. Please ensure the backend is running and CORS allows requests from this origin. (${message})`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = noteText.length;
  const isOverLimit = charCount > MAX_TEXT_CHARS;
  const isNearLimit = charCount > MAX_TEXT_CHARS * 0.9;

  return (
    <div>
      {/* Site Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-group">
            <h1 className="brand-title">Sanitas</h1>
            <span className="brand-subtitle">AI Clinical Document Reviewer</span>
          </div>
          <div className="header-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Synthetic Note Review</span>
          </div>
        </div>
      </header>

      {/* Safety & Compliance Banner */}
      <div className="disclaimer-banner" role="note">
        <strong>Synthetic Clinical Data Only:</strong> Sanitas is designed for evaluation on synthetic clinical documents. Never enter real Protected Health Information (PHI).
      </div>

      <main className="main-container">
        {/* Error Alert Box */}
        {apiError && (
          <div className="error-box" role="alert" aria-live="polite">
            <div className="error-header">
              <span>Analysis Error</span>
              <span className="error-code">{apiError.code}</span>
            </div>
            <p className="error-message">{apiError.message}</p>
            {apiError.suggestion && (
              <p className="error-suggestion">
                <strong>Suggestion:</strong> {apiError.suggestion}
              </p>
            )}
            <div className="error-correlation">Correlation ID: {apiError.correlation_id}</div>
          </div>
        )}

        {networkError && (
          <div className="error-box" role="alert" aria-live="polite">
            <div className="error-header">
              <span>Connection Error</span>
            </div>
            <p className="error-message">{networkError}</p>
          </div>
        )}

        {/* Workbench Layout */}
        <div className="workbench-grid">
          {/* Left Column: Note Input & Source Viewer */}
          <section className="panel" aria-label="Input Clinical Note and Source Segments">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{analysis ? "Source Document" : "Clinical Note Input"}</h2>
                <p className="panel-subtitle">
                  {analysis
                    ? `${analysis.canonical_document.segments.length} canonical source segments verified`
                    : "Plain-text synthetic clinical document"}
                </p>
              </div>
              <div className="button-row">
                {!analysis && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLoadDemo}
                    disabled={isLoading}
                  >
                    Load Synthetic Demo
                  </button>
                )}
                {analysis && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAnalysis(null)}
                  >
                    Edit Input
                  </button>
                )}
              </div>
            </div>

            <div className="panel-body">
              {!analysis ? (
                <form onSubmit={handleSubmit}>
                  <div className="textarea-wrapper">
                    <label htmlFor="clinical-note-input" className="detail-label" style={{ display: "block", marginBottom: 6 }}>
                      Document Text (Plain Text Only)
                    </label>
                    <textarea
                      id="clinical-note-input"
                      className="note-textarea"
                      placeholder="Paste synthetic clinical note here, or click 'Load Synthetic Demo' above..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      disabled={isLoading}
                      rows={14}
                      aria-invalid={isOverLimit}
                    />
                    <div className="textarea-footer">
                      <span className="error-suggestion">
                        {isOverLimit ? "Note exceeds maximum limit." : "Accepts synthetic plain text."}
                      </span>
                      <span
                        className={`char-counter ${
                          isOverLimit ? "char-limit-exceeded" : isNearLimit ? "char-limit-near" : ""
                        }`}
                      >
                        {charCount.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} chars
                      </span>
                    </div>
                  </div>

                  <div className="button-row">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading || !noteText.trim() || isOverLimit}
                    >
                      {isLoading ? "Reviewing..." : "Review Clinical Note"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleClear}
                      disabled={isLoading || (!noteText && !apiError && !networkError)}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              ) : (
                /* Canonical Source Segment Inspection */
                <div>
                  <p className="detail-label" style={{ marginBottom: 12 }}>
                    Canonical Source Segments (Page 1)
                  </p>
                  <div className="segments-list">
                    {analysis.canonical_document.segments.map((segment) => {
                      const isActive = highlightedSegment === segment.segment_id;
                      return (
                        <div
                          key={segment.segment_id}
                          id={segment.segment_id}
                          className={`segment-item ${isActive ? "active-evidence" : ""}`}
                        >
                          <span className="segment-id">{segment.segment_id}</span>
                          <span className="segment-text">{segment.text}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAnalysis(null)}
                    >
                      Enter Another Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Loading State or Structured Clinical Extraction */}
          <section className="panel" aria-label="Structured Extraction Results">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Clinical Extraction Results</h2>
                <p className="panel-subtitle">
                  {analysis
                    ? "Evidence-grounded structured extraction"
                    : "Awaiting note submission for review"}
                </p>
              </div>
              {analysis && (
                <div className="meta-badge">
                  {analysis.processing.model} • {analysis.processing.prompt_version}
                </div>
              )}
            </div>

            <div className="panel-body">
              {isLoading && (
                <div className="loading-box" role="status" aria-live="polite">
                  <div className="spinner" aria-hidden="true" />
                  <p className="loading-text">Reviewing the submitted clinical note...</p>
                  <p className="loading-subtext">
                    Extracting structured clinical findings with verified verbatim evidence grounding via Gemini.
                  </p>
                </div>
              )}

              {!isLoading && !analysis && (
                <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-muted)" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                    No note reviewed yet
                  </p>
                  <p style={{ margin: 0, fontSize: 13, maxWidth: 360, marginInline: "auto" }}>
                    Paste a synthetic clinical note on the left or load the demonstration note to view evidence-grounded structured findings.
                  </p>
                </div>
              )}

              {!isLoading && analysis && (
                <div>
                  {/* Analysis Metadata Header */}
                  <div className="results-header">
                    <div className="results-meta">
                      <div className="meta-item">
                        <span className="detail-label">Status:</span>
                        <span className="badge badge-high">{analysis.status}</span>
                      </div>
                      <div className="meta-item">
                        <span className="detail-label">Analysis ID:</span>
                        <code style={{ fontSize: 11 }}>{analysis.analysis_id.slice(0, 8)}...</code>
                      </div>
                    </div>
                  </div>

                  {/* 1. Patient Information */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">Patient Information</h3>
                    </div>
                    <div className="category-card-body">
                      <div className="patient-grid">
                        <div className="patient-field">
                          <div className="patient-field-label">Name</div>
                          <div className="patient-field-value">
                            {analysis.clinical_extraction.patient_information.name?.value || "Not documented"}
                          </div>
                          {analysis.clinical_extraction.patient_information.name && (
                            <EvidenceWidget
                              id="patient-name"
                              evidence={analysis.clinical_extraction.patient_information.name.evidence}
                              certainty={analysis.clinical_extraction.patient_information.name.certainty}
                              isExpanded={!!expandedEvidence["patient-name"]}
                              onToggle={() => toggleEvidence("patient-name")}
                              onHighlight={setHighlightedSegment}
                            />
                          )}
                        </div>

                        <div className="patient-field">
                          <div className="patient-field-label">Age / DOB</div>
                          <div className="patient-field-value">
                            {analysis.clinical_extraction.patient_information.age?.value || "—"}
                            {analysis.clinical_extraction.patient_information.date_of_birth?.value
                              ? ` (DOB: ${analysis.clinical_extraction.patient_information.date_of_birth.value})`
                              : ""}
                          </div>
                          {(analysis.clinical_extraction.patient_information.age ||
                            analysis.clinical_extraction.patient_information.date_of_birth) && (
                            <EvidenceWidget
                              id="patient-age"
                              evidence={[
                                ...(analysis.clinical_extraction.patient_information.age?.evidence || []),
                                ...(analysis.clinical_extraction.patient_information.date_of_birth?.evidence || []),
                              ]}
                              certainty={
                                analysis.clinical_extraction.patient_information.age?.certainty || "high"
                              }
                              isExpanded={!!expandedEvidence["patient-age"]}
                              onToggle={() => toggleEvidence("patient-age")}
                              onHighlight={setHighlightedSegment}
                            />
                          )}
                        </div>

                        <div className="patient-field">
                          <div className="patient-field-label">Sex</div>
                          <div className="patient-field-value">
                            {analysis.clinical_extraction.patient_information.sex?.value || "Not documented"}
                          </div>
                          {analysis.clinical_extraction.patient_information.sex && (
                            <EvidenceWidget
                              id="patient-sex"
                              evidence={analysis.clinical_extraction.patient_information.sex.evidence}
                              certainty={analysis.clinical_extraction.patient_information.sex.certainty}
                              isExpanded={!!expandedEvidence["patient-sex"]}
                              onToggle={() => toggleEvidence("patient-sex")}
                              onHighlight={setHighlightedSegment}
                            />
                          )}
                        </div>

                        <div className="patient-field">
                          <div className="patient-field-label">MRN / ID</div>
                          <div className="patient-field-value">
                            {analysis.clinical_extraction.patient_information.medical_record_number?.value ||
                              "Not documented"}
                          </div>
                          {analysis.clinical_extraction.patient_information.medical_record_number && (
                            <EvidenceWidget
                              id="patient-mrn"
                              evidence={
                                analysis.clinical_extraction.patient_information.medical_record_number.evidence
                              }
                              certainty={
                                analysis.clinical_extraction.patient_information.medical_record_number.certainty
                              }
                              isExpanded={!!expandedEvidence["patient-mrn"]}
                              onToggle={() => toggleEvidence("patient-mrn")}
                              onHighlight={setHighlightedSegment}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Diagnoses & Conditions */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Diagnoses & Conditions
                        <span className="category-count">
                          {analysis.clinical_extraction.diagnoses.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.diagnoses.length === 0 ? (
                        <p className="empty-category-note">No documented diagnoses or conditions identified.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.diagnoses.map((dx) => (
                            <div key={dx.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">{dx.name}</span>
                                <span className="badge badge-status">{dx.diagnosis_status}</span>
                              </div>
                              {dx.code && (
                                <div className="entity-details">
                                  <span>
                                    <span className="detail-label">Code:</span> {dx.code}
                                  </span>
                                </div>
                              )}
                              <EvidenceWidget
                                id={dx.entity_id}
                                evidence={dx.evidence}
                                certainty={dx.certainty}
                                isExpanded={!!expandedEvidence[dx.entity_id]}
                                onToggle={() => toggleEvidence(dx.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Symptoms */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Symptoms
                        <span className="category-count">
                          {analysis.clinical_extraction.symptoms.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.symptoms.length === 0 ? (
                        <p className="empty-category-note">No documented symptoms identified.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.symptoms.map((sym) => (
                            <div key={sym.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">{sym.name}</span>
                                <span className={`badge badge-${sym.certainty}`}>{sym.certainty} certainty</span>
                              </div>
                              <div className="entity-details">
                                {sym.description && (
                                  <span>
                                    <span className="detail-label">Details:</span> {sym.description}
                                  </span>
                                )}
                                {sym.onset && (
                                  <span>
                                    <span className="detail-label">Onset:</span> {sym.onset}
                                  </span>
                                )}
                                {sym.duration && (
                                  <span>
                                    <span className="detail-label">Duration:</span> {sym.duration}
                                  </span>
                                )}
                                {sym.severity && (
                                  <span>
                                    <span className="detail-label">Severity:</span> {sym.severity}
                                  </span>
                                )}
                              </div>
                              <EvidenceWidget
                                id={sym.entity_id}
                                evidence={sym.evidence}
                                certainty={sym.certainty}
                                isExpanded={!!expandedEvidence[sym.entity_id]}
                                onToggle={() => toggleEvidence(sym.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Medications */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Medications
                        <span className="category-count">
                          {analysis.clinical_extraction.medications.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.medications.length === 0 ? (
                        <p className="empty-category-note">No documented medications identified.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.medications.map((med) => (
                            <div key={med.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">{med.name}</span>
                                <span className="badge badge-status">{med.medication_status}</span>
                              </div>
                              <div className="entity-details">
                                {med.dose_value && (
                                  <span>
                                    <span className="detail-label">Dose:</span> {med.dose_value}{" "}
                                    {med.dose_unit || ""}
                                  </span>
                                )}
                                {med.route && (
                                  <span>
                                    <span className="detail-label">Route:</span> {med.route}
                                  </span>
                                )}
                                {med.frequency && (
                                  <span>
                                    <span className="detail-label">Frequency:</span> {med.frequency}
                                  </span>
                                )}
                              </div>
                              <EvidenceWidget
                                id={med.entity_id}
                                evidence={med.evidence}
                                certainty={med.certainty}
                                isExpanded={!!expandedEvidence[med.entity_id]}
                                onToggle={() => toggleEvidence(med.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Vitals */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Vital Signs
                        <span className="category-count">
                          {analysis.clinical_extraction.vitals.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.vitals.length === 0 ? (
                        <p className="empty-category-note">No documented vital signs identified.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.vitals.map((v) => (
                            <div key={v.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">
                                  {v.vital_type}: {v.value} {v.unit || ""}
                                </span>
                                <span className={`badge badge-${v.certainty}`}>{v.certainty}</span>
                              </div>
                              {(v.qualifier || v.observed_at) && (
                                <div className="entity-details">
                                  {v.qualifier && (
                                    <span>
                                      <span className="detail-label">Qualifier:</span> {v.qualifier}
                                    </span>
                                  )}
                                  {v.observed_at && (
                                    <span>
                                      <span className="detail-label">Observed:</span> {v.observed_at}
                                    </span>
                                  )}
                                </div>
                              )}
                              <EvidenceWidget
                                id={v.entity_id}
                                evidence={v.evidence}
                                certainty={v.certainty}
                                isExpanded={!!expandedEvidence[v.entity_id]}
                                onToggle={() => toggleEvidence(v.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 6. Allergies */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Allergies
                        <span className="category-count">
                          {analysis.clinical_extraction.allergies.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.allergies.length === 0 ? (
                        <p className="empty-category-note">No allergy statements documented.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.allergies.map((alg) => (
                            <div key={alg.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">{alg.substance}</span>
                                <span className="badge badge-status">
                                  {alg.allergy_status === "no_known_allergies"
                                    ? "No Known Allergies"
                                    : alg.allergy_status}
                                </span>
                              </div>
                              {alg.reaction && (
                                <div className="entity-details">
                                  <span>
                                    <span className="detail-label">Reaction:</span> {alg.reaction}
                                  </span>
                                </div>
                              )}
                              <EvidenceWidget
                                id={alg.entity_id}
                                evidence={alg.evidence}
                                certainty={alg.certainty}
                                isExpanded={!!expandedEvidence[alg.entity_id]}
                                onToggle={() => toggleEvidence(alg.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 7. Clinical Observations */}
                  <div className="category-card">
                    <div className="category-card-header">
                      <h3 className="category-card-title">
                        Clinical Observations
                        <span className="category-count">
                          {analysis.clinical_extraction.clinical_observations.length}
                        </span>
                      </h3>
                    </div>
                    <div className="category-card-body">
                      {analysis.clinical_extraction.clinical_observations.length === 0 ? (
                        <p className="empty-category-note">No general observations documented.</p>
                      ) : (
                        <div className="entity-list">
                          {analysis.clinical_extraction.clinical_observations.map((obs) => (
                            <div key={obs.entity_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">{obs.observation}</span>
                                <span className="badge badge-status">{obs.category}</span>
                              </div>
                              <EvidenceWidget
                                id={obs.entity_id}
                                evidence={obs.evidence}
                                certainty={obs.certainty}
                                isExpanded={!!expandedEvidence[obs.entity_id]}
                                onToggle={() => toggleEvidence(obs.entity_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 8. Uncertain Items */}
                  {analysis.clinical_extraction.uncertain_items.length > 0 && (
                    <div className="category-card" style={{ borderColor: "var(--warning-border)" }}>
                      <div className="category-card-header" style={{ background: "var(--warning-bg)" }}>
                        <h3 className="category-card-title" style={{ color: "var(--warning)" }}>
                          Uncertain Items
                          <span className="category-count">
                            {analysis.clinical_extraction.uncertain_items.length}
                          </span>
                        </h3>
                      </div>
                      <div className="category-card-body">
                        <div className="entity-list">
                          {analysis.clinical_extraction.uncertain_items.map((unc) => (
                            <div key={unc.item_id} className="entity-item">
                              <div className="entity-top">
                                <span className="entity-title">Field: {unc.field}</span>
                                <span className="badge badge-medium">Uncertain</span>
                              </div>
                              <p style={{ margin: "4px 0 8px", fontSize: 13, color: "var(--text-secondary)" }}>
                                {unc.reason}
                              </p>
                              {unc.candidate_values.length > 0 && (
                                <div className="entity-details">
                                  <span>
                                    <span className="detail-label">Candidate Values:</span>{" "}
                                    {unc.candidate_values.join(", ")}
                                  </span>
                                </div>
                              )}
                              <EvidenceWidget
                                id={unc.item_id}
                                evidence={unc.evidence}
                                certainty="low"
                                isExpanded={!!expandedEvidence[unc.item_id]}
                                onToggle={() => toggleEvidence(unc.item_id)}
                                onHighlight={setHighlightedSegment}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface EvidenceWidgetProps {
  id: string;
  evidence: EvidenceRef[];
  certainty: string;
  isExpanded: boolean;
  onToggle: () => void;
  onHighlight: (segmentId: string | null) => void;
}

function EvidenceWidget({
  evidence,
  certainty,
  isExpanded,
  onToggle,
  onHighlight,
}: EvidenceWidgetProps) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="evidence-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          className="evidence-toggle"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Hide source evidence" : `Inspect evidence (${evidence.length})`}</span>
        </button>
        <span className={`badge badge-${certainty}`}>{certainty}</span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 6 }}>
          {evidence.map((ref, idx) => (
            <div
              key={`${ref.segment_id}-${idx}`}
              className="evidence-quote-box"
              onMouseEnter={() => onHighlight(ref.segment_id)}
              onMouseLeave={() => onHighlight(null)}
              onClick={() => {
                onHighlight(ref.segment_id);
                const el = document.getElementById(ref.segment_id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
              style={{ cursor: "pointer" }}
              title="Click or hover to highlight segment in source viewer"
            >
              <p className="evidence-quote-text">“{ref.quote}”</p>
              <span className="evidence-ref-tag">
                {ref.segment_id} (Page {ref.page_number})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
