"use client";

import { useState, useRef } from "react";
import ReviewReportView, { AnalysisResponse } from "./components/ReviewReportView";

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

export default function WorkbenchPage() {
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "image">("text");
  const [noteText, setNoteText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<SafeError | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleLoadTextDemo = () => {
    setInputMode("text");
    setNoteText(SYNTHETIC_DEMO_NOTE);
    setSelectedFile(null);
    setImagePreview(null);
    setApiError(null);
    setNetworkError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
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
    setSelectedFile(null);
    setImagePreview(null);
    setApiError(null);
    setNetworkError(null);
    setAnalysis(null);
    setHighlightedSegment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        `Unable to reach the Sanitas API at ${apiBaseUrl}. Ensure the backend is reachable. (${msg})`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = noteText.length;
  const isOverLimit = charCount > MAX_TEXT_CHARS;

  return (
    <main className="main-container">
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
              <strong>Suggestion:</strong> {apiError.suggestion}
            </p>
          )}
          <div className="error-id">Correlation ID: {apiError.correlation_id}</div>
        </div>
      )}

      {networkError && (
        <div className="error-box-neo" role="alert">
          <div className="error-header">
            <span>Backend Connectivity Error</span>
          </div>
          <p className="error-msg">{networkError}</p>
        </div>
      )}

      {/* Main Workbench Grid */}
      <div className="workbench-grid">
        {/* LEFT COLUMN: Document Input or Source Inspection */}
        <section className="card-neo" aria-label="Input Clinical Document and Canonical Source">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <span className="badge-neo badge-neo-scope2">
                {analysis ? "Source Document" : "Document Ingestion"}
              </span>
              <h2 style={{ fontSize: "1.3rem", marginTop: "6px" }}>
                {analysis ? "Canonical Segments" : "Submit Clinical Document"}
              </h2>
            </div>
            {!analysis && (
              <button
                type="button"
                className="btn-neo btn-neo-sm btn-neo-accent"
                onClick={handleLoadTextDemo}
                disabled={isLoading}
              >
                Load Demo Note
              </button>
            )}
            {analysis && (
              <button
                type="button"
                className="btn-neo btn-neo-sm btn-neo-secondary"
                onClick={() => setAnalysis(null)}
              >
                New Review
              </button>
            )}
          </div>

          {!analysis ? (
            <form onSubmit={handleSubmit}>
              {/* Input Mode Selector Tabs */}
              <div className="input-mode-tabs">
                <button
                  type="button"
                  className={`input-tab ${inputMode === "text" ? "active" : ""}`}
                  onClick={() => {
                    setInputMode("text");
                    setSelectedFile(null);
                  }}
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  className={`input-tab ${inputMode === "pdf" ? "active" : ""}`}
                  onClick={() => {
                    setInputMode("pdf");
                    setNoteText("");
                  }}
                >
                  PDF Document
                </button>
                <button
                  type="button"
                  className={`input-tab ${inputMode === "image" ? "active" : ""}`}
                  onClick={() => {
                    setInputMode("image");
                    setNoteText("");
                  }}
                >
                  Medical Image Scan
                </button>
              </div>

              {/* Mode 1: Plain Text */}
              {inputMode === "text" && (
                <div className="textarea-wrapper">
                  <textarea
                    id="clinical-note-input"
                    className="note-textarea"
                    placeholder="Enter or paste synthetic clinical note text here..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="char-counter">
                    <span style={{ color: isOverLimit ? "#E63946" : "var(--text-muted)" }}>
                      {charCount.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} chars
                    </span>
                  </div>
                </div>
              )}

              {/* Mode 2: PDF Document Upload */}
              {inputMode === "pdf" && (
                <div>
                  <div
                    className="dropzone-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
                    <div className="dropzone-title">
                      {selectedFile ? selectedFile.name : "Select or Drop a Clinical PDF"}
                    </div>
                    <div className="dropzone-sub">
                      Supports Digital or Scanned PDFs (up to 15 pages, max 10 MB)
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

              {/* Mode 3: Medical Image Scan */}
              {inputMode === "image" && (
                <div>
                  <div
                    className="dropzone-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🖼️</div>
                    <div className="dropzone-title">
                      {selectedFile ? selectedFile.name : "Select or Drop a Document Image"}
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
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="submit"
                  className="btn-neo btn-neo-primary"
                  disabled={
                    isLoading ||
                    (inputMode === "text" && (!noteText.trim() || isOverLimit)) ||
                    (inputMode !== "text" && !selectedFile)
                  }
                >
                  {isLoading ? "Running Review Pipeline..." : "Review Clinical Document"}
                </button>
                <button
                  type="button"
                  className="btn-neo btn-neo-ghost"
                  onClick={handleClear}
                  disabled={isLoading || (!noteText && !selectedFile && !apiError && !networkError)}
                >
                  Clear
                </button>
              </div>
            </form>
          ) : (
            /* Canonical Source Segments Inspection Viewer */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>
                  Verified Segments ({analysis.canonical_document.segments.length})
                </span>
                <span className="badge-neo">
                  Route: {analysis.source?.source_type || analysis.canonical_document.source_type}
                </span>
              </div>
              <div className="segments-list">
                {analysis.canonical_document.segments.map((seg) => {
                  const isActive = highlightedSegment === seg.segment_id;
                  return (
                    <div
                      key={seg.segment_id}
                      id={seg.segment_id}
                      className={`segment-box ${isActive ? "active-evidence" : ""}`}
                    >
                      <span className="segment-id-tag">{seg.segment_id}</span>
                      <span>{seg.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Results or Empty / Loading State */}
        <section aria-label="Review Results and Findings">
          {isLoading && (
            <div className="card-neo spinner-box">
              <div className="spinner-neo" aria-hidden="true" />
              <h3 style={{ margin: "0 0 8px" }}>Executing Two-Pass Clinical Review</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto" }}>
                Ingesting document, routing modality, extracting structured facts with evidence grounding, detecting contradictions, and synthesizing reviewer findings.
              </p>
            </div>
          )}

          {!isLoading && !analysis && (
            <div className="card-neo" style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>🩺</div>
              <h3 style={{ margin: "0 0 8px" }}>Awaiting Document Submission</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 20px" }}>
                Enter synthetic note text, upload a clinical PDF, or attach an image scan on the left.
              </p>
              <button
                type="button"
                className="btn-neo btn-neo-accent"
                onClick={handleLoadTextDemo}
              >
                Try Synthetic Demonstration
              </button>
            </div>
          )}

          {!isLoading && analysis && (
            <ReviewReportView
              analysis={analysis}
              onHighlightSegment={setHighlightedSegment}
            />
          )}
        </section>
      </div>
    </main>
  );
}
