"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  /** Tailwind bg-* class carrying the series color — text stays on text tokens. */
  colorClass: string;
  /** Overrides the direct label at the bar's tip (e.g. "4 · 20%"); defaults to `value`. */
  valueLabel?: string;
  /** Optional extra line shown in the hover tooltip (e.g. "12% of total"). */
  detail?: string;
};

/**
 * Horizontal bar list following the dataviz mark spec: ≤24px thick bars,
 * rounded data-end at the value tip, square baseline, 2px surface gap
 * between bars, direct value label at the tip, hover tooltip for the exact
 * figure. Labels ride text tokens — only the bar fill carries the series color.
 */
export function HorizontalBarChart({ data }: { data: BarDatum[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        return (
          <div
            key={d.key}
            className="group relative"
            onMouseEnter={() => setHovered(d.key)}
            onMouseLeave={() => setHovered((h) => (h === d.key ? null : h))}
          >
            <div className="mb-0.5 flex items-center justify-between text-sm">
              <span className="text-foreground">{d.label}</span>
              <span className="font-medium text-foreground">{d.valueLabel ?? d.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width]", d.colorClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
            {d.detail && hovered === d.key && (
              <div className="glass-panel absolute -top-8 left-0 z-10 rounded-md px-2 py-1 text-xs text-popover-foreground shadow-md">
                {d.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
