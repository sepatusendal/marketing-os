"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notification";
import type { Notification } from "@prisma/client";

export function NotificationBell({
  notifications,
  unreadCount,
  hrefFor,
}: {
  notifications: Notification[];
  unreadCount: number;
  hrefFor: (n: Notification) => string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleClick(n: Notification) {
    if (!n.readAt) {
      await markNotificationReadAction(n.id);
    }
    setOpen(false);
    router.push(hrefFor(n));
    router.refresh();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction();
    router.refresh();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="group relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 origin-top transition-transform group-hover:animate-[bell-ring_0.6s_ease-in-out]" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] transition-transform group-hover:scale-110"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-normal text-muted-foreground hover:underline"
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleClick(n)}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
            >
              <span className={n.readAt ? "text-muted-foreground" : "font-medium"}>
                {n.message}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
