"use client";

import Link from "next/link";

const BENCHMARK_CASES = [
  {
    id: "ambulatory",
    title: "Elena Rostova",
    badge: "Ambulatory Encounter",
    badgeType: "badge-neo-scope1",
    scenario: "54yo female presenting with acute bilateral throbbing headache. Evaluates Type 2 Diabetes, Metformin therapy, and recent Lisinopril discontinuation.",
    highlights: ["Type 2 Diabetes Mellitus", "Metformin 1000mg BID", "Discontinued Lisinopril", "Vitals Normal"],
  },
  {
    id: "allergy_conflict",
    title: "Marcus Vance",
    badge: "Allergy Inconsistency",
    badgeType: "badge-neo-high",
    scenario: "42yo male urgent care encounter. Intake sheet documents NKDA, yet clinical narrative reports acute anaphylactoid reaction to Amoxicillin capsule.",
    highlights: ["NKDA in Header vs Amoxicillin Allergy", "Facial Angioedema", "IM Diphenhydramine & IV Decadron", "Deterministic Rule P5 Trigger"],
  },
  {
    id: "medication_conflict",
    title: "Sarah Jenkins",
    badge: "Medication Conflict",
    badgeType: "badge-neo-high",
    scenario: "61yo female with ACE-inhibitor induced dry cough. Active problem list lists Lisinopril daily, while discharge orders mandate immediate cessation.",
    highlights: ["Lisinopril Active vs Discontinue Order", "Switch to Losartan 50mg", "Nocturnal Cough for 4 Weeks", "Follow-up BMP in 3 Weeks"],
  },
  {
    id: "acute_abdomen",
    title: "David Miller",
    badge: "Emergency Triage",
    badgeType: "badge-neo-scope2",
    scenario: "29yo male presenting with 14-hour progressive right lower quadrant pain, positive McBurney point tenderness, and leukocytosis (WBC 14.8k).",
    highlights: ["Acute Appendicitis", "Positive Rovsing Sign", "WBC 14.8 x10^3/uL", "Stat Surgical Laparoscopy Consult"],
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      {/* =========================================================================
          HERO SECTION (Centered Layout, High Contrast, Neo-Brutalist Geometry)
          ========================================================================= */}
      <section className="hero-centered">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <span className="badge-neo badge-neo-scope2" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            ✦ CLINICAL INTELLIGENCE PLATFORM
          </span>
          <span className="badge-neo badge-neo-status" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            <span className="status-live-dot" /> SYNTHETIC DATA BENCHMARK
          </span>
        </div>

        <h1 className="hero-title">
          Audit-Ready AI Clinical Review Grounded in{" "}
          <span className="hero-highlight">Verifiable Evidence.</span>
        </h1>

        <p className="hero-subtitle">
          Sanitas automates clinical document intake with schema-enforced entity extraction,
          mathematical evidence substring verification against immutable source lines,
          and deterministic contradiction detection.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="hero-cta-group">
          <Link href="/workbench" className="btn-neo btn-neo-primary hero-btn-main">
            Launch Clinical Workbench &rarr;
          </Link>
          <Link href="/docs" className="btn-neo btn-neo-secondary hero-btn-sub">
            📖 System Architecture &amp; Docs
          </Link>
          <Link href="/history" className="btn-neo btn-neo-secondary hero-btn-sub">
            📋 Audit History
          </Link>
        </div>

        {/* 4 Architectural Proof Badges */}
        <div className="hero-stats-row">
          <div className="hero-stat-card">
            <div className="hero-stat-val">100%</div>
            <div className="hero-stat-label">Evidence Grounding</div>
            <p className="hero-stat-sub">Every clinical claim verified via deterministic quote matching</p>
          </div>
          <div className="hero-stat-card">
            <div className="hero-stat-val">2-Pass</div>
            <div className="hero-stat-label">Isolated AI Pipeline</div>
            <p className="hero-stat-sub">Pass 1 factual extraction separated from Pass 2 review synthesis</p>
          </div>
          <div className="hero-stat-card">
            <div className="hero-stat-val">3 Modes</div>
            <div className="hero-stat-label">Multi-Modal Intake</div>
            <p className="hero-stat-sub">Plain text, digital PDF (PyMuPDF), and memory-bounded OCR</p>
          </div>
          <div className="hero-stat-card">
            <div className="hero-stat-val">Fail-Closed</div>
            <div className="hero-stat-label">Deterministic Gate</div>
            <p className="hero-stat-sub">Ungrounded hallucinations trigger HTTP 502 rejection</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PIPELINE WALKTHROUGH: 3-STEP AUDITABLE WORKFLOW
          ========================================================================= */}
      <section className="section-container" style={{ paddingTop: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <span className="badge-neo badge-neo-scope1">Transparent Engineering</span>
          <h2 style={{ fontSize: "2.1rem", marginTop: "8px", marginBottom: "8px" }}>
            How Sanitas Verifies Clinical Records
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "680px", margin: "0 auto", fontSize: "0.95rem" }}>
            Unlike black-box LLM wrappers, Sanitas enforces strict mathematical verification between the original document text and all generated review findings.
          </p>
        </div>

        <div className="workflow-grid">
          {/* Step 1 */}
          <div className="card-neo workflow-card">
            <div className="workflow-step-badge">STAGE 1</div>
            <div className="workflow-icon">📥</div>
            <h3 className="workflow-card-title">Multi-Modal Intake &amp; Canonicalization</h3>
            <p className="workflow-card-desc">
              Ingests raw text, native digital PDFs, or scanned images. Text is segmented line-by-line into an immutable <code>CanonicalDocument</code> with permanent identifiers (<code>p1-s1</code>, <code>p1-s2</code>).
            </p>
            <div className="workflow-card-footer">
              <span className="tag-micro">PyMuPDF Text Density Check</span>
              <span className="tag-micro">150 DPI Memory Bounding</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-neo workflow-card">
            <div className="workflow-step-badge">STAGE 2</div>
            <div className="workflow-icon">🛡️</div>
            <h3 className="workflow-card-title">Two-Pass AI &amp; Evidence Gate</h3>
            <p className="workflow-card-desc">
              Gemini extracts clinical entities with verbatim quote references. An independent Python gate verifies quotes against source text. Deterministic rules flag allergy and medication conflicts.
            </p>
            <div className="workflow-card-footer">
              <span className="tag-micro">Prompt E1.1 Fact Extraction</span>
              <span className="tag-micro">Fail-Closed Verification Gate</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-neo workflow-card">
            <div className="workflow-step-badge">STAGE 3</div>
            <div className="workflow-icon">📊</div>
            <h3 className="workflow-card-title">Evidence-Linked Audit &amp; Persistence</h3>
            <p className="workflow-card-desc">
              Synthesizes an executive clinical review report. Every clinical concern, allergy, and medication links directly to its source segment. Full records and telemetry persist to Neon PostgreSQL.
            </p>
            <div className="workflow-card-footer">
              <span className="tag-micro">Interactive Quote Drawer</span>
              <span className="tag-micro">Neon PostgreSQL Audit Log</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BENCHMARK CASES: INTERACTIVE PRESET SHOWCASE
          ========================================================================= */}
      <section className="section-container" style={{ background: "#FFFFFF", borderTop: "var(--ui-border)", borderBottom: "var(--ui-border)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="badge-neo badge-neo-scope2">Preloaded Test Encounters</span>
              <h2 style={{ fontSize: "2.1rem", marginTop: "8px", marginBottom: "6px" }}>
                Explore Synthetic Benchmark Cases
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: 0 }}>
                Test Sanitas immediately with verified synthetic scenarios designed to validate contradiction detection and factual extraction.
              </p>
            </div>
            <Link href="/workbench" className="btn-neo btn-neo-primary">
              Open Workbench With Presets &rarr;
            </Link>
          </div>

          <div className="presets-showcase-grid">
            {BENCHMARK_CASES.map((bc) => (
              <div key={bc.id} className="card-neo preset-showcase-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className={`badge-neo ${bc.badgeType}`}>{bc.badge}</span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>SYNTHETIC</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--primary-dark)", marginBottom: "8px" }}>{bc.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
                  {bc.scenario}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
                  {bc.highlights.map((h, i) => (
                    <span key={i} className="tag-micro" style={{ background: "var(--mint-light)", border: "1px solid var(--border-color)" }}>
                      {h}
                    </span>
                  ))}
                </div>
                <Link
                  href="/workbench"
                  className="btn-neo btn-neo-sm btn-neo-secondary"
                  style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                >
                  Analyze Case in Workbench &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CORE CAPABILITIES GRID (4 Architectural Pillars)
          ========================================================================= */}
      <section className="section-container" style={{ padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="badge-neo badge-neo-scope1">Engineering Safeguards</span>
          <h2 style={{ fontSize: "2.1rem", marginTop: "8px", marginBottom: "8px" }}>
            Architectural Guarantees Built for Clinical Rigor
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "700px", margin: "0 auto", fontSize: "0.95rem" }}>
            Built in alignment with the Agentic Web Development Handbook standards for anti-vibe-coding, deterministic verification, and explicit database failure semantics.
          </p>
        </div>

        <div className="features-grid">
          <div className="card-neo feature-card">
            <div className="feature-icon-box">🛡️</div>
            <h3 className="feature-title">Deterministic Verification Gate</h3>
            <p className="feature-desc">
              Every clinical entity is bound to verbatim quotes from canonical segments. Python application code independently tests substring containment prior to review synthesis. If a quote is fabricated or absent, the pipeline fails closed with HTTP 502.
            </p>
          </div>

          <div className="card-neo feature-card">
            <div className="feature-icon-box">🔍</div>
            <h3 className="feature-title">Document Contradiction Engine</h3>
            <p className="feature-desc">
              A rule-based inconsistency detector identifies conflicting statements within the document without LLM hallucination: NKDA status vs documented penicillin allergy, active vs discontinued drug statuses, and conflicting vital timestamps.
            </p>
          </div>

          <div className="card-neo feature-card">
            <div className="feature-icon-box">⚡</div>
            <h3 className="feature-title">Multi-Modal Adaptive Router</h3>
            <p className="feature-desc">
              Intelligently inspects incoming documents. Digital PDFs with &ge;80% selectable text parse directly via PyMuPDF in milliseconds. Scanned records route to memory-bounded 150 DPI optical transcription, preventing OOM crashes on cloud tiers.
            </p>
          </div>

          <div className="card-neo feature-card">
            <div className="feature-icon-box">💾</div>
            <h3 className="feature-title">Neon PostgreSQL &amp; Dialect Portability</h3>
            <p className="feature-desc">
              In production and standard development, PostgreSQL persistence is strictly required with typed failure if unavailable. Automated unit tests run instantly on in-memory SQLite fixtures through portable SQLAlchemy dialect modeling.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM CALL TO ACTION & SYSTEM TRUST BANNER
          ========================================================================= */}
      <section style={{ background: "var(--primary-dark)", color: "#FFFFFF", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="badge-neo badge-neo-scope2" style={{ background: "var(--sage-accent)", color: "var(--primary-dark)", marginBottom: "16px", display: "inline-block" }}>
            Ready for Clinical Review
          </span>
          <h2 style={{ color: "#FFFFFF", fontSize: "2.4rem", marginBottom: "14px" }}>
            Experience Evidence-Grounded AI Analysis
          </h2>
          <p style={{ color: "#D1E7DD", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "32px" }}>
            Explore the live clinical reviewer on synthetic encounters, inspect interactive quote highlights, or examine the exhaustive architectural specifications and flowcharts.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/workbench" className="btn-neo btn-neo-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              Open Clinical Workbench &rarr;
            </Link>
            <Link href="/docs" className="btn-neo btn-neo-secondary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              📖 Read Documentation &amp; Schemas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
