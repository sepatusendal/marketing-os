import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

const taskStatusValues = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
const priorityValues = Object.values(Priority) as [Priority, ...Priority[]];

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

export const updateTaskStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(taskStatusValues),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
