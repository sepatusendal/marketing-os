import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listAllUsers } from "@/server/user.service";
import { UsersTable } from "@/components/modules/settings/users-table";
import { InviteUserForm } from "@/components/modules/settings/invite-user-form";
import { RolePermissionsReference } from "@/components/modules/settings/role-permissions-reference";

export default async function SettingsUsersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (!authorize({ id: user.id, role: user.role }, "user:manage")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to manage users.</p>
      </div>
    );
  }

  const users = await listAllUsers();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          ← Back to settings
        </Link>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">Invite teammates and manage roles.</p>
      </div>

      <InviteUserForm />

      <UsersTable users={users} currentUserId={user.id} />

      <RolePermissionsReference />
    </div>
  );
}
