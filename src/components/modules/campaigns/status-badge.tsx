import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@prisma/client";

const STYLES: Record<CampaignStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PLANNING: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  RUNNING: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  COMPLETED: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  ARCHIVED: "bg-zinc-500/15 text-zinc-500",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", STYLES[status])}>
      {status}
    </Badge>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  HIGH: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  URGENT: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", PRIORITY_STYLES[priority])}>
      {priority}
    </Badge>
  );
}
