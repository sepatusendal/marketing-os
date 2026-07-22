"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_LOST_REASON_ORDER, LEAD_LOST_REASON_LABEL } from "@/lib/lead-labels";
import type { LeadLostReason } from "@prisma/client";

/**
 * Controlled, trigger-less confirmation dialog — moving a lead to LOST
 * (from the drawer's status select or a board drag-drop) always routes
 * through here so a reason is captured before the status change commits.
 */
export function LostReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: LeadLostReason) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<LeadLostReason>("OTHER");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Why was this lead lost?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lost-reason">Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as LeadLostReason)}>
            <SelectTrigger id="lost-reason" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_LOST_REASON_ORDER.map((r) => (
                <SelectItem key={r} value={r}>
                  {LEAD_LOST_REASON_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
