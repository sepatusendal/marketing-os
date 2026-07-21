import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";
import { TASK_LABEL_COLORS } from "@/lib/task-labels";

const taskStatusValues = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];
const labelColorValues = TASK_LABEL_COLORS;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(priorityValues).default("MEDIUM"),
});

export const updateTaskSchema = createTaskSchema.extend({
  id: z.string().min(1),
});

export const updateTaskColumnSchema = z.object({
  id: z.string().min(1),
  columnId: z.string().min(1),
});

export const updateTaskLabelsSchema = z.object({
  id: z.string().min(1),
  labels: z.array(z.enum(labelColorValues)),
});

export const createChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  label: z.string().min(1).max(200),
});

export const toggleChecklistItemSchema = z.object({
  id: z.string().min(1),
  isDone: z.boolean(),
});

export const deleteChecklistItemSchema = z.object({
  id: z.string().min(1),
});

export const createBoardColumnSchema = z.object({
  name: z.string().min(1).max(60),
  status: z.enum(taskStatusValues),
  color: z.string().max(30).optional().or(z.literal("")),
  wipLimit: z.coerce.number().int().positive().optional(),
});

export const updateBoardColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60).optional(),
  color: z.string().max(30).optional().or(z.literal("")),
  wipLimit: z.coerce.number().int().positive().optional().nullable(),
});

export const deleteBoardColumnSchema = z.object({
  id: z.string().min(1),
});

export const reorderBoardColumnsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
