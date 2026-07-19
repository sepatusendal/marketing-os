-- Enable Row Level Security with no policies on every application table.
--
-- This is defense-in-depth only (PRD §5 D11): the app's real authorization
-- boundary is authorize() in src/lib/rbac.ts, enforced server-side on every
-- mutation and query. Prisma connects as the table owner, which Postgres
-- always lets bypass RLS, so this migration does not change app behavior.
-- What it does change: if the Supabase `anon` or `authenticated` roles ever
-- queried these tables directly (e.g. via the auto-generated REST/GraphQL
-- API or a client-side Supabase call), enabling RLS with zero policies
-- means every such query is denied by default, with no accidental exposure.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
