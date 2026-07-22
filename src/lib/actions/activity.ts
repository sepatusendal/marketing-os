"use server";

import { requireUser } from "@/lib/auth";
import { listLeadTimeline, listActivityForEntity } from "@/server/activity.service";

export async function listLeadTimelineAction(leadId: string) {
  await requireUser();
  return listLeadTimeline(leadId);
}

export async function listClientTimelineAction(clientId: string) {
  await requireUser();
  return listActivityForEntity("CLIENT", clientId);
}
