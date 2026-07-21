import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listBoardColumns } from "@/server/board-column.service";
import { BoardColumnManager } from "@/components/modules/settings/board-column-manager";

export default async function BoardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!authorize({ id: user.id, role: user.role }, "board:manage_columns")) notFound();

  const columns = await listBoardColumns();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          ← Back to settings
        </Link>
        <h1 className="text-2xl font-semibold">Task board</h1>
        <p className="text-sm text-muted-foreground">
          Columns are shared across the global Tasks board and every campaign&apos;s task tab. Each
          column maps to an underlying stage (To Do / In Progress / Review / Completed) so reports
          and the dashboard stay accurate — name, color, order, and WIP limit are yours to customize.
        </p>
      </div>

      <BoardColumnManager columns={columns} />
    </div>
  );
}
