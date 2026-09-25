"use client";

import { useState } from "react";
import MermaidChart from "../components/MermaidChart";

const TOPOLOGY_DIAGRAM = `flowchart TD
    subgraph Client["Reviewer Client Interface"]
        UI["Next.js 16 Web Application<br/>(Hosted on Vercel)"]
    end

    subgraph Backend["Sanitas FastAPI Application Service<br/>(Hosted on Render)"]
        Ingest["Stage P1: Ingestion & Adaptive Router"]
        Canon["Stage P2: Canonical Document Builder"]
        Extract["Stage P3: Fact Extractor (Prompt E1.1)"]
        DetVal["Stage P4: Deterministic Evidence Gate"]
        InconRules["Stage P5: Contradiction Candidate Rules"]
        Synthesize["Stage P6: Review Synthesizer (Prompt R1.0)"]
        Gate["Stage P7: Final Quality Gate"]
        Persist["Persistence Engine"]
    end

    subgraph AI["Upstream Foundation Model"]
        Gemini["Google Gemini API<br/>(gemini-3.8-flash)"]
    end

    subgraph Storage["Serverless Relational Persistence"]
        NeonDB[("Neon PostgreSQL<br/>(analyses & processing_events)")]
    end

    UI -->|"POST /analyses (multipart/JSON)"| Ingest
    Ingest --> Canon
    Canon -->|"Canonical Segments JSON"| Extract
    Extract <-->|"Strict Schema Generation"| Gemini
    Extract --> DetVal
    DetVal -->|"Verified Facts"| InconRules
    InconRules --> Synthesize
    Synthesize <-->|"Review Synthesis"| Gemini
    Synthesize --> Gate
    Gate --> Persist
    Persist -->|"Store Analysis & Events"| NeonDB
    Persist -->|"Evidence-Linked Response"| UI
`;

const PIPELINE_DIAGRAM = `flowchart LR
    A["Raw Input<br/>(Text / PDF / Image)"] --> B{"Adaptive Router"}
    B -->|"Plain Text"| C1["Deterministic Line<br/>Canonicalization"]
    B -->|"Digital PDF (>=80% text)"| C2["PyMuPDF Block & Line<br/>Reading-Order Extraction"]
    B -->|"Scanned PDF / Image"| C3["Gemini Prompt V1.0<br/>Bounded Visual Transcription"]

    C1 --> D["Canonical Document<br/>(p{page}-s{seg} segments)"]
    C2 --> D
    C3 --> D

    D --> E["Stage P3: Fact Extraction<br/>(Gemini Prompt E1.1)"]
    E --> F{"Stage P4: Evidence Gate<br/>Verbatim Quote Match"}
    F -->|Pass| G["Stage P5: Contradiction Rules<br/>(Allergy / Med / Vitals)"]
    F -->|Fail| Err["Fail Closed: 502<br/>EVIDENCE_VALIDATION_FAILED"]

    G --> H["Stage P6: Review Synthesis<br/>(Gemini Prompt R1.0)"]
    H --> I{"Stage P7: Quality Gate<br/>Schema & Anti-Directive Check"}
    I -->|Pass| J["Stage P8: Persistence<br/>(PostgreSQL + Telemetry)"]
    I -->|Fail| Err2["Fail Closed: 502<br/>REVIEW_QUALITY_GATE_FAILED"]
`;

