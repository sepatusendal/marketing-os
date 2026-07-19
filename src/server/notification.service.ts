import { prisma } from "@/lib/prisma";
import type { EntityType } from "@prisma/client";

/**
 * Row creation only — the notification bell UI lands in Phase 5 (PRD §9.3).
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
}) {
  return prisma.notification.create({ data: params });
}
