import { NextResponse } from "next/server";
import { saveQuizAttempt, type SaveAttemptInput } from "@/app/exam-prep/actions";

/**
 * POST /api/attempt — persist a quiz/mock attempt.
 *
 * This exists so the exam runner can save an in-progress attempt via
 * navigator.sendBeacon when the tab is closed or hidden. A normal server-action
 * call would be killed along with the page before its network request lands; a
 * beacon is delivered by the browser after the page is gone, so the attempt is
 * recorded even on a hard close.
 *
 * Auth is read from the request cookies inside saveQuizAttempt (Clerk) — the
 * beacon is same-origin, so those cookies are sent. Grading is done server-side
 * from the DB; the client body only supplies which options were chosen.
 */
export async function POST(req: Request) {
  let input: SaveAttemptInput;
  try {
    input = (await req.json()) as SaveAttemptInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = await saveQuizAttempt(input);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
