import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import {
  getCampaignPerformanceReport,
  getLeadFunnelReport,
  getBudgetByCategoryReport,
  getSalesOverview,
  getSourcePerformance,
  getLostReasonBreakdown,
} from "@/server/report.service";
import { getClientStats } from "@/server/client.service";
import { ReportDateFilter } from "@/components/modules/reports/report-date-filter";
import { FunnelChart } from "@/components/modules/reports/funnel-chart";
import { SalesOverviewCards } from "@/components/modules/reports/sales-overview-cards";
import { SourcePerformanceChart } from "@/components/modules/reports/source-performance-chart";
import { LostReasonChart } from "@/components/modules/reports/lost-reason-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatIDR, formatIDRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Download, Users, UserCheck, UserX, Wallet } from "lucide-react";

function ExportLink({ href }: { href: string }) {
  return (
    <a href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
      <Download className="mr-1 h-4 w-4" />
      Export CSV
    </a>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  if (!authorize(user, "reports:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view reports.</p>
      </div>
    );
  }

  const range = { dateFrom: params.dateFrom, dateTo: params.dateTo };
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(range).filter(([, v]) => v)) as Record<string, string>,
  ).toString();

  const [campaignPerf, leadFunnel, budgetByCategory, salesOverview, sourcePerf, lostReasons, clientStats] =
    await Promise.all([
      getCampaignPerformanceReport(),
      getLeadFunnelReport(range),
      getBudgetByCategoryReport(range),
      getSalesOverview(range),
      getSourcePerformance(range),
      getLostReasonBreakdown(range),
      getClientStats(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <ReportDateFilter />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SalesOverviewCards sales={salesOverview} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SourcePerformanceChart data={sourcePerf} />
            <LostReasonChart data={lostReasons} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Clients</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard size="sm" label="Total Clients" value={clientStats.total} icon={Users} accent="indigo" />
              <KpiCard size="sm" label="Active" value={clientStats.active} icon={UserCheck} accent="emerald" />
              <KpiCard
                size="sm"
                label="Inactive / Churned"
                value={clientStats.inactive + clientStats.churned}
                icon={UserX}
                accent="amber"
              />
              <KpiCard
                size="sm"
                label="Active Contract Value"
                value={formatIDRCompact(clientStats.activeContractValue)}
                icon={Wallet}
                accent="violet"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Campaign Performance</CardTitle>
          <ExportLink href="/api/reports/campaign-performance" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>KPI (target / actual)</TableHead>
                <TableHead className="text-right">Task Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignPerf.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No campaigns yet.
                  </TableCell>
                </TableRow>
              ) : (
                campaignPerf.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatIDR(c.budgetUsed)} / {formatIDR(c.budgetAllocated)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.targetKpi.length === 0
                        ? "—"
                        : c.targetKpi
                            .map((k) => {
                              const actual = c.actualKpi.find((a) => a.name === k.name)?.actual;
                              return `${k.name}: ${actual ?? "—"} / ${k.target}${k.unit ?? ""}`;
                            })
                            .join(", ")}
                    </TableCell>
                    <TableCell className="text-right">{c.taskCompletionPercent}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lead Funnel</CardTitle>
          <ExportLink href={`/api/reports/lead-funnel?${query}`} />
        </CardHeader>
        <CardContent>
          <FunnelChart rows={leadFunnel} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Contacted</TableHead>
                <TableHead className="text-right">Qualified</TableHead>
                <TableHead className="text-right">Proposal</TableHead>
                <TableHead className="text-right">Review</TableHead>
                <TableHead className="text-right">Negotiation</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Lost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadFunnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                    No leads in this range.
                  </TableCell>
                </TableRow>
              ) : (
                leadFunnel.map((r) => (
                  <TableRow key={r.source}>
                    <TableCell className="font-medium">{r.source}</TableCell>
                    {r.byStatus.map((s) => (
                      <TableCell key={s.status} className="text-right">
                        {s.count}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">{r.total}</TableCell>
                    <TableCell className="text-right">{r.conversionPercent}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Budget by Category</CardTitle>
          <ExportLink href={`/api/reports/budget-by-category?${query}`} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetByCategory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No expenses in this range.
                  </TableCell>
                </TableRow>
              ) : (
                budgetByCategory.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell>{r.category.replaceAll("_", " ")}</TableCell>
                    <TableCell className="text-right">{formatIDR(r.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
