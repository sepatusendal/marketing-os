"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CampaignStatusBadge } from "./status-badge";
import { updateCampaignStatusAction } from "@/app/(app)/campaigns/actions";
import type { CampaignStatus } from "@prisma/client";

export function StatusControl({
  campaignId,
  status,
  allowedTransitions,
}: {
  campaignId: string;
  status: CampaignStatus;
  allowedTransitions: CampaignStatus[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  function handleTransition(next: CampaignStatus) {
    const isArchive = next === "ARCHIVED";
    const isUnarchive = status === "ARCHIVED";

    if (isArchive && !confirm("Archive this campaign? This is a terminal state.")) return;
    if (isUnarchive && !confirm("Un-archive this campaign back to Completed?")) return;

    startTransition(async () => {
      const result = await updateCampaignStatusAction({ id: campaignId, status: next });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (next === "COMPLETED") setShowReviewPrompt(true);
      toast.success(`Status changed to ${next}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CampaignStatusBadge status={status} />
        {allowedTransitions.map((next) => (
          <Button
            key={next}
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleTransition(next)}
          >
            Move to {next}
          </Button>
        ))}
      </div>

      {showReviewPrompt && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
          <span>Write a Campaign Review in Knowledge?</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              router.push(`/knowledge/new?campaignId=${campaignId}&type=CAMPAIGN_REVIEW`)
            }
          >
            Write review
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReviewPrompt(false)}>
            Skip
          </Button>
        </div>
      )}
    </div>
  );
}
