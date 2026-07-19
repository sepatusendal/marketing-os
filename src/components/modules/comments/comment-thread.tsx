"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { createCommentAction } from "@/lib/actions/comment";
import type { Comment, User, EntityType } from "@prisma/client";

type CommentWithAuthor = Comment & { author: User };

export function CommentThread({
  entityType,
  entityId,
  comments,
  revalidatePath,
}: {
  entityType: EntityType;
  entityId: string;
  comments: CommentWithAuthor[];
  revalidatePath?: string;
}) {
  const [items, setItems] = useState(comments);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const comment = await createCommentAction({
          entityType,
          entityId,
          body: trimmed,
          revalidate: revalidatePath,
        });
        setItems((prev) => [...prev, comment]);
        setBody("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not post comment.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          items.map((c) => (
            <div key={c.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{c.author.name}</span>
                <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Write a comment... use @name to mention someone"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <Button size="sm" disabled={pending || !body.trim()} onClick={handleSubmit}>
          {pending ? "Posting..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}
