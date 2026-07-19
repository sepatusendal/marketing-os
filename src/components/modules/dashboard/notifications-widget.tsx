import Link from "next/link";
import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import { notificationHref } from "@/lib/notification-href";
import type { Notification } from "@prisma/client";

export function NotificationsWidget({ notifications }: { notifications: Notification[] }) {
  const unread = notifications.filter((n) => !n.readAt);

  return (
    <WidgetCard title={`Notifications (${unread.length} unread)`}>
      {unread.length === 0 ? (
        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {unread.map((n) => (
            <li key={n.id}>
              <Link href={notificationHref(n.entityType, n.entityId)} className="hover:underline">
                {n.message}
              </Link>
              <span className="ml-1 text-xs text-muted-foreground">
                · {formatDate(n.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
