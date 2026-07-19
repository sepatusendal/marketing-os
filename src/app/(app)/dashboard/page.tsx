import { requireUser } from "@/lib/auth";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">The state of marketing, right now.</p>
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
