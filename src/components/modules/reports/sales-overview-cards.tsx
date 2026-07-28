import { Users, Target, TrendingUp, Trophy, Clock, Wallet } from "lucide-react";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import { formatIDRCompact } from "@/lib/format";
import type { getSalesOverview } from "@/server/report.service";

export function SalesOverviewCards({ sales }: { sales: Awaited<ReturnType<typeof getSalesOverview>> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        size="sm"
        label="Total Leads"
        value={sales.total}
        icon={Users}
        accent="indigo"
        secondary={`${sales.open} open`}
      />
      <KpiCard
        size="sm"
        label="Win Rate"
        value={`${sales.winRate}%`}
        icon={Target}
        accent="emerald"
        secondary={`${sales.won} won · ${sales.lost} lost`}
      />
      <KpiCard
        size="sm"
        label="Avg Deal Size"
        value={formatIDRCompact(sales.avgDealSize)}
        icon={Wallet}
        accent="violet"
        secondary="per won lead"
      />
      <KpiCard
        size="sm"
        label="Avg Sales Cycle"
        value={`${sales.avgCycleDays}d`}
        icon={Clock}
        accent="cyan"
        secondary="created → won"
      />
      <KpiCard
        size="sm"
        label="Open Pipeline"
        value={formatIDRCompact(sales.openPipelineValue)}
        icon={TrendingUp}
        accent="amber"
        secondary="potential revenue"
      />
      <KpiCard
        size="sm"
        label="Won Revenue"
        value={formatIDRCompact(sales.wonRevenue)}
        icon={Trophy}
        accent="rose"
        secondary="realized"
      />
    </div>
  );
}
