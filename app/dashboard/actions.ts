"use server";

// ============================================================================
//  Dashboard backend — one server action that assembles every stat shown on
//  the user's dashboard (app/dashboard/page.tsx) from Postgres.
//
//  Design notes
//  ------------
//  • The two "maintained summary" tables do the heavy lifting and keep the page
//    O(1) regardless of history size (see database/DATABASE_DESIGN.md §4/§13):
//        - user_performance_summary  → streak, totals, overall accuracy
//        - user_subject_mastery      → per-subject mastery, weak/strong topics
//    Both are UPSERTed on every submit inside saveQuizAttempt
//    (app/exam-prep/actions.ts). So the dashboard never recomputes from raw
//    answers — it reads the running rollups.
//  • Time-windowed extras (heatmap, deltas, sparklines, mock-score trend) DO
//    need per-attempt rows, so we pull the user's completed test_attempts from
//    the trailing 12 months only, and derive everything from that one list.
//  • Everything returned is plain JSON (Decimals → number, Dates → strings) so
//    it can cross the server→client boundary into the card components.
//
//  Grading is never done here — score_percent / correct_count were graded
//  authoritatively against the DB when the attempt was saved.
// ============================================================================

import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

/* ─── Serializable shapes handed to the card components ──────────────────── */

export interface DashStat {
  key: string;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: "up" | "down" | "flat";
  caption: string;
  spark: number[];
}

export interface DashSubjectPerf {
  subject: string;
  mastery: number;
  change: number; // reserved — see note in buildData (needs history snapshots)
  color: "emerald" | "cyan" | "violet" | "amber";
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface DashTopic {
  name: string;
  accuracy: number;
  attempts: number;
}

export interface DashMockScore {
  date: string;
  score: number;
}

/** Per-subject, per-test bars for the Subject → Test Breakdown chart. Keyed by
 *  subject name; each entry is one mock test the user took that touched it. */
export type DashTestBreakdown = Record<
  string,
  { test: string; correct: number; incorrect: number; unattempted: number }[]
>;

export interface DashHeatDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DashQuickAccess {
  key: string;
  title: string;
  caption: string;
  accent: "emerald" | "violet" | "cyan" | "amber";
  badge: string;
}

export interface DashCountdown {
  name: string;
  dateLabel: string;
  timeLabel: string;
  daysAway: number;
  totalQuestions: number;
  durationMin: number;
}

export interface DashboardData {
  greeting: { salutation: string; title: string; highlight: string; subtext: string };
  stats: DashStat[];
  studyActivity: DashHeatDay[];
  upcomingExam: DashCountdown | null;
  performance: DashSubjectPerf[];
  mockScores: DashMockScore[];
  subjectBreakdown: DashTestBreakdown;
  weakTopics: DashTopic[];
  strongTopics: DashTopic[];
  quickAccess: DashQuickAccess[];
}

/* ─── Small date/number helpers ─────────────────────────────────────────── */

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// For pure DATE columns stored as UTC-midnight (user_active_days.active_date).
const dayKeyUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
const num = (v: unknown) => (v == null ? 0 : Number(v));
const pct = (correct: number, total: number) => (total > 0 ? (correct / total) * 100 : 0);
const withCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const SUBJECT_PALETTE = ["emerald", "cyan", "violet", "amber"] as const;

/* ============================================================================
 * THE ONE ENTRY POINT — everything the dashboard needs in a single round-trip.
 * ========================================================================== */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const dbUser = await ensureDbUser();

