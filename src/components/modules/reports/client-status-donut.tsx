import { Users2 } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { CLIENT_STATUS_STYLE_HEX } from "@/lib/client-labels";
import type { getClientStats } from "@/server/client.service";

export function ClientStatusDonut({ stats }: { stats: Awaited<ReturnType<typeof getClientStats>> }) {
  const total = stats.active + stats.inactive + stats.churned;

  return (
    <WidgetCard size="sm" title="Client Status Mix" accent="emerald" icon={Users2}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No clients yet.</p>
      ) : (
        <DonutChart
          centerValue={total.toString()}
          centerLabel="total clients"
          data={[
            { key: "ACTIVE", label: "Active", value: stats.active, colorHex: CLIENT_STATUS_STYLE_HEX.ACTIVE },
            { key: "INACTIVE", label: "Inactive", value: stats.inactive, colorHex: CLIENT_STATUS_STYLE_HEX.INACTIVE },
            { key: "CHURNED", label: "Churned", value: stats.churned, colorHex: CLIENT_STATUS_STYLE_HEX.CHURNED },
          ]}
        />
      )}
    </WidgetCard>
  );
}
