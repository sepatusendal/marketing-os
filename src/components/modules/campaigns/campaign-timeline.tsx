import { formatDate } from "@/lib/format";
import { describeActivity } from "@/lib/activity-description";
import type { ActivityLog, User } from "@prisma/client";

type TimelineEntry = ActivityLog & { actor: User };

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
            <span className="text-muted-foreground">{describeActivity(entry)}</span>
            <div className="text-xs text-muted-foreground">
              {formatDate(entry.createdAt)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
