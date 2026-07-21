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
    <header className="glass-panel sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4">
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
        <SheetContent
          side="left"
          className="border-sidebar-border bg-sidebar text-sidebar-foreground p-0 data-[side=left]:w-64"
        >
          <div className="flex h-14 items-center border-b border-sidebar-border px-4 font-heading text-[15px] font-semibold tracking-tight">
            MarketingOS
          </div>
          <SidebarNav />
          <div className="border-t border-sidebar-border px-3 py-3 text-center text-xs text-sidebar-foreground/40">
            Built with care by Nufa Global
          </div>
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
        className="flex h-9 flex-1 max-w-64 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden rounded-sm border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          hrefFor={(n) => notificationHref(n.entityType, n.entityId)}
        />
        <ThemeToggle />
      </div>
      <div className="mx-1 h-6 w-px bg-border" />
      <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
    </header>
  );
}
