import { prisma } from "@/lib/prisma";
import type { CampaignStatus, Prisma } from "@prisma/client";
import type { CreateCampaignInput, UpdateCampaignInput } from "@/lib/schemas/campaign";

const PAGE_SIZE = 25;

export type CampaignListFilters = {
  status?: CampaignStatus;
  department?: string;
  ownerId?: string;
  search?: string;
  cursor?: string;
};

async function getBudgetUsedMap(campaignIds: string[]) {
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

export async function listCampaigns(filters: CampaignListFilters = {}) {
  const where: Prisma.CampaignWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" } }
      : {}),
  };

  const rows = await prisma.campaign.findMany({
    where,
    include: { owner: true },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const budgetUsedByCampaign = await getBudgetUsedMap(items.map((c) => c.id));

  return {
    campaigns: items.map((c) => ({
      ...c,
      budgetUsed: budgetUsedByCampaign[c.id] ?? 0,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function getCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { owner: true },
  });
  if (!campaign) return null;

  const usedResult = await prisma.expense.aggregate({
    where: { campaignId: id },
    _sum: { amount: true },
  });
  const budgetUsed = Number(usedResult._sum.amount ?? 0);

  return {
    ...campaign,
    budgetUsed,
    budgetRemaining: Number(campaign.budgetAllocated) - budgetUsed,
  };
}

export async function listCampaignOptions() {
  return prisma.campaign.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function listDepartments() {
  const rows = await prisma.campaign.findMany({
    where: { department: { not: null } },
    select: { department: true },
    distinct: ["department"],
  });
  return rows.map((r) => r.department!).sort();
}

export async function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      name: input.name,
      objective: input.objective || null,
      department: input.department || null,
      ownerId: input.ownerId,
      priority: input.priority,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      budgetAllocated: input.budgetAllocated,
      description: input.description || null,
      targetKpi: input.targetKpi ?? undefined,
    },
  });
}

export async function updateCampaign(input: UpdateCampaignInput) {
  return prisma.campaign.update({
    where: { id: input.id },
    data: {
      name: input.name,
      objective: input.objective || null,
      department: input.department || null,
      ownerId: input.ownerId,
      priority: input.priority,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      budgetAllocated: input.budgetAllocated,
      description: input.description || null,
      targetKpi: input.targetKpi ?? undefined,
      actualKpi: input.actualKpi ?? undefined,
    },
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({ where: { id }, data: { status } });
}
