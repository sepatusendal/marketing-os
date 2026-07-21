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
 *
 * Uses the uncapped variant of getLeadsNeedingFollowup (no `take` limit) —
 * the dashboard widget's top-10 cap must not also cap which leads ever get
 * notified, or overdue leads past the 10th silently never fire.
 *
 * The check-then-create per lead is wrapped in a transaction holding a
 * Postgres advisory lock keyed by the lead id, so two near-simultaneous
 * calls (e.g. two open tabs) can't both pass the "no existing notification"
 * check before either insert commits and send a duplicate notification/email.
 */
export async function checkOverdueLeadFollowupsAction() {
  const overdue = await getLeadsNeedingFollowup(null);

  await Promise.all(
    overdue
      .filter((lead) => lead.ownerId)
      .map(async (lead) => {
        const since = lead.lastContactAt ?? lead.createdAt;

        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lead.id}))`;

          const existing = await tx.notification.findFirst({
            where: {
              userId: lead.ownerId!,
              type: "lead_followup_overdue",
              entityId: lead.id,
              createdAt: { gte: since },
            },
          });
          if (existing) return;

          await createNotification(
            {
              userId: lead.ownerId!,
              type: "lead_followup_overdue",
              message: `${lead.name} hasn't been contacted in 48+ hours`,
              entityType: "LEAD",
              entityId: lead.id,
            },
            tx,
          );
        });
      }),
  );
}
