"use client";

import Link from "next/link";
import {
  IconFileText,
  IconShieldCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconSparkles,
} from "./components/Icons";

const SAMPLE_CASES = [
  {
    id: "ambulatory",
    title: "Elena Rostova",
    demographics: "54yo Female • MRN SYN-88421",
    category: "Ambulatory Review",
    badgeType: "badge-neo-scope1",
    summary: "Type 2 Diabetes follow-up, Metformin therapy, and recent Lisinopril cessation review.",
    focalPoint: "Validates: Active vs discontinued medications",
  },
  {
    id: "allergy_conflict",
    title: "Marcus Vance",
    demographics: "42yo Male • Urgent Care",
    category: "Allergy Inconsistency",
    badgeType: "badge-neo-high",
    summary: "Intake header specifies NKDA, but emergency narrative documents acute reaction to Amoxicillin.",
    focalPoint: "Validates: Cross-record allergy contradiction",
  },
  {
    id: "medication_conflict",
    title: "Sarah Jenkins",
    demographics: "61yo Female • Discharge",
    category: "Medication Conflict",
    badgeType: "badge-neo-high",
    summary: "Active problem list notes daily Lisinopril, yet discharge orders mandate immediate cessation.",
    focalPoint: "Validates: Active vs discontinued discrepancy",
  },
  {
    id: "acute_abdomen",
    title: "David Miller",
    demographics: "29yo Male • Emergency Dept",
    category: "Emergency Triage",
    badgeType: "badge-neo-scope2",
    summary: "14-hour severe RLQ abdominal pain, positive McBurney sign, rebound tenderness, WBC 14.8k.",
    focalPoint: "Validates: Urgent triage & surgical consult",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* Centered Minimal Hero - Full Viewport Coverage */}
      <section className="hero-centered">
        <div style={{ marginBottom: "20px" }}>
          <span
            className="badge-neo badge-neo-scope2"
            style={{ fontSize: "0.82rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span className="status-live-dot" style={{ width: "7px", height: "7px" }} />
            Clinical Document Intelligence
          </span>
        </div>

        <h1 className="hero-title">
          Audit-Ready AI Clinical Review Grounded in{" "}
          <span className="hero-highlight">Verifiable Evidence.</span>
        </h1>

        <p className="hero-subtitle">
          Extract structured medical entities, detect clinical contradictions across records,
          and verify every claim against verbatim source lines.
        </p>

        {/* Minimal CTAs */}
        <div className="hero-cta-group">
          <Link href="/workbench" className="btn-neo btn-neo-primary hero-btn-main">
            Launch Workbench <IconArrowRight size={20} />
          </Link>
          <Link href="/docs" className="btn-neo btn-neo-secondary hero-btn-sub">
            View Documentation
          </Link>
        </div>

        {/* Trust & Grounding Bar */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <IconShieldCheck size={18} color="var(--emerald)" />
            <span>Deterministic Evidence Quotes</span>
          </div>
          <div className="trust-item">
            <IconCheck size={18} color="var(--emerald)" />
            <span>Zero Hallucination Tolerance</span>
          </div>
          <div className="trust-item">
            <IconSparkles size={18} color="var(--emerald)" />
            <span>Schema Enforced Gemini 2.5</span>
          </div>
        </div>
      </section>

      {/* 3 Core Capability Pillars - Clean Vector Icons (Flaticon Style) */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "16px 24px 48px" }}>
        <div className="features-grid-minimal">
          <div className="card-neo pillar-card">
            <div className="pillar-icon-box">
              <IconFileText size={24} color="var(--primary-dark)" />
            </div>
            <h3 className="pillar-title">Structured Fact Extraction</h3>
            <p className="pillar-desc">
              Schema-enforced extraction of demographics, symptoms, diagnoses, medications, vitals, and documented allergies.
            </p>
          </div>

          <div className="card-neo pillar-card">
            <div className="pillar-icon-box">
              <IconShieldCheck size={24} color="var(--primary-dark)" />
            </div>
            <h3 className="pillar-title">Deterministic Evidence Gate</h3>
            <p className="pillar-desc">
              Mathematical quote substring matching against immutable source text. Every finding links to verifiable evidence.
            </p>
          </div>

          <div className="card-neo pillar-card">
            <div className="pillar-icon-box">
              <IconAlertTriangle size={24} color="var(--primary-dark)" />
            </div>
            <h3 className="pillar-title">Contradiction Detection</h3>
            <p className="pillar-desc">
              Rule-based identification of allergy conflicts, medication status discrepancies, and documentation inconsistencies.
            </p>
          </div>
        </div>
      </section>

      {/* Sample Cases - Clean Interactive Grid */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 24px 44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge-neo badge-neo-scope2" style={{ fontSize: "0.72rem" }}>Interactive Test Suite</span>
            </div>
            <h2 style={{ fontSize: "1.75rem", margin: "0 0 4px" }}>Sample Clinical Encounters</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Select a pre-configured clinical scenario to inspect findings and evidence verification in the Workbench.
            </p>
          </div>
          <Link href="/workbench" className="btn-neo btn-neo-sm btn-neo-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span>Open Blank Workbench</span>
            <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="sample-cases-grid">
          {SAMPLE_CASES.map((sc) => (
            <Link
              key={sc.id}
              href={`/workbench?case=${sc.id}`}
              className="card-neo sample-case-card"
              style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className={`badge-neo ${sc.badgeType}`} style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                    {sc.category}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
                    {sc.demographics}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", margin: "0 0 6px", color: "var(--primary-dark)" }}>{sc.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.45 }}>
                  {sc.summary}
                </p>
              </div>
              <div style={{ borderTop: "1px solid #E2ECE9", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--emerald)" }}>
                  {sc.focalPoint}
                </span>
                <IconArrowRight size={14} color="var(--emerald)" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Deterministic Evidence Verification Deep Dive Section */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px 48px" }}>
        <div className="evidence-verification-showcase">
          <div style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 28px" }}>
            <span className="badge-neo badge-neo-scope1" style={{ fontSize: "0.76rem", marginBottom: "8px" }}>
              Deterministic Safety Standard
            </span>
            <h2 style={{ fontSize: "1.85rem", margin: "8px 0 10px", color: "var(--primary-dark)" }}>
              How Sanitas Eliminates Clinical AI Hallucinations
            </h2>
            <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              Conventional LLM reviewers summarize and rephrase medical notes, introducing subtle hallucinations. Sanitas enforces mathematical substring matching: every extracted entity and clinical concern must bind to verbatim source text lines, or the pipeline fail-closes.
            </p>
          </div>

          <div className="evidence-split-demo">
            <div className="evidence-demo-box">
              <div className="evidence-demo-header" style={{ color: "var(--primary-dark)" }}>
                <IconFileText size={16} color="var(--primary-dark)" />
                <span>1. Immutable Source Segment (Canonical Ground Truth)</span>
              </div>
              <div className="evidence-quote-snippet">
                “Intake record lists NKDA, but emergency narrative documents acute reaction to Amoxicillin 500mg oral capsule prescribed by dentist.”
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Segment ID: <code>p1-s4</code></span>
                <span>Page: 1 • Deterministic MD5 Line Hash</span>
              </div>
            </div>

            <div className="evidence-demo-box" style={{ background: "#F8FCF9", borderColor: "var(--emerald)" }}>
              <div className="evidence-demo-header" style={{ color: "var(--emerald)" }}>
                <IconShieldCheck size={16} color="var(--emerald)" />
                <span>2. Mathematical Evidence Verification Result</span>
              </div>
              <div style={{ background: "#FFFFFF", border: "1.5px solid var(--emerald)", borderRadius: "6px", padding: "10px 12px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "0.85rem", color: "#8B0000" }}>Allergy Documentation Conflict</strong>
                  <span className="badge-neo badge-neo-high" style={{ fontSize: "0.68rem" }}>High Severity</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dark)", lineHeight: 1.4 }}>
                  Intake record claims NKDA, contradicted by acute penicillin reaction in narrative.
                </div>
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--emerald)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                <IconCheck size={14} color="var(--emerald)" />
                <span>100% Verbatim Substring Match Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Documentation & Architecture Showcase */}
      <section style={{ maxWidth: "1120px", margin: "0 auto 64px", padding: "0 24px" }}>
        <div
          className="card-neo"
          style={{
            padding: "36px 36px",
            background: "#FFFFFF",
            borderLeft: "8px solid var(--emerald)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ maxWidth: "700px" }}>
              <span className="badge-neo badge-neo-scope2" style={{ fontSize: "0.74rem", marginBottom: "8px" }}>
                Architectural Disclosure
              </span>
              <h3 style={{ fontSize: "1.5rem", margin: "8px 0 8px", color: "var(--primary-dark)" }}>
                Deep Architecture, System Schemas &amp; Verification Math
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                Explore the 7-stage pipeline mechanics, bounded memory consumption safeguards, multi-modal router decision trees, and 5 interactive SVG Mermaid diagrams with full zoom and inspection controls.
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge-neo" style={{ fontSize: "0.72rem" }}>
                  7-Stage Pipeline Loop
                </span>
                <span className="badge-neo" style={{ fontSize: "0.72rem" }}>
                  Two-Pass Gemini AI
                </span>
                <span className="badge-neo" style={{ fontSize: "0.72rem" }}>
                  Stage P5 Inconsistency Rules
                </span>
                <span className="badge-neo" style={{ fontSize: "0.72rem" }}>
                  Stage P7 Safety Quality Gate
                </span>
              </div>
            </div>

            <div style={{ alignSelf: "center" }}>
              <Link href="/docs" className="btn-neo btn-neo-primary" style={{ fontWeight: 800, padding: "14px 24px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span>Explore Full Documentation</span>
                <IconArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
