import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import { describeActivity } from "@/lib/activity-description";
import type { ActivityLog, User } from "@prisma/client";

export function RecentActivityWidget({
  entries,
}: {
  entries: (ActivityLog & { actor: User })[];
}) {
  return (
    <WidgetCard title="Recent Activity">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {entries.map((e) => (
            <li key={e.id}>
              <span className="font-medium">{e.actor.name}</span>{" "}
              <span className="text-muted-foreground">{describeActivity(e)}</span>
              <span className="ml-1 text-xs text-muted-foreground">
                · {formatDate(e.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
