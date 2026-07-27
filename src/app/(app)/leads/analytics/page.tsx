import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Skeleton } from "@/components/ui/skeleton";
import { getSalesOverview, getSourcePerformance, getLostReasonBreakdown } from "@/server/report.service";
import { getClientStats } from "@/server/client.service";
import { getLeadsNeedingFollowup } from "@/server/dashboard.service";
import {
  getPipelineForecast,
  getFunnelConversion,
  getSalesTrend,
  getOwnerPerformance,
  getTopClients,
  getClientGrowthTrend,
  getNewLeadsThisMonth,
} from "@/server/sales-analytics.service";
import { AdvancedOverviewCards } from "@/components/modules/reports/advanced-overview-cards";
import { FunnelConversionChart } from "@/components/modules/reports/funnel-conversion-chart";
import { SalesTrendChart } from "@/components/modules/reports/sales-trend-chart";
import { OwnerLeaderboard } from "@/components/modules/reports/owner-leaderboard";
import { SourcePerformanceChart } from "@/components/modules/reports/source-performance-chart";
import { LostReasonChart } from "@/components/modules/reports/lost-reason-chart";
import { TopClientsTable } from "@/components/modules/reports/top-clients-table";
import { ClientGrowthChart } from "@/components/modules/reports/client-growth-chart";
import { FollowupWidget } from "@/components/modules/dashboard/followup-widget";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import { formatIDRCompact } from "@/lib/format";
import { Users, UserCheck, UserX, Wallet } from "lucide-react";

function RowSkeleton({ className, heights }: { className: string; heights: string[] }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {heights.map((h, i) => (
        <Skeleton key={i} className={`w-full rounded-xl ${h}`} />
      ))}
    </div>
  );
}

export default async function LeadsAnalyticsPage() {
  const user = await requireUser();

  if (!authorize(user, "lead:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view this.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
            ← Back to leads
          </Link>
          <h1 className="text-2xl font-semibold">Sales & Client Analytics</h1>
          <p className="text-muted-foreground">
            The full picture — pipeline health, team performance, and client value.
          </p>
        </div>
      </div>

      <Suspense fallback={<RowSkeleton className="sm:grid-cols-4" heights={Array(8).fill("h-32")} />}>
        <OverviewSection />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-2" heights={["h-96", "h-96"]} />}>
        <FunnelAndTrendSection />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-3" heights={["h-80", "h-64", "h-64"]} />}>
        <PerformanceSection />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-2" heights={["h-72", "h-72"]} />}>
        <ClientSection />
      </Suspense>
    </div>
  );
}

async function OverviewSection() {
  const [sales, forecast, newThisMonth] = await Promise.all([
    getSalesOverview(),
    getPipelineForecast(),
    getNewLeadsThisMonth(),
  ]);

  return <AdvancedOverviewCards sales={sales} forecast={forecast} newThisMonth={newThisMonth} />;
}

async function FunnelAndTrendSection() {
  const [funnel, trend] = await Promise.all([getFunnelConversion(), getSalesTrend(6)]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FunnelConversionChart data={funnel} />
      <SalesTrendChart trend={trend} />
    </div>
  );
}

async function PerformanceSection() {
  const [owners, sources, lostReasons, followupLeads] = await Promise.all([
    getOwnerPerformance(),
    getSourcePerformance(),
    getLostReasonBreakdown(),
    getLeadsNeedingFollowup(8),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <OwnerLeaderboard data={owners} />
      <SourcePerformanceChart data={sources} />
      <div className="space-y-4">
        <LostReasonChart data={lostReasons} />
        <FollowupWidget leads={followupLeads} />
      </div>
    </div>
  );
}

async function ClientSection() {
  const [clientStats, topClients, clientGrowth] = await Promise.all([
    getClientStats(),
    getTopClients(),
    getClientGrowthTrend(6),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">Clients</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Clients" value={clientStats.total} icon={Users} accent="indigo" />
        <KpiCard label="Active" value={clientStats.active} icon={UserCheck} accent="emerald" />
        <KpiCard
          label="Inactive / Churned"
          value={clientStats.inactive + clientStats.churned}
          icon={UserX}
          accent="amber"
        />
        <KpiCard
          label="Active Contract Value"
          value={formatIDRCompact(clientStats.activeContractValue)}
          icon={Wallet}
          accent="violet"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClientGrowthChart trend={clientGrowth} />
        <TopClientsTable data={topClients} />
      </div>
    </div>
  );
}
