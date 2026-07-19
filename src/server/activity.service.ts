import { prisma } from "@/lib/prisma";
import type { EntityType, Prisma } from "@prisma/client";

/**
 * Every mutation must call this. It backs Dashboard Recent Activity,
 * Campaign Timeline, and the audit trail (PRD §9.9) — a skipped call
 * creates an invisible gap in all three.
 */
export async function logActivity(params: {
  actorId: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.activityLog.create({ data: params });
}

export async function listActivityForEntity(entityType: EntityType, entityId: string) {
  return prisma.activityLog.findMany({
    where: { entityType, entityId },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Campaign Timeline (PRD §9.2) includes the campaign's own activity plus
 * its children (tasks, expenses) — ActivityLog has no campaignId column,
 * so child entries are pulled by first collecting task/expense ids.
 */
export async function listCampaignTimeline(campaignId: string) {
  const [tasks, expenses] = await Promise.all([
    prisma.task.findMany({ where: { campaignId }, select: { id: true } }),
    prisma.expense.findMany({ where: { campaignId }, select: { id: true } }),
  ]);

  return prisma.activityLog.findMany({
    where: {
      OR: [
        { entityType: "CAMPAIGN", entityId: campaignId },
        { entityType: "TASK", entityId: { in: tasks.map((t) => t.id) } },
        { entityType: "EXPENSE", entityId: { in: expenses.map((e) => e.id) } },
      ],
    },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
  });
}
