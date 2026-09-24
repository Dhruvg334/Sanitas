"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavHeader() {
  const pathname = usePathname();

  const isCurrent = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
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

          <div className="header-badge-container">
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
    </>
  );
}
