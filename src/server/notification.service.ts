import { prisma } from "@/lib/prisma";
import type { EntityType } from "@prisma/client";
import { sendNotificationEmail } from "@/lib/email";

/**
 * Single hook point for both in-app and email notifications (PRD D10, amended:
 * notifications are in-app plus email). Every existing call site (task
 * assignment, @mention, lead-won, budget threshold) gets email for free.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
}) {
  const notification = await prisma.notification.create({ data: params });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, emailNotifications: true },
  });
  if (user?.emailNotifications) {
    await sendNotificationEmail({
      to: user.email,
      subject: "MarketingOS notification",
      body: `${params.message}\n\n${process.env.APP_BASE_URL ?? ""}`,
    });
  }

  return notification;
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
