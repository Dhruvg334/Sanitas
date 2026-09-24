"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ReviewReportView, { AnalysisResponse } from "../../components/ReviewReportView";
import PageGuideBanner from "../../components/PageGuideBanner";

export default function DurableReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const analysisId = resolvedParams.id;

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/analyses/${analysisId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Analysis with ID ${analysisId} was not found in the persistence store.`);
          }
          throw new Error(`Failed to load analysis (Status ${res.status})`);
        }
        const data: AnalysisResponse = await res.json();
        setAnalysis(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error fetching analysis";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId, apiBaseUrl]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="main-container">
      <PageGuideBanner
        pageKey="review"
        title="Durable Clinical Review Permalink"
        description="This verified review is permanently stored in Neon PostgreSQL and reloadable without re-running model inference. Click evidence pills to highlight source segments."
        onOpenGuide={(tab) => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-sanitas-guide", { detail: { tab } }));
          }
        }}
      />
      {/* Top Header Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <Link href="/history" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--emerald)", textDecoration: "none" }}>
            &larr; Back to History
          </Link>
          <h1 style={{ fontSize: "1.9rem", marginTop: "4px" }}>Persisted Clinical Review</h1>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
            ID: {analysisId}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn-neo btn-neo-sm btn-neo-secondary"
            onClick={handleCopyLink}
          >
            {copied ? "✓ Link Copied!" : "🔗 Shareable Link"}
          </button>
          <Link href="/" className="btn-neo btn-neo-sm btn-neo-primary">
            + New Analysis
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-box-neo" role="alert">
          <div className="error-header">
            <span>Report Retrieval Error</span>
          </div>
          <p className="error-msg">{error}</p>
          <div style={{ marginTop: "12px" }}>
            <Link href="/history" className="btn-neo btn-neo-sm btn-neo-primary">
              Return to Analysis History
            </Link>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="card-neo spinner-box">
          <div className="spinner-neo" aria-hidden="true" />
          <h3 style={{ margin: "0 0 6px" }}>Retrieving Persisted Report</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Loading canonical document, verified extraction, and reviewer findings from database...
          </p>
        </div>
      )}

      {!isLoading && analysis && (
        <div className="workbench-grid">
          {/* Left Column: Canonical Segments */}
          <section className="card-neo" aria-label="Persisted Canonical Segments">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="badge-neo badge-neo-scope2">Source Verification</span>
              <span className="badge-neo">
                {analysis.canonical_document.segments.length} Segments
              </span>
            </div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "12px" }}>Canonical Source Segments</h3>
            <div className="segments-list">
              {analysis.canonical_document.segments.map((seg) => {
                const isActive = highlightedSegment === seg.segment_id;
                return (
                  <div
                    key={seg.segment_id}
                    id={seg.segment_id}
                    className={`segment-box ${isActive ? "active-evidence" : ""}`}
                  >
                    <span className="segment-id-tag">{seg.segment_id}</span>
                    <span>{seg.text}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Full Review Report View */}
          <section aria-label="Persisted Review Report">
            <ReviewReportView
              analysis={analysis}
              onHighlightSegment={setHighlightedSegment}
            />
          </section>
        </div>
      )}
    </main>
  );
}
