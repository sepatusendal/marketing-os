"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  createKnowledgeAction,
  updateKnowledgeAction,
  type ActionState,
} from "@/app/(app)/knowledge/actions";

const TYPES = [
  "SOP",
  "EXPERIMENT",
  "MEETING_NOTES",
  "BEST_PRACTICE",
  "CAMPAIGN_REVIEW",
  "LESSONS_LEARNED",
];

const DRAFT_KEY = "marketingos:knowledge-draft-new";

type KnowledgeFormArticle = {
  id: string;
  title: string;
  type: string;
  body: string;
  campaignId: string | null;
  tags: string[];
};

export function KnowledgeForm({
  mode,
  article,
  campaignOptions,
  defaultCampaignId,
  defaultType,
}: {
  mode: "create" | "edit";
  article?: KnowledgeFormArticle;
  campaignOptions: { id: string; name: string }[];
  defaultCampaignId?: string;
  defaultType?: string;
}) {
  const router = useRouter();
  const action = mode === "create" ? createKnowledgeAction : updateKnowledgeAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const [title, setTitle] = useState(article?.title ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");

  // Restoring a locally-saved draft is inherently a client-only, post-mount
  // concern (reading it during render would mismatch the server-rendered
  // HTML), so this is a legitimate use of setState-in-effect.
  useEffect(() => {
    if (mode !== "create") return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a local draft is a legitimate client-only, post-mount concern
      if (draft.title) setTitle(draft.title);
      if (draft.body) setBody(draft.body);
      if (draft.tags) setTags(draft.tags);
      toast.info("Restored your unsaved draft");
    } catch {
      // ignore corrupt draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft on every change until the article is actually saved.
  useEffect(() => {
    if (mode !== "create") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, tags }));
  }, [mode, title, body, tags]);

  useEffect(() => {
    if (state.success) {
      if (mode === "create") {
        localStorage.removeItem(DRAFT_KEY);
        toast.success("Article published");
        if (state.articleId) router.push(`/knowledge/${state.articleId}`);
        return;
      }
      toast.success("Article saved");
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && article && <input type="hidden" name="id" value={article.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {fieldError("title") && (
            <p className="text-sm text-destructive">{fieldError("title")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={article?.type ?? defaultType ?? "SOP"}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaignId">Linked campaign</Label>
          <Select
            name="campaignId"
            defaultValue={article?.campaignId ?? defaultCampaignId ?? ""}
            items={{
              "": "No campaign",
              ...Object.fromEntries(campaignOptions.map((c) => [c.id, c.name])),
            }}
          >
            <SelectTrigger id="campaignId" className="w-full">
              <SelectValue placeholder="No campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No campaign</SelectItem>
              {campaignOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ads, q3, retro"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Body (Markdown)</Label>
        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="pt-2">
            {/* Real field. Tabs unmount-hide inactive panels (display:none),
                which excludes hidden form controls from submission — so this
                textarea alone isn't reliable if the user submits while the
                Preview tab is active. The hidden input below carries the
                value regardless of which tab is showing. */}
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="font-mono text-sm"
              required
            />
            {fieldError("body") && (
              <p className="text-sm text-destructive">{fieldError("body")}</p>
            )}
          </TabsContent>
          <TabsContent value="preview" className="pt-2">
            <div className="rounded-md border p-4">
              {body ? <MarkdownRenderer content={body} /> : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        {/* Mirrors the textarea value so it's submitted regardless of which
            tab is active (Base UI keeps inactive TabsContent mounted but
            display:none, and hidden controls are excluded from FormData). */}
        <input type="hidden" name="body" value={body} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : mode === "create" ? "Publish article" : "Save changes"}
      </Button>
    </form>
  );
}
