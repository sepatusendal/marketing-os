"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncUserFromCurrentSession } from "./actions";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Invite/magic-link emails redirect here with the session in a URL hash
    // fragment (#access_token=...&refresh_token=...). @supabase/ssr locks
    // the browser client to flowType "pkce", which only auto-detects a
    // `?code=` query param, so the hash has to be parsed and applied here.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    async function run() {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          await syncUserFromCurrentSession();
          router.replace("/invite/accept");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? "/dashboard" : "/login");
    }

    run();
  }, [router]);

  return null;
}
