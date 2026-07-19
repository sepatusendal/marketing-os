import { formatDate, formatIDR } from "@/lib/format";
import type { ActivityLog, User } from "@prisma/client";

type TimelineEntry = ActivityLog & { actor: User };

function describe(entry: TimelineEntry) {
  const meta = entry.meta as Record<string, unknown> | null;

  switch (`${entry.entityType}:${entry.action}`) {
    case "CAMPAIGN:created":
      return "created this campaign";
    case "CAMPAIGN:updated":
      return "updated campaign details";
    case "CAMPAIGN:status_changed":
      return `moved campaign status from ${meta?.from} to ${meta?.to}`;
    case "TASK:created":
      return "created a task";
    case "TASK:updated":
      return "updated a task";
    case "TASK:status_changed":
      return `moved a task from ${meta?.from} to ${meta?.to}`;
    case "EXPENSE:created":
      return `logged an expense of ${formatIDR(String(meta?.amount ?? 0))}`;
    default:
      return entry.action;
  }
}

export function CampaignTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 text-sm">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <div>
            <span className="font-medium">{entry.actor.name}</span>{" "}
            <span className="text-muted-foreground">{describe(entry)}</span>
            <div className="text-xs text-muted-foreground">
              {formatDate(entry.createdAt)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
