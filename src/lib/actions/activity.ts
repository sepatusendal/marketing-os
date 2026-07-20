"use server";

import { requireUser } from "@/lib/auth";
import { listLeadTimeline } from "@/server/activity.service";

export async function listLeadTimelineAction(leadId: string) {
  await requireUser();
  return listLeadTimeline(leadId);
}
