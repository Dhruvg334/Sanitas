"use client";

import { useState } from "react";

export interface EvidenceRef {
  segment_id: string;
  page_number: number;
  quote: string;
}

export interface SupportedValue {
  value: string;
  support_status: "supported" | "uncertain" | "conflicting";
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

export interface PatientInformation {
  name?: SupportedValue | null;
  date_of_birth?: SupportedValue | null;
  age?: SupportedValue | null;
  sex?: SupportedValue | null;
  medical_record_number?: SupportedValue | null;
}

export interface Symptom {
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

export interface Diagnosis {
  entity_id: string;
  name: string;
  code?: string | null;
  diagnosis_status: "documented" | "suspected" | "historical" | "ruled_out" | "unknown";
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

export interface Medication {
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

export interface Vital {
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

export interface Allergy {
  entity_id: string;
  substance: string;
  reaction?: string | null;
  allergy_status: "present" | "no_known_allergies" | "uncertain";
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

export interface ClinicalObservation {
  entity_id: string;
  category: string;
  observation: string;
  support_status: string;
  certainty: "high" | "medium" | "low";
  evidence: EvidenceRef[];
}

export interface UncertainItem {
  item_id: string;
  field: string;
  candidate_values: string[];
  reason: string;
  evidence: EvidenceRef[];
}

export interface ClinicalExtraction {
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

export interface ClinicalConcern {
  finding_id: string;
  title: string;
  description: string;
  importance: "low" | "moderate" | "high";
  related_entity_ids: string[];
  evidence: EvidenceRef[];
}

export interface MissingInformation {
  finding_id: string;
  field: string;
  reason: string;
  importance: "low" | "moderate" | "high";
}

export interface PotentialInconsistency {
  finding_id: string;
  description: string;
  importance: "low" | "moderate" | "high";
  related_entity_ids: string[];
  evidence: EvidenceRef[];
}

export interface ReviewItem {
  finding_id: string;
  title: string;
  reason: string;
  importance: "low" | "moderate" | "high";
  related_entity_ids: string[];
  evidence: EvidenceRef[];
}

export interface ClinicalReview {
  schema_version: string;
  report_summary: string;
  clinical_concerns: ClinicalConcern[];
  missing_information: MissingInformation[];
  potential_inconsistencies: PotentialInconsistency[];
  requires_review: ReviewItem[];
}

export interface SourceSegment {
  segment_id: string;
  page_number: number;
  text: string;
  segment_type?: string;
  certainty?: string;
}

export interface CanonicalPage {
  page_number: number;
  segments: SourceSegment[];
  unreadable_regions?: string[];
}

export interface CanonicalDocument {
  schema_version: string;
  source_type: string;
  document_quality?: string;
  quality_issues?: string[];
  pages?: CanonicalPage[];
  segments: SourceSegment[];
}

export interface SourceMetadata {
  source_type: string;
  original_filename?: string | null;
  sha256: string;
  size_bytes?: number | null;
  page_count?: number | null;
}

export interface Processing {
  model: string;
  prompt_version?: string;
  prompt_versions?: Record<string, string | null>;
  timings_ms?: Record<string, number>;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: string;
  created_at?: string | null;
  completed_at?: string | null;
  source?: SourceMetadata | null;
  document_quality?: { level: string; issues: string[] } | null;
  canonical_document: CanonicalDocument;
  clinical_extraction: ClinicalExtraction;
  clinical_review?: ClinicalReview | null;
  processing: Processing;
}

export interface ReviewReportViewProps {
  analysis: AnalysisResponse;
  onHighlightSegment?: (segmentId: string | null) => void;
  onSelectSegment?: (segmentId: string) => void;
}

export default function ReviewReportView({
  analysis,
  onHighlightSegment,
  onSelectSegment,
}: ReviewReportViewProps) {
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"findings" | "extraction" | "telemetry">("findings");

  const handleHighlight = (segmentId: string | null) => {
    if (onHighlightSegment) onHighlightSegment(segmentId);
    if (onSelectSegment && segmentId) onSelectSegment(segmentId);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const review = analysis.clinical_review;
  const extraction = analysis.clinical_extraction;
  const timings = analysis.processing.timings_ms || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Analysis Top Metadata Bar */}
      <div className="card-neo" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="badge-neo badge-neo-status">
              <span className="status-live-dot" /> {analysis.status}
            </span>
            <span className="badge-neo badge-neo-low">
              {analysis.source?.source_type || analysis.canonical_document.source_type}
            </span>
            {analysis.source?.page_count && analysis.source.page_count > 1 && (
              <span className="badge-neo">{analysis.source.page_count} Pages</span>
            )}
            {analysis.document_quality && (
              <span className={`badge-neo badge-neo-${analysis.document_quality.level === "good" ? "low" : "moderate"}`}>
                Quality: {analysis.document_quality.level}
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
            ID: {analysis.analysis_id.slice(0, 8)}...{analysis.analysis_id.slice(-4)}
          </div>
        </div>
      </div>

      {/* 1. Report Summary Card */}
      {review?.report_summary && (
        <div className="review-summary-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span className="badge-neo badge-neo-scope2">Synthesis Summary</span>
            {timings.total_ms && (
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--emerald)" }}>
                Processed in {timings.total_ms}ms
              </span>
            )}
          </div>
          <h3 className="review-summary-title">Executive Clinical Review</h3>
          <p className="review-summary-text">{review.report_summary}</p>
        </div>
      )}

      {/* Mode Tabs: Review Findings vs Structured Extraction vs Telemetry */}
      <div className="input-mode-tabs" style={{ marginBottom: "8px" }}>
        <button
          type="button"
          className={`input-tab ${activeTab === "findings" ? "active" : ""}`}
          onClick={() => setActiveTab("findings")}
        >
          Review Findings &amp; Gaps ({
            (review?.clinical_concerns?.length || 0) +
            (review?.potential_inconsistencies?.length || 0) +
            (review?.missing_information?.length || 0) +
            (review?.requires_review?.length || 0)
          })
        </button>
        <button
          type="button"
          className={`input-tab ${activeTab === "extraction" ? "active" : ""}`}
          onClick={() => setActiveTab("extraction")}
        >
          Structured Extraction Entities ({
            extraction.diagnoses.length +
            extraction.symptoms.length +
            extraction.medications.length +
            extraction.vitals.length +
            extraction.allergies.length
          })
        </button>
        <button
          type="button"
          className={`input-tab ${activeTab === "telemetry" ? "active" : ""}`}
          onClick={() => setActiveTab("telemetry")}
        >
          Stage Telemetry &amp; Lineage
        </button>
      </div>

      {/* TAB 1: REVIEW FINDINGS */}
      {activeTab === "findings" && (
        <div>
          {/* Potential Inconsistencies */}
          {review?.potential_inconsistencies && review.potential_inconsistencies.length > 0 && (
            <div className="category-card" style={{ borderLeft: "8px solid #E63946" }}>
              <div className="category-card-header" style={{ background: "#FFEAEA" }}>
                <h4 className="category-title" style={{ color: "#9D0208" }}>
                  Potential Inconsistencies &amp; Contradictions
                  <span className="category-count">{review.potential_inconsistencies.length}</span>
                </h4>
              </div>
              <div className="category-card-body">
                <div className="entity-list">
                  {review.potential_inconsistencies.map((incon) => (
                    <div key={incon.finding_id} className="entity-item" style={{ borderColor: "#E63946" }}>
                      <div className="entity-item-top">
                        <span className="entity-name" style={{ color: "#9D0208" }}>{incon.description}</span>
                        <span className={`badge-neo badge-neo-${incon.importance}`}>{incon.importance}</span>
                      </div>
                      <EvidenceWidget
                        id={incon.finding_id}
                        evidence={incon.evidence}
                        isExpanded={!!expandedEvidence[incon.finding_id]}
                        onToggle={() => toggleEvidence(incon.finding_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clinical Concerns */}
          {review?.clinical_concerns && review.clinical_concerns.length > 0 && (
            <div className="category-card" style={{ borderLeft: "8px solid #FFD166" }}>
              <div className="category-card-header" style={{ background: "#FFFDF0" }}>
                <h4 className="category-title" style={{ color: "#7F5539" }}>
                  Document-Evident Clinical Concerns
                  <span className="category-count">{review.clinical_concerns.length}</span>
                </h4>
              </div>
              <div className="category-card-body">
                <div className="entity-list">
                  {review.clinical_concerns.map((concern) => (
                    <div key={concern.finding_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{concern.title}</span>
                        <span className={`badge-neo badge-neo-${concern.importance}`}>{concern.importance}</span>
                      </div>
                      <p style={{ fontSize: "0.88rem", margin: "4px 0 8px", color: "var(--text-dark)" }}>
                        {concern.description}
                      </p>
                      <EvidenceWidget
                        id={concern.finding_id}
                        evidence={concern.evidence}
                        isExpanded={!!expandedEvidence[concern.finding_id]}
                        onToggle={() => toggleEvidence(concern.finding_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Context-Sensitive Missing Information */}
          {review?.missing_information && review.missing_information.length > 0 && (
            <div className="category-card">
              <div className="category-card-header">
                <h4 className="category-title">
                  Context-Sensitive Missing Information
                  <span className="category-count">{review.missing_information.length}</span>
                </h4>
              </div>
              <div className="category-card-body">
                <div className="entity-list">
                  {review.missing_information.map((missing) => (
                    <div key={missing.finding_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">Field: {missing.field}</span>
                        <span className={`badge-neo badge-neo-${missing.importance}`}>{missing.importance} priority</span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                        <strong>Reason:</strong> {missing.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Items Requiring Human Review */}
          {review?.requires_review && review.requires_review.length > 0 && (
            <div className="category-card">
              <div className="category-card-header">
                <h4 className="category-title">
                  Items Requiring Review
                  <span className="category-count">{review.requires_review.length}</span>
                </h4>
              </div>
              <div className="category-card-body">
                <div className="entity-list">
                  {review.requires_review.map((item) => (
                    <div key={item.finding_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{item.title}</span>
                        <span className={`badge-neo badge-neo-${item.importance}`}>{item.importance}</span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0 6px" }}>
                        {item.reason}
                      </p>
                      {item.evidence && item.evidence.length > 0 && (
                        <EvidenceWidget
                          id={item.finding_id}
                          evidence={item.evidence}
                          isExpanded={!!expandedEvidence[item.finding_id]}
                          onToggle={() => toggleEvidence(item.finding_id)}
                          onHighlight={handleHighlight}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STRUCTURED EXTRACTION */}
      {activeTab === "extraction" && (
        <div>
          {/* Patient Demographics */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">Patient Demographics</h4>
            </div>
            <div className="category-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div className="entity-item">
                  <div className="detail-label">Name</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, margin: "4px 0" }}>
                    {extraction.patient_information.name?.value || "Not documented"}
                  </div>
                  {extraction.patient_information.name && (
                    <EvidenceWidget
                      id="pat-name"
                      evidence={extraction.patient_information.name.evidence}
                      isExpanded={!!expandedEvidence["pat-name"]}
                      onToggle={() => toggleEvidence("pat-name")}
                      onHighlight={handleHighlight}
                    />
                  )}
                </div>

                <div className="entity-item">
                  <div className="detail-label">Age / DOB</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, margin: "4px 0" }}>
                    {extraction.patient_information.age?.value || "—"}
                    {extraction.patient_information.date_of_birth?.value ? ` (${extraction.patient_information.date_of_birth.value})` : ""}
                  </div>
                  {extraction.patient_information.age && (
                    <EvidenceWidget
                      id="pat-age"
                      evidence={extraction.patient_information.age.evidence}
                      isExpanded={!!expandedEvidence["pat-age"]}
                      onToggle={() => toggleEvidence("pat-age")}
                      onHighlight={handleHighlight}
                    />
                  )}
                </div>

                <div className="entity-item">
                  <div className="detail-label">Sex</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, margin: "4px 0" }}>
                    {extraction.patient_information.sex?.value || "Not documented"}
                  </div>
                </div>

                <div className="entity-item">
                  <div className="detail-label">MRN / ID</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, margin: "4px 0" }}>
                    {extraction.patient_information.medical_record_number?.value || "Not documented"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnoses */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">
                Diagnoses &amp; Conditions
                <span className="category-count">{extraction.diagnoses.length}</span>
              </h4>
            </div>
            <div className="category-card-body">
              {extraction.diagnoses.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No diagnoses documented.</p>
              ) : (
                <div className="entity-list">
                  {extraction.diagnoses.map((dx) => (
                    <div key={dx.entity_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{dx.name}</span>
                        <span className="badge-neo badge-neo-low">{dx.diagnosis_status}</span>
                      </div>
                      {dx.code && (
                        <div className="entity-details">
                          <span><span className="detail-label">Code:</span> {dx.code}</span>
                        </div>
                      )}
                      <EvidenceWidget
                        id={dx.entity_id}
                        evidence={dx.evidence}
                        isExpanded={!!expandedEvidence[dx.entity_id]}
                        onToggle={() => toggleEvidence(dx.entity_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Symptoms */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">
                Symptoms
                <span className="category-count">{extraction.symptoms.length}</span>
              </h4>
            </div>
            <div className="category-card-body">
              {extraction.symptoms.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No symptoms documented.</p>
              ) : (
                <div className="entity-list">
                  {extraction.symptoms.map((sym) => (
                    <div key={sym.entity_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{sym.name}</span>
                        <span className={`badge-neo badge-neo-${sym.certainty}`}>{sym.certainty}</span>
                      </div>
                      <div className="entity-details">
                        {sym.onset && <span><span className="detail-label">Onset:</span> {sym.onset}</span>}
                        {sym.duration && <span><span className="detail-label">Duration:</span> {sym.duration}</span>}
                        {sym.severity && <span><span className="detail-label">Severity:</span> {sym.severity}</span>}
                      </div>
                      <EvidenceWidget
                        id={sym.entity_id}
                        evidence={sym.evidence}
                        isExpanded={!!expandedEvidence[sym.entity_id]}
                        onToggle={() => toggleEvidence(sym.entity_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Medications */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">
                Medications
                <span className="category-count">{extraction.medications.length}</span>
              </h4>
            </div>
            <div className="category-card-body">
              {extraction.medications.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No medications documented.</p>
              ) : (
                <div className="entity-list">
                  {extraction.medications.map((med) => (
                    <div key={med.entity_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{med.name}</span>
                        <span className={`badge-neo badge-neo-${med.medication_status === "active" ? "low" : "moderate"}`}>
                          {med.medication_status}
                        </span>
                      </div>
                      <div className="entity-details">
                        {med.dose_value && (
                          <span><span className="detail-label">Dose:</span> {med.dose_value} {med.dose_unit || ""}</span>
                        )}
                        {med.route && <span><span className="detail-label">Route:</span> {med.route}</span>}
                        {med.frequency && <span><span className="detail-label">Frequency:</span> {med.frequency}</span>}
                      </div>
                      <EvidenceWidget
                        id={med.entity_id}
                        evidence={med.evidence}
                        isExpanded={!!expandedEvidence[med.entity_id]}
                        onToggle={() => toggleEvidence(med.entity_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vitals */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">
                Vital Signs
                <span className="category-count">{extraction.vitals.length}</span>
              </h4>
            </div>
            <div className="category-card-body">
              {extraction.vitals.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No vital signs documented.</p>
              ) : (
                <div className="entity-list">
                  {extraction.vitals.map((v) => (
                    <div key={v.entity_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{v.vital_type}: {v.value} {v.unit || ""}</span>
                        <span className={`badge-neo badge-neo-${v.certainty}`}>{v.certainty}</span>
                      </div>
                      {v.observed_at && (
                        <div className="entity-details">
                          <span><span className="detail-label">Observed:</span> {v.observed_at}</span>
                        </div>
                      )}
                      <EvidenceWidget
                        id={v.entity_id}
                        evidence={v.evidence}
                        isExpanded={!!expandedEvidence[v.entity_id]}
                        onToggle={() => toggleEvidence(v.entity_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Allergies */}
          <div className="category-card">
            <div className="category-card-header">
              <h4 className="category-title">
                Allergies
                <span className="category-count">{extraction.allergies.length}</span>
              </h4>
            </div>
            <div className="category-card-body">
              {extraction.allergies.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No allergy statements documented.</p>
              ) : (
                <div className="entity-list">
                  {extraction.allergies.map((alg) => (
                    <div key={alg.entity_id} className="entity-item">
                      <div className="entity-item-top">
                        <span className="entity-name">{alg.substance}</span>
                        <span className="badge-neo badge-neo-low">
                          {alg.allergy_status === "no_known_allergies" ? "No Known Allergies" : alg.allergy_status}
                        </span>
                      </div>
                      {alg.reaction && (
                        <div className="entity-details">
                          <span><span className="detail-label">Reaction:</span> {alg.reaction}</span>
                        </div>
                      )}
                      <EvidenceWidget
                        id={alg.entity_id}
                        evidence={alg.evidence}
                        isExpanded={!!expandedEvidence[alg.entity_id]}
                        onToggle={() => toggleEvidence(alg.entity_id)}
                        onHighlight={handleHighlight}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TELEMETRY & LINEAGE */}
      {activeTab === "telemetry" && (
        <div className="card-neo">
          <h4 style={{ margin: "0 0 16px" }}>Pipeline Execution Telemetry</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Routing &amp; Ingestion</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.routing_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Canonicalization</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.canonicalization_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Clinical Extraction (E1.1)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.clinical_extraction_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Deterministic Verification</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.deterministic_validation_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Review Synthesis (R1.0)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.review_synthesis_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Quality Gate</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--emerald)" }}>
                {timings.quality_gate_ms ?? "—"} ms
              </div>
            </div>
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "12px" }}>
              <div className="detail-label">Total Duration</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary-dark)" }}>
                {timings.total_ms ?? "—"} ms
              </div>
            </div>
          </div>
          <div style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Model: <code>{analysis.processing.model}</code> | Prompt Versions:{" "}
            <code>
              {JSON.stringify(analysis.processing.prompt_versions || { extraction: analysis.processing.prompt_version })}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceWidget({
  id,
  evidence,
  isExpanded,
  onToggle,
  onHighlight,
}: {
  id: string;
  evidence: EvidenceRef[];
  isExpanded: boolean;
  onToggle: () => void;
  onHighlight: (segmentId: string | null) => void;
}) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="evidence-container">
      <button
        type="button"
        className="evidence-toggle-btn"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {isExpanded ? "▲ Hide source evidence" : `▼ Inspect evidence (${evidence.length})`}
      </button>

      {isExpanded && (
        <div style={{ marginTop: "6px" }}>
          {evidence.map((ref, idx) => (
            <div
              key={`${id}-${ref.segment_id}-${idx}`}
              className="evidence-quote-box"
              onMouseEnter={() => onHighlight(ref.segment_id)}
              onMouseLeave={() => onHighlight(null)}
              onClick={() => {
                onHighlight(ref.segment_id);
                const el = document.getElementById(ref.segment_id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
              title="Click or hover to highlight in source document"
            >
              <p className="evidence-quote-text">“{ref.quote}”</p>
              <span className="evidence-tag">
                {ref.segment_id} (Page {ref.page_number})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
