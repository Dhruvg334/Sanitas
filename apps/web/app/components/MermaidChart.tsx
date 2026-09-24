"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidChartProps {
  chart: string;
}

export default function MermaidChart({ chart }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);

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
    <div
      ref={containerRef}
      className="mermaid-wrapper"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
