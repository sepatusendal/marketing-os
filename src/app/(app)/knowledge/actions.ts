"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { logActivity } from "@/server/activity.service";
import {
  createKnowledgeArticle,
  updateKnowledgeArticle,
  getKnowledgeArticle,
} from "@/server/knowledge.service";
import { createKnowledgeSchema, updateKnowledgeSchema } from "@/lib/schemas/knowledge";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

const MANAGER_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];

export async function createKnowledgeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "knowledge:edit")) {
    return { error: "You don't have permission to create knowledge articles." };
  }

  const parsed = createKnowledgeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const article = await createKnowledgeArticle(parsed.data, user.id);
  await logActivity({
    actorId: user.id,
    entityType: "KNOWLEDGE",
    entityId: article.id,
    action: "created",
  });

  revalidatePath("/knowledge");
  redirect(`/knowledge/${article.id}`);
}

export async function updateKnowledgeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing article id." };

  const existing = await getKnowledgeArticle(id);
  if (!existing) return { error: "Article not found." };

  const isAuthor = existing.authorId === user.id;
  const isManagerUp = MANAGER_ROLES.includes(user.role);
  if (!authorize(user, "knowledge:edit") || !(isAuthor || isManagerUp)) {
    return { error: "Only the author or a Manager+ can edit this article." };
  }

  const parsed = updateKnowledgeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const article = await updateKnowledgeArticle(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "KNOWLEDGE",
    entityId: article.id,
    action: "updated",
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${id}`);
  return { success: true };
}