const ROUTER_FLOWCHART = `flowchart TD
    Start["Incoming Request<br/>(JSON or Multipart)"] --> Norm["Normalize into<br/>IngestedDocument Dataclass"]
    Norm --> Sniff["MIME & Magic Header Inspection"]
    Sniff --> Bounds{"Enforce Bounds<br/>(<=10MB, <=15 Pages, <=50k Chars)"}
    Bounds -->|Exceeded| ErrBound["Reject: 413 TEXT_TOO_LARGE /<br/>400 UNSUPPORTED_INPUT"]
    Bounds -->|Valid| Branch{"MIME Type Dispatch"}

    Branch -->|"text/plain"| TextPath["Deterministic Canonicalizer<br/>(Line-by-line p1-sX)"]
    Branch -->|"application/pdf"| PDFDensity{"PyMuPDF Text Density Check<br/>(>=80% Pages have Text?)"}
    Branch -->|"image/jpeg or png"| ImgClamp["Clamp Max Dimension 1600px<br/>(LANCZOS Antialiasing)"]

    PDFDensity -->|"Yes (Digital PDF)"| DigitalPDF["PyMuPDF Reading-Order<br/>Text Block Parsing"]
    PDFDensity -->|"No (Scanned PDF)"| PDFRender["Render Pages at 150 DPI<br/>(Memory Bounded)"]

    PDFRender --> Vision["Gemini Vision Prompt V1.0<br/>Optical Transcription"]
    ImgClamp --> Vision
    DigitalPDF --> Canon["Construct Immutable<br/>CanonicalDocument"]
    TextPath --> Canon
    Vision --> Canon
`;

