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
