import { prisma } from "@/lib/prisma";

export async function listSavedViews(userId: string, entityType: string) {
  return prisma.savedView.findMany({
    where: { userId, entityType },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSavedView(params: {
  userId: string;
  entityType: string;
  name: string;
  filters: Record<string, string>;
}) {
  return prisma.savedView.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      name: params.name,
      filters: params.filters,
    },
  });
}

export async function deleteSavedView(id: string, userId: string) {
  return prisma.savedView.deleteMany({ where: { id, userId } });
}