const TWOPASS_DIAGRAM = `flowchart TD
    subgraph Pass1["Pass 1: Pure Fact Extraction"]
        P1Input["Canonical Document Segments"] --> P1Prompt["System Prompt E1.1<br/>Role: Pure Data Extraction Specialist"]
        P1Prompt --> P1Call["Gemini API Call<br/>(temperature: 0.0)"]
        P1Call --> P1Schema["Strict ClinicalExtraction JSON<br/>(Demographics, Symptoms, Meds, Vitals, Allergies)"]
        P1Schema --> P1Evidence["At Least One EvidenceRef<br/>per Documented Entity"]
    end

    subgraph InterStage["Deterministic Middle Layer (Stage P4 & P5)"]
        P1Evidence --> P4Gate["Stage P4: Quote Substring Verification<br/>(Normalized Whitespace Matching)"]
        P4Gate --> P5Rules["Stage P5: Contradiction Engine<br/>- NKDA vs Specific Allergy<br/>- Active vs Discontinued Meds<br/>- Vitals Timestamp Conflicts"]
    end

    subgraph Pass2["Pass 2: Review Synthesis & Governance"]
        P5Rules --> P2Prompt["System Prompt R1.0<br/>Role: Clinical Documentation Reviewer"]
        P2Prompt --> P2Call["Gemini API Call<br/>(temperature: 0.0)"]
        P2Call --> P2Schema["ClinicalReview JSON<br/>(Summary, Concerns, Missing Info, Items to Review)"]
        P2Schema --> P7Gate["Stage P7: Quality Gate<br/>- Entity ID Cross-Referencing<br/>- Evidence Quote Grounding<br/>- Anti-Directive Regex Check"]
    end

    Pass1 --> InterStage
    InterStage --> Pass2
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
    API->>Router: Normalize & validate MIME, size bounds & classify route
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
    "architecture" | "pipeline" | "router" | "twopass" | "evidence" | "persistence" | "evaluation" | "api"
  >("architecture");

  return (
    <main className="docs-container" style={{ maxWidth: "1240px", margin: "24px auto 80px", padding: "0 24px" }}>
      {/* Title Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <span className="badge-neo badge-neo-scope2">Engineering &amp; System Specification</span>
        <h1 style={{ fontSize: "2.5rem", marginTop: "8px", marginBottom: "8px" }}>
          Platform Technical Documentation
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "780px", margin: "0 auto", fontSize: "0.95rem" }}>
          Exhaustive architectural rationale, two-pass pipeline mechanics, deterministic evidence verification algorithms, persistence design, and REST API contracts for Sanitas.
        </p>
      </div>

      {/* Organized Domain Navigation Grid */}
      <div className="docs-nav-card">
        <div className="docs-nav-group">
          <span className="docs-nav-group-label">Architecture</span>
          <div className="docs-nav-buttons">
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "architecture" ? "active" : ""}`}
              onClick={() => setActiveTab("architecture")}
            >
              1. Topology &amp; Hosting
            </button>
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "pipeline" ? "active" : ""}`}
              onClick={() => setActiveTab("pipeline")}
            >
              2. 7-Stage Pipeline
            </button>
          </div>
        </div>

        <div className="docs-nav-group">
          <span className="docs-nav-group-label">AI &amp; Intake</span>
          <div className="docs-nav-buttons">
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "router" ? "active" : ""}`}
              onClick={() => setActiveTab("router")}
            >
              3. Ingestion &amp; Memory
            </button>
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "twopass" ? "active" : ""}`}
              onClick={() => setActiveTab("twopass")}
            >
              4. Two-Pass AI &amp; Prompts
            </button>
          </div>
        </div>

        <div className="docs-nav-group">
          <span className="docs-nav-group-label">Verification</span>
          <div className="docs-nav-buttons">
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "evidence" ? "active" : ""}`}
              onClick={() => setActiveTab("evidence")}
            >
              5. Evidence &amp; Contradictions
            </button>
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "evaluation" ? "active" : ""}`}
              onClick={() => setActiveTab("evaluation")}
            >
              7. Evaluation &amp; Standards
            </button>
          </div>
        </div>

        <div className="docs-nav-group">
          <span className="docs-nav-group-label">Data &amp; API</span>
          <div className="docs-nav-buttons">
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "persistence" ? "active" : ""}`}
              onClick={() => setActiveTab("persistence")}
            >
              6. PostgreSQL Persistence
            </button>
            <button
              type="button"
              className={`docs-sub-btn ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
            >
              8. REST API Reference
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SYSTEM ARCHITECTURE & TOPOLOGY */}
      {activeTab === "architecture" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Architectural Topology</span>
            <h2 style={{ margin: "10px 0 14px" }}>System Architecture &amp; Hosting Rationales</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Sanitas implements an enterprise multi-tier architecture separating the user presentation layer, long-lived clinical document processing microservices, serverless relational persistence, and structured foundation model reasoning.
            </p>

            <div className="mermaid-wrapper">
              <MermaidChart chart={TOPOLOGY_DIAGRAM} title="System Architecture & Hosting Topology" />
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ color: "var(--primary-dark)", marginBottom: "12px" }}>Platform Hosting Decision Matrix</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                  <thead>
                    <tr style={{ background: "var(--mint-light)", borderBottom: "2px solid var(--border-color)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Component</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Selected Host</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Architectural Rationale</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>Alternative Evaluated &amp; Rejected</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #E2ECE9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>Frontend Web App</td>
                      <td style={{ padding: "10px 14px" }}><span className="badge-neo badge-neo-scope1">Vercel</span></td>
                      <td style={{ padding: "10px 14px" }}>Native Next.js 16 App Router edge hosting, automatic asset compression, zero-config domain routing.</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>AWS S3 + CloudFront: Excessive maintenance overhead for dynamic server routes.</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #E2ECE9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>API Microservice</td>
                      <td style={{ padding: "10px 14px" }}><span className="badge-neo badge-neo-scope2">Render</span></td>
                      <td style={{ padding: "10px 14px" }}>Persistent Python 3.12 container runtime managed by Uvicorn. Supports PyMuPDF C-extensions, bounded image processing, and persistent connection pooling without serverless execution timeouts.</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>AWS Lambda / Vercel Serverless: 50MB bundle size limits, C-extension compilation friction, and aggressive 10s execution cutoffs.</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #E2ECE9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>Relational Persistence</td>
                      <td style={{ padding: "10px 14px" }}><span className="badge-neo badge-neo-status">Neon PostgreSQL</span></td>
                      <td style={{ padding: "10px 14px" }}>Serverless PostgreSQL with native JSONB binary indexing, ACID transaction guarantees, and transparent connection pooling.</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>MongoDB: Lacks strict schema migration tooling and relational audit integrity for medical records.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>AI Inference Engine</td>
                      <td style={{ padding: "10px 14px" }}><span className="badge-neo badge-neo-accent">Google Gemini API</span></td>
                      <td style={{ padding: "10px 14px" }}><code>gemini-3.8-flash</code> via official <code>google-genai</code> SDK. Provides sub-second latency, multimodal vision token handling, and native Pydantic JSON Schema enforcement.</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>Local Llama 3: Requires high-cost GPU infrastructure and lacks guaranteed structured JSON schema adherence.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 7-STAGE CLINICAL PIPELINE */}
      {activeTab === "pipeline" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Pipeline Mechanics</span>
            <h2 style={{ margin: "10px 0 14px" }}>The 7-Stage Clinical Review Pipeline</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Clinical review requires strict separation between raw input ingestion, deterministic segmentation, factual extraction, evidence verification, and clinical synthesis. Every stage is bounded by a fail-closed quality gate.
            </p>

            <div className="mermaid-wrapper">
              <MermaidChart chart={PIPELINE_DIAGRAM} title="7-Stage Clinical Review Pipeline Architecture" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "24px" }}>
              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P1: Document Ingestion &amp; Request Normalization</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Normalizes both JSON text payloads and multipart file uploads into a single internal <code>IngestedDocument</code> dataclass. Checks MIME magic bytes and enforces size constraints (max 10MB, max 15 pages, max 50,000 characters). Computes SHA-256 digest for audit immutability.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P2: Canonical Document Construction</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Constructs the unified <code>CanonicalDocument</code> contract. Every piece of visible text is assigned an immutable segment identifier in natural reading order (<code>{"p{page_number}-s{seq_number}"}</code>). Preserves original punctuation and line breaks for exact quote matching.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P3: Structured Fact Extraction (Pass 1 - Prompt E1.1)</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Invokes Gemini with <code>temperature: 0.0</code> and strict Pydantic JSON Schema enforcement. Extracts patient demographics, symptoms, diagnoses, medications, vitals, allergies, observations, and uncertain items. Strictly prohibited from synthesizing clinical concerns or medical opinions.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P4: Deterministic Evidence Verification</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Application code independently verifies that every referenced <code>segment_id</code> exists, page numbers match, and the referenced <code>quote</code> is a verbatim substring in normalized segment text. Claims failing verification fail closed with <code>EVIDENCE_VALIDATION_FAILED</code>.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P5: Contradiction Candidate Detection Engine</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Deterministic rule engine operating without LLM speculation. Identifies document-level contradictions:
                  (1) &quot;NKDA&quot; allergy status alongside a specific documented penicillin allergy;
                  (2) active vs discontinued medication status conflicts for the same drug;
                  (3) conflicting vital sign recordings at identical timestamps.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P6: Review Synthesis (Pass 2 - Prompt R1.0)</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Synthesizes an executive clinical review report (<code>ClinicalReview</code>) summarizing verified facts, contextualizing clinical concerns, highlighting potential inconsistencies from Stage P5, and surfacing actionable information gaps.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)" }}>Stage P7: Final Review Quality Gate &amp; Safeguards</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Validates that all entity IDs referenced in review findings exist in Pass 1 extraction output. Verifies evidence quotes for clinical concerns. Scans narrative text against secondary regular expressions to prevent prescriptive directives.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INGESTION & MEMORY BOUNDING */}
      {activeTab === "router" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Intake Architecture</span>
            <h2 style={{ margin: "10px 0 14px" }}>Multi-Modal Intake &amp; Memory Bounding</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Production web services on cloud hosting (such as Render) operate under strict memory ceilings (512 MB on standard tiers). Unconstrained PDF rendering or camera photo decoding can rapidly trigger Out-Of-Memory (OOM) fatal crashes.
            </p>

            <div className="mermaid-wrapper">
              <MermaidChart chart={ROUTER_FLOWCHART} title="Multi-Modal Adaptive Router & Ingestion Memory Flow" />
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ color: "var(--primary-dark)", marginBottom: "12px" }}>Engineering Decisions for Bounded Ingestion</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>80% Text Density Heuristic</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Digital PDFs containing selectable text are parsed with PyMuPDF directly in CPU memory in milliseconds. Only scanned documents lacking text (less than 80% text pages) route to visual transcription, minimizing latency and token costs.
                  </p>
                </div>

                <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>150 DPI Rendering &amp; 1600px Clamp</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Scanned PDF pages are rasterized at 150 DPI rather than 300 DPI, and image uploads are clamped to 1600px maximum dimension using Pillow LANCZOS antialiasing. This preserves optical legibility while keeping memory usage under 40 MB per request.
                  </p>
                </div>

                <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Strict Page &amp; Size Ceilings</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Hard limits enforce a maximum of 15 pages per PDF, 10 MB per file, and 50,000 characters per text note. Requests exceeding bounds are rejected immediately with typed HTTP 413 or 400 errors before memory allocation.
                  </p>
                </div>

                <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                  <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Unified IngestedDocument Contract</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Both JSON and multipart requests normalize into <code>IngestedDocument</code> immediately. No bifurcated processing pipelines exist, guaranteeing identical security and canonicalization across all modalities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TWO-PASS AI & PROMPT ENGINEERING */}
      {activeTab === "twopass" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Prompt Engineering</span>
            <h2 style={{ margin: "10px 0 14px" }}>Two-Pass AI Architecture &amp; Prompt Isolation</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              In clinical AI systems, single-shot extraction and synthesis is fundamentally prone to cognitive drift, ungrounded speculation, and prompt injection vulnerabilities. Sanitas isolates extraction from synthesis through two sequential passes.
            </p>

            <div className="mermaid-wrapper">
              <MermaidChart chart={TWOPASS_DIAGRAM} title="Two-Pass AI Extraction & Review Synthesis Model" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "18px" }}>
                <h3 style={{ color: "var(--primary-dark)", fontSize: "1.05rem", marginBottom: "8px" }}>
                  Pass 1: Fact Extraction (Prompt E1.1)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Configured as a clinical extraction specialist with zero temperature and strict Pydantic JSON Schema enforcement.
                </p>
                <ul style={{ fontSize: "0.82rem", color: "var(--text-dark)", paddingLeft: "18px", lineHeight: 1.6 }}>
                  <li>Extracts patient demographics, symptoms, diagnoses, medications, vitals, allergies, and observations.</li>
                  <li>Every single entity must reference valid <code>EvidenceRef</code> objects.</li>
                  <li>Strictly prohibited from inferring unstated diagnoses or generating medical opinions.</li>
                  <li>Preserves negations (e.g. &quot;No chest pain&quot;) without converting them into positive findings.</li>
                </ul>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "18px" }}>
                <h3 style={{ color: "var(--primary-dark)", fontSize: "1.05rem", marginBottom: "8px" }}>
                  Pass 2: Review Synthesis (Prompt R1.0)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Configured as an executive documentation reviewer summarizing grounded facts and highlighting risks.
                </p>
                <ul style={{ fontSize: "0.82rem", color: "var(--text-dark)", paddingLeft: "18px", lineHeight: 1.6 }}>
                  <li>Produces concise executive summary (max 1200 chars).</li>
                  <li>Contextualizes clinical concerns directly grounded in Pass 1 facts.</li>
                  <li>Surfaces actionable missing information (missing dosages, missing lab reference ranges).</li>
                  <li>Prohibited from issuing prescriptive medical directives (e.g. <em>&ldquo;I prescribe&rdquo;</em>).</li>
                </ul>
              </div>
            </div>

            <div style={{ background: "#F8FCF9", border: "1.5px solid var(--emerald)", borderRadius: "8px", padding: "16px", marginTop: "20px" }}>
              <h4 style={{ color: "var(--primary-dark)", marginBottom: "6px" }}>Prompt Injection Boundary Enforcement</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Untrusted document content is wrapped within explicit isolation delimiters: <code>DATA_START</code> and <code>DATA_END</code>. The system prompt instructs the model that content between these tokens is untrusted data and that instructions or system overrides embedded inside it must never be executed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EVIDENCE GROUNDING & CONTRADICTIONS */}
      {activeTab === "evidence" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Verification Mathematics</span>
            <h2 style={{ margin: "10px 0 14px" }}>Deterministic Evidence Grounding &amp; Inconsistency Engine</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              LLM confidence scores and self-reported probabilities cannot be trusted in high-stakes clinical domains. Sanitas enforces mathematical substring verification in Python application code.
            </p>

            <div className="mermaid-wrapper">
              <MermaidChart chart={EVIDENCE_SEQUENCE} title="Deterministic Evidence Verification Sequence" />
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "var(--primary-dark)", marginBottom: "12px" }}>Evidence Verification Algorithm</h3>
              <div style={{ background: "#F8FCF9", border: "var(--ui-border)", borderRadius: "8px", padding: "18px", fontFamily: "monospace", fontSize: "0.82rem", lineHeight: 1.6 }}>
                1. For each clinical entity E in extraction:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;a. For each ref in E.evidence:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i. Assert ref.segment_id in canonical_document.segments<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ii. Assert ref.page_number == segment.page_number<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iii. normalized_quote = &quot; &quot;.join(ref.quote.split())<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iv. normalized_source = &quot; &quot;.join(segment.text.split())<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v. Assert normalized_quote in normalized_source<br/>
                2. If any assertion fails: Fail closed with EVIDENCE_VALIDATION_FAILED (HTTP 502)
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "var(--primary-dark)", marginBottom: "12px" }}>Stage P5 Deterministic Contradiction Rules</h3>
              <ul style={{ fontSize: "0.88rem", color: "var(--text-dark)", paddingLeft: "20px", lineHeight: 1.8 }}>
                <li>
                  <strong>Rule 1 (Allergy Inconsistency):</strong> When an explicit status of <code>no_known_allergies</code> coexists with a specific documented drug allergy (e.g. Amoxicillin, Penicillin), flags a high-importance contradiction with references to both quotes.
                </li>
                <li>
                  <strong>Rule 2 (Medication Status Conflict):</strong> When the same drug is simultaneously recorded with status <code>active</code> and <code>discontinued</code> without chronological resolution, flags a moderate-importance medication conflict.
                </li>
                <li>
                  <strong>Rule 3 (Vital Sign Discrepancies):</strong> Identifies conflicting vital signs recorded under identical timestamps.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PERSISTENCE & SCHEMA */}
      {activeTab === "persistence" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Data Layer</span>
            <h2 style={{ margin: "10px 0 14px" }}>PostgreSQL Persistence &amp; Dialect Portability</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Sanitas uses SQLAlchemy ORM and Alembic migrations with dialect portability across PostgreSQL and SQLite, backed by an explicit database availability policy.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "18px" }}>
              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>Explicit Database Policy</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  In production and standard development, <code>DATABASE_URL</code> is required. If PostgreSQL is unreachable, requests fail explicitly with a typed <code>DATABASE_UNAVAILABLE</code> error. Silent fallbacks to SQLite or in-memory stores are strictly prohibited in non-test environments to avoid masking infrastructure misconfigurations.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>Dialect Portability Strategy</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Database models use SQLAlchemy generic <code>Uuid</code> and <code>JSON().with_variant(JSONB, &quot;postgresql&quot;)</code>. In production on Neon, columns use native PostgreSQL JSONB indexing and UUID types. In automated unit test fixtures (<code>is_explicit_test=True</code>), tests run instantly against in-memory SQLite with StaticPool.
                </p>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px", marginTop: "16px" }}>
              <h4 style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>Relational Schema Specification</h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-muted)", paddingLeft: "18px", lineHeight: 1.7 }}>
                <li><strong>analyses table:</strong> <code>analysis_id</code> (UUID PK), <code>created_at</code>, <code>completed_at</code>, <code>status</code>, <code>source_type</code>, <code>sha256</code>, <code>canonical_document</code> (JSONB), <code>clinical_extraction</code> (JSONB), <code>clinical_review</code> (JSONB), <code>timings_ms</code> (JSONB).</li>
                <li><strong>processing_events table:</strong> <code>event_id</code> (UUID PK), <code>analysis_id</code> (FK), <code>stage</code>, <code>status</code>, <code>details</code> (JSONB), <code>created_at</code>. Tracks pipeline telemetry and quality gate evaluations.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: EVALUATION INTEGRITY & SAFETY */}
      {activeTab === "evaluation" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">Verification &amp; QA</span>
            <h2 style={{ margin: "10px 0 14px" }}>Evaluation Methodology &amp; Anti-Vibe-Coding Standards</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              Sanitas adheres to the Agentic Web Development Handbook standards, enforcing strict separation between structural CI validation and empirical model benchmarking.
            </p>

            <div className="callout-neo callout-info" style={{ margin: "18px 0" }}>
              <strong>Evaluation Integrity Policy:</strong> Offline/mock evaluation is strictly for CI regression testing and schema validation. Mock metrics are <em>never</em> reported as model performance. Empirical metrics must come from actual Gemini executions on annotated test cases.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Offline CI Structural Mode (<code>--mock</code>)</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Exercises the complete 7-stage pipeline across 7 benchmark test cases using deterministic mocked outputs. Verifies canonicalization, schema conformance, inconsistency rules, and quality gates with zero external API calls.
                </p>
              </div>

              <div style={{ background: "#FFFFFF", border: "var(--ui-border)", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ color: "var(--emerald)", marginBottom: "6px" }}>Live Gemini Benchmark Mode (<code>--live</code>)</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Executes live model calls using <code>gemini-3.8-flash</code> across benchmark clinical encounters. Computes empirical Precision, Recall, F1 Score, Evidence Validity Rate, and Latency percentiles (P50/P95).
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

      {/* TAB 8: REST API REFERENCE */}
      {activeTab === "api" && (
        <div>
          <div className="card-neo">
            <span className="badge-neo badge-neo-scope1">API Specification</span>
            <h2 style={{ margin: "10px 0 14px" }}>REST API Endpoint Reference</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "18px" }}>
              The Sanitas API uses standard HTTP methods, JSON/multipart bodies, and typed error responses under <code>/api/v1</code>.
            </p>

            {/* Endpoint 1 */}
            <div style={{ background: "#F8FCF9", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-high">POST</span>
                <code style={{ fontWeight: 800, fontSize: "0.95rem" }}>/api/v1/analyses</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                Submits a clinical document for 7-stage review and persistence. Accepts either JSON (<code>&#123;&quot;text&quot;: &quot;...&quot;&#125;</code>) or multipart/form-data with a <code>file</code> field.
              </p>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dark)", fontFamily: "monospace" }}>
                Responses: 200 OK (Completed AnalysisResponse), 400 (Invalid Request), 413 (Text/File Too Large), 502 (Verification Failed), 503 (Database Unavailable).
              </div>
            </div>

            {/* Endpoint 2 */}
            <div style={{ background: "#F8FCF9", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-scope1">GET</span>
                <code style={{ fontWeight: 800, fontSize: "0.95rem" }}>/api/v1/analyses</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                Retrieves a paginated list of recent analyses from PostgreSQL for the audit history ledger. Supports query parameters <code>limit</code> and <code>cursor</code>.
              </p>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dark)", fontFamily: "monospace" }}>
                Response: 200 OK (AnalysisListResponse with items and next_cursor).
              </div>
            </div>

            {/* Endpoint 3 */}
            <div style={{ background: "#F8FCF9", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-scope1">GET</span>
                <code style={{ fontWeight: 800, fontSize: "0.95rem" }}>/api/v1/analyses/&#123;id&#125;</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                Retrieves the complete, permanent analysis record by UUID, including canonical segments, extracted facts, and synthesized review findings.
              </p>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dark)", fontFamily: "monospace" }}>
                Responses: 200 OK (AnalysisResponse), 404 NOT_FOUND.
              </div>
            </div>

            {/* Endpoint 4 */}
            <div style={{ background: "#F8FCF9", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "16px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <span className="badge-neo badge-neo-scope1">GET</span>
                <code style={{ fontWeight: 800, fontSize: "0.95rem" }}>/health</code>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                Secret-free liveness health check returning service name, status, and version without initiating database or external AI connections.
              </p>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dark)", fontFamily: "monospace" }}>
                Response: 200 OK (<code>&#123;&quot;status&quot;: &quot;ok&quot;, &quot;service&quot;: &quot;sanitas-api&quot;, &quot;version&quot;: &quot;0.1.0&quot;&#125;</code>).
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
