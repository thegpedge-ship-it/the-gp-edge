import { NextResponse } from "next/server";
import { getNotificationsFromDbAction } from "@/actions/admin.actions";

// Dispatches any due scheduled notifications. Safe to call repeatedly/publicly —
// it only delivers notifications whose scheduled time has already passed.
// Point an external scheduler (Vercel Cron, GitHub Actions, uptime pinger) at this route
// to guarantee timely delivery; it is also triggered opportunistically whenever the
// admin notifications page loads.
export async function GET() {
  await getNotificationsFromDbAction();
  return NextResponse.json({ ok: true });
}
