import { prisma } from "@/lib/prisma";
import { getBudgetUsedMap } from "@/server/expense.service";
import { jakartaStartOfDay, jakartaEndOfDay } from "@/lib/jakarta-time";
import type { LeadSource, LeadStatus } from "@prisma/client";

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
