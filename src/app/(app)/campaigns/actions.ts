"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { logActivity } from "@/server/activity.service";
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  updateCampaignStatus,
} from "@/server/campaign.service";
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
} from "@/lib/schemas/campaign";
import { isValidTransition } from "@/lib/campaign-status";
import { getCampaignBudgetUsed } from "@/server/expense.service";
import { notifyIfBudgetCrossedThreshold } from "@/server/budget-alert.service";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

function parseKpiField(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function createCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "campaign:create")) {
    return { error: "You don't have permission to create campaigns." };
  }

  const parsed = createCampaignSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    targetKpi: parseKpiField(formData, "targetKpi"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const campaign = await createCampaign(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "CAMPAIGN",
    entityId: campaign.id,
    action: "created",
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing campaign id." };

  const existing = await getCampaign(id);
  if (!existing) return { error: "Campaign not found." };

  if (!authorize(user, "campaign:edit_own", { ownerId: existing.ownerId })) {
    return { error: "You don't have permission to edit this campaign." };
  }

  const parsed = updateCampaignSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    targetKpi: parseKpiField(formData, "targetKpi"),
    actualKpi: parseKpiField(formData, "actualKpi"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updated = await updateCampaign(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "CAMPAIGN",
    entityId: id,
    action: "updated",
  });

  // Lowering budgetAllocated can push usage past the 90% alert threshold
  // with no expense ever added — the expense-add path can't catch that, so
  // check it here too whenever the allocation itself changes.
  const allocatedBefore = Number(existing.budgetAllocated);
  const allocatedAfter = Number(updated.budgetAllocated);
  if (allocatedBefore !== allocatedAfter) {
    const used = await getCampaignBudgetUsed(id);
    await notifyIfBudgetCrossedThreshold(updated, allocatedBefore, used, allocatedAfter, used);
  }

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  return { success: true };
}

export async function updateCampaignStatusAction(
  input: unknown,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateCampaignStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status change." };

  const { id, status } = parsed.data;
  const existing = await getCampaign(id);
  if (!existing) return { error: "Campaign not found." };

  const isUnarchiving = existing.status === "ARCHIVED";
  const canUnarchive = user.role === Role.OWNER || user.role === Role.ADMIN;

  if (!isValidTransition(existing.status, status, canUnarchive)) {
    return { error: "That status change isn't allowed." };
  }

  const isArchiveTransition = status === "ARCHIVED" || isUnarchiving;
  const permitted = isArchiveTransition
    ? authorize(user, "campaign:archive") &&
      (!isUnarchiving || canUnarchive)
    : authorize(user, "campaign:edit_own", { ownerId: existing.ownerId });

  if (!permitted) {
    return { error: "You don't have permission to change this status." };
  }

  await updateCampaignStatus(id, status);
  await logActivity({
    actorId: user.id,
    entityType: "CAMPAIGN",
    entityId: id,
    action: "status_changed",
    meta: { from: existing.status, to: status },
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  return { success: true };
}
