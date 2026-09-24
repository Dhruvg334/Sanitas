"use client";

import { useCallback, useEffect, useState } from "react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "overview" | "workbench" | "history" | "review" | "docs" | "safety";
}

export default function UserGuideModal({
  isOpen,
  onClose,
  initialTab = "overview",
}: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const handleDismiss = useCallback(() => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem("sanitas_guide_dismissed", "true");
      } catch {
        // Ignore storage errors
      }
    }
    onClose();
  }, [dontShowAgain, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="modal-neo">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge-neo badge-neo-scope1">User Manual &amp; Operational Guide</span>
              <span className="badge-neo badge-neo-status" style={{ fontSize: "0.7rem" }}>
                <span className="status-live-dot" /> Verified Architecture
              </span>
            </div>
            <h2 id="guide-title" style={{ fontSize: "1.45rem", margin: 0, color: "var(--primary-dark)" }}>
              How to Operate Sanitas Reviewer
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
            aria-label="Close Guide"
          >
            ✕
          </button>
        </div>

        {/* Modal Subnav Tabs */}
        <div className="modal-nav-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            1. Overview
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "workbench" ? "active" : ""}`}
            onClick={() => setActiveTab("workbench")}
          >
            2. Workbench Guide
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            3. History &amp; Audit
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            4. Permalinks
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            5. Architecture Docs
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "safety" ? "active" : ""}`}
            onClick={() => setActiveTab("safety")}
          >
            6. Safety Boundary
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="guide-tab-pane">
              <div className="callout-neo callout-info" style={{ marginBottom: "18px" }}>
                <strong>System Mission:</strong> Sanitas is an AI-assisted clinical document reviewer engineered exclusively for <em>synthetic medical documents</em>. It combines schema-constrained Gemini reasoning with deterministic Python evidence gates to eliminate hallucinated assertions.
              </div>

              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Core Review Pipeline Workflow
              </h3>
              <div className="guide-step-grid">
                <div className="guide-step-card">
                  <div className="guide-step-num">1</div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", margin: "0 0 4px" }}>Multi-Modal Intake</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Ingest plain text, digital PDFs, or camera scans. The adaptive router checks MIME types and bounds inputs safely.
                    </p>
                  </div>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-num">2</div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", margin: "0 0 4px" }}>Deterministic Segmentation</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Every line is assigned an immutable ID (<code>p1-s1</code>, <code>p1-s2</code>) before any AI model invocation.
                    </p>
                  </div>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-num">3</div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", margin: "0 0 4px" }}>Two-Pass AI Reasoning</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Pass 1 extracts documented facts with strict JSON schema. Pass 2 synthesizes clinical concerns and information gaps.
                    </p>
                  </div>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-num">4</div>
                  <div>
                    <h4 style={{ fontSize: "0.92rem", margin: "0 0 4px" }}>Deterministic Evidence Gates</h4>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Application code independently verifies that all evidence quotes exist verbatim in the source. Claims without proof fail closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKBENCH GUIDE */}
          {activeTab === "workbench" && (
            <div className="guide-tab-pane">
              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Using the Clinical Workbench (`/`)
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                The Workbench is the central workspace where clinical reviewers ingest synthetic documents, review findings, and audit grounded source evidence.
              </p>

              <ol style={{ paddingLeft: "20px", fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.7 }}>
                <li>
                  <strong>Select an Input Mode:</strong> Choose <em>Plain Text Note</em>, <em>Digital PDF Document</em>, or <em>Document Scan / Photo</em>.
                </li>
                <li>
                  <strong>Use Sample Presets:</strong> Click on one of the quick sample preset buttons (e.g. <em>Ambulatory Follow-up</em>, <em>Allergy Inconsistency</em>, or <em>Medication Conflict</em>) to immediately test different review scenarios without typing.
                </li>
                <li>
                  <strong>Submit for Review:</strong> Click <strong>&ldquo;Run Evidence-Linked Review&rdquo;</strong>. The system will stream real-time stage progress indicator pills.
                </li>
                <li>
                  <strong>Inspect Extracted Entities &amp; Concerns:</strong> The results view displays three structured tabs:
                  <ul style={{ paddingLeft: "20px", marginTop: "6px" }}>
                    <li><strong>Findings &amp; Synthesis:</strong> Clinical Concerns, Factual Inconsistencies, Missing Info, and Items Requiring Human Review.</li>
                    <li><strong>Fact Extraction:</strong> Granular extracted clinical entities with certainty indicators.</li>
                    <li><strong>Telemetry &amp; Audit:</strong> Execution timings, SHA-256 digests, and prompt versions.</li>
                  </ul>
                </li>
                <li>
                  <strong>Verify Evidence Quotes:</strong> Click on any green quote box (e.g. <code>p1-s3</code>) to immediately open the <strong>Canonical Source Segment Drawer</strong> and see the exact line highlighted in yellow.
                </li>
              </ol>
            </div>
          )}

          {/* TAB 3: HISTORY & AUDIT */}
          {activeTab === "history" && (
            <div className="guide-tab-pane">
              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Audit Ledger &amp; PostgreSQL Persistence (`/history`)
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Every analysis is persisted to Neon PostgreSQL. The History page provides an immutable audit ledger of all analyzed synthetic documents.
              </p>

              <div className="guide-step-grid">
                <div className="guide-step-card">
                  <h4 style={{ fontSize: "0.92rem", margin: "0 0 6px", color: "var(--emerald)" }}>Durable Persistence</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    Analysis results are stored in PostgreSQL using native <code>JSONB</code> documents with UUID primary keys. Records survive browser closures and page reloads.
                  </p>
                </div>

                <div className="guide-step-card">
                  <h4 style={{ fontSize: "0.92rem", margin: "0 0 6px", color: "var(--emerald)" }}>One-Click Reopening</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    Click &ldquo;Open Report &amp; Evidence&rdquo; on any history card to reload the complete analysis at its dedicated permalink <code>/review/[id]</code>.
                  </p>
                </div>

                <div className="guide-step-card">
                  <h4 style={{ fontSize: "0.92rem", margin: "0 0 6px", color: "var(--emerald)" }}>Audit Integrity</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    Each record includes the source file type, original filename, executive summary snippet, and exact creation timestamp for clinical governance.
                  </p>
                </div>

                <div className="guide-step-card">
                  <h4 style={{ fontSize: "0.92rem", margin: "0 0 6px", color: "var(--emerald)" }}>Zero Stale Cache</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    The ledger fetches with <code>cache: &quot;no-store&quot;</code> to guarantee that new reviews appear immediately upon completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEW PERMALINKS */}
          {activeTab === "review" && (
            <div className="guide-tab-pane">
              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Durable Review Permalinks (`/review/[id]`)
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Every analysis produces a permanent, shareable URL formatted as <code>https://.../review/&lt;uuid&gt;</code>.
              </p>

              <ul style={{ paddingLeft: "20px", fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.7 }}>
                <li>
                  <strong>Idempotent Retrieval:</strong> Opening a review link retrieves pre-computed and verified analysis results directly from PostgreSQL; it does not re-invoke Gemini or incur API charges.
                </li>
                <li>
                  <strong>Shareable for Second Opinions:</strong> Clinicians and colleagues can open the link in any browser to inspect identical findings and interact with the source segment drawer.
                </li>
                <li>
                  <strong>Copy Permalinks:</strong> Use the &ldquo;📋 Copy Review Link&rdquo; button at the top right of the review page to copy the full URL to your clipboard.
                </li>
                <li>
                  <strong>Offline / Refresh Resilient:</strong> Hard refreshes (F5) reload the full report cleanly without losing state.
                </li>
              </ul>
            </div>
          )}

          {/* TAB 5: ARCHITECTURE DOCS */}
          {activeTab === "docs" && (
            <div className="guide-tab-pane">
              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Navigating Technical Documentation (`/docs`)
              </h3>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                The documentation page provides comprehensive engineering specifications across six interactive chapters:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.84rem" }}>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 1: System Topology</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Vercel + Render + Neon PostgreSQL deployment diagram.
                  </p>
                </div>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 2: 7-Stage Pipeline</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    P1 through P7 execution sequence and verification loop.
                  </p>
                </div>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 3: Ingestion &amp; Memory</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Adaptive 80% text heuristic, 150 DPI memory bounding.
                  </p>
                </div>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 4: Prompts E1.1 &amp; R1.0</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Extraction and synthesis system instructions with prompt injection delimiters.
                  </p>
                </div>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 5: Verification &amp; Rules</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Substring matching, allergy contradictions, and anti-directive filters.
                  </p>
                </div>
                <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px" }}>
                  <strong>Chapter 6: REST API Reference</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    Full request/response schemas, status codes, and error taxonomy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SAFETY BOUNDARY */}
          {activeTab === "safety" && (
            <div className="guide-tab-pane">
              <div className="callout-neo callout-warning" style={{ marginBottom: "16px" }}>
                <strong>CRITICAL CLINICAL NOTICE:</strong> Sanitas is designed and deployed strictly for research, educational evaluation, and demonstration on <strong>SYNTHETIC CLINICAL DATA</strong>.
              </div>

              <h3 style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--primary-dark)" }}>
                Architectural Safety Safeguards
              </h3>
              <ul style={{ paddingLeft: "20px", fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.7 }}>
                <li>
                  <strong>No Real Protected Health Information (PHI):</strong> Never upload identifiable patient records, HIPAA-regulated data, or genuine medical records.
                </li>
                <li>
                  <strong>Prohibition of Medical Directives:</strong> Sanitas contains secondary regex safeguards preventing the AI model from issuing prescriptive commands (e.g. <em>&ldquo;I prescribe&rdquo;</em>, <em>&ldquo;Patient must take&rdquo;</em>).
                </li>
                <li>
                  <strong>Strict No-Inference Boundary:</strong> Sanitas is prohibited from guessing diagnoses not explicitly stated in the document or inferring patient demographics from names.
                </li>
                <li>
                  <strong>Fail-Closed Evidence Verification:</strong> Any extracted assertion referencing a non-existent segment ID or modified quote fails verification and is rejected.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-muted)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--emerald)" }}
            />
            Don&apos;t show this guide automatically on launch
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn-neo btn-neo-sm btn-neo-primary"
              onClick={handleDismiss}
            >
              Got It, Proceed to Reviewer &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
