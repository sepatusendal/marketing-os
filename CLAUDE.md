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
**MVP complete + UI/UX revamp done** (v1.1) — Phase 0 through Phase 8 done and verified end-to-end,
plus a full design-system revamp (indigo accent, collapsible sidebar, dashboard-as-daily-briefing,
campaign hero header, real budget/lead-funnel charts, hover micro-interactions — verified in dark
mode + mobile). Remaining before a real launch: the go-live checklist in PRD §12.9
(production Supabase project, Vercel deployment + Deployment Protection, custom domain) — infrastructure
decisions intentionally left for explicit user action, not automated.

## Design system
Indigo/violet accent (`--primary`), warm-neutral light bg / deep-charcoal dark bg, defined in
`src/app/globals.css`. Card/Table/Badge/Button primitives read colors from CSS variables — new UI should
do the same rather than hardcoding grayscale/colors, so future palette changes propagate automatically.
