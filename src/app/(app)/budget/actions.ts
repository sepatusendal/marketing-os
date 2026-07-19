"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createExpense } from "@/server/expense.service";
import { createExpenseSchema } from "@/lib/schemas/expense";

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

  const expense = await createExpense(parsed.data, user.id);
  await logActivity({
    actorId: user.id,
    entityType: "EXPENSE",
    entityId: expense.id,
    action: "created",
    meta: { campaignId: expense.campaignId, amount: expense.amount.toString() },
  });

  revalidatePath("/budget");
  revalidatePath(`/campaigns/${expense.campaignId}`);
  return { success: true };
}
