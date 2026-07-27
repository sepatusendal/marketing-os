import { PieChart } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { LEAD_STATUS_ACCENT, ACCENT_HEX } from "@/lib/accent-colors";
import { LEAD_STATUS_LABEL } from "@/lib/lead-labels";
import { formatIDRCompact } from "@/lib/format";
import type { getPipelineByStage } from "@/server/sales-analytics.service";

/** Where the open pipeline's money actually sits, by stage — complements the funnel's count view with a value view. */
export function PipelineValueDonut({ data }: { data: Awaited<ReturnType<typeof getPipelineByStage>> }) {
  const total = data.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <WidgetCard title="Open Pipeline by Stage (Value)" accent="amber" icon={PieChart}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No open leads with a revenue estimate yet.</p>
      ) : (
        <DonutChart
          centerValue={formatIDRCompact(total)}
          centerLabel="open value"
          valueFormat="idr"
          data={data.map((d) => ({
            key: d.status,
            label: LEAD_STATUS_LABEL[d.status],
            value: Number(d.value),
            colorHex: ACCENT_HEX[LEAD_STATUS_ACCENT[d.status]],
          }))}
        />
      )}
    </WidgetCard>
  );
}
