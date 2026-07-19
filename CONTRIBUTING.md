# Contributing

## Branching

- `main` is protected. Work happens on a branch per phase or fix: `feat/phase-3-budget`, `fix/invite-hash-token`.
- Open a PR into `main`. Vercel generates a preview deployment against the dev Supabase project for QA before merge.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`. Keep messages focused on *why*, not a restatement of the diff.

## Before opening a PR

- `npm run lint` and `npm run build` pass.
- If you touched `prisma/schema.prisma`, the migration is generated and committed (`npx prisma migrate dev --name <change>`).
- New/changed behavior meets the acceptance criteria in the relevant PRD section (`docs/marketingos-prd.md` §9).

## Project conventions

See `CLAUDE.md` for the hard rules (RBAC via `authorize()`, `logActivity()` on every mutation, service-layer-only Prisma access, etc.) — they apply to every contributor, not just AI-assisted sessions.
