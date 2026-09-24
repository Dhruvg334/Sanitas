"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserGuideModal from "./UserGuideModal";

export default function NavHeader() {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"overview" | "workbench" | "history" | "review" | "docs" | "safety">("overview");

  const isCurrent = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    try {
      const dismissed = localStorage.getItem("sanitas_guide_dismissed");
      if (!dismissed) {
        timer = setTimeout(() => {
          setGuideOpen(true);
        }, 300);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    const handleOpenEvent = (e: Event) => {
      const custom = e as CustomEvent<{ tab?: "overview" | "workbench" | "history" | "review" | "docs" | "safety" }>;
      if (custom.detail?.tab) {
        setGuideTab(custom.detail.tab);
      }
      setGuideOpen(true);
    };

    window.addEventListener("open-sanitas-guide", handleOpenEvent);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("open-sanitas-guide", handleOpenEvent);
    };
  }, []);

  const openGuide = (tab: "overview" | "workbench" | "history" | "review" | "docs" | "safety" = "overview") => {
    setGuideTab(tab);
    setGuideOpen(true);
  };

  return (
    <>
      <header className="top-strip">
        <div className="header-inner">
          <Link href="/" className="brand-logo" aria-label="Sanitas Home">
            <div className="logo-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <div className="brand-titles">
              <span className="brand-name">Sanitas</span>
              <span className="brand-tagline">AI Clinical Reviewer</span>
            </div>
          </Link>

          <nav className="nav-links">
            <Link
              href="/"
              className={`nav-link ${isCurrent("/") ? "active" : ""}`}
            >
              Workbench
            </Link>
            <Link
              href="/history"
              className={`nav-link ${isCurrent("/history") ? "active" : ""}`}
            >
              History
            </Link>
            <Link
              href="/docs"
              className={`nav-link ${isCurrent("/docs") ? "active" : ""}`}
            >
              Documentation
            </Link>
          </nav>

          <div className="header-badge-container" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="btn-neo btn-neo-xs btn-neo-secondary"
              onClick={() => openGuide("overview")}
              title="Open Sanitas Operational User Manual"
              style={{ fontWeight: 800 }}
            >
              📖 User Guide
            </button>
            <span className="badge-neo badge-neo-status">
              <span className="status-live-dot" /> Synthetic Mode
            </span>
          </div>
        </div>
      </header>

      {/* Synthetic Safety Banner */}
      <div className="disclaimer-banner" role="note">
        <strong>Synthetic Clinical Data Only:</strong> Sanitas is designed and deployed strictly for demonstration and evaluation on synthetic clinical documents. Never enter real Protected Health Information (PHI).
      </div>

      {guideOpen && (
        <UserGuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          initialTab={guideTab}
        />
      )}
    </>
  );
}
