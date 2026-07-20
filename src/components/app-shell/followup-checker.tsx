"use client";

import { useEffect } from "react";
import { checkOverdueLeadFollowupsAction } from "@/lib/actions/lead-followup";

/** Fire-and-forget: checks for newly-overdue leads once per app load. */
export function FollowupChecker() {
  useEffect(() => {
    checkOverdueLeadFollowupsAction().catch(() => {
      // best-effort — a missed check just means the reminder fires on a later load
    });
  }, []);

  return null;
}
