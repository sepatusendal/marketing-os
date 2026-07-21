# MarketingOS

Internal marketing team workspace. Full spec lives in `docs/marketingos-prd.md` — read the relevant section before coding. Day-to-day operational docs (deployment, manual config, troubleshooting, backup/disaster recovery) live in `docs/ops/` — start at `docs/ops/README.md`.

## Stack
Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma · Supabase (Postgres/Auth/Storage) · Vercel

## Hard rules
- Reads: server components → `src/server/*` services. Mutations: server actions + zod + `authorize()`.
- Never call Prisma from components. Never import `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Every mutation calls `logActivity()`.
- Permissions come from `src/lib/rbac.ts` only (PRD §6.2). No inline role checks.
- Money: Decimal(14,2), IDR. Store dates in UTC, display in Asia/Jakarta.

## Commands
`npm run dev` · `npx prisma migrate dev` · `npx prisma studio` · `npm run seed`

## Process
Build one phase at a time per PRD §11. Finish the phase's Definition of Done before moving on.
**MVP complete + UI/UX revamp + Lead Follow-up SLA + HubSpot-inspired advanced features + advanced
kanban + email/Google sign-in done** (v1.6) — Phase 0 through Phase 8 done and verified end-to-end, a
full design-system revamp, a Lead Follow-up SLA system, a round of HubSpot-inspired features (lead
scoring, per-lead activity timeline, full JSON backup export, entity-level CSV export, bulk lead CSV
import, saved views/segments, two light automations), and a further round: an advanced task board
(customizable columns, swimlanes, per-column WIP limits, checklist/labels on cards), email notifications
via Resend, and "Sign in with Google" alongside the invite-only password flow. The email/Google work
**amends locked decisions D7 and D10** in `docs/marketingos-prd.md` — see those entries for the updated
text; this was an explicit, confirmed override, not a silent deviation. Remaining before a real launch:
the go-live checklist in PRD §12.9 (production Supabase project, Vercel deployment + Deployment
Protection, custom domain), plus the manual Google OAuth provider setup and Resend API key described in
PRD §12.3 — infrastructure decisions intentionally left for explicit user action, not automated.

## Automations
Two hardcoded automations, not a general rule engine: (1) a lead moving to WON auto-creates a
HIGH-priority onboarding task for its owner (`leads/actions.ts`); (2) a campaign crossing 90% budget
usage notifies its owner, detected via before/after percentage comparison so it fires once per crossing
(`budget/actions.ts`). Add new automations the same way — inline in the relevant action, not as a
separate engine — unless the list grows enough to justify one.

## Lead follow-up SLA
`src/lib/lead-followup.ts` is the single source of truth for the 48h staleness threshold — used by the
lead card indicator, the dashboard widget, and the notification trigger. No background job runner
exists yet; overdue-lead notifications are triggered opportunistically from the client on app load
(`FollowupChecker` in the app layout) and de-duplicate against existing notifications since the lead's
last contact.

## Task board
Columns are shared workspace-wide (`BoardColumn`, `src/server/board-column.service.ts`) — one set reused
by the global `/tasks` board and every campaign's Tasks tab, not per-campaign boards. Each column still
maps to a `TaskStatus`, so `Task.status` (and everything computed from it in dashboard/reports) stays
accurate no matter how columns are renamed/reordered/colored. Manager+ manage columns from
`/settings/board` (`board:manage_columns` in rbac.ts). WIP limits are advisory only — never block a drop.

## Email notifications & Google sign-in
`createNotification()` (`src/server/notification.service.ts`) is the single hook point for both the
in-app `Notification` row and an email via Resend (`src/lib/email.ts`) — every existing call site gets
email for free. Users can opt out per-account (`User.emailNotifications`, Settings). Missing
`RESEND_API_KEY`/`EMAIL_FROM` degrades to in-app-only, it never throws. Google sign-in reuses Supabase
Auth's built-in OAuth (no custom client code) but still enforces invite-only (D7): the callback route
(`src/app/api/auth/callback/route.ts`) rejects any Google account whose email has no existing `User` row.
Enabling the provider in Supabase and Google Cloud Console is a manual dashboard step (PRD §12.3) — not
something this codebase can do for you.

## Design system
Indigo/violet accent (`--primary`), warm-neutral light bg / deep-charcoal dark bg, defined in
`src/app/globals.css`. Card/Table/Badge/Button primitives read colors from CSS variables — new UI should
do the same rather than hardcoding grayscale/colors, so future palette changes propagate automatically.
