import { NextRequest, NextResponse } from "next/server";
import { getNotificationsFromDbAction, getAuthenticatedAdmin } from "@/actions/admin.actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notifications/dispatch
 * Dispatches any due scheduled notifications.
 * Protected by CRON_SECRET header (for automated cron jobs) or active admin session.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      Boolean(cronSecret) &&
      (authHeader === `Bearer ${cronSecret}` || req.headers.get("x-cron-secret") === cronSecret);

    if (!isCronAuthorized) {
      const admin = await getAuthenticatedAdmin(req);
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    await getNotificationsFromDbAction();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("GET /api/admin/notifications/dispatch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

