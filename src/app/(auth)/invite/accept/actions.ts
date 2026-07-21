"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function syncNameAfterInvite(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await prisma.user.upsert({
    where: { id: user.id },
    update: { name },
    create: { id: user.id, email: user.email!, name },
  });
}
