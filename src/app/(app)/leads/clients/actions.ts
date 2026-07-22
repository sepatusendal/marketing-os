"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import {
  createClient,
  updateClient,
  findDuplicateClient,
} from "@/server/client.service";
import { createClientSchema, updateClientSchema } from "@/lib/schemas/client";
import { ClientStatus } from "@prisma/client";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  warning?: string;
};

export type ImportRow = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status?: string;
  contractValue?: string;
  since?: string;
  notes?: string;
};

export type ImportResult = {
  created: number;
  duplicates: number;
  invalid: { row: number; name: string; error: string }[];
};

const STATUS_VALUES = new Set(Object.values(ClientStatus));

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to add clients." };
  }

  const parsed = createClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const duplicate = await findDuplicateClient(parsed.data.name, parsed.data.company);

  const client = await createClient(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "CLIENT",
    entityId: client.id,
    action: "created",
    meta: { source: "manual" },
  });

  revalidatePath("/leads/clients");
  return {
    success: true,
    warning: duplicate
      ? `A client named "${duplicate.name}" at "${duplicate.company}" already exists.`
      : undefined,
  };
}

export async function updateClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    return { error: "You don't have permission to edit clients." };
  }

  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const client = await updateClient(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "CLIENT",
    entityId: client.id,
    action: "updated",
  });

  revalidatePath("/leads/clients");
  return { success: true };
}

export async function bulkImportClientsAction(rows: ImportRow[]): Promise<ImportResult> {
  const user = await requireUser();
  if (!authorize(user, "lead:crud")) {
    throw new Error("You don't have permission to import clients.");
  }

  const result: ImportResult = { created: 0, duplicates: 0, invalid: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const status = row.status?.toUpperCase().trim();

    const parsed = createClientSchema.safeParse({
      name: row.name,
      company: row.company ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      industry: row.industry ?? "",
      status: status && STATUS_VALUES.has(status as ClientStatus) ? status : "ACTIVE",
      contractValue: row.contractValue ?? "",
      since: row.since ?? "",
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

    const duplicate = await findDuplicateClient(parsed.data.name, parsed.data.company);
    if (duplicate) result.duplicates++;

    const client = await createClient(parsed.data);
    await logActivity({
      actorId: user.id,
      entityType: "CLIENT",
      entityId: client.id,
      action: "created",
      meta: { source: "csv_import" },
    });
    result.created++;
  }

  revalidatePath("/leads/clients");
  return result;
}
