import { LineChart } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { AreaLineChart } from "@/components/ui/charts/area-line-chart";
import { ACCENT_HEX } from "@/lib/accent-colors";
import type { getClientGrowthTrend } from "@/server/sales-analytics.service";

export function ClientGrowthChart({ trend }: { trend: Awaited<ReturnType<typeof getClientGrowthTrend>> }) {
  const hasData = trend.newClients.some((v) => v > 0);

  return (
    <WidgetCard title="Client Growth (6 months)" accent="emerald" icon={LineChart}>
      {!hasData ? (
        <p className="text-sm text-muted-foreground">No new clients in this period yet.</p>
      ) : (
        <AreaLineChart
          labels={trend.labels}
          height={160}
          series={[{ key: "new", label: "New Clients", colorHex: ACCENT_HEX.emerald, values: trend.newClients }]}
        />
      )}
    </WidgetCard>
  );
}
