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
**MVP complete** (v0.9) — Phase 0 through Phase 8 done and verified end-to-end. Remaining before a real
launch: the go-live checklist in PRD §12.9 (production Supabase project, Vercel deployment + Deployment
Protection, custom domain) — infrastructure decisions intentionally left for explicit user action, not
automated. Next up: the UI/UX revamp (deferred per user request until the MVP was functionally complete).
