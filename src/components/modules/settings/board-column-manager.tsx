"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoardColumn, TaskStatus } from "@prisma/client";
import {
  createBoardColumnAction,
  updateBoardColumnAction,
  deleteBoardColumnAction,
  reorderBoardColumnsAction,
} from "@/app/(app)/tasks/actions";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
const COLOR_PALETTE = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#64748b"];

export function BoardColumnManager({ columns }: { columns: BoardColumn[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [creating, setCreating] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Reconciles with the server once router.refresh() lands (create/delete/
  // rename all go through this same prop), without clobbering the optimistic
  // reorder already applied in handleMove.
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const result = await createBoardColumnAction({ name: name.trim(), status });
    setCreating(false);
    if (result.error) toast.error(result.error);
    else {
      setName("");
      toast.success("Column added");
      router.refresh();
    }
  }

  async function handleRename(id: string, value: string) {
    const result = await updateBoardColumnAction({ id, name: value });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleColor(id: string, color: string) {
    const previous = localColumns;
    setLocalColumns((cols) => cols.map((c) => (c.id === id ? { ...c, color } : c)));
    const result = await updateBoardColumnAction({ id, color });
    if (result.error) {
      toast.error(result.error);
      setLocalColumns(previous);
    } else {
      router.refresh();
    }
  }

  async function handleWipLimit(id: string, value: string) {
    const wipLimit = value.trim() === "" ? null : Number(value);
    const result = await updateBoardColumnAction({ id, wipLimit });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleDelete(id: string) {
    const previous = localColumns;
    setLocalColumns((cols) => cols.filter((c) => c.id !== id));
    const result = await deleteBoardColumnAction({ id });
    if (result.error) {
      toast.error(result.error);
      setLocalColumns(previous);
    } else {
      toast.success("Column deleted");
      router.refresh();
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (movingId) return; // a reorder is already in flight — ignore races from double-clicks
    const ordered = [...localColumns].sort((a, b) => a.position - b.position);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    const previous = localColumns;
    setMovingId(ordered[index].id);
    setLocalColumns(
      ordered.map((c, i) => ({ ...c, position: i })), // optimistic: reflects instantly, no wait for refresh
    );

    const result = await reorderBoardColumnsAction({ orderedIds: ordered.map((c) => c.id) });
    setMovingId(null);
    if (result.error) {
      toast.error(result.error);
      setLocalColumns(previous);
    } else {
      router.refresh();
    }
  }

  const sorted = [...localColumns].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {sorted.map((col, index) => (
          <div
            key={col.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1"
                disabled={index === 0 || movingId !== null}
                onClick={() => handleMove(index, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1"
                disabled={index === sorted.length - 1 || movingId !== null}
                onClick={() => handleMove(index, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Input
              defaultValue={col.name}
              onBlur={(e) => e.target.value !== col.name && handleRename(col.id, e.target.value)}
              className="w-40"
            />

            <span className="text-xs text-muted-foreground">stage: {col.status}</span>

            <div className="flex gap-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColor(col.id, c)}
                  className="h-5 w-5 rounded-full ring-offset-1 ring-offset-background"
                  style={{ backgroundColor: c, outline: col.color === c ? "2px solid currentColor" : undefined }}
                  aria-label={c}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">WIP limit</Label>
              <Input
                type="number"
                min={1}
                defaultValue={col.wipLimit ?? ""}
                onBlur={(e) => handleWipLimit(col.id, e.target.value)}
                className="h-8 w-16"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(col.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="newColumnName">New column</Label>
          <Input
            id="newColumnName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blocked"
            className="w-48"
          />
        </div>
        <div className="space-y-2">
          <Label>Underlying stage</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Adding..." : "Add column"}
        </Button>
      </form>
    </div>
  );
}
