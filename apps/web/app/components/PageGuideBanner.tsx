"use client";

import { useState } from "react";

interface PageGuideBannerProps {
  pageKey: "workbench" | "history" | "review" | "docs";
  title: string;
  description: string;
  onOpenGuide: (tab: "overview" | "workbench" | "history" | "review" | "docs" | "safety") => void;
}

export default function PageGuideBanner({
  pageKey,
  title,
  description,
  onOpenGuide,
}: PageGuideBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="page-guide-banner">
      <div className="banner-content">
        <div className="banner-icon-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div>
          <span className="banner-title">{title}: </span>
          <span className="banner-desc">{description}</span>
        </div>
      </div>
      <div className="banner-actions">
        <button
          type="button"
          className="btn-neo btn-neo-xs btn-neo-secondary"
          onClick={() => onOpenGuide(pageKey)}
        >
          📖 Page Guide
        </button>
        <button
          type="button"
          className="banner-close-btn"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
