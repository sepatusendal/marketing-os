import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MATRIX, ROLE_HIERARCHY, type Action } from "@/lib/rbac";

// Human-readable labels for the raw Action union in rbac.ts — display-only,
// kept separate from rbac.ts so that file stays focused on authorization
// logic rather than UI copy.
const ACTION_LABELS: Record<Action, string> = {
  "user:manage": "Invite users, change roles, activate/deactivate accounts",
  "settings:manage": "Manage workspace settings",
  "campaign:create": "Create new campaigns",
  "campaign:edit_any": "Edit any campaign (not just their own)",
  "campaign:edit_own": "Edit campaigns they own",
  "campaign:archive": "Archive / unarchive campaigns",
  "task:create": "Create tasks, edit any task, manage checklists & labels on any task",
  "task:update_status_self": "Update status, checklist & labels on tasks assigned to them",
  "board:manage_columns": "Add, rename, reorder, or delete task board columns",
  "lead:crud": "Create, edit, and delete leads",
  "lead:view": "View leads",
  "expense:edit": "Add and edit expenses",
  "budget:view": "View budget pages and totals",
  "asset:upload": "Upload files/assets",
  "knowledge:edit": "Create and edit knowledge base articles",
  "reports:view": "View reports",
  "view:all": "View the dashboard and general workspace data",
};

const ROLE_BLURB: Partial<Record<string, string>> = {
  OWNER: "Full access to everything. Only an Owner can grant the Owner role or manage another Owner's account.",
  ADMIN: "Same day-to-day access as Owner, except cannot promote to Owner or touch an Owner's account.",
  MANAGER: "Runs campaigns and the team's work day-to-day — can edit any campaign/task, but not user management.",
  MARKETING: "Creates and manages their own campaigns, leads, and tasks.",
  CRM: "Owns the leads pipeline and follow-up work.",
  FINANCE: "Owns budget/expense tracking.",
  DESIGNER: "Handles assets and assigned tasks.",
  VIEWER: "Read-only access — dashboards, reports, budget, leads.",
};

export function RolePermissionsReference() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Roles &amp; Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Reference only — what each role can do. To change what a role is allowed to do, this
          needs a code change (ask whoever maintains the app), not a toggle here.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ROLE_HIERARCHY.map((role) => {
          const actions = (Object.keys(MATRIX) as Action[]).filter((action) =>
            MATRIX[action].includes(role),
          );
          return (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="outline">{role}</Badge>
                </CardTitle>
                {ROLE_BLURB[role] && (
                  <p className="text-xs text-muted-foreground">{ROLE_BLURB[role]}</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-foreground">
                  {actions.map((action) => (
                    <li key={action} className="flex gap-2">
                      <span className="text-muted-foreground">–</span>
                      <span>{ACTION_LABELS[action]}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
