import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Supabase's free tier auto-pauses a project after ~1 week with no API
 * activity. This route just needs to run one cheap query on a schedule so
 * the project always looks "active" — triggered by the Vercel Cron config
 * in vercel.json (Production only; Vercel Cron doesn't run against Preview
 * deployments, so this only keeps the PROD Supabase project awake).
 *
 * Guarded by CRON_SECRET so this isn't a public endpoint that anyone can
 * hit — Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
 * cron-triggered requests when that env var is set.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await prisma.user.count();

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
