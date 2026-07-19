"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { notificationHref } from "@/lib/notification-href";
import type { Notification } from "@prisma/client";

export function Topbar({
  name,
  email,
  avatarUrl,
  notifications,
  unreadCount,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  notifications: Notification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-14 items-center border-b px-4 font-semibold">
            MarketingOS
          </div>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        hrefFor={(n) => notificationHref(n.entityType, n.entityId)}
      />
      <ThemeToggle />
      <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
    </header>
  );
}
