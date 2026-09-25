"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const handleDismiss = useCallback(() => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem("sanitas_guide_dismissed", "true");
      } catch {
        // Ignore storage errors in restricted contexts
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="modal-neo" style={{ maxWidth: "620px" }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: "18px 22px 14px", borderBottom: "2px solid #E2ECE9" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge-neo badge-neo-scope1" style={{ fontSize: "0.68rem" }}>Quick Start Guide</span>
              <span className="badge-neo badge-neo-status" style={{ fontSize: "0.68rem" }}>
                <span className="status-live-dot" /> Synthetic Data
              </span>
            </div>
            <h2 id="welcome-title" style={{ fontSize: "1.35rem", margin: 0, color: "var(--primary-dark)" }}>
              Welcome to Sanitas Reviewer
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

        {/* Modal Body: Clean 3-Step Overview */}
        <div className="modal-body" style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
            Sanitas is an audit-ready clinical document reviewer that extracts structured medical findings and verifies every claim against verbatim source text.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="guide-step-card" style={{ padding: "12px 14px" }}>
              <div className="guide-step-num">1</div>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "var(--primary-dark)" }}>Ingest or Select Note</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Choose from 4 pre-loaded synthetic clinical presets, or paste plain text / drop PDF &amp; image scans.
                </p>
              </div>
            </div>

            <div className="guide-step-card" style={{ padding: "12px 14px" }}>
              <div className="guide-step-num">2</div>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "var(--primary-dark)" }}>Two-Pass AI Analysis</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Gemini extracts factual entities (Pass 1) and synthesizes clinical concerns &amp; contradictions (Pass 2).
                </p>
              </div>
            </div>

            <div className="guide-step-card" style={{ padding: "12px 14px" }}>
              <div className="guide-step-num">3</div>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "var(--primary-dark)" }}>Inspect Grounded Evidence</strong>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Click any evidence quote pill (e.g. <code>p1-s3</code>) to highlight the exact matching line in the source drawer.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", padding: "10px 12px", background: "var(--mint-light)", borderRadius: "6px", border: "1px solid var(--sage-accent)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dark)" }}>
              Need deep technical architecture &amp; API schemas?
            </span>
            <Link
              href="/docs"
              className="btn-neo btn-neo-xs btn-neo-secondary"
              onClick={handleDismiss}
              style={{ textDecoration: "none", fontSize: "0.75rem", padding: "3px 8px" }}
            >
              View Docs &rarr;
            </Link>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: "14px 22px", background: "#F8FCF9" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: "15px", height: "15px", accentColor: "var(--emerald)" }}
            />
            Don&apos;t show on launch
          </label>

          <button
            type="button"
            className="btn-neo btn-neo-sm btn-neo-primary"
            onClick={handleDismiss}
            style={{ fontWeight: 800 }}
          >
            Start Exploring &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
