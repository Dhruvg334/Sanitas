"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AnalysisListItem {
  analysis_id: string;
  created_at: string;
  status: string;
  source_type: string;
  original_filename?: string | null;
  report_summary?: string | null;
}

interface AnalysisListResponse {
  items: AnalysisListItem[];
  next_cursor?: string | null;
}

export default function HistoryPage() {
  const [items, setItems] = useState<AnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/analyses?limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load history (Status ${res.status})`);
      }
      const data: AnalysisListResponse = await res.json();
      setItems(data.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading history";
      setError(`Unable to reach the Sanitas backend history service at ${apiBaseUrl}. (${msg})`);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/analyses?limit=50`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load history (Status ${res.status})`);
        }
        const data: AnalysisListResponse = await res.json();
        if (!ignore) {
          setItems(data.items || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Error loading history";
          setError(`Unable to reach the Sanitas backend history service at ${apiBaseUrl}. (${msg})`);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl]);

  return (
    <main className="main-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="badge-neo badge-neo-scope2">Audit Log &amp; Persistence</span>
          <h1 style={{ fontSize: "2.2rem", marginTop: "6px" }}>Analysis History</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>
            Reopen and inspect evidence for previously reviewed clinical documents.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn-neo btn-neo-sm btn-neo-secondary"
            onClick={fetchHistory}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "↻ Refresh History"}
          </button>
          <Link href="/workbench" className="btn-neo btn-neo-sm btn-neo-primary">
            + New Review
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-box-neo" role="alert">
          <div className="error-header">
            <span>Persistence Connection Notice</span>
          </div>
          <p className="error-msg">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="card-neo spinner-box">
          <div className="spinner-neo" aria-hidden="true" />
          <p style={{ fontWeight: 700, color: "var(--primary-dark)" }}>Loading analysis history from database...</p>
        </div>
      )}

      {!isLoading && items.length === 0 && !error && (
        <div className="card-neo" style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📋</div>
          <h3 style={{ margin: "0 0 8px" }}>No Analysis Records Found</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto 20px", fontSize: "0.92rem" }}>
            Analyses are persisted to PostgreSQL once documents are processed. Start by analyzing a document in the Workbench.
          </p>
          <Link href="/workbench" className="btn-neo btn-neo-primary">
            Go to Workbench
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="history-grid">
          {items.map((item) => (
            <div key={item.analysis_id} className="history-card">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <span className="badge-neo badge-neo-status">
                    <span className="status-live-dot" /> {item.status}
                  </span>
                  <span className="badge-neo badge-neo-low">
                    {item.source_type}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "monospace" }}>
                  {new Date(item.created_at).toLocaleString()} • ID: {item.analysis_id.slice(0, 8)}...
                </div>

                {item.original_filename && (
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-dark)", marginBottom: "8px" }}>
                    📁 {item.original_filename}
                  </div>
                )}

                <p style={{ fontSize: "0.88rem", color: "var(--text-dark)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                  {item.report_summary
                    ? item.report_summary.slice(0, 180) + (item.report_summary.length > 180 ? "..." : "")
                    : "Clinical document reviewed and structured findings verified."}
                </p>
              </div>

              <div>
                <Link
                  href={`/review/${item.analysis_id}`}
                  className="btn-neo btn-neo-sm btn-neo-primary"
                  style={{ width: "100%" }}
                >
                  Open Verified Report &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
