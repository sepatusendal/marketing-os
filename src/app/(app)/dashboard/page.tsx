import { getCurrentUser } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import type { BudgetPeriod } from "@/server/dashboard.service";
import {
  getActiveCampaigns,
  getCampaignsByStatus,
  getBudgetUsage,
  getTodaysTasks,
  getLeadSummary,
  getRecentActivity,
  getCalendarEvents,
} from "@/server/dashboard.service";
import { listNotifications } from "@/server/notification.service";
import { ActiveCampaignsWidget } from "@/components/modules/dashboard/active-campaigns-widget";
import { CampaignsByStatusWidget } from "@/components/modules/dashboard/campaigns-by-status-widget";
import { BudgetUsageWidget } from "@/components/modules/dashboard/budget-usage-widget";
import { TodaysTasksWidget } from "@/components/modules/dashboard/todays-tasks-widget";
import { LeadSummaryWidget } from "@/components/modules/dashboard/lead-summary-widget";
import { RecentActivityWidget } from "@/components/modules/dashboard/recent-activity-widget";
import { MiniCalendarWidget } from "@/components/modules/dashboard/mini-calendar-widget";
import { NotificationsWidget } from "@/components/modules/dashboard/notifications-widget";

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

  const [
    activeCampaigns,
    campaignsByStatus,
    budgetUsage,
    todaysTasks,
    leadSummary,
    recentActivity,
    calendarEvents,
    notifications,
  ] = await Promise.all([
    getActiveCampaigns(),
    getCampaignsByStatus(),
    getBudgetUsage(budgetPeriod),
    getTodaysTasks(user.id),
    getLeadSummary(),
    getRecentActivity(),
    getCalendarEvents(new Date()),
    listNotifications(user.id),
  ]);

  const firstName = user.name.split(" ")[0];
  const overdueOrDueToday = todaysTasks.length;
  const staleLeads = leadSummary.byStatus.find((s) => s.status === "NEW")?.count ?? 0;

  const briefingParts: string[] = [];
  briefingParts.push(
    activeCampaigns.length === 0
      ? "no campaigns are running right now"
      : `${activeCampaigns.length} campaign${activeCampaigns.length === 1 ? "" : "s"} running`,
  );
  if (overdueOrDueToday > 0) {
    briefingParts.push(`${overdueOrDueToday} task${overdueOrDueToday === 1 ? "" : "s"} on your plate today`);
  }
  if (staleLeads > 0) {
    briefingParts.push(`${staleLeads} new lead${staleLeads === 1 ? "" : "s"} waiting on a first touch`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{jakartaDateLabel()}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {jakartaGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground">
          {briefingParts[0].charAt(0).toUpperCase() + briefingParts[0].slice(1)}
          {briefingParts.length > 1 ? ` — ${briefingParts.slice(1).join(", ")}.` : "."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active campaigns</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {activeCampaigns.length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Due today</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {todaysTasks.length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Budget used</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {budgetUsage.percentUsed}%
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              of {formatIDR(budgetUsage.allocated)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActiveCampaignsWidget campaigns={activeCampaigns} />
        <CampaignsByStatusWidget data={campaignsByStatus} />
        <BudgetUsageWidget usage={budgetUsage} period={budgetPeriod} />
        <TodaysTasksWidget tasks={todaysTasks} />
        <LeadSummaryWidget summary={leadSummary} />
        <MiniCalendarWidget events={calendarEvents} />
        <NotificationsWidget notifications={notifications} />
        <div className="md:col-span-2">
          <RecentActivityWidget entries={recentActivity} />
        </div>
      </div>
    </div>
  );
}
