"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRoleAction, setUserActiveAction } from "@/app/(app)/settings/actions";
import type { Role, User } from "@prisma/client";

const ROLES: Role[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "MARKETING",
  "CRM",
  "FINANCE",
  "DESIGNER",
  "VIEWER",
];

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();

  async function handleRoleChange(userId: string, role: string) {
    const result = await updateUserRoleAction(userId, role as Role);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Role updated");
      router.refresh();
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    const result = await setUserActiveAction(userId, !isActive);
    if (result.error) toast.error(result.error);
    else {
      toast.success(!isActive ? "User activated" : "User deactivated");
      router.refresh();
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
            <TableCell>
              <Select
                defaultValue={u.role}
                onValueChange={(v) => handleRoleChange(u.id, String(v))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              {u.isActive ? (
                <Badge variant="outline">Active</Badge>
              ) : (
                <Badge variant="destructive">Deactivated</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              {u.id !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(u.id, u.isActive)}
                >
                  {u.isActive ? "Deactivate" : "Activate"}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
