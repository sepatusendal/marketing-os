import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { ProfileForm } from "@/components/modules/settings/profile-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canManageUsers = authorize({ id: user.id, role: user.role }, "user:manage");
  const canManageBoard = authorize({ id: user.id, role: user.role }, "board:manage_columns");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex gap-3 text-sm">
          {canManageUsers && (
            <Link href="/settings/users" className="text-muted-foreground hover:underline">
              Users
            </Link>
          )}
          {canManageBoard && (
            <Link href="/settings/board" className="text-muted-foreground hover:underline">
              Board
            </Link>
          )}
          <Link href="/settings/workspace" className="text-muted-foreground hover:underline">
            Workspace
          </Link>
        </div>
      </div>

      <ProfileForm
        initialName={user.name}
        email={user.email}
        initialEmailNotifications={user.emailNotifications}
      />
    </div>
  );
}
