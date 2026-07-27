import { prisma } from "@/lib/prisma";
import { getBudgetUsedMap } from "@/server/expense.service";
import { jakartaStartOfDay, jakartaEndOfDay } from "@/lib/jakarta-time";
import type { LeadSource, LeadStatus, Prisma } from "@prisma/client";

export async function getCampaignPerformanceReport() {
  const campaigns = await prisma.campaign.findMany({
    include: { tasks: { select: { status: true } } },
    orderBy: { name: "asc" },
  });

  const usedMap = await getBudgetUsedMap(campaigns.map((c) => c.id));

  return campaigns.map((c) => {
    const totalTasks = c.tasks.length;
    const completedTasks = c.tasks.filter((t) => t.status === "COMPLETED").length;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      budgetAllocated: Number(c.budgetAllocated),
      budgetUsed: usedMap[c.id] ?? 0,
      targetKpi: (c.targetKpi as { name: string; target: number; unit?: string }[] | null) ?? [],
      actualKpi: (c.actualKpi as { name: string; actual: number }[] | null) ?? [],
      taskCompletionPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });
}

export type ReportDateRange = { dateFrom?: string; dateTo?: string };

function leadDateWhere(range: ReportDateRange): Prisma.LeadWhereInput {
  if (!range.dateFrom && !range.dateTo) return {};
  return {
    createdAt: {
      ...(range.dateFrom ? { gte: jakartaStartOfDay(new Date(range.dateFrom)) } : {}),
      ...(range.dateTo ? { lte: jakartaEndOfDay(new Date(range.dateTo)) } : {}),
    },
  };
}

export async function getLeadFunnelReport(range: ReportDateRange = {}) {
  const where = {
    ...(range.dateFrom || range.dateTo
      ? {
          createdAt: {
            ...(range.dateFrom ? { gte: jakartaStartOfDay(new Date(range.dateFrom)) } : {}),
            ...(range.dateTo ? { lte: jakartaEndOfDay(new Date(range.dateTo)) } : {}),
          },
        }
      : {}),
  };

  const leads = await prisma.lead.findMany({ where, select: { source: true, status: true } });

  const sources = [...new Set(leads.map((l) => l.source))].sort();
  const statuses: LeadStatus[] = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "INTERNAL_REVIEW",
    "NEGOTIATION",
    "WON",
    "LOST",
  ];

  return sources.map((source: LeadSource) => {
    const sourceLeads = leads.filter((l) => l.source === source);
    const total = sourceLeads.length;
    const won = sourceLeads.filter((l) => l.status === "WON").length;
    return {
      source,
      total,
      byStatus: statuses.map((status) => ({
        status,
        count: sourceLeads.filter((l) => l.status === status).length,
      })),
      conversionPercent: total > 0 ? Math.round((won / total) * 100) : 0,
    };
  });
}

export async function getBudgetByCategoryReport(range: ReportDateRange = {}) {
  const expenses = await prisma.expense.findMany({
    where: {
      ...(range.dateFrom || range.dateTo
        ? {
            spentAt: {
              ...(range.dateFrom ? { gte: jakartaStartOfDay(new Date(range.dateFrom)) } : {}),
              ...(range.dateTo ? { lte: jakartaEndOfDay(new Date(range.dateTo)) } : {}),
            },
          }
        : {}),
    },
    select: { category: true, amount: true, spentAt: true },
  });

  const rows = new Map<string, number>();
  for (const e of expenses) {
    const month = e.spentAt.toISOString().slice(0, 7); // YYYY-MM
    const key = `${e.category}::${month}`;
    rows.set(key, (rows.get(key) ?? 0) + Number(e.amount));
  }

  return [...rows.entries()]
    .map(([key, total]) => {
      const [category, month] = key.split("::");
      return { category, month, total };
    })
    .sort((a, b) => (a.month === b.month ? a.category.localeCompare(b.category) : a.month.localeCompare(b.month)));
}

/**
 * Top-line sales KPIs (HubSpot-style deal summary). Aggregate queries only —
 * never fetches every lead row into memory, so this stays cheap even with a
 * large pipeline.
 */
export async function getSalesOverview(range: ReportDateRange = {}) {
  const where = leadDateWhere(range);

  const [byStatus, wonAgg, openAgg, wonForCycle] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where, _count: true }),
    prisma.lead.aggregate({
      where: { ...where, status: "WON" },
      _sum: { potentialRevenue: true },
    }),
    prisma.lead.aggregate({
      where: { ...where, status: { notIn: ["WON", "LOST"] } },
      _sum: { potentialRevenue: true },
    }),
    // Sales-cycle length approximated from createdAt -> updatedAt on Won
    // leads (the last write is almost always the WON status change) — good
    // enough for a dashboard metric without adding a dedicated timestamp
    // column just to track it precisely.
    prisma.lead.findMany({
      where: { ...where, status: "WON" },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count])) as Record<
    LeadStatus,
    number
  >;
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const won = counts.WON ?? 0;
  const lost = counts.LOST ?? 0;
  const decided = won + lost;
  const wonRevenue = Number(wonAgg._sum.potentialRevenue ?? 0);

  const avgCycleDays =
    wonForCycle.length > 0
      ? Math.round(
          wonForCycle.reduce((sum, l) => sum + (l.updatedAt.getTime() - l.createdAt.getTime()), 0) /
            wonForCycle.length /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  return {
    total,
    won,
    lost,
    open: total - won - lost,
    winRate: decided > 0 ? Math.round((won / decided) * 1000) / 10 : 0,
    openPipelineValue: (openAgg._sum.potentialRevenue ?? 0).toString(),
    wonRevenue: wonRevenue.toString(),
    avgDealSize: won > 0 ? Math.round(wonRevenue / won) : 0,
    avgCycleDays,
  };
}

/** Per-source performance — total leads, won count, win rate, revenue attributed. */
export async function getSourcePerformance(range: ReportDateRange = {}) {
  const where = leadDateWhere(range);
  const rows = await prisma.lead.groupBy({
    by: ["source", "status"],
    where,
    _count: true,
    _sum: { potentialRevenue: true },
  });

  const sources = [...new Set(rows.map((r) => r.source))];

  return sources
    .map((source) => {
      const sourceRows = rows.filter((r) => r.source === source);
      const total = sourceRows.reduce((sum, r) => sum + r._count, 0);
      const won = sourceRows.find((r) => r.status === "WON")?._count ?? 0;
      const lost = sourceRows.find((r) => r.status === "LOST")?._count ?? 0;
      const decided = won + lost;
      const revenue = sourceRows.find((r) => r.status === "WON")?._sum.potentialRevenue ?? 0;
      return {
        source,
        total,
        won,
        winRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
        revenue: Number(revenue).toString(),
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Breakdown of why Lost leads were lost — structured since D-day, LeadLostReason. */
export async function getLostReasonBreakdown(range: ReportDateRange = {}) {
  const where = leadDateWhere(range);
  const rows = await prisma.lead.groupBy({
    by: ["lostReason"],
    where: { ...where, status: "LOST" },
    _count: true,
  });

  const total = rows.reduce((sum, r) => sum + r._count, 0);

  return rows
    .map((r) => ({
      reason: r.lostReason ?? "OTHER",
      count: r._count,
      percent: total > 0 ? Math.round((r._count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
