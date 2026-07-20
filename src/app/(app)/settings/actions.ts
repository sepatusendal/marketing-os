"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserRole, setUserActive } from "@/server/user.service";
import { logActivity } from "@/server/activity.service";
import type { Role } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

export async function updateProfileNameAction(name: string): Promise<ActionState> {
  const user = await requireUser();
  if (!name.trim()) return { error: "Name cannot be empty." };

  await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateEmailNotificationsAction(enabled: boolean): Promise<ActionState> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { emailNotifications: enabled } });
  revalidatePath("/settings");
  return { success: true };
}

export async function inviteUserAction(email: string): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "user:manage")) {
    return { error: "You don't have permission to invite users." };
  }
  if (!email.trim()) return { error: "Email is required." };

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: `${process.env.APP_BASE_URL}/invite/accept`,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: Role): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "user:manage")) {
    return { error: "You don't have permission to change roles." };
  }

  await updateUserRole(userId, role);
  await logActivity({
    actorId: user.id,
    entityType: "USER",
    entityId: userId,
    action: "role_changed",
    meta: { to: role },
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function setUserActiveAction(userId: string, isActive: boolean): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "user:manage")) {
    return { error: "You don't have permission to change user status." };
  }
  if (userId === user.id) {
    return { error: "You can't deactivate your own account." };
  }

  await setUserActive(userId, isActive);
  await logActivity({
    actorId: user.id,
    entityType: "USER",
    entityId: userId,
    action: isActive ? "activated" : "deactivated",
  });

  revalidatePath("/settings/users");
  return { success: true };
}
