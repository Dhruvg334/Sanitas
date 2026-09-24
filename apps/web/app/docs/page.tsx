"use client";

import { useState } from "react";
import MermaidChart from "../components/MermaidChart";

const ARCHITECTURE_MERMAID = `flowchart TD
    subgraph Client["Reviewer Client Interface"]
        UI["Next.js 16 Web Application<br/>(Hosted on Vercel)"]
    end

    subgraph Backend["Sanitas FastAPI Application Service<br/>(Hosted on Render)"]
        Ingest["Stage P0: Input Ingestion & MIME Sniffer"]
        Router["Stage P1: Adaptive Document Router"]
        Canon["Stage P2: Canonical Document Builder"]
        Extract["Stage P3: Fact Extractor (Prompt E1.1)"]
        DetVal["Stage P4: Deterministic Evidence Gate"]
        InconRules["Stage P5: Contradiction Candidate Rules"]
        Synthesize["Stage P6: Review Synthesizer (Prompt R1.0)"]
        Gate["Stage P7: Final Quality Gate"]
        Persist["Stage P8: Persistence Manager"]
    end

    subgraph AI["Upstream Foundation Model"]
        Gemini["Google Gemini API<br/>(gemini-3.8-flash)"]
    end

    subgraph Storage["Serverless Relational Persistence"]
        NeonDB[("Neon PostgreSQL<br/>(analyses & processing_events)")]
    end

    UI -->|"POST /analyses (multipart/JSON)"| Ingest
    Ingest --> Router
    Router --> Canon
    Canon -->|"Canonical JSON"| Extract
    Extract <-->|"Strict Schema Generation"| Gemini
    Extract --> DetVal
    DetVal -->|"Verified Facts"| InconRules
    InconRules --> Synthesize
    Synthesize <-->|"Review Synthesis"| Gemini
    Synthesize --> Gate
    Gate --> Persist
    Persist -->|"Store Analysis Record"| NeonDB
    Persist -->|"Evidence-Linked Response"| UI
`;

const PIPELINE_FLOWCHART = `flowchart LR
    A["Raw Input<br/>(Text / PDF / Image)"] --> B{"Adaptive Router"}
    B -->|"Plain Text"| C1["Deterministic Line<br/>Canonicalization"]
    B -->|"Digital PDF (>=80% chars)"| C2["PyMuPDF Block & Line<br/>Reading-Order Extraction"]
    B -->|"Scanned PDF / Image"| C3["Gemini Prompt V1.0<br/>Visual Transcription"]

    C1 --> D["Canonical Document<br/>(p{page}-s{seg} segments)"]
    C2 --> D
    C3 --> D

    D --> E["Stage P3: Clinical Extraction<br/>(Gemini Prompt E1.1)"]
    E --> F{"Stage P4: Evidence Gate<br/>Verbatim Quote Match"}
    F -->|Pass| G["Stage P5: Contradiction Rules<br/>(Allergy / Med / Demographics)"]
    F -->|Fail| Err["Fail Closed: 502<br/>EVIDENCE_VALIDATION_FAILED"]

    G --> H["Stage P6: Review Synthesis<br/>(Gemini Prompt R1.0)"]
    H --> I{"Stage P7: Quality Gate<br/>Schema & Entity Cross-Ref"}
    I -->|Pass| J["Stage P8: Persistence<br/>(PostgreSQL + Telemetry)"]
    I -->|Fail| Err2["Fail Closed: 502<br/>REVIEW_QUALITY_GATE_FAILED"]
`;

