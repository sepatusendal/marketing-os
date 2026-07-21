"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createNotification } from "@/server/notification.service";
import {
  createTask,
  getTask,
  updateTask,
  updateTaskColumn,
  updateTaskLabels,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  getChecklistItemTaskId,
} from "@/server/task.service";
import {
  createBoardColumn,
  updateBoardColumn,
  deleteBoardColumn,
  reorderBoardColumns,
} from "@/server/board-column.service";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskColumnSchema,
  updateTaskLabelsSchema,
  createChecklistItemSchema,
  toggleChecklistItemSchema,
  deleteChecklistItemSchema,
  createBoardColumnSchema,
  updateBoardColumnSchema,
  deleteBoardColumnSchema,
  reorderBoardColumnsSchema,
} from "@/lib/schemas/task";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

async function notifyAssignee(assigneeId: string, taskId: string, taskTitle: string) {
  await createNotification({
    userId: assigneeId,
    type: "task_assigned",
    message: `You were assigned to "${taskTitle}"`,
    entityType: "TASK",
    entityId: taskId,
  });
}

export async function createTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "task:create")) {
    return { error: "You don't have permission to create tasks." };
  }

  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const task = await createTask(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: task.id,
    action: "created",
  });

  if (task.assigneeId) {
    await notifyAssignee(task.assigneeId, task.id, task.title);
  }

  revalidatePath("/tasks");
  if (task.campaignId) revalidatePath(`/campaigns/${task.campaignId}`);
  return { success: true };
}

export async function updateTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "task:create")) {
    return { error: "You don't have permission to edit tasks." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing task id." };

  const existing = await getTask(id);
  if (!existing) return { error: "Task not found." };

  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const task = await updateTask(parsed.data);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: task.id,
    action: "updated",
  });

  if (task.assigneeId && task.assigneeId !== existing.assigneeId) {
    await notifyAssignee(task.assigneeId, task.id, task.title);
  }

  revalidatePath("/tasks");
  if (task.campaignId) revalidatePath(`/campaigns/${task.campaignId}`);
  return { success: true };
}

export async function updateTaskColumnAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateTaskColumnSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid column change." };

  const { id, columnId } = parsed.data;
  const existing = await getTask(id);
  if (!existing) return { error: "Task not found." };

  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to update this task." };
  }

  const task = await updateTaskColumn(id, columnId);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: id,
    action: "status_changed",
    meta: { from: existing.status, to: task.status },
  });

  revalidatePath("/tasks");
  if (task.campaignId) revalidatePath(`/campaigns/${task.campaignId}`);
  return { success: true };
}

export async function updateTaskLabelsAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateTaskLabelsSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid labels." };

  const existing = await getTask(parsed.data.id);
  if (!existing) return { error: "Task not found." };
  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to edit this task." };
  }

  const task = await updateTaskLabels(parsed.data.id, parsed.data.labels);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: task.id,
    action: "labels_changed",
    meta: { labels: parsed.data.labels },
  });
  revalidatePath("/tasks");
  if (task.campaignId) revalidatePath(`/campaigns/${task.campaignId}`);
  return { success: true };
}

export async function createChecklistItemAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid checklist item." };

  const existing = await getTask(parsed.data.taskId);
  if (!existing) return { error: "Task not found." };
  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to edit this task." };
  }

  const item = await addChecklistItem(parsed.data.taskId, parsed.data.label);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: item.taskId,
    action: "checklist_item_added",
    meta: { label: item.label },
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function toggleChecklistItemAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = toggleChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid checklist item." };

  const taskId = await getChecklistItemTaskId(parsed.data.id);
  if (!taskId) return { error: "Checklist item not found." };
  const existing = await getTask(taskId);
  if (!existing) return { error: "Task not found." };
  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to edit this task." };
  }

  const item = await toggleChecklistItem(parsed.data.id, parsed.data.isDone);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: item.taskId,
    action: item.isDone ? "checklist_item_checked" : "checklist_item_unchecked",
    meta: { label: item.label },
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteChecklistItemAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteChecklistItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid checklist item." };

  const taskId = await getChecklistItemTaskId(parsed.data.id);
  if (!taskId) return { error: "Checklist item not found." };
  const existing = await getTask(taskId);
  if (!existing) return { error: "Task not found." };
  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to edit this task." };
  }

  await deleteChecklistItem(parsed.data.id);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: taskId,
    action: "checklist_item_removed",
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function createBoardColumnAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "board:manage_columns")) {
    return { error: "You don't have permission to manage board columns." };
  }
  const parsed = createBoardColumnSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid column." };

  const column = await createBoardColumn({
    name: parsed.data.name,
    status: parsed.data.status,
    color: parsed.data.color || null,
    wipLimit: parsed.data.wipLimit ?? null,
  });
  await logActivity({
    actorId: user.id,
    entityType: "BOARD_COLUMN",
    entityId: column.id,
    action: "created",
    meta: { name: column.name },
  });
  revalidatePath("/tasks");
  revalidatePath("/settings/board");
  return { success: true };
}

export async function updateBoardColumnAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "board:manage_columns")) {
    return { error: "You don't have permission to manage board columns." };
  }
  const parsed = updateBoardColumnSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid column." };

  const column = await updateBoardColumn(parsed.data.id, {
    name: parsed.data.name,
    color: parsed.data.color,
    wipLimit: parsed.data.wipLimit,
  });
  await logActivity({
    actorId: user.id,
    entityType: "BOARD_COLUMN",
    entityId: column.id,
    action: "updated",
    meta: { name: column.name },
  });
  revalidatePath("/tasks");
  revalidatePath("/settings/board");
  return { success: true };
}

export async function deleteBoardColumnAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "board:manage_columns")) {
    return { error: "You don't have permission to manage board columns." };
  }
  const parsed = deleteBoardColumnSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid column id." };

  await deleteBoardColumn(parsed.data.id);
  await logActivity({
    actorId: user.id,
    entityType: "BOARD_COLUMN",
    entityId: parsed.data.id,
    action: "deleted",
  });
  revalidatePath("/tasks");
  revalidatePath("/settings/board");
  return { success: true };
}

export async function reorderBoardColumnsAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  if (!authorize(user, "board:manage_columns")) {
    return { error: "You don't have permission to manage board columns." };
  }
  const parsed = reorderBoardColumnsSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid column order." };

  try {
    await reorderBoardColumns(parsed.data.orderedIds);
  } catch {
    return { error: "Column list is out of date — refresh and try again." };
  }
  await logActivity({
    actorId: user.id,
    entityType: "BOARD_COLUMN",
    entityId: parsed.data.orderedIds[0] ?? "board",
    action: "reordered",
  });
  revalidatePath("/tasks");
  revalidatePath("/settings/board");
  return { success: true };
}
