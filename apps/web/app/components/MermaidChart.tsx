"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidChartProps {
  chart: string;
  title?: string;
}

export default function MermaidChart({ chart, title }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#E8F5E9",
          primaryTextColor: "#0B3D2E",
          primaryBorderColor: "#0B3D2E",
          lineColor: "#2D6A4F",
          secondaryColor: "#FFF9C4",
          tertiaryColor: "#FFECB3",
          edgeLabelBackground: "#FFFFFF",
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: "13px",
        },
        securityLevel: "loose",
      });
    } catch {
      // mermaid already initialized
    }

    const renderChart = async () => {
      try {
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        if (isMounted) {
          setSvgContent(svg);
          setRenderError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setRenderError(err instanceof Error ? err.message : "Diagram rendering failed");
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1.0);

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (renderError) {
    return (
      <div className="mermaid-fallback-box">
        <pre className="mermaid-code">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`mermaid-card-container ${isFullscreen ? "mermaid-fullscreen-mode" : ""}`}>
      {/* Interactive Controls Bar */}
      <div className="mermaid-toolbar">
        <div className="mermaid-toolbar-left">
          {title && <span className="mermaid-title-tag">{title}</span>}
          <span className="mermaid-zoom-indicator">{Math.round(zoom * 100)}% scale</span>
        </div>
        <div className="mermaid-toolbar-actions">
          <button
            type="button"
            className="mermaid-tool-btn"
            onClick={handleZoomOut}
            title="Zoom Out (-20%)"
          >
            &minus; Zoom Out
          </button>
          <button
            type="button"
            className="mermaid-tool-btn"
            onClick={handleResetZoom}
            title="Reset to 100% Zoom"
          >
            Reset (100%)
          </button>
          <button
            type="button"
            className="mermaid-tool-btn"
            onClick={handleZoomIn}
            title="Zoom In (+20%)"
          >
            + Zoom In
          </button>
          <button
            type="button"
            className="mermaid-tool-btn"
            onClick={handleCopyCode}
            title="Copy Mermaid Diagram Source"
          >
            {copied ? "✓ Copied" : "📋 Copy Code"}
          </button>
          <button
            type="button"
            className="mermaid-tool-btn mermaid-tool-btn-accent"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Expand Diagram Fullscreen"}
          >
            {isFullscreen ? "✕ Close Expanded View" : "⛶ Full View"}
          </button>
        </div>
      </div>

      {/* Diagram Viewport */}
      <div className="mermaid-viewport">
        <div
          ref={containerRef}
          className="mermaid-canvas"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {isFullscreen && (
        <div className="mermaid-fullscreen-hint">
          Press <strong>Close Expanded View</strong> button above or toggle zoom to inspect components.
        </div>
      )}
    </div>
  );
}
