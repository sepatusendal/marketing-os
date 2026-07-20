# MarketingOS — Product Requirements Document (Build-Ready)

**Version:** 2.0 (MVP, build-ready)
**Status:** Locked for build
**Author:** Wira
**Purpose:** This document is the working specification for building MarketingOS with Claude Code. It contains everything needed to build the MVP: locked decisions, data model, module specs with acceptance criteria, implementation phases, and deployment strategy.

---

## 1. Overview

MarketingOS is an internal web application that serves as the single workspace for the marketing team — "the marketing team's world." It centralizes campaigns, tasks, leads, budget, assets, documentation, and a dashboard that summarizes everything in real time.

MarketingOS is **not** an ERP, **not** a full CRM, and **not** a generic project management tool. It is the coordination center that connects all marketing work in one place.

**Core value proposition:** a Marketing Manager opens the dashboard and understands the state of all marketing activity in under 5 minutes.

---

## 2. Problem Statement

Marketing work is currently scattered across Spreadsheets (budget), Google Drive (assets), WhatsApp (coordination), Email (approvals), Notion (documentation), ads dashboards, and PowerPoint (reporting). As a result:

- No single view of campaign status
- Reporting is manual and slow
- Budget is not visible in real time
- Campaign history and learnings are lost when PICs change
- Collaboration is fragmented

---

## 3. Goals (MVP)

1. Every campaign is documented in one system with a clear owner and status.
2. Every task has an assignee and due date.
3. Campaign budget (allocated vs. spent vs. remaining) is visible at any time.
4. All leads live in one pipeline with clear ownership.
5. Reporting time drops from hours to minutes (dashboard + canned reports).
6. Every meaningful change is recorded as history (activity log).

## 4. Non-Goals (MVP)

No marketing automation, no WhatsApp automation, no AI features, no Meta Ads / Google Ads / Google Analytics integrations, no finance ERP, no HR, no full sales CRM. Email is in scope only for notification delivery (D10) — not marketing/broadcast email. These are explicitly deferred to the roadmap (Section 13).

---

## 5. Locked Product Decisions

These decisions are final for the MVP. Claude Code should build against them without re-opening the questions.

| # | Decision |
|---|----------|
| D1 | **Campaign is the central entity.** Tasks, expenses, leads, assets, and knowledge can all link to a campaign. |
| D2 | **Tasks may exist without a campaign** (`campaignId` nullable) to support ad-hoc work, but the default creation flow links them to a campaign. |
| D3 | **Leads may be attributed to a campaign** (`campaignId` nullable). This enables cost-per-lead reporting later. |
| D4 | **Single workspace, single company.** Multi-workspace/multi-company is V5. No `Team` hierarchy in MVP — users have a `department` field instead. |
| D5 | **Client = a converted Lead.** When a lead reaches status `WON`, the user can convert it into a Client record. Clients are read-mostly in MVP. |
| D6 | **Reports (MVP) = 3 canned reports + CSV export.** Custom report builder is V2. |
| D7 | **Authentication is invite-only.** Public signup is disabled. Admins invite users by email. Two login methods are supported for an invited email: password, or "Sign in with Google" (Supabase OAuth) — both still gated by a prior invite; the OAuth callback rejects any Google account whose email has no existing `User` row instead of auto-provisioning one. |
| D8 | **Single currency (IDR).** Money stored as `Decimal(14,2)`. |
| D9 | **Campaign KPIs stored as JSON** (`targetKpi`, `actualKpi` arrays) — no separate KPI table in MVP. Actual KPI values are entered manually. |
| D10 | **Notifications are in-app plus email.** Every `Notification` (task assigned, mention, campaign status, lead-won, budget threshold) is also sent by email via Resend, based on a per-user opt-out toggle (`User.emailNotifications`, default on). Sends are synchronous best-effort inside the triggering request — a provider outage never fails the mutation. WhatsApp notifications remain out of scope for MVP. *(Amended from the original "in-app only" MVP decision — see CLAUDE.md changelog.)* |
| D11 | **RBAC is enforced server-side at the application layer** (single `authorize()` helper). Supabase RLS is enabled as defense-in-depth with default-deny, but Prisma connects with the service role, so the app layer is the source of truth for permissions. |

