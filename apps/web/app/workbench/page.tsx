"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ReviewReportView, { AnalysisResponse } from "../components/ReviewReportView";

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

interface DemoPreset {
  id: string;
  label: string;
  category: string;
  description: string;
  text: string;
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "ambulatory",
    label: "Ambulatory Follow-up",
    category: "General Practice",
    description: "Elena Rostova: 54yo female, Type 2 Diabetes, Metformin, discontinued Lisinopril, headache.",
    text: `Patient: Elena Rostova
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
Patient unsure whether current headache is related to recent reduction in daily caffeine intake.`,
  },
  {
    id: "allergy_conflict",
    label: "Allergy Inconsistency Case",
    category: "Contradiction Detection",
    description: "Marcus Vance: Header notes NKDA, but encounter documents acute anaphylactoid reaction to Amoxicillin.",
    text: `PATIENT CLINICAL SUMMARY
Patient Name: Marcus Vance
DOB: 1982-07-19 | Age: 42 | Sex: Male | MRN: SYN-49012
ALLERGIES: NKDA (No Known Drug Allergies)
Chief Complaint: Acute facial angioedema and diffuse pruritic urticaria.
Encounter Narrative:
Patient presented to urgent care 45 minutes after ingesting Amoxicillin 500mg oral capsule prescribed by dentist.
Developed severe periorbital edema, lip swelling, and erythematous wheals over bilateral upper extremities.
Assessment:
1. Acute allergic drug reaction secondary to Amoxicillin.
2. Contradictory intake documentation (intake sheet states NKDA).
Plan:
Administer diphenhydramine 50mg IM stat and dexamethasone 10mg IV.
Update allergy record immediately: Penicillin class antibiotics strictly contraindicated.`,
  },
  {
    id: "medication_conflict",
    label: "Medication Status Conflict",
    category: "Contradiction Detection",
    description: "Sarah Jenkins: Lisinopril listed as active daily, yet discharge instructions order immediate discontinuation.",
    text: `PROGRESS & DISCHARGE RECORD
Patient: Sarah Jenkins | Age: 61 | Sex: Female | MRN: SYN-30419
Active Problem List: Essential Hypertension, Hyperlipidemia.
Medications at Encounter Start:
- Lisinopril 20 mg oral daily with breakfast.
- Atorvastatin 20 mg oral daily at bedtime.
Subjective & History:
Patient reports a persistent, intractable, dry, non-productive nocturnal cough for 4 weeks.
Exam:
Lungs clear bilaterally. Oropharynx normal without erythema.
Discharge Orders:
Discontinue Lisinopril immediately due to suspected ACE-inhibitor induced cough.
Initiate Losartan 50 mg oral daily as alternative angiotensin receptor blocker.
Follow up with primary care in 3 weeks with repeat basic metabolic panel.`,
  },
  {
    id: "acute_abdomen",
    label: "Emergency Acute Abdomen",
    category: "Emergency Triage",
    description: "David Miller: 29yo male, severe right lower quadrant abdominal pain, rebound tenderness, surgical consult.",
    text: `EMERGENCY DEPARTMENT ENCOUNTER
Patient: David Miller | Age: 29 | Sex: Male | MRN: SYN-11894
Triage Time: 02:40 AM
Chief Complaint: Progressive worsening right lower quadrant abdominal pain for 14 hours.
Associated Symptoms: Anorexia, nausea, two episodes of non-bloody vomiting. Denies diarrhea.
Vital Signs:
BP: 124/76 mmHg | HR: 104 bpm (sinus tachycardia) | RR: 20 /min | Temp: 100.9 F | SpO2: 99%
Physical Examination:
Abdomen: Flat. Markedly tender to palpation at McBurney point with localized involuntary guarding and positive Rovsing sign.
Laboratory & Diagnostics:
WBC: 14.8 x10^3/uL (neutrophilic leukocytosis).
Impression:
Acute appendicitis with localized peritoneal irritation.
Plan:
NPO status. Intravenous normal saline infusion at 125 mL/hr.
Stat surgical consultation requested for diagnostic laparoscopy / appendectomy.`,
  },
];

