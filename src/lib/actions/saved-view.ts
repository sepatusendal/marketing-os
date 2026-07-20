"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  listSavedViews,
  createSavedView,
  deleteSavedView,
} from "@/server/saved-view.service";

export async function listSavedViewsAction(entityType: string) {
  const user = await requireUser();
  return listSavedViews(user.id, entityType);
}

export async function createSavedViewAction(
  entityType: string,
  name: string,
  filters: Record<string, string>,
  path: string,
) {
  const user = await requireUser();
  if (!name.trim()) throw new Error("Name is required.");

  const view = await createSavedView({ userId: user.id, entityType, name: name.trim(), filters });
  revalidatePath(path);
  return view;
}

export async function deleteSavedViewAction(id: string, path: string) {
  const user = await requireUser();
  await deleteSavedView(id, user.id);
  revalidatePath(path);
}