---

## 6. Users & Roles

### 6.1 Roles

`OWNER`, `ADMIN`, `MANAGER`, `MARKETING`, `CRM`, `FINANCE`, `DESIGNER`, `VIEWER`

### 6.2 Permission Matrix

| Capability | OWNER | ADMIN | MANAGER | MARKETING | CRM | FINANCE | DESIGNER | VIEWER |
|---|---|---|---|---|---|---|---|---|
| Manage users & roles | ✓ | ✓ | – | – | – | – | – | – |
| App settings | ✓ | ✓ | – | – | – | – | – | – |
| Campaign: create | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Campaign: edit any | ✓ | ✓ | ✓ | – | – | – | – | – |
| Campaign: edit own | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Campaign: archive/close | ✓ | ✓ | ✓ | – | – | – | – | – |
| Task: create/assign | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Task: update status (assigned to self) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Lead: full CRUD | ✓ | ✓ | ✓ | – | ✓ | – | – | – |
| Lead: view | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | ✓ |
| Budget/expense: create/edit | ✓ | ✓ | ✓ | – | – | ✓ | – | – |
| Budget: view | ✓ | ✓ | ✓ | ✓ | – | ✓ | – | ✓ |
| Assets: upload | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ | – |
| Knowledge: create/edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Reports: view/export | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ |
| Everything: view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | (scoped) | ✓ |

Notes:
- DESIGNER sees only tasks assigned to them, the campaigns those tasks belong to, and the asset library.
- "Own" = user is the campaign `ownerId`.
- All permission checks go through one helper: `authorize(user, action, resource)` in `src/lib/rbac.ts`. Never scatter role checks across components.

---

## 7. System Architecture

```
Browser (Next.js App Router, React Server Components + shadcn/ui)
   │
   ├── Server Components ──► read data via service layer
   ├── Server Actions ─────► mutations (create/update/delete)
   └── Route Handlers ─────► file upload URLs, CSV export, auth callback
   │
Service layer (src/server/*) ──► Prisma Client
   │
Supabase PostgreSQL (pooled via Supavisor)
Supabase Auth (email invite, no public signup)
Supabase Storage (private `assets` bucket, signed URLs)
   │
Deployed on Vercel · Source on GitHub
```

**Conventions (Claude Code must follow):**
- Reads: React Server Components calling service functions directly.
- Mutations: Server Actions (`"use server"`), validated with **zod**, wrapped with `authorize()`.
- Route Handlers only for: Supabase auth callback, signed upload URLs, CSV export endpoints.
- One service module per entity in `src/server/` (e.g. `campaign.service.ts`). Prisma is never called directly from components.
- Every mutation writes an `ActivityLog` row via a shared `logActivity()` helper.
- UI: shadcn/ui components, dark mode via `next-themes`, mobile-responsive.

### 7.1 Folder Structure

```
src/
  app/
    (auth)/login, invite/accept
    (app)/
      dashboard/
      campaigns/            # list
      campaigns/[id]/       # detail with tabs
      leads/
      tasks/                # "My Tasks" + global board
      budget/
      knowledge/
      reports/
      settings/
    api/                    # route handlers only (auth callback, upload, export)
  components/
    ui/                     # shadcn
    modules/                # feature components per module
  lib/                      # prisma.ts, supabase.ts, rbac.ts, utils.ts, zod schemas
  server/                   # service layer per entity
prisma/
  schema.prisma
  migrations/
  seed.ts
```

---

## 8. Data Model

Reference Prisma schema. This is the source of truth for entities; adjust syntax details as needed during implementation, but do not change entity relationships without updating this document.

