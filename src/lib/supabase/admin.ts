import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for Storage operations (signed upload/download URLs).
 * Server-only — never import this from a client component. The private
 * `assets` bucket has no public access, so all upload/download URLs are
 * short-lived tokens minted here after authorize() has already run.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
