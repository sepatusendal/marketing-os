import { prisma } from "@/lib/prisma";
import type { Prisma, TaskStatus, Priority } from "@prisma/client";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/schemas/task";

const TASK_INCLUDE = {
  campaign: { select: { id: true, name: true } },
  assignee: true,
  column: true,
  checklistItems: { orderBy: { position: "asc" } },
  assets: {
    where: { fileType: { startsWith: "image" } },
    take: 1,
    orderBy: { createdAt: "asc" },
  },
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
  const defaultColumn = await prisma.boardColumn.findFirst({
    where: { status: "TODO" },
    orderBy: { position: "asc" },
  });

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      campaignId: input.campaignId || null,
      assigneeId: input.assigneeId || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
      columnId: defaultColumn?.id ?? null,
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

/** Moving a task to a column also updates its status to that column's stage
 * so dashboard/report aggregates (which key off Task.status) never drift
 * from what the board visually shows. */
export async function updateTaskColumn(id: string, columnId: string) {
  const column = await prisma.boardColumn.findUniqueOrThrow({ where: { id: columnId } });
  return prisma.task.update({
    where: { id },
    data: { columnId, status: column.status },
    include: TASK_INCLUDE,
  });
}

export async function updateTaskLabels(id: string, labels: string[]) {
  return prisma.task.update({ where: { id }, data: { labels }, include: TASK_INCLUDE });
}

export async function addChecklistItem(taskId: string, label: string) {
  const last = await prisma.taskChecklistItem.findFirst({
    where: { taskId },
    orderBy: { position: "desc" },
  });
  return prisma.taskChecklistItem.create({
    data: { taskId, label, position: last ? last.position + 1 : 0 },
  });
}

export async function toggleChecklistItem(id: string, isDone: boolean) {
  return prisma.taskChecklistItem.update({ where: { id }, data: { isDone } });
}

export async function deleteChecklistItem(id: string) {
  return prisma.taskChecklistItem.delete({ where: { id } });
}

export async function getChecklistItemTaskId(id: string) {
  const item = await prisma.taskChecklistItem.findUnique({
    where: { id },
    select: { taskId: true },
  });
  return item?.taskId ?? null;
}