```prisma
enum Role            { OWNER ADMIN MANAGER MARKETING CRM FINANCE DESIGNER VIEWER }
enum CampaignStatus  { DRAFT PLANNING RUNNING COMPLETED ARCHIVED }
enum Priority        { LOW MEDIUM HIGH URGENT }
enum TaskStatus      { TODO IN_PROGRESS REVIEW COMPLETED }
enum LeadStatus      { NEW CONTACTED QUALIFIED NEGOTIATION WON LOST }
enum LeadSource      { WEBSITE WHATSAPP INSTAGRAM TIKTOK REFERRAL EVENT PAID_ADS EMAIL OTHER }
enum ExpenseCategory { META_ADS GOOGLE_ADS INFLUENCER EVENT AGENCY PRODUCTION SOFTWARE MISC }
enum KnowledgeType   { SOP EXPERIMENT MEETING_NOTES BEST_PRACTICE CAMPAIGN_REVIEW LESSONS_LEARNED }
enum EntityType      { CAMPAIGN TASK LEAD CLIENT EXPENSE ASSET KNOWLEDGE USER }

model User {
  id         String   @id @db.Uuid            // equals Supabase auth.users.id
  email      String   @unique
  name       String
  role       Role     @default(MARKETING)
  department String?
  avatarUrl  String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  campaignsOwned Campaign[]
  tasksAssigned  Task[]
  leadsOwned     Lead[]
  expenses       Expense[]
  assets         Asset[]
  comments       Comment[]
  activities     ActivityLog[]
  knowledge      KnowledgeArticle[]
  notifications  Notification[]
}

model Campaign {
  id              String         @id @default(cuid())
  name            String
  objective       String?
  department      String?
  ownerId         String         @db.Uuid
  owner           User           @relation(fields: [ownerId], references: [id])
  status          CampaignStatus @default(DRAFT)
  priority        Priority       @default(MEDIUM)
  startDate       DateTime?
  endDate         DateTime?
  budgetAllocated Decimal        @default(0) @db.Decimal(14, 2)
  targetKpi       Json?          // [{ "name": "Leads", "target": 200, "unit": "leads" }]
  actualKpi       Json?          // [{ "name": "Leads", "actual": 150 }]
  description     String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  tasks     Task[]
  expenses  Expense[]
  leads     Lead[]
  assets    Asset[]
  knowledge KnowledgeArticle[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  campaignId  String?                      // D2: nullable
  campaign    Campaign?  @relation(fields: [campaignId], references: [id])
  assigneeId  String?    @db.Uuid
  assignee    User?      @relation(fields: [assigneeId], references: [id])
  dueDate     DateTime?
  priority    Priority   @default(MEDIUM)
  status      TaskStatus @default(TODO)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  assets Asset[]                            // attachments
}

model Lead {
  id               String     @id @default(cuid())
  name             String
  company          String?
  industry         String?
  source           LeadSource @default(OTHER)
  status           LeadStatus @default(NEW)
  ownerId          String?    @db.Uuid
  owner            User?      @relation(fields: [ownerId], references: [id])
  campaignId       String?                  // D3: attribution
  campaign         Campaign?  @relation(fields: [campaignId], references: [id])
  potentialRevenue Decimal?   @db.Decimal(14, 2)
  lastContactAt    DateTime?
  notes            String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  client Client?
}

model Client {
  id        String   @id @default(cuid())
  leadId    String   @unique
  lead      Lead     @relation(fields: [leadId], references: [id])
  name      String
  company   String?
  since     DateTime @default(now())
  notes     String?
  createdAt DateTime @default(now())
}

model Expense {
  id          String          @id @default(cuid())
  campaignId  String
  campaign    Campaign        @relation(fields: [campaignId], references: [id])
  category    ExpenseCategory
  description String
  amount      Decimal         @db.Decimal(14, 2)
  spentAt     DateTime        @default(now())
  createdById String          @db.Uuid
  createdBy   User            @relation(fields: [createdById], references: [id])
  createdAt   DateTime        @default(now())
}

model Asset {
  id          String    @id @default(cuid())
  fileName    String
  storagePath String                        // path in Supabase Storage bucket
  fileType    String
  sizeBytes   Int
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  taskId      String?
  task        Task?     @relation(fields: [taskId], references: [id])
  uploaderId  String    @db.Uuid
  uploader    User      @relation(fields: [uploaderId], references: [id])
  tags        String[]
  createdAt   DateTime  @default(now())
}

model KnowledgeArticle {
  id         String        @id @default(cuid())
  title      String
  type       KnowledgeType
  body       String                         // markdown
  authorId   String        @db.Uuid
  author     User          @relation(fields: [authorId], references: [id])
  campaignId String?
  campaign   Campaign?     @relation(fields: [campaignId], references: [id])
  tags       String[]
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model Comment {
  id         String     @id @default(cuid())
  entityType EntityType
  entityId   String
  authorId   String     @db.Uuid
  author     User       @relation(fields: [authorId], references: [id])
  body       String
  createdAt  DateTime   @default(now())

  @@index([entityType, entityId])
}

model ActivityLog {
  id         String     @id @default(cuid())
  actorId    String     @db.Uuid
  actor      User       @relation(fields: [actorId], references: [id])
  entityType EntityType
  entityId   String
  action     String                         // "created", "status_changed", "budget_added", ...
  meta       Json?                          // { from: "DRAFT", to: "RUNNING" }
  createdAt  DateTime   @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String    @db.Uuid
  user      User      @relation(fields: [userId], references: [id])
  type      String                          // "task_assigned", "mention", "campaign_status", ...
  message   String
  entityType EntityType?
  entityId  String?
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, readAt])
}
```

