import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, countUnreadNotifications } from "@/server/notification.service";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(user.id),
    countUnreadNotifications(user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <CommandPalette />
      <aside className="hidden w-64 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          MarketingOS
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
