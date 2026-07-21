import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserFromAuth, findUserByEmail } from "@/server/user.service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // D7 (invite-only) still applies to OAuth logins: the password flow
      // only ever reaches this route for accounts an admin already invited,
      // but Google OAuth lets anyone with a Google account complete the
      // exchange. Only let it through if a User row already exists for this
      // email — otherwise this would silently auto-provision accounts.
      const invited = data.user.email ? await findUserByEmail(data.user.email) : null;

      if (!invited) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_invited`);
      }

      // If Supabase's "link accounts with same email" setting isn't enabled,
      // a Google sign-in produces a different auth.users.id than the one the
      // invite created — upserting on that id would violate User.email's
      // unique constraint. Until an admin enables account linking, ask the
      // user to fall back to their password instead of crashing.
      if (invited.id !== data.user.id) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=account_not_linked`);
      }

      await upsertUserFromAuth(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