**Derived values (never stored):**
- `budgetUsed` = sum of `Expense.amount` per campaign
- `budgetRemaining` = `budgetAllocated - budgetUsed`
- Funnel conversion rates computed at query time

**User sync:** on first login after accepting a Supabase invite, upsert a `User` row using the Supabase auth user id/email (handled in the auth callback route).

---

## 9. Module Specifications

### 9.1 Dashboard (`/dashboard`)

Purpose: answer "what is the state of marketing right now?" in one screen.

| Widget | Data definition |
|---|---|
| Active Campaigns | Count + list of campaigns with status `RUNNING`, with owner and end date |
| Campaign by Status | Count grouped by `CampaignStatus` (donut or bar) |
| Budget Usage | Sum of allocated vs. used across non-archived campaigns, with progress bar; filter: this month / this quarter / all time |
| Today's Tasks | Tasks assigned to current user, due today or overdue, not completed |
| Lead Summary | Counts by `LeadStatus` (mini funnel) + new leads in the last 7 days |
| Recent Activity | Last 20 `ActivityLog` entries, human-readable ("Wira moved Campaign X to Running") |
| Mini Calendar | Campaign start/end dates + task due dates for the current month |
| Notifications | Unread notification list for current user |

**Acceptance criteria**
- [ ] Dashboard loads with all widgets in a single request cycle (server components, parallel fetch).
- [ ] All numbers match their source modules exactly.
- [ ] Empty states are designed (new workspace shows guidance, not blank boxes).
- [ ] Responsive: widgets stack on mobile.

### 9.2 Campaigns (`/campaigns`, `/campaigns/[id]`)

List view: table with name, status badge, priority, owner, dates, budget used/allocated, quick filters (status, department, owner) and search.

Detail view tabs:
1. **Overview** — all campaign fields, KPI target vs. actual (editable), status control.
2. **Timeline** — `ActivityLog` filtered to this campaign and its children (tasks, expenses), reverse chronological.
3. **Tasks** — kanban scoped to this campaign (Todo / In Progress / Review / Completed), inline create.
4. **Budget** — allocated (editable by permitted roles), expense table, add-expense form, per-category breakdown.
5. **Analytics** — MVP: KPI target vs. actual visual, budget burn over time (from expenses), lead count attributed to this campaign. No external integrations.
6. **Assets** — files linked to this campaign, upload, preview images, download via signed URL.
7. **Notes** — `Comment` thread on the campaign.

**Status flow rules**
- Allowed transitions: `DRAFT → PLANNING → RUNNING → COMPLETED → ARCHIVED`; backward moves allowed one step except from `ARCHIVED` (only Admin/Owner can un-archive).
- Completing a campaign prompts (optional, skippable): "Write a Campaign Review in Knowledge?"

