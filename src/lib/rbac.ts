import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  role: Role;
};

/**
 * Actions map 1:1 to rows in PRD §6.2. Keep this list in sync with the
 * permission matrix rather than adding ad-hoc checks elsewhere.
 */
export type Action =
  | "user:manage"
  | "settings:manage"
  | "campaign:create"
  | "campaign:edit_any"
  | "campaign:edit_own"
  | "campaign:archive"
  | "task:create"
  | "task:update_status_self"
  | "lead:crud"
  | "lead:view"
  | "expense:edit"
  | "budget:view"
  | "asset:upload"
  | "knowledge:edit"
  | "reports:view"
  | "view:all";

/**
 * Resource is optional context needed for "own"/"self" rules — e.g. a
 * campaign's ownerId, or a task's assigneeId — so authorize() can tell
 * "edit own campaign" from "edit any campaign".
 */
export type Resource = {
  ownerId?: string | null;
  assigneeId?: string | null;
};

const { OWNER, ADMIN, MANAGER, MARKETING, CRM, FINANCE, DESIGNER, VIEWER } =
  Role;

// PRD §6.2 permission matrix, transcribed 1:1. Do not scatter role checks
// anywhere else in the app — this table is the single source of truth.
const MATRIX: Record<Action, Role[]> = {
  "user:manage": [OWNER, ADMIN],
  "settings:manage": [OWNER, ADMIN],
  "campaign:create": [OWNER, ADMIN, MANAGER, MARKETING],
  "campaign:edit_any": [OWNER, ADMIN, MANAGER],
  "campaign:edit_own": [OWNER, ADMIN, MANAGER, MARKETING],
  "campaign:archive": [OWNER, ADMIN, MANAGER],
  "task:create": [OWNER, ADMIN, MANAGER, MARKETING, CRM],
  "task:update_status_self": [
    OWNER,
    ADMIN,
    MANAGER,
    MARKETING,
    CRM,
    FINANCE,
    DESIGNER,
  ],
  "lead:crud": [OWNER, ADMIN, MANAGER, CRM],
  "lead:view": [OWNER, ADMIN, MANAGER, MARKETING, CRM, VIEWER],
  "expense:edit": [OWNER, ADMIN, MANAGER, FINANCE],
  "budget:view": [OWNER, ADMIN, MANAGER, MARKETING, FINANCE, VIEWER],
  "asset:upload": [OWNER, ADMIN, MANAGER, MARKETING, CRM, DESIGNER],
  "knowledge:edit": [OWNER, ADMIN, MANAGER, MARKETING, CRM, FINANCE, DESIGNER],
  "reports:view": [OWNER, ADMIN, MANAGER, MARKETING, CRM, FINANCE, VIEWER],
  "view:all": [OWNER, ADMIN, MANAGER, MARKETING, CRM, FINANCE, VIEWER],
};

/**
 * Central authorization check. Every server action and route handler that
 * mutates or reads scoped data must call this before touching Prisma.
 *
 * For "own"/"self" actions, pass `resource` so the caller's identity can be
 * checked against `ownerId`/`assigneeId`. Roles that can act on ANY resource
 * (per the matrix) bypass the ownership check.
 */
export function authorize(
  user: AuthUser,
  action: Action,
  resource?: Resource,
): boolean {
  const allowedRoles = MATRIX[action];
  if (!allowedRoles.includes(user.role)) return false;

  if (action === "campaign:edit_own") {
    if (MATRIX["campaign:edit_any"].includes(user.role)) return true;
    return resource?.ownerId === user.id;
  }

  if (action === "task:update_status_self") {
    // Manager+ may update any task; everyone else only their own assignment.
    if (MATRIX["campaign:edit_any"].includes(user.role)) return true;
    return resource?.assigneeId === user.id;
  }

  return true;
}

/**
 * Throws if the check fails. Use in server actions/route handlers to short
 * circuit with a clear error instead of silently no-op-ing.
 */
export function assertAuthorized(
  user: AuthUser,
  action: Action,
  resource?: Resource,
): void {
  if (!authorize(user, action, resource)) {
    throw new Error(`Not authorized: ${user.role} cannot perform ${action}`);
  }
}
