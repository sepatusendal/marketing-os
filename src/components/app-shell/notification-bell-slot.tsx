import { listNotifications, countUnreadNotifications } from "@/server/notification.service";
import { NotificationBell } from "./notification-bell";

/** Fetches notifications on its own — rendered inside a Suspense boundary
 * in the layout so the app shell (sidebar/topbar) never waits on this query. */
export async function NotificationBellSlot({ userId }: { userId: string }) {
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(userId),
    countUnreadNotifications(userId),
  ]);

  return <NotificationBell notifications={notifications} unreadCount={unreadCount} />;
}
