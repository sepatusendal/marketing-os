import { XCircle } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { HorizontalBarChart } from "@/components/ui/charts/horizontal-bar-chart";
import { ACCENT_FILL, LEAD_LOST_REASON_ACCENT } from "@/lib/accent-colors";
import { LEAD_LOST_REASON_LABEL } from "@/lib/lead-labels";
import type { getLostReasonBreakdown } from "@/server/report.service";
import type { AccentColor } from "@/lib/accent-colors";

/** Why leads were marked Lost — feeds strategy back from raw win/loss counts. */
export function LostReasonChart({
  data,
}: {
  data: Awaited<ReturnType<typeof getLostReasonBreakdown>>;
}) {
  if (data.length === 0) {
    return (
      <WidgetCard title="Why Leads Are Lost" accent="red" icon={XCircle}>
        <p className="text-sm text-muted-foreground">No lost leads in this range. 🎉</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Why Leads Are Lost" accent="red" icon={XCircle}>
      <HorizontalBarChart
        data={data.map((d) => ({
          key: d.reason,
          label: LEAD_LOST_REASON_LABEL[d.reason as keyof typeof LEAD_LOST_REASON_LABEL] ?? d.reason,
          value: d.count,
          colorClass: ACCENT_FILL[(LEAD_LOST_REASON_ACCENT[d.reason] ?? "slate") as AccentColor],
          valueLabel: `${d.count} · ${d.percent}%`,
        }))}
      />
    </WidgetCard>
  );
}
