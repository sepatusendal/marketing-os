import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { FollowupChecker } from "@/components/app-shell/followup-checker";
import { NotificationBellSlot } from "@/components/app-shell/notification-bell-slot";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <CommandPalette />
      <FollowupChecker />
      <AppSidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          role={user.role}
          notificationSlot={
            // Its own Suspense boundary — the shell paints immediately
            // instead of blocking every page load on the notifications query.
            <Suspense
              fallback={
                <Button variant="ghost" size="icon" disabled aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
              }
            >
              <NotificationBellSlot userId={user.id} />
            </Suspense>
          }
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
