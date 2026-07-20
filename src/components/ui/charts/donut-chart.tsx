"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatIDRCompact } from "@/lib/format";

export type DonutDatum = {
  key: string;
  label: string;
  value: number;
  colorHex: string;
};

/**
 * Segmented ring with a center label, a legend (count + percent per row —
 * identity is never color-alone), and a hover tooltip per segment. A 2px
 * surface gap separates touching segments per the dataviz mark spec.
 */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 140,
  thickness = 16,
  valueFormat = "number",
}: {
  data: DonutDatum[];
  centerLabel: string;
  centerValue: string;
  size?: number;
  thickness?: number;
  /** Server Components can't pass function props to a Client Component —
   * a fixed format key avoids that boundary issue. */
  valueFormat?: "number" | "idr";
}) {
  const formatValue = valueFormat === "idr" ? formatIDRCompact : (v: number) => v.toString();
  const [hovered, setHovered] = useState<string | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 ? 2 : 0; // px of surface gap between segments

  const fractions = data.filter((d) => d.value > 0).map((d) => (total > 0 ? d.value / total : 0));
  // Cumulative offset per segment, computed without mutating a variable across iterations.
  const cumulativeOffsets = fractions.map((_, i) =>
    fractions.slice(0, i).reduce((sum, f) => sum + f * circumference, 0),
  );
  const segments = data.filter((d) => d.value > 0).map((d, i) => ({
    ...d,
    fraction: fractions[i],
    length: Math.max(0, fractions[i] * circumference - gap),
    dashoffset: -cumulativeOffsets[i],
  }));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {segments.map((s) => (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.colorHex}
              strokeWidth={thickness}
              strokeDasharray={`${s.length} ${circumference - s.length}`}
              strokeDashoffset={s.dashoffset}
              strokeLinecap="round"
              className="cursor-default transition-opacity"
              opacity={hovered && hovered !== s.key ? 0.35 : 1}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered((h) => (h === s.key ? null : h))}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{centerValue}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div
              key={d.key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm transition-colors",
                hovered === d.key && "bg-muted",
              )}
              onMouseEnter={() => setHovered(d.key)}
              onMouseLeave={() => setHovered((h) => (h === d.key ? null : h))}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.colorHex }} />
                <span className="truncate text-foreground">{d.label}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatValue(d.value)} <span className="text-xs">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