**Acceptance criteria**
- [ ] Create/edit/archive respects the permission matrix.
- [ ] Status changes are logged with from/to in `ActivityLog.meta`.
- [ ] Budget tab totals always equal `sum(expenses)`; no drift.
- [ ] Deleting is not exposed in UI; archiving is the terminal state (audit safety).

### 9.3 Tasks (`/tasks`)

- **My Tasks** view (default): kanban of tasks assigned to me across all campaigns.
- **All Tasks** view (Manager+): filterable table/kanban by campaign, assignee, status, priority.
- Task drawer: title, description, campaign link, assignee, due date, priority, column, labels, checklist, attachments, comments.
- Creating a task from a campaign pre-fills `campaignId`; standalone creation allowed (D2).
- **Board columns** are workspace-wide (`BoardColumn`), shared by the global Tasks board and every campaign's Tasks tab — not per-campaign. Manager+ can rename, reorder, recolor, and set a WIP limit per column from `/settings/board`. Each column still maps to one underlying `TaskStatus` so `Task.status` (and everything computed from it — dashboard, reports) never drifts from what the board shows.
- **Swimlanes**: optional client-side grouping of the board by assignee, priority, or campaign (`?groupBy=`), purely presentational.
- **Cards**: color labels (fixed 6-color palette), a checklist (`TaskChecklistItem`) with a progress badge, and an attachment-count indicator.

**Acceptance criteria**
- [ ] Drag-and-drop between kanban columns updates the task's column and status, and logs activity.
- [ ] A column at its WIP limit shows a visual warning; the limit is advisory and never blocks a drop.
- [ ] Assigning a task creates a `Notification` for the assignee (and an email per D10).
- [ ] Overdue tasks are visually flagged.
- [ ] Attachment upload goes to Supabase Storage and creates an `Asset` row linked to the task.

### 9.4 Leads (`/leads`)

- Pipeline board by `LeadStatus` (New → Contacted → Qualified → Negotiation → Won → Lost) + table view toggle.
- Lead drawer: all fields, campaign attribution selector, activity/comments, "last contact" quick-update button.
- **Convert to Client**: enabled when status = `WON`; creates a `Client` row (D5). Clients listed in a simple sub-tab (`/leads/clients`).
- Duplicate guard: on create, warn if a lead with the same name + company already exists (non-blocking).

**Acceptance criteria**
- [ ] Moving a card between columns updates status + logs activity.
- [ ] CRM/Manager/Admin can edit all leads; Marketing can view only (matrix).
- [ ] Converting a Won lead creates exactly one Client (unique `leadId`).
- [ ] Source and status filters work in both board and table view.

### 9.5 Budget (`/budget`)

- Global view: table grouped by campaign — allocated, used, remaining, % used, forecast note field.
- Per-category breakdown across all campaigns (stacked bar or table).
- Add expense from here (select campaign) or from the campaign's Budget tab — same form component.
- Expense history with filters (campaign, category, date range).

**Acceptance criteria**
- [ ] Only Finance/Manager/Admin/Owner can create or edit expenses.
- [ ] Every expense mutation writes an `ActivityLog` row.
- [ ] Totals match campaign Budget tabs exactly (single service function, one source of truth).
- [ ] A campaign exceeding its allocation is visually flagged (red badge, no hard block).

### 9.6 Knowledge (`/knowledge`)

- Article list with type filter (SOP, Experiment, Meeting Notes, Best Practice, Campaign Review, Lessons Learned), tag filter, and search.
- Markdown editor with autosave-draft (localStorage until first save, then DB).
- Optional link to a campaign; campaign detail shows linked articles under Overview.

**Acceptance criteria**
- [ ] All roles except Viewer can create; author or Manager+ can edit.
- [ ] Markdown renders safely (sanitized).
- [ ] Search covers title, tags, and body.

### 9.7 Reports (`/reports`) — MVP-lite (D6)

Three canned reports, each with an on-screen view + **Export CSV**:
1. **Campaign Performance** — per campaign: status, dates, budget allocated/used, KPI target vs. actual, task completion %.
2. **Lead Funnel** — counts and conversion % per status, grouped by source; date-range filter.
3. **Budget by Category** — spend per `ExpenseCategory`, per month, date-range filter.

