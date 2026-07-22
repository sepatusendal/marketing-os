import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * supabase-js sends these straight through as HTTP header values (apikey /
 * Authorization). A stray non-ASCII character — e.g. a "•" picked up from
 * pasting the key out of a rich-text source like Notion or WhatsApp — passes
 * silently here but makes `fetch` throw a cryptic "Cannot convert argument
 * to a ByteString" deep inside the Supabase SDK. Failing fast here instead
 * points straight at the env var and the exact bad character.
 */
function assertAsciiEnvVar(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      throw new Error(
        `Env var ${name} contains a non-ASCII character (U+${code.toString(16).toUpperCase()}) at ` +
          `position ${i} — likely pasted from a rich-text source (Notion, Docs, WhatsApp). ` +
          `Re-copy the value fresh from the Supabase dashboard and redeploy.`,
      );
    }
  }
  return value;
}

/**
 * Service-role client for Storage operations (signed upload/download URLs)
 * and Auth admin calls (invite user). Server-only — never import this from
 * a client component. The private `assets` bucket has no public access, so
 * all upload/download URLs are short-lived tokens minted here after
 * authorize() has already run.
 */
export function createAdminClient() {
  return createClient(
    assertAsciiEnvVar("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    assertAsciiEnvVar("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
