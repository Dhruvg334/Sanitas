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
    category: "Ambulatory Review",
    badgeType: "badge-neo-scope1",
    summary: "54yo female with Type 2 Diabetes, Metformin therapy, and recent Lisinopril cessation.",
  },
  {
    id: "allergy_conflict",
    title: "Marcus Vance",
    category: "Allergy Conflict",
    badgeType: "badge-neo-high",
    summary: "Intake record lists NKDA, but emergency narrative documents acute reaction to Amoxicillin.",
  },
  {
    id: "medication_conflict",
    title: "Sarah Jenkins",
    category: "Medication Conflict",
    badgeType: "badge-neo-high",
    summary: "Active problem list notes daily Lisinopril, while discharge orders mandate immediate cessation.",
  },
  {
    id: "acute_abdomen",
    title: "David Miller",
    category: "Emergency Triage",
    badgeType: "badge-neo-scope2",
    summary: "29yo male presenting with 14-hour RLQ abdominal pain, positive McBurney sign, and WBC 14.8k.",
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
      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", margin: "0 0 4px" }}>Sample Clinical Encounters</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
              Select a pre-configured encounter to analyze in the Workbench.
            </p>
          </div>
          <Link href="/workbench" className="btn-neo btn-neo-xs btn-neo-secondary">
            Open Blank Workbench &rarr;
          </Link>
        </div>

        <div className="sample-cases-grid">
          {SAMPLE_CASES.map((sc) => (
            <Link
              key={sc.id}
              href={`/workbench?case=${sc.id}`}
              className="card-neo sample-case-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span className={`badge-neo ${sc.badgeType}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  {sc.category}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--emerald)", fontWeight: 800 }}>&rarr;</span>
              </div>
              <h3 style={{ fontSize: "1.1rem", margin: "0 0 6px", color: "var(--primary-dark)" }}>{sc.title}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
                {sc.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Minimal Documentation Callout */}
      <section style={{ maxWidth: "1080px", margin: "0 auto 64px", padding: "0 24px" }}>
        <div className="card-neo" style={{ padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "#FFFFFF" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 4px", color: "var(--primary-dark)" }}>
              Need deep technical architecture &amp; API schemas?
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Explore the 7-stage pipeline mechanics, deterministic evidence verification math, and REST API contracts.
            </p>
          </div>
          <Link href="/docs" className="btn-neo btn-neo-sm btn-neo-primary">
            Explore Documentation &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
