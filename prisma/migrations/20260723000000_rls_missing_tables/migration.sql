-- Follow-up to 20260719220000_rls_default_deny: SavedView and
-- BoardColumn/TaskChecklistItem were added in later migrations and never
-- got RLS enabled, so Supabase's Advisor flags them. Same defense-in-depth
-- rationale as the original migration — no policies, so `anon`/
-- `authenticated` get denied by default; the app's Prisma connection uses
-- the table owner role and is unaffected.

ALTER TABLE "SavedView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardColumn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskChecklistItem" ENABLE ROW LEVEL SECURITY;

-- Prisma's own internal migration-tracking table is also public schema and
-- flagged by the Advisor. Locking it down the same way is harmless (Prisma
-- itself connects as the table owner, same as every app table) and removes
-- one more table any anon/authenticated client could otherwise introspect.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
