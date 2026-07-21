import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  subDays,
} from "date-fns";
import type { CampaignStatus, LeadStatus, LeadSource } from "@prisma/client";
import { FOLLOWUP_SLA_HOURS } from "@/lib/lead-followup";
import { jakartaDayKey, jakartaDayLabel, jakartaStartOfDay, jakartaStartOfMonth, jakartaDayRange, jakartaEndOfDay } from "@/lib/jakarta-time";

// Wrapped in React's cache() so the dashboard's Suspense-streamed sections
// can each request the same data independently without re-querying the
// database — React dedupes calls with equal arguments within one request.

export const getActiveCampaigns = cache(async function getActiveCampaigns() {
  return prisma.campaign.findMany({
    where: { status: "RUNNING" },
    include: { owner: true },
    orderBy: { endDate: "asc" },
  });
});

export const getCampaignsByStatus = cache(async function getCampaignsByStatus() {
  const rows = await prisma.campaign.groupBy({ by: ["status"], _count: true });
  const counts = Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<
    CampaignStatus,
    number
  >;
  const order: CampaignStatus[] = ["DRAFT", "PLANNING", "RUNNING", "COMPLETED", "ARCHIVED"];
  return order.map((status) => ({ status, count: counts[status] ?? 0 }));
});

export type BudgetPeriod = "month" | "quarter" | "all";

export const getBudgetUsage = cache(async function getBudgetUsage(period: BudgetPeriod) {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, budgetAllocated: true },
  });
  const allocated = campaigns.reduce((sum, c) => sum + Number(c.budgetAllocated), 0);

  const dateFrom =
    period === "month"
      ? startOfMonth(new Date())
      : period === "quarter"
        ? startOfQuarter(new Date())
        : undefined;

  const usedResult = await prisma.expense.aggregate({
    where: {
      campaignId: { in: campaigns.map((c) => c.id) },
      ...(dateFrom ? { spentAt: { gte: dateFrom } } : {}),
    },
    _sum: { amount: true },
  });
  const used = Number(usedResult._sum.amount ?? 0);

  return {
    allocated,
    used,
    remaining: allocated - used,
    percentUsed: allocated > 0 ? Math.round((used / allocated) * 100) : 0,
  };
});

export const getTodaysTasks = cache(async function getTodaysTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "COMPLETED" },
      dueDate: { lte: jakartaEndOfDay(new Date()) },
    },
    include: { campaign: { select: { id: true, name: true } }, assignee: true },
    orderBy: { dueDate: "asc" },
  });
});

export const getLeadSummary = cache(async function getLeadSummary() {
  const [byStatus, newLast7Days] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.count({ where: { createdAt: { gte: subDays(new Date(), 7) } } }),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count])) as Record<
    LeadStatus,
    number
  >;
  const order: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST"];

  return {
    byStatus: order.map((status) => ({ status, count: counts[status] ?? 0 })),
    newLast7Days,
  };
});

/** Active leads not contacted within the follow-up SLA window (48h) — see lib/lead-followup.ts. */
// `limit` defaults to 10 for the dashboard widget's display purposes only —
// pass `null` explicitly for consumers (like the follow-up notification
// trigger) that must see every overdue lead, not just the 10 most-stale.
// (A default parameter only kicks in for `undefined`, not `null`, so `null`
// is the sentinel that actually reaches the query as "no limit".)
export const getLeadsNeedingFollowup = cache(async function getLeadsNeedingFollowup(
  limit: number | null = 10,
) {
  const slaThreshold = new Date(Date.now() - FOLLOWUP_SLA_HOURS * 60 * 60 * 1000);

  return prisma.lead.findMany({
    where: {
      status: { notIn: ["WON", "LOST"] },
      OR: [
        { lastContactAt: { lt: slaThreshold } },
        { lastContactAt: null, createdAt: { lt: slaThreshold } },
      ],
    },
    include: { owner: true, campaign: { select: { id: true, name: true } } },
    orderBy: { lastContactAt: "asc" },
    take: limit ?? undefined,
  });
});

export const getRecentActivity = cache(async function getRecentActivity(limit = 20) {
  return prisma.activityLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
});

