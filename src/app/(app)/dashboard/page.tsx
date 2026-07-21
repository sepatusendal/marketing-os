import { Suspense } from "react";
import { CalendarDays, Megaphone, ListTodo, AlarmClock, Wallet } from "lucide-react";
import type { User } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import { CountUp } from "@/components/ui/count-up";
import { Sparkline } from "@/components/ui/charts/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import { DashboardHeroIllustration } from "@/components/modules/dashboard/hero-illustration";
import { ACCENT_HEX } from "@/lib/accent-colors";
import type { BudgetPeriod, PerformanceRange } from "@/server/dashboard.service";
import {
  getActiveCampaigns,
  getCampaignsByStatus,
  getBudgetUsage,
  getTodaysTasks,
  getUpcomingTasks,
  getLeadSummary,
  getLeadSourceBreakdown,
  getRecentActivity,
  getCalendarEvents,
  getLeadsNeedingFollowup,
  getPerformanceTrend,
  getNewCampaignsThisWeek,
} from "@/server/dashboard.service";
import { listNotifications } from "@/server/notification.service";
import { listBoardColumns } from "@/server/board-column.service";
import { CampaignPerformanceWidget } from "@/components/modules/dashboard/campaign-performance-widget";
import { CampaignsByStatusWidget } from "@/components/modules/dashboard/campaigns-by-status-widget";
import { BudgetUsageWidget } from "@/components/modules/dashboard/budget-usage-widget";
import { UpcomingTasksWidget } from "@/components/modules/dashboard/upcoming-tasks-widget";
import { LeadSourcesWidget } from "@/components/modules/dashboard/lead-sources-widget";
import { RecentActivityWidget } from "@/components/modules/dashboard/recent-activity-widget";
import { MiniCalendarWidget } from "@/components/modules/dashboard/mini-calendar-widget";
import { NotificationsWidget } from "@/components/modules/dashboard/notifications-widget";
import { FollowupWidget } from "@/components/modules/dashboard/followup-widget";

function jakartaGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  if (hour < 11) return "Good morning";
  if (hour < 15) return "Good afternoon";
  if (hour < 19) return "Good evening";
  return "Good evening";
}

function jakartaDateLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const budgetPeriod = (params.budgetPeriod as BudgetPeriod) ?? "all";
  const performanceRange = (params.performanceRange as PerformanceRange) ?? "7d";
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <DashboardHeroIllustration />
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {jakartaGreeting()}, {firstName} 👋
          </h1>
          <Suspense fallback={<Skeleton className="h-5 w-72" />}>
            <BriefingLine />
          </Suspense>
        </div>
        <span className="glass-panel flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {jakartaDateLabel()}
        </span>
      </div>

      <Suspense fallback={<KpiRowSkeleton />}>
        <KpiRow user={user} budgetPeriod={budgetPeriod} performanceRange={performanceRange} />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-4" heights={["h-72 lg:col-span-2", "h-72", "h-72"]} />}>
        <PerformanceRow budgetPeriod={budgetPeriod} performanceRange={performanceRange} />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-3" heights={["h-64", "h-64", "h-64"]} />}>
        <LeadsTasksRow user={user} />
      </Suspense>

      <Suspense fallback={<RowSkeleton className="lg:grid-cols-3" heights={["h-72 lg:col-span-2", "h-72"]} />}>
        <CalendarNotifRow user={user} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <RecentActivitySection />
      </Suspense>
    </div>
  );
}

function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

function RowSkeleton({ className, heights }: { className: string; heights: string[] }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {heights.map((h, i) => (
        <Skeleton key={i} className={`w-full rounded-xl ${h}`} />
      ))}
    </div>
  );
}

async function BriefingLine() {
  const [activeCampaigns, followupLeads] = await Promise.all([
    getActiveCampaigns(),
    getLeadsNeedingFollowup(),
  ]);

  const briefingParts: string[] = [];
  briefingParts.push(
    activeCampaigns.length === 0
      ? "no campaigns are running right now"
      : `${activeCampaigns.length} campaign${activeCampaigns.length === 1 ? "" : "s"} running`,
  );
  if (followupLeads.length > 0) {
    briefingParts.push(
      `${followupLeads.length} lead${followupLeads.length === 1 ? "" : "s"} overdue for follow-up`,
    );
  }

  return (
    <p className="text-muted-foreground">
      {briefingParts[0].charAt(0).toUpperCase() + briefingParts[0].slice(1)}
      {briefingParts.length > 1 ? ` — ${briefingParts.slice(1).join(", ")}.` : "."}
    </p>
  );
}

