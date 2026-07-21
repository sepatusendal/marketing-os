"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createExpenseWithBudgetLock } from "@/server/expense.service";
import { getCampaign } from "@/server/campaign.service";
import { createExpenseSchema } from "@/lib/schemas/expense";
import { notifyIfBudgetCrossedThreshold } from "@/server/budget-alert.service";

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
  const { expense, usedBefore, usedAfter } = await createExpenseWithBudgetLock(
    parsed.data,
    user.id,
  );
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
    await notifyIfBudgetCrossedThreshold(campaign, allocated, usedBefore, allocated, usedAfter);
  }

  revalidatePath("/budget");
  revalidatePath(`/campaigns/${expense.campaignId}`);
  return { success: true };
}
