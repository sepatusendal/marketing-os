# MarketingOS

[![CI](https://github.com/sepatusendal/marketing-os/actions/workflows/ci.yml/badge.svg)](https://github.com/sepatusendal/marketing-os/actions/workflows/ci.yml)

MarketingOS is an internal web application that serves as the single workspace for the marketing team — campaigns, tasks, leads, budget, assets, documentation, and a dashboard that summarizes everything in real time.

Full product spec lives in [`docs/marketingos-prd.md`](docs/marketingos-prd.md).

## Stack

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma · Supabase (Postgres/Auth/Storage) · Vercel

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project's credentials (Project URL, anon key, service role key, pooled/direct database URLs). See `docs/marketingos-prd.md` §12.2–12.3 for where to find each value.
3. Apply the database schema:
   ```bash
   npx prisma migrate dev
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Other commands

- `npx prisma studio` — browse the database
- `npm run seed` — seed dev data (never run against prod)
- `npm run lint` — lint
- `npm run build` — production build

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
