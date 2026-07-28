import { Radar } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { HorizontalBarChart } from "@/components/ui/charts/horizontal-bar-chart";
import { ACCENT_FILL, LEAD_SOURCE_ACCENT, WIDGET_ACCENT } from "@/lib/accent-colors";
import { LEAD_SOURCE_LABEL } from "@/lib/lead-labels";
import { formatIDRCompact } from "@/lib/format";
import type { getSourcePerformance } from "@/server/report.service";

/** Win rate per lead source, ranked by volume — which channels actually close, not just generate volume. */
export function SourcePerformanceChart({
  data,
}: {
  data: Awaited<ReturnType<typeof getSourcePerformance>>;
}) {
  if (data.length === 0) {
    return (
      <WidgetCard size="sm" title="Win Rate by Source" accent={WIDGET_ACCENT.leadSummary} icon={Radar}>
        <p className="text-sm text-muted-foreground">No leads in this range.</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard size="sm" title="Win Rate by Source" accent={WIDGET_ACCENT.leadSummary} icon={Radar}>
      <HorizontalBarChart
        data={data.slice(0, 8).map((d) => ({
          key: d.source,
          label: LEAD_SOURCE_LABEL[d.source],
          value: d.winRate,
          colorClass: ACCENT_FILL[LEAD_SOURCE_ACCENT[d.source]],
          valueLabel: `${d.winRate}%`,
          detail: `${d.won}/${d.total} won · ${formatIDRCompact(d.revenue)} revenue`,
        }))}
      />
    </WidgetCard>
  );
}