**Acceptance criteria**
- [ ] CSV export matches on-screen data (same service function).
- [ ] Date-range filters apply consistently.
- [ ] Viewer role can view and export (read-only data).

### 9.8 Settings (`/settings`)

- **Profile**: name, avatar, password (via Supabase).
- **Users** (Admin/Owner): list users, invite by email (Supabase invite), set role, deactivate.
- **Workspace**: app name/logo (simple), department list (free-text managed list used by campaigns/users).

**Acceptance criteria**
- [ ] Public signup is impossible; only invited emails can create sessions.
- [ ] Deactivated users cannot log in; their historical data remains intact.
- [ ] Role changes take effect on next request (no stale elevated access in UI).

### 9.9 Cross-cutting Features

- **Activity log**: every create/update/status-change/mutation logs via `logActivity()`. Powers Dashboard Recent Activity, Campaign Timeline, and the audit trail.
- **Comments**: polymorphic on Campaign, Task, Lead. `@mention` (simple `@name` autocomplete) creates a Notification.
- **Notifications**: in-app bell with unread count; mark-as-read; types: task_assigned, mention, campaign_status. Every notification also emails the recipient (D10) unless they've opted out in Settings.
- **Global search (Cmd+K)**: searches campaigns, tasks, leads, knowledge by name/title; navigates on select.
- **Dark mode**: system default + manual toggle, persisted.

---

## 10. Non-Functional Requirements

| Requirement | Implementation note |
|---|---|
| Responsive desktop + mobile | Tailwind breakpoints; kanban degrades to stacked lists on mobile |
| Dark mode | `next-themes`, shadcn tokens |
| Fast search | Postgres `ILIKE`/trigram on indexed columns; debounced Cmd+K |
| Audit log | `ActivityLog` on all mutations (Section 9.9) |
| Pagination | Cursor-based on all tables (default 25 rows) |
| Autosave draft | Knowledge editor + campaign create form (localStorage) |
| Secure authentication | Supabase Auth, invite-only, session via `@supabase/ssr` cookies |
| Authorization | Central `authorize()`; server-side only; UI hides what the API forbids |
| Keyboard friendly | Cmd+K search, form submit on Enter, focus states |
| Performance | Server components, parallel data fetch, no client-side waterfalls |

---

## 11. Implementation Plan (Claude Code Phases)

Build **one phase per session**. Commit at the end of each phase with a conventional commit + tag (`v0.1`, `v0.2`, ...). Do not start a phase before the previous phase's Definition of Done passes.

### Phase 0 — Scaffold, Auth & Shell
- Init Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- Add full Prisma schema (Section 8), run first migration against dev DB.
- Supabase clients (`@supabase/ssr`): browser + server helpers.
- Login page, invite-accept flow, auth callback route with `User` upsert (Section 8).
- Protected app shell: sidebar nav (all module links), topbar, dark-mode toggle.
- `src/lib/rbac.ts` with `authorize()` + permission matrix from §6.2.
- **DoD:** invited user can log in, sees empty dashboard shell; non-invited email cannot register; schema fully migrated.

### Phase 1 — Campaigns Core
- Campaign list (filters + search), create form, Overview tab, edit, status flow rules (§9.2).
- `logActivity()` helper; log all campaign mutations.
- **DoD:** §9.2 acceptance criteria pass except tabs that depend on later phases (Tasks/Budget/Assets tabs can be placeholders).

### Phase 2 — Tasks
- My Tasks kanban, All Tasks view, campaign Tasks tab, task drawer.
- Assignment → `Notification` row (bell UI comes in Phase 5; row creation now).
- **DoD:** §9.3 criteria pass except attachments (Phase 5).

### Phase 3 — Budget & Expenses
- Campaign Budget tab + global `/budget` page; shared expense form component.
- Single service function for budget aggregates (used/remaining/percent).
- **DoD:** §9.5 criteria pass; totals identical across views.

