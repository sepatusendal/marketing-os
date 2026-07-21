import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

export async function listBoardColumns() {
  return prisma.boardColumn.findMany({ orderBy: { position: "asc" } });
}

export async function createBoardColumn(input: {
  name: string;
  status: TaskStatus;
  color?: string | null;
  wipLimit?: number | null;
}) {
  const last = await prisma.boardColumn.findFirst({ orderBy: { position: "desc" } });
  return prisma.boardColumn.create({
    data: {
      name: input.name,
      status: input.status,
      color: input.color ?? null,
      wipLimit: input.wipLimit ?? null,
      position: last ? last.position + 1 : 0,
    },
  });
}

export async function updateBoardColumn(
  id: string,
  input: { name?: string; color?: string | null; wipLimit?: number | null },
) {
  return prisma.boardColumn.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.wipLimit !== undefined ? { wipLimit: input.wipLimit } : {}),
    },
  });
}

/**
 * Reassigns 0..n-1 positions in the given order. Goes through a negative
 * staging range first — `position` is unique, so writing final positions
 * directly can collide mid-transaction with another column's current value
 * (e.g. swapping two adjacent columns).
 *
 * `orderedIds` must be exactly the current set of column ids (a permutation,
 * no duplicates, none missing) — a partial or stale list would leave
 * unlisted columns at their old position, which can collide with the newly
 * assigned ones and throw on the unique constraint, or silently produce a
 * board with gaps/duplicates. Reject anything that doesn't match instead of
 * guessing.
 */
export async function reorderBoardColumns(orderedIds: string[]) {
  const existing = await prisma.boardColumn.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((c) => c.id));
  const uniqueOrderedIds = new Set(orderedIds);

  if (
    uniqueOrderedIds.size !== orderedIds.length ||
    uniqueOrderedIds.size !== existingIds.size ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    throw new Error("orderedIds must be a permutation of every existing board column.");
  }

  await prisma.$transaction([
    ...orderedIds.map((id, index) =>
      prisma.boardColumn.update({ where: { id }, data: { position: -(index + 1) } }),
    ),
    ...orderedIds.map((id, position) =>
      prisma.boardColumn.update({ where: { id }, data: { position } }),
    ),
  ]);
}

/** Tasks in the deleted column fall back to no column (still keep their status). */
export async function deleteBoardColumn(id: string) {
  await prisma.task.updateMany({ where: { columnId: id }, data: { columnId: null } });
  return prisma.boardColumn.delete({ where: { id } });
}
