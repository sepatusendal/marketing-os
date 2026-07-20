"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createExpense, getCampaignBudgetUsed } from "@/server/expense.service";
import { getCampaign } from "@/server/campaign.service";
import { createNotification } from "@/server/notification.service";
import { createExpenseSchema } from "@/lib/schemas/expense";

const BUDGET_ALERT_THRESHOLD = 90;

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "expense:edit")) {
    return { error: "You don't have permission to add expenses." };
  }

  const parsed = createExpenseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const campaign = await getCampaign(parsed.data.campaignId);
  const usedBefore = campaign ? await getCampaignBudgetUsed(campaign.id) : 0;

  const expense = await createExpense(parsed.data, user.id);
  await logActivity({
    actorId: user.id,
    entityType: "EXPENSE",
    entityId: expense.id,
    action: "created",
    meta: { campaignId: expense.campaignId, amount: expense.amount.toString() },
  });

  // Automation: notify the campaign owner the moment spend crosses the 90%
  // mark, rather than requiring anyone to check the budget page proactively.
  if (campaign) {
    const allocated = Number(campaign.budgetAllocated);
    if (allocated > 0) {
      const percentBefore = (usedBefore / allocated) * 100;
      const usedAfter = usedBefore + Number(expense.amount);
      const percentAfter = (usedAfter / allocated) * 100;
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
  }

  revalidatePath("/budget");
  revalidatePath(`/campaigns/${expense.campaignId}`);
  return { success: true };
}
