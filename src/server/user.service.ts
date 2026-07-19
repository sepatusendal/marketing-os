import { prisma } from "@/lib/prisma";
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