### Phase 4 — Leads & Clients
- Pipeline board + table toggle, lead drawer, campaign attribution, convert-to-client, duplicate warning.
- **DoD:** §9.4 criteria pass.

### Phase 5 — Assets, Comments & Notifications
- Private Storage bucket integration: signed upload/download, `Asset` rows for campaigns + task attachments, image preview.
- Polymorphic comments on Campaign/Task/Lead; `@mention` → notification.
- Notification bell: unread count, list, mark-as-read.
- **DoD:** §9.9 comment/notification criteria + asset criteria in §9.2/§9.3 pass.

### Phase 6 — Dashboard
- All 8 widgets (§9.1) wired to live data, parallel fetch, empty states.
- **DoD:** §9.1 criteria pass; every number cross-checked against its module.

### Phase 7 — Knowledge, Reports & Settings
- Knowledge list + markdown editor with autosave draft (§9.6).
- 3 canned reports + CSV export (§9.7).
- Settings: profile, user management + invites, roles, department list (§9.8).
- **DoD:** §9.6–9.8 criteria pass.

### Phase 8 — Polish & Hardening
- Global Cmd+K search, pagination sweep, mobile QA, loading/error/empty states everywhere.
- `prisma/seed.ts` (Appendix B), RLS default-deny enabled, permission audit against §6.2.
- **DoD:** Go-live checklist (§12.9) passes end-to-end.

---

## 12. Deployment Strategy

### 12.1 Environments

| Environment | App | Database | Purpose |
|---|---|---|---|
| **Local** | `localhost:3000` | Supabase **dev** project | daily development |
| **Preview** | Vercel preview URL (per PR) | Supabase **dev** project | QA/review before merge |
| **Production** | `marketingos.<company-domain>` | Supabase **prod** project | live internal tool |

Two Supabase projects (`marketingos-dev`, `marketingos-prod`). Preview deployments intentionally share the dev database — acceptable for a solo/internal project and keeps things simple.

### 12.2 Supabase Setup (do for both projects)

1. Create project; save the database password.
2. **Auth:** enable Email provider; **disable public signups** (Auth → Providers → Email → turn OFF "Allow new users to sign up"). Users are added via dashboard invite or admin API from Settings → Users (§9.8).
3. **Storage:** create bucket `assets`, **private**, file size limit 25 MB.
4. Collect: Project URL, `anon` key, `service_role` key.
5. Collect both connection strings: **pooled** (Supavisor, port `6543`) and **direct** (port `5432`).

### 12.3 Vercel Setup & Environment Variables

Import the GitHub repo into Vercel. Set variables per scope:

| Variable | Scope | Notes |
|---|---|---|
| `DATABASE_URL` | Production / Preview / Development | **Pooled** URI (`:6543`) + `?pgbouncer=true&connection_limit=1` — required for Prisma on serverless |
| `DIRECT_URL` | Local `.env` + GitHub Actions secret only | Direct URI (`:5432`); used only by `prisma migrate` |
| `NEXT_PUBLIC_SUPABASE_URL` | all | per environment's project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | per environment's project |
| `SUPABASE_SERVICE_ROLE_KEY` | all — **server-only** | never prefix with `NEXT_PUBLIC`, never import in client components |
| `APP_BASE_URL` | all | used in invite links |
| `RESEND_API_KEY` | all | notification emails (D10); if unset, emails are silently skipped and the app still works in-app-only |
| `EMAIL_FROM` | all | verified sender address/domain in Resend |

Preview scope points at **dev** Supabase; Production scope points at **prod** Supabase. Turn on **Vercel Deployment Protection** for previews (this is an internal tool).

**Google Sign-In setup (manual, dashboard-only — not part of the codebase):** enable the Google provider under Supabase → Authentication → Providers with a Google Cloud OAuth client, and add `${SUPABASE_URL}/auth/v1/callback` as an authorized redirect URI in Google Cloud Console. Also enable "link accounts with the same email" in Supabase's auth settings — without it, an already-invited user who signs in with Google gets a distinct auth identity from their password account and the app will ask them to fall back to their password (see `account_not_linked` on the login page) rather than silently duplicating their account.

