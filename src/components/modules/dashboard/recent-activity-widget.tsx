import { History } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, initials } from "@/lib/format";
import { describeActivity } from "@/lib/activity-description";
import { WIDGET_ACCENT } from "@/lib/accent-colors";
import type { ActivityLog, User } from "@prisma/client";

/** De-emphasized audit trail — reference material, not an action-driver, so
 * it sits as a compact scrolling strip rather than competing with the
 * attention-grabbing widgets above it. */
export function RecentActivityWidget({
  entries,
}: {
  entries: (ActivityLog & { actor: User })[];
}) {
  return (
    <WidgetCard title="Recent Activity" accent={WIDGET_ACCENT.recentActivity} icon={History}>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {entries.map((e) => (
            <div key={e.id} className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm">
              <Avatar size="sm">
                <AvatarFallback className="bg-muted text-[10px] font-medium">
                  {initials(e.actor.name)}
                </AvatarFallback>
              </Avatar>
              <span>
                <span className="font-medium text-foreground">{e.actor.name}</span>{" "}
                <span className="text-muted-foreground">{describeActivity(e)}</span>
                <span className="ml-1 text-xs text-muted-foreground">· {formatDate(e.createdAt)}</span>
              </span>
              <span className="ml-2 h-4 w-px bg-border" />
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
