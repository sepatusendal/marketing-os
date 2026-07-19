import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/**
 * First-login sync (PRD §8 "User sync"): upsert the app's User row from the
 * Supabase auth user. Called from both the PKCE callback route and the
 * hash-based invite/magic-link landing path, since Supabase can redirect
 * either way depending on how the link was generated.
 */
export async function upsertUserFromAuth(authUser: SupabaseAuthUser) {
  return prisma.user.upsert({
    where: { id: authUser.id },
    update: { email: authUser.email! },
    create: {
      id: authUser.id,
      email: authUser.email!,
      name:
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email!.split("@")[0],
    },
  });
}

export async function listActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function listAllUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function setUserActive(id: string, isActive: boolean) {
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export async function listDepartments() {
  const [users, campaigns] = await Promise.all([
    prisma.user.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.campaign.findMany({
      where: { department: { not: null } },
      select: { department: true },
    }),
  ]);
  const set = new Set<string>();
  for (const u of users) if (u.department) set.add(u.department);
  for (const c of campaigns) if (c.department) set.add(c.department);
  return [...set].sort();
}
