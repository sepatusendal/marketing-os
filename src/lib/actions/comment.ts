"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/server/activity.service";
import { createNotification } from "@/server/notification.service";
import { createComment, parseMentions, listCommentsForEntity } from "@/server/comment.service";
import type { EntityType } from "@prisma/client";

export async function listCommentsAction(entityType: EntityType, entityId: string) {
  await requireUser();
  return listCommentsForEntity(entityType, entityId);
}

export async function createCommentAction(input: {
  entityType: EntityType;
  entityId: string;
  body: string;
  revalidate?: string;
}) {
  const user = await requireUser();
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  const comment = await createComment({
    entityType: input.entityType,
    entityId: input.entityId,
    authorId: user.id,
    body: trimmed,
  });

  await logActivity({
    actorId: user.id,
    entityType: input.entityType,
    entityId: input.entityId,
    action: "commented",
  });

  const mentioned = await parseMentions(trimmed);
  await Promise.all(
    mentioned
      .filter((u) => u.id !== user.id)
      .map((u) =>
        createNotification({
          userId: u.id,
          type: "mention",
          message: `You were mentioned in a comment`,
          entityType: input.entityType,
          entityId: input.entityId,
        }),
      ),
  );

  if (input.revalidate) revalidatePath(input.revalidate);
  return comment;
}
