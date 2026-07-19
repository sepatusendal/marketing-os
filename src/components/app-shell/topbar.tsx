"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
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
        <SheetContent side="left" className="p-0 data-[side=left]:w-64">
          <div className="flex h-14 items-center border-b px-4 font-semibold">
            MarketingOS
          </div>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
        className="flex h-8 flex-1 max-w-64 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

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