export const getCalendarEvents = cache(async function getCalendarEvents(referenceDate: Date) {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);

  const [campaigns, tasks] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
        ],
      },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: start, lte: end } },
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  return { campaigns, tasks };
});

export type PerformanceRange = "7d" | "30d" | "month";

function rangeStart(range: PerformanceRange): Date {
  const now = new Date();
  if (range === "7d") return jakartaStartOfDay(subDays(now, 6));
  if (range === "30d") return jakartaStartOfDay(subDays(now, 29));
  return jakartaStartOfMonth(now);
}

/**
 * Real, trackable performance signal — new leads, budget spent, and tasks
 * completed per day. Deliberately does NOT include ad-platform metrics
 * (impressions/reach/clicks): MarketingOS has no Meta/Google Ads
 * integration (PRD §4 non-goal), so those numbers don't exist anywhere in
 * the database and would have to be fabricated to show them.
 *
 * Day buckets are Jakarta calendar days (CLAUDE.md: store UTC, display
 * Asia/Jakarta) — bucketing by the server process's own local time (UTC on
 * Vercel) would misattribute anything from 00:00–06:59 WIB to the previous day.
 */
export const getPerformanceTrend = cache(async function getPerformanceTrend(range: PerformanceRange) {
  const from = rangeStart(range);
  const now = new Date();
  const days = jakartaDayRange(from, now);
  const dayKeys = days.map((d) => jakartaDayKey(d));

  const [leads, tasks, expenses] = await Promise.all([
    prisma.lead.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    prisma.task.findMany({
      where: { status: "COMPLETED", updatedAt: { gte: from } },
      select: { updatedAt: true },
    }),
    prisma.expense.findMany({ where: { spentAt: { gte: from } }, select: { spentAt: true, amount: true } }),
  ]);

  const newLeadsByDay = new Map<string, number>();
  for (const l of leads) {
    const key = jakartaDayKey(l.createdAt);
    newLeadsByDay.set(key, (newLeadsByDay.get(key) ?? 0) + 1);
  }
  const tasksCompletedByDay = new Map<string, number>();
  for (const t of tasks) {
    const key = jakartaDayKey(t.updatedAt);
    tasksCompletedByDay.set(key, (tasksCompletedByDay.get(key) ?? 0) + 1);
  }
  const budgetSpentByDay = new Map<string, number>();
  for (const e of expenses) {
    const key = jakartaDayKey(e.spentAt);
    budgetSpentByDay.set(key, (budgetSpentByDay.get(key) ?? 0) + Number(e.amount));
  }

  return {
    labels: days.map((d) => jakartaDayLabel(d)),
    newLeads: dayKeys.map((k) => newLeadsByDay.get(k) ?? 0),
    tasksCompleted: dayKeys.map((k) => tasksCompletedByDay.get(k) ?? 0),
    budgetSpent: dayKeys.map((k) => budgetSpentByDay.get(k) ?? 0),
  };
});

export const getLeadSourceBreakdown = cache(async function getLeadSourceBreakdown() {
  const rows = await prisma.lead.groupBy({ by: ["source"], _count: true });
  const counts = Object.fromEntries(rows.map((r) => [r.source, r._count])) as Record<LeadSource, number>;
  const order: LeadSource[] = [
    "WEBSITE",
    "INSTAGRAM",
    "WHATSAPP",
    "REFERRAL",
    "PAID_ADS",
    "EMAIL",
    "TIKTOK",
    "EVENT",
    "OTHER",
  ];
  return order.map((source) => ({ source, count: counts[source] ?? 0 })).filter((d) => d.count > 0);
});

export const getUpcomingTasks = cache(async function getUpcomingTasks(userId: string, days = 7) {
  const cutoff = jakartaStartOfDay(subDays(new Date(), -days - 1)); // Jakarta midnight, `days` days from today, exclusive
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "COMPLETED" },
      dueDate: { lt: cutoff },
    },
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
    take: 8,
  });
});

/** Real "new this week" context for the Active Campaigns KPI card — never a fabricated percentage. */
export const getNewCampaignsThisWeek = cache(async function getNewCampaignsThisWeek() {
  return prisma.campaign.count({
    where: { startDate: { gte: jakartaStartOfDay(subDays(new Date(), 6)) } },
  });
});