    // Signed-out / not-yet-provisioned → return an all-empty dashboard rather
    // than throwing, so the page still renders its zero-state.
    if (!dbUser || !dbUser.id) return emptyDashboard();

    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * DAY_MS);

    // ── Pull all sources in a single concurrent Promise.all ───────────────────
    // Each query includes an inline .catch() handler so a single query failure
    // (e.g. temporary database glitch or timeout) does NOT reject the whole batch.
    const [
      summary,
      attempts,
      mastery,
      subjectQCounts,
      mbsRaw,
      conditionCount,
      savedTemplates,
      bookmarks,
      nextMock,
      mockBreakdown,
      activeVisits,
    ] = await Promise.all([
      // 1. Running rollup: streak + totals + overall accuracy.
      prisma.user_performance_summary
        .findUnique({ where: { user_id: dbUser.id } })
        .catch((err) => {
          console.error("[Dashboard] Error fetching performance summary:", err);
          return null;
        }),

      // 2. Completed attempts in the trailing year (heatmap / deltas / trend).
      prisma.test_attempts
        .findMany({
          where: {
            user_id: dbUser.id,
            status: "completed",
            submitted_at: { gte: yearAgo },
          },
          orderBy: { submitted_at: "asc" },
          select: {
            source: true,
            score_percent: true,
            total_questions: true,
            correct_count: true,
            submitted_at: true,
          },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching test attempts:", err);
          return [];
        }),

      // 3. Per-subject mastery rollup (drives Subject Mastery + weak/strong).
      //    Filtered by the user's exam target so AKT and KFP mastery are separate.
      prisma.user_subject_mastery
        .findMany({
          where: {
            user_id: dbUser.id,
            exam_type_code: (dbUser.exam_target || "").toUpperCase().includes("KFP") ? "KFP" : "AKT",
          },
          orderBy: { mastery_percent: "desc" },
          select: {
            correct_count: true,
            incorrect_count: true,
            total_answered: true,
            mastery_percent: true,
            subjects: { select: { id: true, name: true } },
          },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching subject mastery:", err);
          return [];
        }),

      // 4. Published-question count per subject → lets us show "unattempted".
      prisma.questions
        .groupBy({
          by: ["subject_id"],
          where: { status: "published", deleted_at: null, subject_id: { not: null } },
          _count: { _all: true },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching question counts:", err);
          return [];
        }),

      // 5. MBS items count (raw query for speed)
      prisma
        .$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int as count FROM mbs_items`
        .then((r) => Number(r[0]?.count ?? 0))
        .catch((err) => {
          console.error("[Dashboard] Error fetching MBS items count:", err);
          return 0;
        }),

      // 6. Medical conditions count
      prisma.medical_conditions
        .count({ where: { deleted_at: null } })
        .catch((err) => {
          console.error("[Dashboard] Error fetching medical conditions count:", err);
          return 0;
        }),

      // 7. User saved templates count
      prisma.user_saved_templates
        .count({ where: { user_id: dbUser.id } })
        .catch((err) => {
          console.error("[Dashboard] Error fetching saved templates count:", err);
          return 0;
        }),

      // 8. User question bookmarks count
      prisma.user_question_bookmarks
        .count({ where: { user_id: dbUser.id } })
        .catch((err) => {
          console.error("[Dashboard] Error fetching question bookmarks count:", err);
          return 0;
        }),

      // 9. Soonest upcoming mock for countdown
      prisma.mock_tests
        .findFirst({
          where: { deleted_at: null, unlock_at: { gt: now } },
          orderBy: { unlock_at: "asc" },
          select: { name: true, unlock_at: true, question_count: true, duration_min: true },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching upcoming mock:", err);
          return null;
        }),

      // 10. Completed mock-test attempts with per-subject tallies
      prisma.test_attempts
        .findMany({
          where: {
            user_id: dbUser.id,
            source: "mock_test",
            status: "completed",
            submitted_at: { gte: yearAgo },
          },
          orderBy: { submitted_at: "asc" },
          select: {
            submitted_at: true,
            title_snapshot: true,
            mock_tests: { select: { name: true } },
            attempt_subject_stats: {
              select: {
                correct: true,
                incorrect: true,
                unanswered: true,
                subjects: { select: { name: true } },
              },
            },
          },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching mock breakdown:", err);
          return [];
        }),

      // 11. Days the user visited the platform
      prisma.user_active_days
        .findMany({
          where: { user_id: dbUser.id, active_date: { gte: startOfDay(yearAgo) } },
          select: { active_date: true },
        })
        .catch((err) => {
          console.error("[Dashboard] Error fetching active visits:", err);
          return [];
        }),
    ]);

    const mbsCount = mbsRaw;

    return buildData({
      dbUser,
      now,
      summary,
      attempts,
      mastery,
      subjectQCounts,
      mbsCount,
      conditionCount,
      savedTemplates,
      bookmarks,
      nextMock,
      mockBreakdown,
      activeVisits,
    });
  } catch (err) {
    console.error("[Dashboard] Unexpected error in getDashboardData:", err);
    return emptyDashboard();
  }
}

/* ============================================================================
 * Pure assembly — turns the raw rows into the card-ready shapes. Kept separate
 * (and side-effect-free) so the calculation of every stat is easy to read.
 * ========================================================================== */
type BuildArgs = {
  dbUser: { first_name: string | null; exam_target: string | null };
  now: Date;
  summary: Awaited<ReturnType<typeof prisma.user_performance_summary.findUnique>>;
  attempts: {
    source: string;
    score_percent: unknown;
    total_questions: number;
    correct_count: number;
    submitted_at: Date | null;
  }[];
  mastery: {
    correct_count: number;
    incorrect_count: number;
    total_answered: number;
    mastery_percent: unknown;
    subjects: { id: string; name: string } | null;
  }[];
  subjectQCounts: { subject_id: string | null; _count: { _all: number } }[];
  mbsCount: number;
  conditionCount: number;
  savedTemplates: number;
  bookmarks: number;
  nextMock: {
    name: string;
    unlock_at: Date | null;
    question_count: number;
    duration_min: number;
  } | null;
  mockBreakdown: {
    submitted_at: Date | null;
    title_snapshot: string | null;
    mock_tests: { name: string } | null;
    attempt_subject_stats: {
      correct: number;
      incorrect: number;
      unanswered: number;
      subjects: { name: string } | null;
    }[];
  }[];
  activeVisits: { active_date: Date }[];
};

function buildData(a: BuildArgs): DashboardData {
  const { now, summary, attempts, mastery } = a;

  /* ── GREETING ────────────────────────────────────────────────────────────
   * Time-of-day salutation + the user's first name. */
  const hour = now.getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const firstName = a.dbUser.first_name?.trim() || "there";
  const greeting = {
    salutation: `Good ${partOfDay}, ${firstName}!`,
    title: "Your study",
    highlight: "cockpit",
    subtext: attempts.length
      ? "Keep going! You're doing great."
      : "Start your first practice set to light up your dashboard.",
  };

  /* ── ACTIVE DAYS (source of truth for the streak) ────────────────────────
   * The set of calendar days the user was active — either they submitted a test
   * OR simply visited the platform (user_active_days). We compute the streak
   * from this set directly rather than trusting user_performance_summary's
   * current_streak_days, which is only rewritten on submit and so goes stale the
   * moment the user's activity isn't a fresh submission. */
  const activeDayKeys = new Set<string>();
  for (const t of attempts) if (t.submitted_at) activeDayKeys.add(dayKey(t.submitted_at));
  for (const v of a.activeVisits) activeDayKeys.add(dayKeyUTC(v.active_date));

  /* ── STAT TILE 1 — STUDY STREAK ──────────────────────────────────────────
   * Value: consecutive active days ending today (or yesterday — a streak is
   *   still alive until a full day is missed). 0 once broken.
   * Caption: longest run ever — the summary's lifetime figure, floored by the
   *   longest run we can see in the trailing-year window.
   * Spark: active-day count per week for the last 12 weeks (a proxy for
   *   momentum — a fuller bar means more days active that week). */
  const currentStreak = currentStreakFrom(activeDayKeys, now);
  const longestStreak = Math.max(
    summary?.longest_streak_days ?? 0,
    longestStreakFrom(activeDayKeys)
  );
  const weeklyActiveDays = weeklyActiveDayCounts(activeDayKeys, now, 12);

  /* ── STAT TILE 2 — AVG ACCURACY ──────────────────────────────────────────
   * Value: overall_accuracy from the summary = total_correct / total_questions
   *   across ALL history (lifetime accuracy).
   * Delta: last-30-days accuracy minus the prior-30-days accuracy, so it reads
   *   "am I trending up recently?" independent of the lifetime figure.
   * Spark: per-week accuracy over the last 12 weeks. */
  const overallAccuracy = num(summary?.overall_accuracy);
  const last30 = accuracyInWindow(attempts, now, 0, 30);
  const prev30 = accuracyInWindow(attempts, now, 30, 60);
  const accDelta = last30.total > 0 && prev30.total > 0 ? last30.acc - prev30.acc : 0;
  const weeklyAccuracy = weeklyAccuracySeries(attempts, now, 12, overallAccuracy);

  /* ── STAT TILE 3 — QUIZ ATTEMPTS ─────────────────────────────────────────
   * Value: total_attempts (lifetime, from the summary).
   * Delta: attempts submitted in the last 7 days.
   * Spark: cumulative attempt count at the end of each of the last 12 weeks. */
  const totalAttempts = summary?.total_attempts ?? 0;
  const attemptsThisWeek = countSince(attempts, now, 7);
  const cumulativeAttempts = weeklyCumulativeCount(attempts, now, 12, () => true);

  /* ── STAT TILE 4 — MOCK EXAMS ────────────────────────────────────────────
   * Value: lifetime count of completed full mock tests (source = 'mock_test').
   * Delta: mocks completed since the start of the current month.
   * Spark: cumulative mock count per week. */
  const isMock = (s: string) => s === "mock_test";
  const mockAttempts = attempts.filter((t) => isMock(t.source));
  const totalMocks = mockAttempts.length;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const mocksThisMonth = mockAttempts.filter(
    (t) => t.submitted_at && t.submitted_at >= startOfMonth
  ).length;
  const cumulativeMocks = weeklyCumulativeCount(attempts, now, 12, isMock);

  const stats: DashStat[] = [
    {
      key: "streak",
      label: "Study Streak",
      value: String(currentStreak),
      unit: "days",
      delta: `Max streak: ${longestStreak} days`,
      trend: currentStreak > 0 ? "up" : "flat",
      caption: "",
      spark: pad(weeklyActiveDays),
    },
    {
      key: "accuracy",
      label: "Avg Accuracy",
      value: `${overallAccuracy.toFixed(1)}%`,
      delta: `${accDelta >= 0 ? "+" : ""}${accDelta.toFixed(1)}%`,
      trend: accDelta > 0 ? "up" : accDelta < 0 ? "down" : "flat",
      caption: "vs prev 30 days",
      spark: pad(weeklyAccuracy),
    },
    {
      key: "attempts",
      label: "Quiz Attempts",
      value: withCommas(totalAttempts),
      delta: `+${attemptsThisWeek}`,
      trend: attemptsThisWeek > 0 ? "up" : "flat",
      caption: "this week",
      spark: pad(cumulativeAttempts),
    },
    {
      key: "mocks",
      label: "Mock Exams",
      value: String(totalMocks),
      unit: "done",
      delta: `+${mocksThisMonth}`,
      trend: mocksThisMonth > 0 ? "up" : "flat",
      caption: "this month",
      spark: pad(cumulativeMocks),
    },
  ];

  /* ── STUDY ACTIVITY HEATMAP ───────────────────────────────────────────────
   * One entry per day the user was ACTIVE — either they submitted a test, or
   * they simply visited the platform (user_active_days). count = total
   * questions answered that day (0 for a visit-only day). Every entry, even a
   * count-0 one, marks the day active in the heatmap; days absent from the map
   * are the only ones shown inactive. The card slices this to its grid. */
  const perDay = new Map<string, number>();
  for (const t of attempts) {
    if (!t.submitted_at) continue;
    const k = dayKey(t.submitted_at);
    perDay.set(k, (perDay.get(k) ?? 0) + t.total_questions);
  }
  // A visit-only day contributes 0 questions but must still count as active.
  // active_date is a pure DATE stored as UTC-midnight (see /api/visit), so read
  // its calendar day back with UTC parts.
  for (const v of a.activeVisits) {
    const k = dayKeyUTC(v.active_date);
    if (!perDay.has(k)) perDay.set(k, 0);
  }
  const studyActivity: DashHeatDay[] = [...perDay.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((x, y) => (x.date < y.date ? -1 : 1));

  /* ── COUNTDOWN — NEXT EXAM ────────────────────────────────────────────────
   * Prefer a real scheduled mock (mock_tests.unlock_at in the future). If none
   * is scheduled, fall back to the month/year parsed from the user's free-text
   * exam_target ("AKT — Aug 2026" → 1 Aug 2026). Null when neither exists so the
   * card can hide itself. */
  const upcomingExam = buildCountdown(a.nextMock, a.dbUser.exam_target, now);

  /* ── SUBJECT MASTERY (Performance card) ───────────────────────────────────
   * Straight from user_subject_mastery:
   *   mastery      = mastery_percent (running correct / total_answered × 100)
   *   correct/incorrect = the maintained tallies
   *   unattempted  = published questions in that subject − questions answered,
   *                  floored at 0 (how much of the subject is still untouched).
   * `change` needs a historical mastery snapshot we don't keep yet, so it's 0
   *   for now (the UI simply shows no ± chip). */
  const qCountBySubject = new Map(
    a.subjectQCounts.map((r) => [r.subject_id, r._count._all])
  );
  const performance: DashSubjectPerf[] = mastery
    .filter((m) => m.subjects)
    .map((m, i) => {
      const answered = m.total_answered;
      const poolSize = qCountBySubject.get(m.subjects!.id) ?? answered;
      return {
        subject: m.subjects!.name,
        mastery: Math.round(num(m.mastery_percent)),
        change: 0,
        color: SUBJECT_PALETTE[i % SUBJECT_PALETTE.length],
        correct: m.correct_count,
        incorrect: m.incorrect_count,
        unattempted: Math.max(0, poolSize - answered),
      };
    });

  /* ── WEAK / STRONG TOPICS ─────────────────────────────────────────────────
   * Rank subjects the user has actually practised by mastery_percent:
   *   weakTopics   = the 3 lowest, strongTopics = the 3 highest.
   * accuracy = mastery_percent, attempts = total_answered. (Subject-level; a
   * finer subtopic ranking would need per-subtopic mastery, which isn't
   * maintained.) */
  const practised = mastery.filter((m) => m.subjects && m.total_answered > 0);
  const asTopic = (m: (typeof practised)[number]): DashTopic => ({
    name: m.subjects!.name,
    accuracy: Math.round(num(m.mastery_percent)),
    attempts: m.total_answered,
  });
  const ascending = [...practised].sort(
    (x, y) => num(x.mastery_percent) - num(y.mastery_percent)
  );
  const weakTopics = ascending.slice(0, 3).map(asTopic);
  const strongTopics = ascending.slice(-3).reverse().map(asTopic);

  /* ── MOCK-SCORE TREND (Accuracy Trend card) ───────────────────────────────
   * Every completed mock (full mock_test + Mock Drill) as a {date, score}
   * point, oldest→newest, so the line shows exam readiness over time. */
  const mockScores: DashMockScore[] = attempts
    .filter((t) => (t.source === "mock_test" || t.source === "mock_drill") && t.submitted_at)
    .map((t) => ({
      date: t.submitted_at!.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      score: Math.round(num(t.score_percent)),
    }));

  /* ── SUBJECT → TEST BREAKDOWN (Accuracy Trend card, subject view) ──────────
   * For each subject, one bar-group per mock test the user took that touched it
   * — correct / incorrect / unanswered. Reads the maintained per-attempt
   * tallies (attempt_subject_stats), so nothing is recomputed from raw answers.
   * Capped to the most recent few mocks per subject to keep the chart legible. */
  const MAX_BREAKDOWN_TESTS = 6;
  const subjectBreakdown: DashTestBreakdown = {};
  a.mockBreakdown.forEach((att, i) => {
    const label = att.submitted_at
      ? att.submitted_at.toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
      : `Test ${i + 1}`;
    for (const st of att.attempt_subject_stats) {
      const name = st.subjects?.name;
      if (!name) continue;
      (subjectBreakdown[name] ??= []).push({
        test: label,
        correct: st.correct,
        incorrect: st.incorrect,
        unattempted: st.unanswered,
      });
    }
  });
  for (const name of Object.keys(subjectBreakdown)) {
    subjectBreakdown[name] = subjectBreakdown[name].slice(-MAX_BREAKDOWN_TESTS);
  }

  /* ── QUICK ACCESS BADGES ──────────────────────────────────────────────────
   * Library sizes (whole platform) + this user's saved counts. */
  const quickAccess: DashQuickAccess[] = [
    { key: "mbs", title: "MBS Explorer", caption: "Search billing items", accent: "emerald", badge: `${withCommas(a.mbsCount)} items` },
    { key: "autofills", title: "Clinical Autofills", caption: "Templates & macros", accent: "violet", badge: `${a.savedTemplates} saved` },
    { key: "conditions", title: "Conditions Library", caption: "Reference & guidelines", accent: "cyan", badge: `${withCommas(a.conditionCount)} entries` },
  ];

  return {
    greeting,
    stats,
    studyActivity,
    upcomingExam,
    performance,
    mockScores,
    subjectBreakdown,
    weakTopics,
    strongTopics,
    quickAccess,
  };
}

/* ─── Time-series helpers (all pure) ─────────────────────────────────────── */

type Attempt = BuildArgs["attempts"][number];

/** Accuracy over the window [now-endDaysAgo, now-startDaysAgo). */
function accuracyInWindow(attempts: Attempt[], now: Date, startDaysAgo: number, endDaysAgo: number) {
  const from = new Date(now.getTime() - endDaysAgo * DAY_MS);
  const to = new Date(now.getTime() - startDaysAgo * DAY_MS);
  let correct = 0;
  let total = 0;
  for (const t of attempts) {
    if (!t.submitted_at || t.submitted_at < from || t.submitted_at >= to) continue;
    correct += t.correct_count;
    total += t.total_questions;
  }
  return { acc: pct(correct, total), total };
}

/** Number of attempts submitted in the last `days` days. */
function countSince(attempts: Attempt[], now: Date, days: number) {
  const from = new Date(now.getTime() - days * DAY_MS);
  return attempts.filter((t) => t.submitted_at && t.submitted_at >= from).length;
}

/** Bucket attempts into `weeks` trailing weekly buckets (oldest→newest). */
function weeklyBuckets<T>(attempts: Attempt[], now: Date, weeks: number, seed: T[]): Attempt[][] {
  const buckets: Attempt[][] = Array.from({ length: weeks }, () => []);
  const start = startOfDay(new Date(now.getTime() - (weeks * 7 - 1) * DAY_MS));
  for (const t of attempts) {
    if (!t.submitted_at) continue;
    const idx = Math.floor((startOfDay(t.submitted_at).getTime() - start.getTime()) / (7 * DAY_MS));
    if (idx >= 0 && idx < weeks) buckets[idx].push(t);
  }
  return buckets;
}

/**
 * Consecutive active days ending today, or yesterday if today isn't active yet
 * (a streak stays alive until a full calendar day is missed). 0 once broken.
 * `activeDays` holds "YYYY-MM-DD" keys for every day the user submitted or
 * visited, so this is the authoritative streak — no dependency on the
 * submit-only summary rollup.
 */
function currentStreakFrom(activeDays: Set<string>, now: Date): number {
  let cursor = startOfDay(now);
  if (!activeDays.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS); // fall back to yesterday
    if (!activeDays.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/** Longest run of consecutive active days within the set (trailing window). */
function longestStreakFrom(activeDays: Set<string>): number {
  if (activeDays.size === 0) return 0;
  const sorted = [...activeDays].sort(); // YYYY-MM-DD sorts chronologically
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = startOfDay(new Date(`${sorted[i - 1]}T00:00:00`));
    const cur = startOfDay(new Date(`${sorted[i]}T00:00:00`));
    const gap = Math.round((cur.getTime() - prev.getTime()) / DAY_MS);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

/** Count of active days per trailing week (streak-momentum sparkline). */
function weeklyActiveDayCounts(activeDays: Set<string>, now: Date, weeks: number): number[] {
  const start = startOfDay(new Date(now.getTime() - (weeks * 7 - 1) * DAY_MS));
  const buckets = new Array(weeks).fill(0);
  for (const key of activeDays) {
    const d = startOfDay(new Date(`${key}T00:00:00`));
    const idx = Math.floor((d.getTime() - start.getTime()) / (7 * DAY_MS));
    if (idx >= 0 && idx < weeks) buckets[idx] += 1;
  }
  return buckets;
}

/** Per-week accuracy; empty weeks inherit the last known value (flat line). */
function weeklyAccuracySeries(attempts: Attempt[], now: Date, weeks: number, fallback: number): number[] {
  let last = 0;
  const series = weeklyBuckets(attempts, now, weeks, []).map((b) => {
    const correct = b.reduce((s, t) => s + t.correct_count, 0);
    const total = b.reduce((s, t) => s + t.total_questions, 0);
    if (total === 0) return last;
    last = pct(correct, total);
    return Math.round(last);
  });
  return series.some((v) => v > 0) ? series : [Math.round(fallback), Math.round(fallback)];
}

/** Running cumulative count of attempts matching `keep`, sampled per week. */
function weeklyCumulativeCount(
  attempts: Attempt[],
  now: Date,
  weeks: number,
  keep: (source: string) => boolean
): number[] {
  const buckets = weeklyBuckets(attempts, now, weeks, []);
  // Everything older than the window's start counts toward the opening total.
  const start = startOfDay(new Date(now.getTime() - (weeks * 7 - 1) * DAY_MS));
  let running = attempts.filter(
    (t) => keep(t.source) && t.submitted_at && startOfDay(t.submitted_at) < start
  ).length;
  return buckets.map((b) => {
    running += b.filter((t) => keep(t.source)).length;
    return running;
  });
}

/** Sparklines need ≥2 points; duplicate a single/empty series. */
function pad(series: number[]): number[] {
  if (series.length >= 2) return series;
  if (series.length === 1) return [series[0], series[0]];
  return [0, 0];
}

/** Build the countdown card payload from a scheduled mock or the exam target. */
function buildCountdown(
  nextMock: BuildArgs["nextMock"],
  examTarget: string | null,
  now: Date
): DashCountdown | null {
  let target: Date | null = null;
  let name = "";
  let totalQuestions = 0;
  let durationMin = 0;

  if (nextMock?.unlock_at) {
    target = nextMock.unlock_at;
    name = nextMock.name;
    totalQuestions = nextMock.question_count;
    durationMin = nextMock.duration_min;
  } else {
    // Parse a month + year out of a free-text target like "AKT — Aug 2026".
    const parsed = parseExamTarget(examTarget);
    if (parsed) {
      target = parsed;
      name = examTarget!.trim();
    }
  }

  if (!target) return null;

  const daysAway = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / DAY_MS));
  return {
    name,
    dateLabel: target.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    timeLabel: target.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
    daysAway,
    totalQuestions,
    durationMin,
  };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function parseExamTarget(target: string | null | undefined): Date | null {
  if (!target) return null;
  const lower = target.toLowerCase();
  const monthIdx = MONTHS.findIndex((m) => lower.includes(m));
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  if (monthIdx === -1 || !yearMatch) return null;
  return new Date(Number(yearMatch[1]), monthIdx, 1, 9, 0, 0);
}

function emptyDashboard(): DashboardData {
  const flat: DashStat[] = [
    { key: "streak", label: "Study Streak", value: "0", unit: "days", delta: "Max streak: 0 days", trend: "flat", caption: "", spark: [0, 0] },
    { key: "accuracy", label: "Avg Accuracy", value: "0.0%", delta: "+0.0%", trend: "flat", caption: "vs prev 30 days", spark: [0, 0] },
    { key: "attempts", label: "Quiz Attempts", value: "0", delta: "+0", trend: "flat", caption: "this week", spark: [0, 0] },
    { key: "mocks", label: "Mock Exams", value: "0", unit: "done", delta: "+0", trend: "flat", caption: "this month", spark: [0, 0] },
  ];
  return {
    greeting: {
      salutation: "Welcome!",
      title: "Your study",
      highlight: "cockpit",
      subtext: "Sign in and start practising to light up your dashboard.",
    },
    stats: flat,
    studyActivity: [],
    upcomingExam: null,
    performance: [],
    mockScores: [],
    subjectBreakdown: {},
    weakTopics: [],
    strongTopics: [],
    quickAccess: [
      { key: "mbs", title: "MBS Explorer", caption: "Search billing items", accent: "emerald", badge: "" },
      { key: "autofills", title: "Clinical Autofills", caption: "Templates & macros", accent: "violet", badge: "" },
      { key: "conditions", title: "Conditions Library", caption: "Reference & guidelines", accent: "cyan", badge: "" },
    ],
  };
}
