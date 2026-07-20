import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  subDays,
  endOfDay,
} from "date-fns";
import type { CampaignStatus, LeadStatus } from "@prisma/client";
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
