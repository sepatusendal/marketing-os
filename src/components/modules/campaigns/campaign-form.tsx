"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiEditor } from "./kpi-editor";
import {
  createCampaignAction,
  updateCampaignAction,
  type ActionState,
} from "@/app/(app)/campaigns/actions";

type CampaignFormUser = { id: string; name: string };

type CampaignFormCampaign = {
  id: string;
  name: string;
  objective: string | null;
  department: string | null;
  ownerId: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  budgetAllocated: string;
  description: string | null;
  targetKpi: unknown;
  actualKpi: unknown;
};

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function CampaignForm({
  mode,
  users,
  campaign,
  onSuccess,
}: {
  mode: "create" | "edit";
  users: CampaignFormUser[];
  campaign?: CampaignFormCampaign;
  onSuccess?: () => void;
}) {
  const action = mode === "create" ? createCampaignAction : updateCampaignAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Campaign saved");
      onSuccess?.();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && campaign && (
        <input type="hidden" name="id" value={campaign.id} />
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={campaign?.name} required />
        {fieldError("name") && (
          <p className="text-sm text-destructive">{fieldError("name")}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ownerId">Owner</Label>
          <Select
            name="ownerId"
            defaultValue={campaign?.ownerId}
            items={Object.fromEntries(users.map((u) => [u.id, u.name]))}
          >
            <SelectTrigger id="ownerId" className="w-full">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("ownerId") && (
            <p className="text-sm text-destructive">{fieldError("ownerId")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={campaign?.priority ?? "MEDIUM"}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" defaultValue={campaign?.department ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetAllocated">Budget allocated (IDR)</Label>
          <Input
            id="budgetAllocated"
            name="budgetAllocated"
            type="number"
            min={0}
            step="0.01"
            defaultValue={
              campaign ? String(campaign.budgetAllocated) : "0"
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(campaign?.startDate ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(campaign?.endDate ?? null)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">Objective</Label>
        <Input id="objective" name="objective" defaultValue={campaign?.objective ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={campaign?.description ?? ""}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Target KPIs</Label>
        <KpiEditor
          mode="target"
          fieldName="targetKpi"
          defaultValue={
            (campaign?.targetKpi as { name: string; target: number; unit?: string }[]) ??
            undefined
          }
        />
      </div>

      {mode === "edit" && (
        <div className="space-y-2">
          <Label>Actual KPIs</Label>
          <KpiEditor
            mode="actual"
            fieldName="actualKpi"
            defaultValue={
              (campaign?.actualKpi as { name: string; actual: number }[]) ?? undefined
            }
          />
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : mode === "create" ? "Create campaign" : "Save changes"}
      </Button>
    </form>
  );
}
