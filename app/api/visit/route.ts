import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

/**
 * POST /api/visit — mark the signed-in user active on the platform *today*.
 *
 * Called as a fire-and-forget beacon from <VisitTracker> on page load, so any
 * visit (not just a submitted test) lights the day up in the study-activity
 * heatmap. The beacon throttles to once per day per browser; the upsert is
 * idempotent so duplicate calls are harmless.
 */
export async function POST() {
  const dbUser = await ensureDbUser();
  if (!dbUser) return NextResponse.json({ ok: false }, { status: 401 });

  // Store the server-local calendar day as UTC-midnight of that date, so the
  // pure DATE column round-trips to the same day regardless of the server's
  // timezone (read back with getUTC* in getDashboardData).
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  try {
    await prisma.user_active_days.upsert({
      where: { user_id_active_date: { user_id: dbUser.id, active_date: today } },
      create: { user_id: dbUser.id, active_date: today },
      update: {},
    });
  } catch (error: any) {
    // If concurrent requests attempt to upsert the same user/date combination,
    // a unique constraint conflict (P2002) might be thrown, which we can safely ignore
    // since the record already exists.
    if (error.code !== "P2002") {
      throw error;
    }
  }

  return NextResponse.json({ ok: true });
}
