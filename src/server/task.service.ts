import { prisma } from "@/lib/prisma";
import type { Prisma, TaskStatus, Priority } from "@prisma/client";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/schemas/task";

const TASK_INCLUDE = {
  campaign: { select: { id: true, name: true } },
  assignee: true,
} satisfies Prisma.TaskInclude;

export async function listMyTasks(assigneeId: string) {
  return prisma.task.findMany({
    where: { assigneeId },
    include: TASK_INCLUDE,
    orderBy: { dueDate: "asc" },
  });
}

export type TaskListFilters = {
  campaignId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: Priority;
};

export async function listAllTasks(filters: TaskListFilters = {}) {
  const where: Prisma.TaskWhereInput = {
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
  };

  return prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy: { dueDate: "asc" },
  });
}

export async function listTasksForCampaign(campaignId: string) {
  return prisma.task.findMany({
    where: { campaignId },
    include: TASK_INCLUDE,
    orderBy: { dueDate: "asc" },
  });
}

export async function getTask(id: string) {
  return prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
}

export async function createTask(input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      campaignId: input.campaignId || null,
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
    },
    include: TASK_INCLUDE,
  });
}

export async function updateTask(input: UpdateTaskInput) {
  return prisma.task.update({
    where: { id: input.id },
    data: {
      title: input.title,
      description: input.description || null,
      campaignId: input.campaignId || null,
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
    },
    include: TASK_INCLUDE,
  });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return prisma.task.update({ where: { id }, data: { status }, include: TASK_INCLUDE });
}
