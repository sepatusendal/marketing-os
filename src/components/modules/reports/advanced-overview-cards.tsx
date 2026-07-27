import { Users, Target, TrendingUp, Trophy, Clock, Wallet, Gauge, UserPlus } from "lucide-react";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import { Sparkline } from "@/components/ui/charts/sparkline";
import { ACCENT_HEX } from "@/lib/accent-colors";
import { formatIDRCompact } from "@/lib/format";
import type { getSalesOverview } from "@/server/report.service";
import type { getPipelineForecast, getSalesTrend } from "@/server/sales-analytics.service";

export function AdvancedOverviewCards({
  sales,
  forecast,
  newThisMonth,
  trend,
}: {
  sales: Awaited<ReturnType<typeof getSalesOverview>>;
  forecast: Awaited<ReturnType<typeof getPipelineForecast>>;
  newThisMonth: number;
  trend: Awaited<ReturnType<typeof getSalesTrend>>;
}) {
  const hasTrend = trend.labels.length > 1;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        label="Total Leads"
        value={sales.total}
        icon={Users}
        accent="indigo"
        secondary={`${sales.open} open`}
        sparkline={
          hasTrend && trend.newLeads.some((v) => v > 0) ? (
            <Sparkline values={trend.newLeads} colorVar={ACCENT_HEX.indigo} />
          ) : undefined
        }
      />
      <KpiCard
        label="New This Month"
        value={newThisMonth}
        icon={UserPlus}
        accent="cyan"
        secondary="leads created"
      />
      <KpiCard
        label="Win Rate"
        value={`${sales.winRate}%`}
        icon={Target}
        accent="emerald"
        secondary={`${sales.won} won · ${sales.lost} lost`}
        sparkline={
          hasTrend && trend.won.some((v) => v > 0) ? (
            <Sparkline values={trend.won} colorVar={ACCENT_HEX.emerald} />
          ) : undefined
        }
      />
      <KpiCard
        label="Avg Deal Size"
        value={formatIDRCompact(sales.avgDealSize)}
        icon={Wallet}
        accent="violet"
        secondary="per won lead"
      />
      <KpiCard
        label="Avg Sales Cycle"
        value={`${sales.avgCycleDays}d`}
        icon={Clock}
        accent="blue"
        secondary="created → won"
      />
      <KpiCard
        label="Open Pipeline"
        value={formatIDRCompact(forecast.rawValue)}
        icon={TrendingUp}
        accent="amber"
        secondary={`${forecast.openCount} deals`}
      />
      <KpiCard
        label="Weighted Forecast"
        value={formatIDRCompact(forecast.weightedValue)}
        icon={Gauge}
        accent="rose"
        secondary="probability-adjusted"
      />
      <KpiCard
        label="Won Revenue"
        value={formatIDRCompact(sales.wonRevenue)}
        icon={Trophy}
        accent="indigo"
        secondary="realized"
        sparkline={
          hasTrend && trend.revenue.some((v) => v > 0) ? (
            <Sparkline values={trend.revenue} colorVar={ACCENT_HEX.indigo} />
          ) : undefined
        }
      />
    </div>
  );
}
