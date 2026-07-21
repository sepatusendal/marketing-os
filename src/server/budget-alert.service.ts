import { createNotification } from "@/server/notification.service";

export const BUDGET_ALERT_THRESHOLD = 90;

/** Fires the campaign-budget-alert notification once, exactly on the
 * before/after crossing of BUDGET_ALERT_THRESHOLD. Shared by both the
 * expense-add path (allocated fixed, used changes) and the campaign-edit
 * path (allocated changes, used fixed) so a crossing is caught no matter
 * which side of the percentage moved.
 *
 * Lives outside any "use server" actions file: those modules may only
 * export async server actions, and this is a plain internal helper shared
 * across two of them, not something a client ever calls directly. */
export async function notifyIfBudgetCrossedThreshold(
  campaign: { id: string; name: string; ownerId: string },
  allocatedBefore: number,
  usedBefore: number,
  allocatedAfter: number,
  usedAfter: number,
) {
  if (allocatedBefore <= 0 || allocatedAfter <= 0) return;
  const percentBefore = (usedBefore / allocatedBefore) * 100;
  const percentAfter = (usedAfter / allocatedAfter) * 100;
  if (percentBefore < BUDGET_ALERT_THRESHOLD && percentAfter >= BUDGET_ALERT_THRESHOLD) {
    await createNotification({
      userId: campaign.ownerId,
      type: "campaign_budget_alert",
      message: `"${campaign.name}" has used ${Math.round(percentAfter)}% of its budget`,
      entityType: "CAMPAIGN",
      entityId: campaign.id,
    });
  }
}
