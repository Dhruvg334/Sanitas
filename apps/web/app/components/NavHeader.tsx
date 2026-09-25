"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserGuideModal from "./UserGuideModal";
import { IconBook } from "./Icons";

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
            <div className="logo-icon-box" style={{ background: "transparent", border: "none", boxShadow: "none", width: "36px", height: "36px" }}>
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="36" height="36" rx="9" fill="#0B3D2E" stroke="#0B3D2E" strokeWidth="2"/>
                <rect x="17" y="6" width="6" height="28" rx="3" fill="#2D6A4F" />
                <rect x="6" y="17" width="28" height="6" rx="3" fill="#2D6A4F" />
                <path d="M7 20H13.5L16.5 13L23.5 27L26.5 20H33" stroke="#B7E4C7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="20" r="3.5" fill="#FFD166" stroke="#0B3D2E" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="brand-titles">
              <span className="brand-name">Sanitas</span>
              <span className="brand-tagline">Clinical AI Reviewer</span>
            </div>
          </Link>

          <nav className="nav-links">
            <Link
              href="/"
              className={`nav-link ${isCurrent("/") ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/workbench"
              className={`nav-link ${isCurrent("/workbench") ? "active" : ""}`}
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
              title="Open Sanitas Quick Operational Guide"
              style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <IconBook size={15} color="var(--primary-dark)" />
              <span>Quick Guide</span>
            </button>
          </div>
        </div>
      </header>

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
