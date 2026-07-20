"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bookmark, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listSavedViewsAction,
  createSavedViewAction,
  deleteSavedViewAction,
} from "@/lib/actions/saved-view";
import { cn } from "@/lib/utils";
import type { SavedView } from "@prisma/client";

export function SavedViewsBar({
  entityType,
  basePath,
  currentFilters,
}: {
  entityType: string;
  basePath: string;
  currentFilters: Record<string, string | undefined>;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSavedViewsAction(entityType).then(setViews);
  }, [entityType]);

  const activeFilters = Object.fromEntries(
    Object.entries(currentFilters).filter(([, v]) => v),
  ) as Record<string, string>;
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const view = await createSavedViewAction(entityType, name, activeFilters, basePath);
      setViews((prev) => [...prev, view]);
      setName("");
      setNaming(false);
      toast.success(`Saved view "${view.name}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save view");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setViews((prev) => prev.filter((v) => v.id !== id));
    await deleteSavedViewAction(id, basePath);
  }

  if (views.length === 0 && !hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      {views.map((view) => (
        <div key={view.id} className="group relative">
          <Link
            href={`${basePath}?${new URLSearchParams(view.filters as Record<string, string>).toString()}`}
            className="inline-flex items-center gap-1 rounded-full border bg-muted/40 py-1 pl-2.5 pr-6 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <Bookmark className="h-3 w-3" />
            {view.name}
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(view.id)}
            aria-label={`Delete saved view ${view.name}`}
            className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 text-muted-foreground hover:text-destructive group-hover:block"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {hasActiveFilters && !naming && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setNaming(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Save view
        </Button>
      )}

      {naming && (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="View name..."
            className={cn("h-6 w-32 text-xs")}
          />
          <Button size="sm" className="h-6 px-2 text-xs" disabled={saving} onClick={handleSave}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setNaming(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
