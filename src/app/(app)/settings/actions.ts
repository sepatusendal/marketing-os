"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize, canManageTargetUser } from "@/lib/rbac";
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
  await logActivity({
    actorId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "profile_updated",
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateEmailNotificationsAction(enabled: boolean): Promise<ActionState> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { emailNotifications: enabled } });
  await logActivity({
    actorId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "email_notifications_toggled",
    meta: { enabled },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function inviteUserAction(email: string): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "user:manage")) {
    return { error: "You don't have permission to invite users." };
  }
  if (!email.trim()) return { error: "Email is required." };

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Supabase admin client misconfigured." };
  }

  // Redirect to "/" rather than straight to "/invite/accept": the invite
  // link carries the session as a URL hash fragment, which only the root
  // page's client-side handler parses (@supabase/ssr's browser client only
  // auto-detects a "?code=" query param, not a hash) — landing directly on
  // /invite/accept left it checking for a session that was never applied.
  let error;
  try {
    ({ error } = await supabase.auth.admin.inviteUserByEmail(email.trim(), {
      redirectTo: `${process.env.APP_BASE_URL}/`,
    }));
  } catch (err) {
    // The Supabase SDK throws a raw fetch-level TypeError (not its usual
    // AuthError) when a header value is malformed — e.g. a non-ASCII
    // character in an env var — so it never reaches the `error` branch above.
    return {
      error:
        err instanceof Error
          ? `Invite failed: ${err.message}. Check APP_BASE_URL and Supabase env vars for stray characters.`
          : "Invite failed unexpectedly.",
    };
  }

  if (error) return { error: error.message };

  await logActivity({
    actorId: user.id,
    entityType: "USER",
    entityId: email.trim(),
    action: "invited",
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: Role): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "user:manage")) {
    return { error: "You don't have permission to change roles." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "User not found." };
  if (!canManageTargetUser(user, target, role)) {
    return { error: "Only an Owner can grant or change the Owner role." };
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

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "User not found." };
  if (!canManageTargetUser(user, target)) {
    return { error: "Only an Owner can change another Owner's account status." };
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
