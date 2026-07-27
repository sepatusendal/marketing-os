import { Filter } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { LEAD_STATUS_LABEL } from "@/lib/lead-labels";
import { LEAD_STATUS_ACCENT, ACCENT_FILL } from "@/lib/accent-colors";
import type { getFunnelConversion } from "@/server/sales-analytics.service";

/**
 * Waterfall-style funnel — each stage's bar width is proportional to its
 * cumulative count, with the conversion rate from the previous stage called
 * out explicitly. More useful than a flat bar chart for spotting exactly
 * where the pipeline leaks (a specific stage-to-stage drop, not just "fewer
 * leads further along").
 */
export function FunnelConversionChart({
  data,
}: {
  data: Awaited<ReturnType<typeof getFunnelConversion>>;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <WidgetCard title="Pipeline Funnel" accent="indigo" icon={Filter}>
      <div className="space-y-3">
        {data.map((stage, i) => {
          const widthPct = Math.max(6, Math.round((stage.count / max) * 100));
          return (
            <div key={stage.status}>
              {i > 0 && (
                <div className="mb-1 flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
                  <span
                    className={
                      stage.conversionFromPrevious < 50 ? "font-medium text-destructive" : "font-medium text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {stage.conversionFromPrevious}%
                  </span>
                  <span>advanced from {LEAD_STATUS_LABEL[data[i - 1].status]}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 truncate text-sm text-foreground">
                  {LEAD_STATUS_LABEL[stage.status]}
                </div>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className={`flex h-full items-center justify-end rounded-md px-2 text-xs font-medium text-white transition-[width] ${ACCENT_FILL[LEAD_STATUS_ACCENT[stage.status]]}`}
                    style={{ width: `${widthPct}%` }}
                  >
                    {stage.count}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
