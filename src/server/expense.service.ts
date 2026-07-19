import { prisma } from "@/lib/prisma";
import type { Prisma, ExpenseCategory } from "@prisma/client";
import type { CreateExpenseInput } from "@/lib/schemas/expense";

/**
 * Single source of truth for "budget used" on a campaign — every view
 * (campaign list, campaign detail, global budget page) must call this
 * rather than re-deriving the sum, so totals can never drift apart.
 */
export async function getCampaignBudgetUsed(campaignId: string) {
  const result = await prisma.expense.aggregate({
    where: { campaignId },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function getBudgetUsedMap(campaignIds: string[]) {
  if (campaignIds.length === 0) return {} as Record<string, number>;

  const sums = await prisma.expense.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaignIds } },
    _sum: { amount: true },
  });

  return Object.fromEntries(
    sums.map((s) => [s.campaignId, Number(s._sum.amount ?? 0)]),
  ) as Record<string, number>;
}

export async function listCampaignBudgetSummaries() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, name: true, budgetAllocated: true, status: true },
    orderBy: { name: "asc" },
  });

  const usedMap = await getBudgetUsedMap(campaigns.map((c) => c.id));

  return campaigns.map((c) => {
    const allocated = Number(c.budgetAllocated);
    const used = usedMap[c.id] ?? 0;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      allocated,
      used,
      remaining: allocated - used,
      percentUsed: allocated > 0 ? Math.round((used / allocated) * 100) : 0,
    };
  });
}

export type ExpenseListFilters = {
  campaignId?: string;
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
};

export async function listExpenses(filters: ExpenseListFilters = {}) {
  const where: Prisma.ExpenseWhereInput = {
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          spentAt: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
  };

  return prisma.expense.findMany({
    where,
    include: { campaign: { select: { id: true, name: true } }, createdBy: true },
    orderBy: { spentAt: "desc" },
  });
}

export async function categoryBreakdown(campaignId?: string) {
  const sums = await prisma.expense.groupBy({
    by: ["category"],
    where: campaignId ? { campaignId } : undefined,
    _sum: { amount: true },
  });

  return sums
    .map((s) => ({ category: s.category, total: Number(s._sum.amount ?? 0) }))
    .sort((a, b) => b.total - a.total);
}

export async function createExpense(input: CreateExpenseInput, createdById: string) {
  return prisma.expense.create({
    data: {
      campaignId: input.campaignId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      spentAt: new Date(input.spentAt),
      createdById,
    },
  });
}
