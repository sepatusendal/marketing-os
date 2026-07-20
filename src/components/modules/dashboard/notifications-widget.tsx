import Link from "next/link";
import { Bell, UserPlus, AtSign, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import { notificationHref } from "@/lib/notification-href";
import { WIDGET_ACCENT, ACCENT_CHIP, type AccentColor } from "@/lib/accent-colors";
import type { Notification } from "@prisma/client";

/** Matches the `type` strings actually written by createNotification() call
 * sites (tasks/actions.ts, leads/actions.ts, budget/actions.ts, comment.ts). */
const TYPE_ICON: Record<string, { icon: LucideIcon; accent: AccentColor }> = {
  task_assigned: { icon: UserPlus, accent: "blue" },
  mention: { icon: AtSign, accent: "violet" },
  campaign_budget_alert: { icon: AlertTriangle, accent: "amber" },
};

function iconFor(type: string) {
  return TYPE_ICON[type] ?? { icon: Bell, accent: "slate" as AccentColor };
}

export function NotificationsWidget({ notifications }: { notifications: Notification[] }) {
  const unread = notifications.filter((n) => !n.readAt);

  return (
    <WidgetCard
      title={`Notifications (${unread.length} unread)`}
      accent={WIDGET_ACCENT.notifications}
      icon={Bell}
    >
      {unread.length === 0 ? (
        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-1">
          {unread.map((n) => {
            const { icon: Icon, accent } = iconFor(n.type);
            return (
              <li key={n.id}>
                <Link
                  href={notificationHref(n.entityType, n.entityId)}
                  className="flex items-start gap-3 rounded-lg p-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ACCENT_CHIP[accent]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-foreground">{n.message}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
