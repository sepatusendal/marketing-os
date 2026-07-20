"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import {
  createLead,
  updateLead,
  updateLeadStatus,
  touchLastContact,
  findDuplicateLead,
  convertToClient,
  getLead,
} from "@/server/lead.service";
import { createLeadSchema, updateLeadSchema, updateLeadStatusSchema } from "@/lib/schemas/lead";
import { LeadSource } from "@prisma/client";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  warning?: string;
};

export type ImportRow = {
  name: string;
  company?: string;
  phone?: string;
  industry?: string;
  source?: string;
  potentialRevenue?: string;
  notes?: string;
};

export type ImportResult = {
  created: number;
  duplicates: number;
  invalid: { row: number; name: string; error: string }[];
};

const SOURCE_VALUES = new Set(Object.values(LeadSource));

export async function bulkImportLeadsAction(rows: ImportRow[]): Promise<ImportResult> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    throw new Error("You don't have permission to import leads.");
  }

  const result: ImportResult = { created: 0, duplicates: 0, invalid: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const source = row.source?.toUpperCase().replace(/\s+/g, "_") ?? "OTHER";

    const parsed = createLeadSchema.safeParse({
      name: row.name,
      company: row.company ?? "",
      phone: row.phone ?? "",
      industry: row.industry ?? "",
      source: SOURCE_VALUES.has(source as LeadSource) ? source : "OTHER",
      potentialRevenue: row.potentialRevenue ?? "",
      notes: row.notes ?? "",
    });

    if (!parsed.success) {
      result.invalid.push({
        row: i + 1,
        name: row.name || "(no name)",
        error: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    const duplicate = await findDuplicateLead(parsed.data.name, parsed.data.company);
    if (duplicate) result.duplicates++;

    const lead = await createLead(parsed.data);
    await logActivity({
      actorId: user.id,
      entityType: "LEAD",
      entityId: lead.id,
      action: "created",
      meta: { source: "csv_import" },
    });
    result.created++;
  }

  revalidatePath("/leads");
  return result;
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to create leads." };
  }

  const parsed = createLeadSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const duplicate = await findDuplicateLead(parsed.data.name, parsed.data.company);

  const lead = await createLead(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "LEAD",
    entityId: lead.id,
    action: "created",
  });

  revalidatePath("/leads");
  return {
    success: true,
    warning: duplicate
      ? `A lead named "${duplicate.name}" at "${duplicate.company}" already exists.`
      : undefined,
  };
}

export async function updateLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to edit leads." };
  }

  const parsed = updateLeadSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const lead = await updateLead(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "LEAD",
    entityId: lead.id,
    action: "updated",
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadStatusAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to update this lead." };
  }

  const parsed = updateLeadStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status change." };

  const existing = await getLead(parsed.data.id);
  if (!existing) return { error: "Lead not found." };

  const lead = await updateLeadStatus(parsed.data.id, parsed.data.status);
  await logActivity({
    actorId: user.id,
    entityType: "LEAD",
    entityId: lead.id,
    action: "status_changed",
    meta: { from: existing.status, to: parsed.data.status },
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function touchLastContactAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to update this lead." };
  }

  await touchLastContact(id);
  await logActivity({
    actorId: user.id,
    entityType: "LEAD",
    entityId: id,
    action: "contacted",
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function convertToClientAction(leadId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to convert this lead." };
  }

  try {
    const client = await convertToClient(leadId);
    await logActivity({
      actorId: user.id,
      entityType: "CLIENT",
      entityId: client.id,
      action: "created",
      meta: { leadId },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not convert lead." };
  }

  revalidatePath("/leads");
  revalidatePath("/leads/clients");
  return { success: true };
}
