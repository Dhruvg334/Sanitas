"use client";

import Link from "next/link";

export default function Footer() {
  const openGuide = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-sanitas-guide", { detail: { tab: "overview" } })
      );
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link href="/" className="brand-logo" style={{ textDecoration: "none", marginBottom: "10px", display: "inline-flex" }}>
              <div style={{ width: "30px", height: "30px", marginRight: "10px" }}>
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="36" height="36" rx="9" fill="#0B3D2E" stroke="#0B3D2E" strokeWidth="2"/>
                  <rect x="17" y="6" width="6" height="28" rx="3" fill="#2D6A4F" />
                  <rect x="6" y="17" width="28" height="6" rx="3" fill="#2D6A4F" />
                  <path d="M7 20H13.5L16.5 13L23.5 27L26.5 20H33" stroke="#B7E4C7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="20" r="3.5" fill="#FFD166" stroke="#0B3D2E" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="brand-titles">
                <span className="brand-name" style={{ fontSize: "1.2rem" }}>Sanitas</span>
                <span className="brand-tagline" style={{ fontSize: "0.68rem" }}>Clinical AI Reviewer</span>
              </div>
            </Link>
            <p className="footer-desc">
              Audit-ready clinical document review platform combining multi-modal document ingestion, two-pass Gemini structured extraction, and deterministic mathematical evidence verification.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Platform Navigation</h4>
            <ul className="footer-nav-list">
              <li>
                <Link href="/" className="footer-link">Home</Link>
              </li>
              <li>
                <Link href="/workbench" className="footer-link">Clinical Workbench</Link>
              </li>
              <li>
                <Link href="/history" className="footer-link">Review History &amp; Ledger</Link>
              </li>
              <li>
                <Link href="/docs" className="footer-link">Technical Documentation</Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openGuide}
                  className="footer-link-btn"
                >
                  Quick Start Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Stack */}
          <div className="footer-stack-col">
            <h4 className="footer-col-title">Deployment Topology</h4>
            <div className="footer-badges-list">
              <span className="badge-neo badge-neo-scope2" style={{ fontSize: "0.72rem" }}>
                Frontend: Vercel Edge
              </span>
              <span className="badge-neo badge-neo-scope1" style={{ fontSize: "0.72rem" }}>
                Backend: Render FastAPI
              </span>
              <span className="badge-neo badge-neo-low" style={{ fontSize: "0.72rem" }}>
                Persistence: PostgreSQL (Neon)
              </span>
              <span className="badge-neo badge-neo-accent" style={{ fontSize: "0.72rem" }}>
                AI: Gemini 2.5 (Two-Pass)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer Strip */}
        <div className="footer-bottom-strip">
          <p className="footer-disclaimer">
            <strong>Clinical Governance Notice:</strong> Sanitas is a clinical intelligence &amp; evidence-verification tool designed to assist healthcare professionals. It does not provide medical diagnoses or prescribe treatment plans. All clinical determinations remain the sole responsibility of licensed medical practitioners.
          </p>
          <div className="footer-meta">
            <span>&copy; {new Date().getFullYear()} Sanitas Clinical Platform</span>
            <span>•</span>
            <span>Dhruv Gupta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}