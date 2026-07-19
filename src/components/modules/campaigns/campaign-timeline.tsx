import { formatDate } from "@/lib/format";
import type { ActivityLog, User } from "@prisma/client";

type TimelineEntry = ActivityLog & { actor: User };

const ACTION_LABELS: Record<string, string> = {
  created: "created this campaign",
  updated: "updated campaign details",
  status_changed: "changed the status",
};

function describe(entry: TimelineEntry) {
  const label = ACTION_LABELS[entry.action] ?? entry.action;
  if (entry.action === "status_changed" && entry.meta) {
    const meta = entry.meta as { from?: string; to?: string };
    return `moved status from ${meta.from} to ${meta.to}`;
  }
  return label;
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