const EVIDENCE_SEQUENCE = `sequenceDiagram
    autonumber
    actor Reviewer as Clinical Reviewer
    participant API as FastAPI Pipeline
    participant Router as Adaptive Router
    participant Gemini as Gemini AI Service
    participant Gate as Deterministic Gate
    participant DB as Neon PostgreSQL

    Reviewer->>API: POST /analyses (Document File or Note Text)
    API->>Router: Validate MIME, size bounds & classify route
    alt Plain text or Digital PDF
        Router->>API: Generate Canonical Document deterministically
    else Scanned PDF or Image
        Router->>Gemini: Prompt V1.0 (Visual transcription to canonical schema)
        Gemini-->>Router: CanonicalDocument JSON
    end
    API->>Gemini: Prompt E1.1 (Structured Clinical Extraction)
    Gemini-->>API: ClinicalExtraction JSON with segment evidence refs
    API->>Gate: Verify verbatim quotes in referenced segments
    alt Evidence Quote Mismatched or Segment Absent
        Gate-->>Reviewer: 502 Bad Gateway (EVIDENCE_VALIDATION_FAILED)
    else Evidence Grounded & Valid
        API->>Gemini: Prompt R1.0 (Synthesize Concerns, Missingness & Review Items)
        Gemini-->>API: ClinicalReview JSON
        API->>Gate: Validate review schema and cross-referenced entity IDs
        API->>DB: Persist Analysis & ProcessingEvent records
        API-->>Reviewer: 201 Completed AnalysisResponse
    end
`;

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<
    "architecture" | "pipeline" | "evidence" | "errors" | "evaluation" | "api"
  >("architecture");

  return (
    <main className="docs-container" style={{ maxWidth: "1200px", margin: "32px auto 80px", padding: "0 24px" }}>
      {/* Title Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <span className="badge-neo badge-neo-scope2">Engineering &amp; System Specification</span>
        <h1 style={{ fontSize: "2.6rem", marginTop: "8px", marginBottom: "8px" }}>
          Platform Technical Documentation
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "700px", margin: "0 auto", fontSize: "0.95rem" }}>
          Comprehensive architectural specifications, two-pass pipeline mechanics, deterministic evidence verification math, and REST API contracts for Sanitas.
        </p>
      </div>

      {/* Subpage Mini-Nav / Tabs */}
      <div className="mini-nav-container">
        <nav className="mini-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === "architecture" ? "active" : ""}`}
            onClick={() => setActiveTab("architecture")}
          >
            System Architecture
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            Two-Pass Pipeline (P0-P8)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "evidence" ? "active" : ""}`}
            onClick={() => setActiveTab("evidence")}
          >
            Evidence Grounding
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "errors" ? "active" : ""}`}
            onClick={() => setActiveTab("errors")}
          >
            Reliability &amp; Error Taxonomy
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "evaluation" ? "active" : ""}`}
            onClick={() => setActiveTab("evaluation")}
          >
            Evaluation Methodology
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            REST API Reference
          </button>
        </nav>
      </div>

      {/* TAB 1: SYSTEM ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div>
          <div className="card-neo" style={{ marginBottom: "24px" }}>
            <span className="badge-neo badge-neo-scope1">Topology Overview</span>
            <h2 style={{ margin: "10px 0 14px" }}>Multi-Tier Deployment Architecture</h2>
            <p style={{ color: "var(--text-dark)", lineHeight: 1.6, fontSize: "0.92rem" }}>
              Sanitas is architected as an independent, decoupled modern clinical reviewer. The frontend runs as a static/edge Next.js 16 application on Vercel, interacting with a dedicated FastAPI Python service deployed on Render. State persistence is managed through Neon Serverless PostgreSQL with schema migrations strictly versioned in Alembic.
            </p>

            <MermaidChart chart={ARCHITECTURE_MERMAID} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "20px" }}>
              <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Vercel Web Frontend</h4>
                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Next.js 16 App Router interface utilizing the high-contrast Carbonly design system. Durable routes (`/`, `/history`, `/review/[id]`) survive browser refreshes by pulling persisted reviews.
                </p>
              </div>

              <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Render FastAPI Service</h4>
                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Python 3.12 Web Service running Uvicorn. Implements adaptive document classification, PyMuPDF block parsing, Pillow EXIF normalization, and deterministic verification gates.
                </p>
              </div>

              <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Neon Serverless PostgreSQL</h4>
                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  Stores analysis records (`analyses`) and telemetry (`processing_events`). Uses JSONB for structured schemas. Raw uploaded file bytes are never stored to guarantee privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TWO-PASS PIPELINE (P0-P8) */}
      {activeTab === "pipeline" && (
        <div>
          <div className="card-neo" style={{ marginBottom: "24px" }}>
            <span className="badge-neo badge-neo-scope2">Pipeline Specification</span>
            <h2 style={{ margin: "10px 0 14px" }}>The Two-Pass Verified Pipeline Stages</h2>
            <p style={{ color: "var(--text-dark)", lineHeight: 1.6, fontSize: "0.92rem" }}>
              To prevent generative hallucinations and unsupported clinical leaps, Sanitas separates document processing into two distinct semantic passes with deterministic boundaries in between.
            </p>

            <MermaidChart chart={PIPELINE_FLOWCHART} />

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "24px" }}>
              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stages P0 &amp; P1: Ingestion, Validation &amp; Routing</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Validates file signature via byte magic (`filetype`, `%PDF-`). Rejects oversized files (&gt;10 MB), page overflows (&gt;15 pages), and multiple inputs. Evaluates native character density: if &ge;80% of pages contain &ge;80 printable characters, it routes to `digital_pdf` native text extraction; otherwise routes to `scanned_or_visual_pdf`.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P2: Canonical Document Construction</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Constructs the unified <code>CanonicalDocument</code> contract. Every piece of visible text is assigned an immutable segment identifier in visible reading order (<code>{"p{page_number}-s{seq_number}"}</code>).
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P3: Fact Extraction (Pass 1 - Prompt E1.1)</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Extracts documented entities (patient demographics, symptoms, diagnoses, medications, vitals, allergies, observations) with strict JSON Schema constraints. No concerns or medical opinions are synthesized in this pass.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stages P4 &amp; P5: Deterministic Validation &amp; Inconsistency Rules</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Validates evidence quotes against canonical segments with whitespace normalization. Checks for document-level factual contradictions (e.g. &quot;NKDA&quot; allergy status alongside a specific documented penicillin allergy; active and discontinued medication conflicts).
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stages P6 &amp; P7: Review Synthesis (Pass 2 - Prompt R1.0) &amp; Quality Gate</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Synthesizes report summary, document-supported clinical concerns, context-sensitive missing information, and items requiring review. The quality gate verifies all referenced entity IDs and ensures prohibited prescriptive directive language is absent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE GROUNDING */}
      {activeTab === "evidence" && (
        <div>
          <div className="card-neo" style={{ marginBottom: "24px" }}>
            <span className="badge-neo badge-neo-scope1">Grounding Mechanics</span>
            <h2 style={{ margin: "10px 0 14px" }}>Verbatim Evidence Grounding Sequence</h2>
            <p style={{ color: "var(--text-dark)", lineHeight: 1.6, fontSize: "0.92rem" }}>
              Every extracted claim and reviewer finding must link directly to verbatim evidence spans present in the original document. No paraphrased quotes or hallucinated segment references are permitted.
            </p>

            <MermaidChart chart={EVIDENCE_SEQUENCE} />

            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "18px", marginTop: "20px" }}>
              <h4 style={{ color: "var(--emerald)", marginBottom: "8px" }}>Evidence Verification Math</h4>
              <p style={{ fontSize: "0.88rem", color: "var(--text-dark)", lineHeight: 1.6 }}>
                For an extracted entity with evidence ref <code>E = (segment_id, page_number, quote)</code> and canonical document segments <code>S</code>:
              </p>
              <ul style={{ fontSize: "0.84rem", color: "var(--text-muted)", paddingLeft: "20px", marginTop: "8px" }}>
                <li><strong>Existence:</strong> A segment S exists such that S.id == E.segment_id and S.page == E.page_number</li>
                <li><strong>Verbatim Substring:</strong> normalize(E.quote) is a direct substring of normalize(S.text)</li>
                <li><strong>Integrity:</strong> Normalized comparison collapses arbitrary whitespace while strictly preserving letter casing, medical units, punctuation, and negative assertions.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RELIABILITY & ERROR TAXONOMY */}
      {activeTab === "errors" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Error Taxonomy</span>
            <h2 style={{ margin: "10px 0 14px" }}>Strictly Typed, Safe Error Responses</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "18px" }}>
              Sanitas guarantees that raw stack traces, model provider exceptions, and patient document content never cross the API boundary. All errors map to calibrated, recoverable codes.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "var(--mint-light)", borderBottom: "var(--ui-border)" }}>
                    <th style={{ textAlign: "left", padding: "10px", fontWeight: 800 }}>HTTP Status</th>
                    <th style={{ textAlign: "left", padding: "10px", fontWeight: 800 }}>Error Code</th>
                    <th style={{ textAlign: "left", padding: "10px", fontWeight: 800 }}>User Message</th>
                    <th style={{ textAlign: "left", padding: "10px", fontWeight: 800 }}>Actionable Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>400</code></td>
                    <td style={{ padding: "10px" }}><code>EMPTY_INPUT</code></td>
                    <td style={{ padding: "10px" }}>Enter a synthetic note or select a document.</td>
                    <td style={{ padding: "10px" }}>Provide non-empty text, PDF, or image.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>400</code></td>
                    <td style={{ padding: "10px" }}><code>MULTIPLE_INPUTS</code></td>
                    <td style={{ padding: "10px" }}>Provide either text or a single file, not both.</td>
                    <td style={{ padding: "10px" }}>Submit one document input per request.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>413</code></td>
                    <td style={{ padding: "10px" }}><code>FILE_TOO_LARGE</code></td>
                    <td style={{ padding: "10px" }}>File exceeds maximum size.</td>
                    <td style={{ padding: "10px" }}>Upload a file smaller than 10 MB.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>415</code></td>
                    <td style={{ padding: "10px" }}><code>UNSUPPORTED_FILE_TYPE</code></td>
                    <td style={{ padding: "10px" }}>File format not supported.</td>
                    <td style={{ padding: "10px" }}>Upload PDF, JPEG, or PNG documents.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>502</code></td>
                    <td style={{ padding: "10px" }}><code>EVIDENCE_VALIDATION_FAILED</code></td>
                    <td style={{ padding: "10px" }}>Extraction could not be verified against source.</td>
                    <td style={{ padding: "10px" }}>Resubmit or verify statements are in source.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "10px" }}><code>503</code></td>
                    <td style={{ padding: "10px" }}><code>DATABASE_UNAVAILABLE</code></td>
                    <td style={{ padding: "10px" }}>Database is currently unreachable.</td>
                    <td style={{ padding: "10px" }}>Verify database configuration or connection.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px" }}><code>504</code></td>
                    <td style={{ padding: "10px" }}><code>MODEL_TIMEOUT</code></td>
                    <td style={{ padding: "10px" }}>Upstream model processing took too long.</td>
                    <td style={{ padding: "10px" }}>Try submitting a shorter note or retrying shortly.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EVALUATION METHODOLOGY */}
      {activeTab === "evaluation" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope2">Benchmarking &amp; Rigor</span>
            <h2 style={{ margin: "10px 0 14px" }}>Evaluation Framework &amp; Integrity Principles</h2>
            <p style={{ color: "var(--text-dark)", lineHeight: 1.6, fontSize: "0.92rem" }}>
              To ensure scientific integrity, Sanitas strictly differentiates between offline structural CI test suites and live model performance benchmarks.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginTop: "20px" }}>
              <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Offline CI Test Suite</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Runs in GitHub Actions CI without API keys. Validates route handlers, MIME sniffers, Pydantic schema adherence, evidence verification gates, and database models.
                </p>
              </div>

              <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Live Benchmark Suite</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Evaluates 40 synthetic clinical documents across text, digital PDF, visual PDF, and images. Measures Precision, Recall, F1, Evidence Validity Rate, and Latency percentiles (P50/P95).
                </p>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "18px", marginTop: "20px" }}>
              <h4 style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>Primary Extraction Metrics</h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "20px", lineHeight: 1.6 }}>
                <li><strong>Precision (P):</strong> <code>True Positives / Total Extracted Entities</code></li>
                <li><strong>Recall (R):</strong> <code>True Positives / Ground Truth Entities</code></li>
                <li><strong>F1 Score:</strong> <code>2 &times; (Precision &times; Recall) / (Precision + Recall)</code></li>
                <li><strong>Evidence Validity Rate:</strong> <code>Entities with Verifiable Quotes / Total Supported Entities</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REST API REFERENCE */}
      {activeTab === "api" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">API Specification</span>
            <h2 style={{ margin: "10px 0 14px" }}>REST API Endpoint Reference</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "18px" }}>
              The Sanitas API uses standard HTTP methods, JSON/multipart bodies, and typed error responses under `/api/v1`.
            </p>

            {/* Endpoint 1 */}
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-status">POST</span>
                <code style={{ fontSize: "1rem", fontWeight: 700 }}>/api/v1/analyses</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dark)", marginBottom: "10px" }}>
                Submit a synthetic clinical document for full two-pass evidence-grounded review. Accepts either JSON (`text`) or multipart (`file`).
              </p>
              <pre className="mermaid-code" style={{ background: "#FFFFFF", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "6px" }}>
<code>{`# 1. Plain-text JSON request
curl -X POST https://sanitas-api.onrender.com/api/v1/analyses \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Patient: Jane Doe\\nComplains of acute headache."}'

