"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertUserFromAuth } from "@/server/user.service";

/**
 * Called from the root page's client-side hash-token handler (invite and
 * magic-link emails redirect here with the session in a URL fragment, which
 * the server never sees). By the time this runs, the browser client has
 * already written the session into cookies, so the server can read it.
 */
export async function syncUserFromCurrentSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await upsertUserFromAuth(user);
}
