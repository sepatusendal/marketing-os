import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/rbac";

/**
 * Resolves the current Supabase session into the app's User row.
 * Cached per-request so server components/actions can call it freely
 * without duplicating the Supabase + Prisma round trip.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user || !user.isActive) return null;

  return user;
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return { id: user.id, role: user.role };
}
