import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listDepartments } from "@/server/user.service";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  const departments = await listDepartments();
  const canManageSettings = user ? authorize({ id: user.id, role: user.role }, "settings:manage") : false;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          ← Back to settings
        </Link>
        <h1 className="text-2xl font-semibold">Workspace</h1>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">App name</h2>
        <p className="text-sm text-muted-foreground">MarketingOS</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Departments</h2>
        <p className="text-xs text-muted-foreground">
          Departments are free text on campaigns and user profiles — this is every value
          currently in use across the workspace.
        </p>
        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No departments set yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => (
              <Badge key={d} variant="outline">
                {d}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {canManageSettings && (
        <div className="space-y-2 border-t pt-6">
          <h2 className="text-sm font-medium">Backup</h2>
          <p className="text-xs text-muted-foreground">
            Download a full JSON snapshot of every campaign, task, lead, expense, and article in the
            workspace. Safety net only — this file isn&apos;t designed to be re-imported.
          </p>
          <a
            href="/api/backup/export"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="mr-1 h-4 w-4" />
            Export full backup (JSON)
          </a>
        </div>
      )}
    </div>
  );
}
