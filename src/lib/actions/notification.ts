"use server";

import { requireUser } from "@/lib/auth";
import { markNotificationRead, markAllNotificationsRead } from "@/server/notification.service";

export async function markNotificationReadAction(id: string) {
  const user = await requireUser();
  await markNotificationRead(id, user.id);
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
}