# 2. File upload request (PDF or Image)
curl -X POST https://sanitas-api.onrender.com/api/v1/analyses \\
  -F "file=@clinical_scan.pdf"`}</code>
              </pre>
            </div>

            {/* Endpoint 2 */}
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-low">GET</span>
                <code style={{ fontSize: "1rem", fontWeight: 700 }}>/api/v1/analyses</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dark)", marginBottom: "10px" }}>
                List paginated previous analyses from PostgreSQL history (`limit`, `cursor`, `status`).
              </p>
              <pre className="mermaid-code" style={{ background: "#FFFFFF", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "6px" }}>
<code>{`curl https://sanitas-api.onrender.com/api/v1/analyses?limit=20`}</code>
              </pre>
            </div>

            {/* Endpoint 3 */}
            <div style={{ background: "var(--mint-light)", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-low">GET</span>
                <code style={{ fontSize: "1rem", fontWeight: 700 }}>/api/v1/analyses/{`{analysis_id}`}</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dark)", marginBottom: "10px" }}>
                Retrieve a full persisted analysis by its UUID, including canonical segments, extracted facts, and review findings.
              </p>
              <pre className="mermaid-code" style={{ background: "#FFFFFF", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "6px" }}>
<code>{`curl https://sanitas-api.onrender.com/api/v1/analyses/04253db5-927d-4ba6-8656-91e8557eb6ef`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
