"use server";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/notification.service";
import { getLeadsNeedingFollowup } from "@/server/dashboard.service";

/**
 * Notifies each overdue lead's owner, once per overdue period. Triggered
 * opportunistically from the client on app load (see FollowupChecker) since
 * there's no background job runner — cheap to call repeatedly because it
 * skips leads that already have a live notification since their last
 * contact.
 */
export async function checkOverdueLeadFollowupsAction() {
  const overdue = await getLeadsNeedingFollowup();

  await Promise.all(
    overdue
      .filter((lead) => lead.ownerId)
      .map(async (lead) => {
        const since = lead.lastContactAt ?? lead.createdAt;
        const existing = await prisma.notification.findFirst({
          where: {
            userId: lead.ownerId!,
            type: "lead_followup_overdue",
            entityId: lead.id,
            createdAt: { gte: since },
          },
        });
        if (existing) return;

        await createNotification({
          userId: lead.ownerId!,
          type: "lead_followup_overdue",
          message: `${lead.name} hasn't been contacted in 48+ hours`,
          entityType: "LEAD",
          entityId: lead.id,
        });
      }),
  );
}
