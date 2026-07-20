import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  startOfDay,
  subDays,
  endOfDay,
  eachDayOfInterval,
  format,
} from "date-fns";
import type { CampaignStatus, LeadStatus, LeadSource } from "@prisma/client";
import { FOLLOWUP_SLA_HOURS } from "@/lib/lead-followup";

export async function getActiveCampaigns() {
  return prisma.campaign.findMany({
    where: { status: "RUNNING" },
    include: { owner: true },
    orderBy: { endDate: "asc" },
  });
}

export async function getCampaignsByStatus() {
  const rows = await prisma.campaign.groupBy({ by: ["status"], _count: true });
  const counts = Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<
    CampaignStatus,
    number
  >;
  const order: CampaignStatus[] = ["DRAFT", "PLANNING", "RUNNING", "COMPLETED", "ARCHIVED"];
  return order.map((status) => ({ status, count: counts[status] ?? 0 }));
}

export type BudgetPeriod = "month" | "quarter" | "all";

export async function getBudgetUsage(period: BudgetPeriod) {
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
}

export async function getTodaysTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "COMPLETED" },
      dueDate: { lte: endOfDay(new Date()) },
    },
    include: { campaign: { select: { id: true, name: true } }, assignee: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function getLeadSummary() {
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
}

/** Active leads not contacted within the follow-up SLA window (48h) — see lib/lead-followup.ts. */
export async function getLeadsNeedingFollowup() {
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
    take: 10,
  });
}

export async function getRecentActivity(limit = 20) {
  return prisma.activityLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCalendarEvents(referenceDate: Date) {
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
}

export type PerformanceRange = "7d" | "30d" | "month";

function rangeStart(range: PerformanceRange): Date {
  const now = new Date();
  if (range === "7d") return startOfDay(subDays(now, 6));
  if (range === "30d") return startOfDay(subDays(now, 29));
  return startOfMonth(now);
}

/**
 * Real, trackable performance signal — new leads, budget spent, and tasks
 * completed per day. Deliberately does NOT include ad-platform metrics
 * (impressions/reach/clicks): MarketingOS has no Meta/Google Ads
 * integration (PRD §4 non-goal), so those numbers don't exist anywhere in
 * the database and would have to be fabricated to show them.
 */
export async function getPerformanceTrend(range: PerformanceRange) {
  const from = rangeStart(range);
  const days = eachDayOfInterval({ start: from, end: new Date() });
  const dayKeys = days.map((d) => format(d, "yyyy-MM-dd"));

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
    const key = format(l.createdAt, "yyyy-MM-dd");
    newLeadsByDay.set(key, (newLeadsByDay.get(key) ?? 0) + 1);
  }
  const tasksCompletedByDay = new Map<string, number>();
  for (const t of tasks) {
    const key = format(t.updatedAt, "yyyy-MM-dd");
    tasksCompletedByDay.set(key, (tasksCompletedByDay.get(key) ?? 0) + 1);
  }
  const budgetSpentByDay = new Map<string, number>();
  for (const e of expenses) {
    const key = format(e.spentAt, "yyyy-MM-dd");
    budgetSpentByDay.set(key, (budgetSpentByDay.get(key) ?? 0) + Number(e.amount));
  }

  return {
    labels: dayKeys.map((k) => format(new Date(k), "MMM d")),
    newLeads: dayKeys.map((k) => newLeadsByDay.get(k) ?? 0),
    tasksCompleted: dayKeys.map((k) => tasksCompletedByDay.get(k) ?? 0),
    budgetSpent: dayKeys.map((k) => budgetSpentByDay.get(k) ?? 0),
  };
}

export async function getLeadSourceBreakdown() {
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
}

export async function getUpcomingTasks(userId: string, days = 7) {
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "COMPLETED" },
      dueDate: { lte: endOfDay(subDays(new Date(), -days)) },
    },
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
    take: 8,
  });
}

/** Real "new this week" context for the Active Campaigns KPI card — never a fabricated percentage. */
export async function getNewCampaignsThisWeek() {
  return prisma.campaign.count({ where: { startDate: { gte: subDays(new Date(), 7) } } });
}