export default function WorkbenchPage() {
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "image">("text");
  const [noteText, setNoteText] = useState(DEMO_PRESETS[0].text);
  const [activePreset, setActivePreset] = useState<string>("ambulatory");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<SafeError | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  const [copiedSegmentId, setCopiedSegmentId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleSelectPreset = (preset: DemoPreset) => {
    setInputMode("text");
    setActivePreset(preset.id);
    setNoteText(preset.text);
    setSelectedFile(null);
    setImagePreview(null);
    setApiError(null);
    setNetworkError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setActivePreset("");
    setApiError(null);
    setNetworkError(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleClear = () => {
    setNoteText("");
    setActivePreset("");
    setSelectedFile(null);
    setImagePreview(null);
    setApiError(null);
    setNetworkError(null);
    setAnalysis(null);
    setHighlightedSegment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopySegment = (segText: string, segId: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(segText);
      setCopiedSegmentId(segId);
      setTimeout(() => setCopiedSegmentId(null), 1800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setApiError(null);
    setNetworkError(null);
    setHighlightedSegment(null);

    try {
      let res: Response;

      if (inputMode === "text") {
        if (!noteText.trim()) {
          setIsLoading(false);
          return;
        }
        res = await fetch(`${apiBaseUrl}/api/v1/analyses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: noteText }),
        });
      } else {
        if (!selectedFile) {
          setIsLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch(`${apiBaseUrl}/api/v1/analyses`, {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        try {
          const errData: ApiErrorResponse = await res.json();
          if (errData.error) {
            setApiError(errData.error);
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
      const msg = err instanceof Error ? err.message : "Network error";
      setNetworkError(
        `Unable to reach the Sanitas API at ${apiBaseUrl}. Ensure the backend service is running and CORS permits this origin. (${msg})`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = noteText.length;
  const isOverLimit = charCount > MAX_TEXT_CHARS;

  return (
    <main className="main-container">
      {/* Workbench Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="badge-neo badge-neo-scope2">Active Review Environment</span>
            <span className="badge-neo badge-neo-status">
              <span className="status-live-dot" /> Synthetic Mode
            </span>
          </div>
          <h1 style={{ fontSize: "2.1rem", margin: 0 }}>Clinical Review Workbench</h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.92rem" }}>
            Ingest synthetic clinical documents, execute schema-constrained extraction, and verify evidence quotes against immutable source lines.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/history" className="btn-neo btn-neo-sm btn-neo-secondary">
            📋 Past Reviews
          </Link>
          <Link href="/docs" className="btn-neo btn-neo-sm btn-neo-secondary">
            📖 Documentation
          </Link>
        </div>
      </div>

      {/* Error Alert Box */}
      {apiError && (
        <div className="error-box-neo" role="alert">
          <div className="error-header">
            <span>Analysis Verification Error</span>
            <span className="badge-neo badge-neo-high">{apiError.code}</span>
          </div>
          <p className="error-msg">{apiError.message}</p>
          {apiError.suggestion && (
            <p className="error-suggestion">
              <strong>Actionable Suggestion:</strong> {apiError.suggestion}
            </p>
          )}
          <div className="error-id">Tracking Correlation ID: {apiError.correlation_id}</div>
        </div>
      )}

      {networkError && (
        <div className="error-box-neo" role="alert">
          <div className="error-header">
            <span>Backend Connectivity Notice</span>
          </div>
          <p className="error-msg">{networkError}</p>
        </div>
      )}

      {/* Main Workbench Grid */}
      <div className="workbench-grid">
        {/* LEFT COLUMN: Document Input or Source Inspection */}
        <section className="card-neo" aria-label="Input Clinical Document and Canonical Source">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="badge-neo badge-neo-scope2">
                {analysis ? "Source Document" : "Multi-Modal Ingestion"}
              </span>
              <h2 style={{ fontSize: "1.25rem", marginTop: "6px" }}>
                {analysis ? "Canonical Segments" : "Document Intake"}
              </h2>
            </div>
            {analysis && (
              <button
                type="button"
                className="btn-neo btn-neo-sm btn-neo-secondary"
                onClick={() => setAnalysis(null)}
              >
                + New Document Review
              </button>
            )}
          </div>

          {!analysis ? (
            <div>
              {/* Synthetic Presets Selector with Clean Spacing */}
              <div style={{ marginBottom: "18px", padding: "12px 14px", background: "var(--mint-light)", borderRadius: "8px", border: "1.5px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Synthetic Test Encounters:
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Select a case to auto-fill
                  </span>
                </div>
                <div className="sample-presets-bar">
                  {DEMO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`sample-preset-btn ${activePreset === p.id ? "active" : ""}`}
                      onClick={() => handleSelectPreset(p)}
                      title={p.description}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Input Mode Selector Tabs with Clear Gaps */}
                <div className="tab-bar-neo" role="tablist" style={{ marginBottom: "16px", gap: "8px" }}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === "text"}
                    className={`tab-btn-neo ${inputMode === "text" ? "active" : ""}`}
                    onClick={() => {
                      setInputMode("text");
                      setApiError(null);
                    }}
                  >
                    Plain Text Note
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === "pdf"}
                    className={`tab-btn-neo ${inputMode === "pdf" ? "active" : ""}`}
                    onClick={() => {
                      setInputMode("pdf");
                      setApiError(null);
                    }}
                  >
                    Digital PDF Document
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === "image"}
                    className={`tab-btn-neo ${inputMode === "image" ? "active" : ""}`}
                    onClick={() => {
                      setInputMode("image");
                      setApiError(null);
                    }}
                  >
                    Document Scan / Photo
                  </button>
                </div>

                {/* TAB 1: PLAIN TEXT */}
                {inputMode === "text" && (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label htmlFor="clinical-note-input" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-dark)" }}>
                        Synthetic Clinical Text
                      </label>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: isOverLimit ? "var(--alert-red)" : "var(--text-muted)",
                        }}
                      >
                        {charCount.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters
                      </span>
                    </div>
                    <textarea
                      id="clinical-note-input"
                      className="textarea-neo"
                      value={noteText}
                      onChange={(e) => {
                        setNoteText(e.target.value);
                        setActivePreset("");
                      }}
                      placeholder="Paste synthetic clinical document text here..."
                      rows={14}
                      disabled={isLoading}
                      required
                    />
                  </div>
                )}

                {/* TAB 2: DIGITAL PDF */}
                {inputMode === "pdf" && (
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      className="dropzone-neo"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type === "application/pdf") {
                          setSelectedFile(file);
                          setActivePreset("");
                          setApiError(null);
                        }
                      }}
                    >
                      <div className="dropzone-icon">📄</div>
                      <div className="dropzone-title">
                        {selectedFile ? selectedFile.name : "Click to select or drag & drop a PDF document"}
                      </div>
                      <div className="dropzone-sub">
                        Supports digital &amp; scanned PDF clinical records (max 10 MB, up to 15 pages)
                      </div>
                      {selectedFile && (
                        <div style={{ marginTop: "12px" }}>
                          <span className="badge-neo badge-neo-scope1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* TAB 3: IMAGE SCAN */}
                {inputMode === "image" && (
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      className="dropzone-neo"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          setSelectedFile(file);
                          setActivePreset("");
                          setApiError(null);
                          const reader = new FileReader();
                          reader.onload = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      <div className="dropzone-icon">📷</div>
                      <div className="dropzone-title">
                        {selectedFile ? selectedFile.name : "Click to select or drop a document image scan"}
                      </div>
                      <div className="dropzone-sub">
                        Supports JPEG / PNG document scans &amp; photographs (max 10 MB)
                      </div>
                      {selectedFile && (
                        <div style={{ marginTop: "12px" }}>
                          <span className="badge-neo badge-neo-scope1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div style={{ marginBottom: "16px", textAlign: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Document Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "220px",
                            border: "var(--ui-border)",
                            borderRadius: "8px",
                            boxShadow: "2px 2px 0 var(--border-color)",
                          }}
                        />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-neo btn-neo-secondary"
                    onClick={handleClear}
                    disabled={isLoading}
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    className="btn-neo btn-neo-primary"
                    disabled={isLoading || isOverLimit || (inputMode === "text" ? !noteText.trim() : !selectedFile)}
                    style={{ fontWeight: 800 }}
                  >
                    {isLoading ? "Running Review Pipeline..." : "Run Evidence-Linked Review \u2192"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CANONICAL SOURCE SEGMENTS DRAWER */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  Showing {analysis.canonical_document.segments?.length || 0} immutable source segments. Click on evidence pills in findings to highlight matching lines.
                </p>
                {highlightedSegment && (
                  <button
                    type="button"
                    className="btn-neo btn-neo-xs btn-neo-secondary"
                    onClick={() => setHighlightedSegment(null)}
                  >
                    Clear Highlight
                  </button>
                )}
              </div>

              <div className="segments-list">
                {analysis.canonical_document.segments?.map((seg) => {
                  const isHighlighted = highlightedSegment === seg.segment_id;
                  return (
                    <div
                      key={seg.segment_id}
                      id={`segment-${seg.segment_id}`}
                      className={`segment-box ${isHighlighted ? "active-evidence" : ""}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span className="segment-id-tag">
                          {seg.segment_id} {isHighlighted && "★ EVIDENCE MATCH"}
                        </span>
                        <button
                          type="button"
                          className="btn-neo btn-neo-xs btn-neo-secondary"
                          style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                          onClick={() => handleCopySegment(seg.text, seg.segment_id)}
                        >
                          {copiedSegmentId === seg.segment_id ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <div>{seg.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Review Results, Progress, or Clinical Guidance */}
        <section aria-label="Clinical Findings and Grounded Evidence">
          {isLoading && (
            <div className="pipeline-progress-tracker">
              <div className="spinner-neo" aria-hidden="true" />
              <h3 style={{ textAlign: "center", margin: "0 0 6px", color: "var(--primary-dark)" }}>
                Executing 7-Stage Clinical Review Pipeline
              </h3>
              <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 auto", maxWidth: "420px" }}>
                Synthesizing findings through Gemini and deterministically verifying source evidence quotes against canonical segments.
              </p>

              <div className="tracker-stages-list">
                <div className="tracker-stage-item active">
                  <span className="tracker-badge-num">P1-2</span>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Canonical Intake</div>
                </div>
                <div className="tracker-stage-item active">
                  <span className="tracker-badge-num">P3</span>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Fact Extraction</div>
                </div>
                <div className="tracker-stage-item active">
                  <span className="tracker-badge-num">P4-5</span>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Evidence Gate</div>
                </div>
                <div className="tracker-stage-item active">
                  <span className="tracker-badge-num">P6-7</span>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Review Synthesis</div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !analysis && (
            <div className="card-neo empty-state-box" style={{ padding: "48px 24px" }}>
              <div className="empty-state-icon">🛡️</div>
              <h3 className="empty-state-title" style={{ fontSize: "1.3rem" }}>Awaiting Document Submission</h3>
              <p className="empty-state-text" style={{ maxWidth: "440px" }}>
                Select a synthetic encounter preset on the left or paste/upload a document. The Sanitas pipeline will extract clinical entities, detect factual contradictions, and verify every claim against the original text.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-neo btn-neo-sm btn-neo-primary"
                  onClick={() => handleSelectPreset(DEMO_PRESETS[0])}
                >
                  Load Elena Rostova Sample
                </button>
                <Link
                  href="/docs"
                  className="btn-neo btn-neo-sm btn-neo-secondary"
                  style={{ textDecoration: "none" }}
                >
                  📖 View System Docs
                </Link>
              </div>
            </div>
          )}

          {!isLoading && analysis && (
            <ReviewReportView
              analysis={analysis}
              onSelectSegment={(segId: string) => {
                setHighlightedSegment(segId);
                const el = document.getElementById(`segment-${segId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