async function KpiRow({
  user,
  budgetPeriod,
  performanceRange,
}: {
  user: User;
  budgetPeriod: BudgetPeriod;
  performanceRange: PerformanceRange;
}) {
  const [activeCampaigns, todaysTasks, followupLeads, leadSummary, budgetUsage, performanceTrend, newCampaignsThisWeek] =
    await Promise.all([
      getActiveCampaigns(),
      getTodaysTasks(user.id),
      getLeadsNeedingFollowup(),
      getLeadSummary(),
      getBudgetUsage(budgetPeriod),
      getPerformanceTrend(performanceRange),
      getNewCampaignsThisWeek(),
    ]);

  const overdueToday = todaysTasks.filter((t) => t.dueDate && t.dueDate < new Date()).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Active Campaigns"
        value={<CountUp value={activeCampaigns.length} />}
        icon={Megaphone}
        accent="indigo"
        secondary={
          newCampaignsThisWeek > 0
            ? `${newCampaignsThisWeek} started this week`
            : "None started this week"
        }
      />
      <KpiCard
        label="Due Today"
        value={<CountUp value={todaysTasks.length} />}
        icon={ListTodo}
        accent="blue"
        secondary={overdueToday > 0 ? `${overdueToday} overdue` : "All on schedule"}
      />
      <KpiCard
        label="Leads Need Follow-up"
        value={<CountUp value={followupLeads.length} />}
        icon={AlarmClock}
        accent="red"
        secondary={`${leadSummary.newLast7Days} new lead${leadSummary.newLast7Days === 1 ? "" : "s"} this week`}
      />
      <KpiCard
        label="Budget Used"
        value={<CountUp value={budgetUsage.percentUsed} suffix="%" />}
        icon={Wallet}
        accent="amber"
        secondary={`${formatIDR(budgetUsage.used)} spent`}
        sparkline={
          performanceTrend.budgetSpent.some((v) => v > 0) ? (
            <Sparkline values={performanceTrend.budgetSpent} colorVar={ACCENT_HEX.amber} />
          ) : undefined
        }
      />
    </div>
  );
}

async function PerformanceRow({
  budgetPeriod,
  performanceRange,
}: {
  budgetPeriod: BudgetPeriod;
  performanceRange: PerformanceRange;
}) {
  const [performanceTrend, budgetUsage, campaignsByStatus] = await Promise.all([
    getPerformanceTrend(performanceRange),
    getBudgetUsage(budgetPeriod),
    getCampaignsByStatus(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <CampaignPerformanceWidget trend={performanceTrend} range={performanceRange} />
      </div>
      <BudgetUsageWidget usage={budgetUsage} period={budgetPeriod} />
      <CampaignsByStatusWidget data={campaignsByStatus} />
    </div>
  );
}

async function LeadsTasksRow({ user }: { user: User }) {
  const [followupLeads, leadSources, upcomingTasks, boardColumns] = await Promise.all([
    getLeadsNeedingFollowup(),
    getLeadSourceBreakdown(),
    getUpcomingTasks(user.id),
    listBoardColumns(),
  ]);
  const completedColumn = boardColumns.find((c) => c.status === "COMPLETED") ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <FollowupWidget leads={followupLeads} />
      <LeadSourcesWidget data={leadSources} />
      <UpcomingTasksWidget tasks={upcomingTasks} completedColumnId={completedColumn?.id ?? null} />
    </div>
  );
}

async function CalendarNotifRow({ user }: { user: User }) {
  const [calendarEvents, notifications] = await Promise.all([
    getCalendarEvents(new Date()),
    listNotifications(user.id),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <MiniCalendarWidget events={calendarEvents} />
      </div>
      <NotificationsWidget notifications={notifications} />
    </div>
  );
}

async function RecentActivitySection() {
  const recentActivity = await getRecentActivity();
  return <RecentActivityWidget entries={recentActivity} />;
}
