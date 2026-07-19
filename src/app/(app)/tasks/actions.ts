"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { logActivity } from "@/server/activity.service";
import { createNotification } from "@/server/notification.service";
import { createTask, getTask, updateTask, updateTaskStatus } from "@/server/task.service";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from "@/lib/schemas/task";

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

export async function updateTaskStatusAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status change." };

  const { id, status } = parsed.data;
  const existing = await getTask(id);
  if (!existing) return { error: "Task not found." };

  if (!authorize(user, "task:update_status_self", { assigneeId: existing.assigneeId })) {
    return { error: "You don't have permission to update this task." };
  }

  const task = await updateTaskStatus(id, status);
  await logActivity({
    actorId: user.id,
    entityType: "TASK",
    entityId: id,
    action: "status_changed",
    meta: { from: existing.status, to: status },
  });

  revalidatePath("/tasks");
  if (task.campaignId) revalidatePath(`/campaigns/${task.campaignId}`);
  return { success: true };
}
