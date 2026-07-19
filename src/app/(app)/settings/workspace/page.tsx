import Link from "next/link";
import { listDepartments } from "@/server/user.service";
import { Badge } from "@/components/ui/badge";

export default async function WorkspacePage() {
  const departments = await listDepartments();

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
    </div>
  );
}
