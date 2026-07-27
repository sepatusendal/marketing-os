import { TrendingUp } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { AreaLineChart } from "@/components/ui/charts/area-line-chart";
import { ACCENT_HEX } from "@/lib/accent-colors";
import { formatIDRCompact } from "@/lib/format";
import type { getSalesTrend } from "@/server/sales-analytics.service";

/**
 * Two charts, not one — leads created/won are counts (tens) and revenue is
 * Rupiah (millions), and AreaLineChart shares one y-axis across its series,
 * so mixing them on a single chart would flatten the count lines to
 * invisible near-zero.
 */
export function SalesTrendChart({ trend }: { trend: Awaited<ReturnType<typeof getSalesTrend>> }) {
  const hasData = trend.newLeads.some((v) => v > 0) || trend.won.some((v) => v > 0);

  return (
    <WidgetCard title="Sales Trend (6 months)" accent="indigo" icon={TrendingUp}>
      {!hasData ? (
        <p className="text-sm text-muted-foreground">Not enough history yet.</p>
      ) : (
        <div className="space-y-5">
          <AreaLineChart
            labels={trend.labels}
            height={160}
            series={[
              { key: "new", label: "Leads Created", colorHex: ACCENT_HEX.indigo, values: trend.newLeads },
              { key: "won", label: "Won", colorHex: ACCENT_HEX.emerald, values: trend.won },
            ]}
          />
          <AreaLineChart
            labels={trend.labels}
            height={140}
            valueFormatter={formatIDRCompact}
            series={[{ key: "revenue", label: "Won Revenue", colorHex: ACCENT_HEX.violet, values: trend.revenue }]}
          />
        </div>
      )}
    </WidgetCard>
  );
}
