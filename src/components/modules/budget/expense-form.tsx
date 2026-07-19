"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
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
import { createExpenseAction, type ActionState } from "@/app/(app)/budget/actions";

const CATEGORIES = [
  "META_ADS",
  "GOOGLE_ADS",
  "INFLUENCER",
  "EVENT",
  "AGENCY",
  "PRODUCTION",
  "SOFTWARE",
  "MISC",
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  campaignOptions,
  defaultCampaignId,
  onSuccess,
}: {
  campaignOptions: { id: string; name: string }[];
  defaultCampaignId?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createExpenseAction,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Expense added");
      onSuccess?.();
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {defaultCampaignId ? (
        <input type="hidden" name="campaignId" value={defaultCampaignId} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="campaignId">Campaign</Label>
          <Select
            name="campaignId"
            items={Object.fromEntries(campaignOptions.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger id="campaignId" className="w-full">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaignOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("campaignId") && (
            <p className="text-sm text-destructive">{fieldError("campaignId")}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="MISC">
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (IDR)</Label>
          <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
          {fieldError("amount") && (
            <p className="text-sm text-destructive">{fieldError("amount")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" required />
        {fieldError("description") && (
          <p className="text-sm text-destructive">{fieldError("description")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="spentAt">Date</Label>
        <Input
          id="spentAt"
          name="spentAt"
          type="date"
          defaultValue={todayInputValue()}
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Add expense"}
      </Button>
    </form>
  );
}
