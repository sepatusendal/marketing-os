"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export type ChartSeries = {
  key: string;
  label: string;
  colorHex: string;
  values: number[];
};

/** Catmull-Rom → cubic Bezier smoothing so lines read as curves, not zig-zags. */
function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  // A single point has no line to draw — an "M-only" path is valid SVG (the
  // dot marker below carries the visual), but the naive `L...L...Z` area
  // path built around an empty linePath is not, so this still needs a stop.
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/**
 * Multi-series smooth line + gradient-area chart. 2px lines, ~10% opacity
 * area wash, hairline recessive gridlines, crosshair + tooltip on hover, and
 * a legend (identity is never color-alone — this is the ≥2-series case).
 */
export function AreaLineChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 600;
  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allValues);
  const n = labels.length;

  function xAt(i: number) {
    return padding.left + (n <= 1 ? 0 : (i / (n - 1)) * plotWidth);
  }
  function yAt(v: number) {
    return padding.top + plotHeight - (v / max) * plotHeight;
  }

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - padding.left) / plotWidth) * (n - 1));
    setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
  }

  const gridLines = 4;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-xs">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.colorHex }} />
            <span className="text-muted-foreground">{s.label}</span>
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.colorHex} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.colorHex} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {Array.from({ length: gridLines }).map((_, i) => {
            const y = padding.top + (i / (gridLines - 1)) * plotHeight;
            return (
              <line
                key={i}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
            );
          })}

          {series.map((s) => {
            const points = s.values.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
            const linePath = smoothPath(points);
            const areaPath = `${linePath} L${xAt(n - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`;
            return (
              <g key={s.key}>
                <path d={areaPath} fill={`url(#area-fill-${s.key})`} stroke="none" />
                {n > 1 ? (
                  <path d={linePath} fill="none" stroke={s.colorHex} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  // A single data point has no line to draw — a lone dot
                  // still needs to carry the value visually.
                  points[0] && <circle cx={points[0][0]} cy={points[0][1]} r={4} fill={s.colorHex} />
                )}
              </g>
            );
          })}

          {hoverIndex !== null && (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={padding.top}
                y2={padding.top + plotHeight}
                stroke="var(--foreground)"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.colorHex}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          {labels.map((label, i) => {
            if (n > 8 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return null;
            const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
            return (
              <text
                key={i}
                x={xAt(i)}
                y={height - 6}
                textAnchor={anchor}
                className="fill-muted-foreground"
                fontSize={10}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {hoverIndex !== null && (
          <div
            className={cn(
              "glass-panel pointer-events-none absolute top-2 z-10 min-w-32 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs text-popover-foreground shadow-md",
            )}
            style={{ left: `${(xAt(hoverIndex) / width) * 100}%` }}
          >
            <div className="mb-1 font-medium text-foreground">{labels[hoverIndex]}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.colorHex }} />
                  {s.label}
                </span>
                <span className="font-medium text-foreground">{s.values[hoverIndex]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