Prisma datasource must declare both URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 12.4 Git & Release Flow

- `main` is protected. Branch per phase: `feat/phase-3-budget`.
- PR → automatic Vercel Preview (dev DB) → QA against the phase's DoD → merge.
- Merge to `main` → production deploy + migration workflow (12.5).
- Conventional Commits; tag `v0.N` at the end of each phase.

### 12.5 Database Migration Workflow

- **Local/dev:** `npx prisma migrate dev --name <change>` (runs against dev via `DIRECT_URL`); commit the generated `prisma/migrations/` folder.
- **Production:** GitHub Action applies committed migrations on merge to `main`:

```yaml
# .github/workflows/migrate-prod.yml
name: migrate-prod
on:
  push:
    branches: [main]
    paths: ['prisma/migrations/**']
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PROD_DIRECT_URL }}
```

Rules: migrations are **forward-only**; prefer additive changes (add column → backfill → switch) over destructive ones; take a manual backup before any destructive migration.

### 12.6 Seed & Demo Data

`prisma/seed.ts` (dev only — never run against prod): 1 OWNER, 1 ADMIN, one user per remaining role; 3 campaigns across different statuses; ~15 tasks spread across statuses/assignees; ~20 leads across the full pipeline; expenses in ≥4 categories; 3 knowledge articles. Run with `npm run seed`.

### 12.7 Security Checklist

- [ ] Public signup disabled on **both** Supabase projects.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used server-side only; grep the client bundle to verify.
- [ ] Every server action and route handler calls `authorize()` before touching data.
- [ ] RLS enabled with default-deny on all tables (defense-in-depth per D11).
- [ ] Storage bucket private; access via short-lived signed URLs only.
- [ ] Vercel Deployment Protection enabled for previews.
- [ ] Session handling via `@supabase/ssr` cookies (no tokens in localStorage).

### 12.8 Backup & Rollback

- **App:** Vercel instant rollback to any previous deployment.
- **Database:** Supabase automated daily backups (paid plan). On free tier, schedule a weekly `pg_dump` GitHub Action that stores an artifact, and always dump manually before destructive migrations.
- **Restore drill:** test one restore into the dev project before go-live.

### 12.9 Go-Live Checklist

- [ ] Prod Supabase: signups disabled, bucket private, keys set in Vercel Production scope.
- [ ] All migrations applied to prod; seed NOT run on prod.
- [ ] First OWNER account invited, logged in, and can invite others.
- [ ] Custom domain connected with HTTPS.
- [ ] All Phase 8 / §12.7 checklist items pass.
- [ ] Backup mechanism verified once.

### 12.10 Monitoring

Vercel logs + analytics and Supabase logs from day one. Add Sentry (error tracking) in V1.5 if the team grows.

---

## 13. Success Metrics

**Product:** DAU/WAU of the marketing team, campaigns created, task completion rate, % of expenses recorded in-system, knowledge articles created.

**Business:** reporting time reduced (target: monthly report assembled in < 30 minutes), budget position always answerable in real time, zero campaign knowledge lost on PIC handover.

---

## 14. Roadmap (Post-MVP)

| Version | Scope |
|---|---|
| **V2** | Content calendar, creative request flow, approval workflow, notification center, report generator |
| **V3** | Email integration, WhatsApp integration, Meta Ads integration, Google Analytics integration, CRM integration |
| **V4** | AI report, AI campaign planner, AI insight, AI copywriting |
| **V5** | Multi-workspace, multi-company, plugin system, public API, mobile application |

---

## Appendix A — CLAUDE.md Starter

Place this at the repo root so every Claude Code session starts with the right context:

```md
# MarketingOS

Internal marketing team workspace. Full spec lives in `docs/marketingos-prd.md` — read the relevant section before coding.

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
Current phase: **Phase 0**.
```

## Appendix B — Seed Data Spec

See §12.6. Keep seed data realistic (Indonesian names, plausible campaign names like "PPDB 2027 Early Bird", "Instagram Awareness Q3") so screenshots and demos look real.

---

*End of document.*
