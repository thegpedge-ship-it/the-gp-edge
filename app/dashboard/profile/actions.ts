"use server";

// ============================================================================
//  Profile backend — the real data behind app/dashboard/profile/page.tsx.
//
//  Replaces the hardcoded `stats` / `examPaths` / `badges` dummies from
//  components/dashboard/data.ts with values read from Postgres:
//    • stats     → user_performance_summary (streak / accuracy / attempts) plus
//                  the user's completed mock-test count.
//    • examPaths → exam_types × mock_tests (available per exam) × the user's
//                  completed mock attempts (done count + average score).
//    • badges    → user_badges ⋈ badges (earned date + image).
//
//  Caching: the assembled payload is memoised per-user via unstable_cache with a
//  short TTL and a `profile:{userId}` tag. Repeated profile visits therefore hit
//  the DB at most once per window; saveQuizAttempt revalidates the tag so the
//  numbers refresh immediately after a test is submitted.
// ============================================================================

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

/* ─── Serializable shapes handed to the (server-rendered) profile page ────── */

export interface ProfileStat {
  key: string;
  label: string;
  value: string;
}

export interface ProfileExamPath {
  code: string;
  name: string;
  readiness: number; // 0-100, average mock score for this exam
  mocksDone: number;
  mocksTotal: number;
  quizzesDone: number;
  quizzesTotal: number;
  quizzesPercent: number;
  nextMilestone: string;
  accent: "emerald" | "violet" | "cyan" | "amber";
}

export interface ProfileBadge {
  key: string;
  name: string;
  earned: string; // e.g. "12 Jan"
  img: string;
}

/** Quiz completion progress across every admin-created quiz (mock-test progress
 *  is carried per-exam on ProfileExamPath instead). */
export interface ProfileCompleteness {
  quizzesCompleted: number; // distinct quizzes this user has finished
  quizzesTotal: number; // all admin-created quizzes (live)
  quizzesPercent: number; // 0-100
}

export interface ProfileData {
  stats: ProfileStat[];
  examPaths: ProfileExamPath[];
  completeness: ProfileCompleteness;
  badges: ProfileBadge[];
}

/* ─── Small helpers ──────────────────────────────────────────────────────── */

const num = (v: unknown) => (v == null ? 0 : Number(v));
const withCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Preferred accent per known exam code, cycling for anything else. */
const ACCENT_BY_CODE: Record<string, ProfileExamPath["accent"]> = {
  AKT: "emerald",
  KFP: "violet",
};
const ACCENT_CYCLE: ProfileExamPath["accent"][] = ["emerald", "violet", "cyan", "amber"];

/** Known local badge art, keyed by a normalised badge code. Used when a badge
 *  has no uploaded image file (the seeded catalogue ships as static assets). */
const LOCAL_BADGE_ART: Record<string, string> = {
  firststeps: "/assets/badges/first_steps_badge.png",
  ontarget: "/assets/badges/on_target_badge.png",
  topperformer: "/assets/badges/top_performer_badge.png",
  unstoppable: "/assets/badges/unstoppable_badge.png",
  gpedge: "/assets/badges/gpedge_badge.png",
};
const FALLBACK_BADGE_ART = "/assets/badges/gpedge_badge.png";

function badgeImage(code: string, objectKey: string | null | undefined): string {
  if (objectKey) {
    const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
    if (base) return `${base.endsWith("/") ? base : `${base}/`}${objectKey}`;
  }
  const normalised = code.toLowerCase().replace(/[^a-z0-9]/g, "");
  return LOCAL_BADGE_ART[normalised] ?? FALLBACK_BADGE_ART;
}

/* ============================================================================
 * PUBLIC ENTRY POINT — resolve the user, then read the cached payload.
 *   The Clerk-dependent user lookup happens OUTSIDE unstable_cache (dynamic
 *   APIs can't run inside it); only the pure per-user DB assembly is cached.
 * ========================================================================== */
export async function getProfileData(): Promise<ProfileData> {
  const dbUser = await ensureDbUser();
  if (!dbUser) return emptyProfile();
  return loadCachedProfileData(dbUser.id, dbUser.exam_target ?? "");
}

// Bump when the ProfileData shape changes so pre-existing cache entries (which
// may lack newer fields like `completeness`) can never be served.
const PROFILE_CACHE_VERSION = "v5";

function loadCachedProfileData(userId: string, examTarget: string): Promise<ProfileData> {
  return unstable_cache(
    () => computeProfileData(userId, examTarget),
    ["profile-data", PROFILE_CACHE_VERSION, userId, examTarget],
    { revalidate: 300, tags: [`profile:${userId}`] },
  )();
}

/** Resolve the user's registered exam code (AKT/KFP) from their exam_target.
 *  exam_target may hold a bare code ("AKT") or a decorated label ("AKT — Aug
 *  2026"), so we match any known code contained in the string. */
function registeredExamCode(examTarget: string, codes: string[]): string | null {
  const t = examTarget.toUpperCase();
  return codes.find((c) => t.includes(c.toUpperCase())) ?? null;
}

/* ============================================================================
 * The actual DB reads + assembly (pure, cacheable — no auth / header access).
 * ========================================================================== */
async function computeProfileData(userId: string, examTarget: string): Promise<ProfileData> {
  const [
    summary,
    examTypes,
    mocksByType,
    userMockAttempts,
    earnedBadges,
    quizzesByType,
    userQuizAttempts,
    totalQuizCount,
    distinctUserQuizzesCompleted,
  ] = await Promise.all([
    // Running rollup: streak / overall accuracy / lifetime attempt count.
    prisma.user_performance_summary.findUnique({
      where: { user_id: userId },
      select: {
        current_streak_days: true,
        longest_streak_days: true,
        last_active_date: true,
        overall_accuracy: true,
        total_attempts: true,
      },
    }),

    // The exam tracks themselves.
    prisma.exam_types.findMany({ select: { code: true, name: true } }),

    // How many mock tests exist per exam (the "of N" denominator).
    prisma.mock_tests.groupBy({
      by: ["exam_type_code"],
      where: { deleted_at: null },
      _count: { _all: true },
    }),

    // This user's completed mocks → per-exam done-count + score for readiness.
    prisma.test_attempts.findMany({
      where: { user_id: userId, source: "mock_test", status: "completed" },
      select: {
        id: true,
        mock_test_id: true,
        score_percent: true,
        mock_tests: { select: { exam_type_code: true } },
      },
    }),

    // Earned achievements, oldest → newest, with image (uploaded file or code).
    prisma.user_badges.findMany({
      where: { user_id: userId },
      orderBy: { earned_at: "asc" },
      select: {
        earned_at: true,
        badges: {
          select: {
            code: true,
            name: true,
            files: { select: { object_key: true } },
          },
        },
      },
    }),

    // Quizzes per exam type (denominator)
    prisma.quizzes.groupBy({
      by: ["exam_type_code"],
      where: { deleted_at: null },
      _count: { _all: true },
    }),

    // User's completed quiz attempts
    prisma.test_attempts.findMany({
      where: {
        user_id: userId,
        status: "completed",
        source: { in: ["quiz", "custom", "subtopic", "mock_drill"] },
      },
      select: {
        id: true,
        quiz_id: true,
        source: true,
        score_percent: true,
        quizzes: { select: { exam_type_code: true } },
      },
    }),

    // Total active admin quizzes count
    prisma.quizzes.count({ where: { deleted_at: null } }),

    // Distinct quizzes completed
    prisma.test_attempts.groupBy({
      by: ["quiz_id"],
      where: { user_id: userId, status: "completed", quiz_id: { not: null } },
    }),
  ]);

  /* ── STATS (telemetry grid) ─────────────────────────────────────────────── */
  const totalMocks = userMockAttempts.length;
  // current_streak_days is only rewritten on submit, so it goes stale after a
  // missed day — show 0 unless the user was active today or yesterday.
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const streakAlive =
    summary?.last_active_date != null &&
    Math.round((startOfDay(new Date()) - startOfDay(new Date(summary.last_active_date))) / 86_400_000) <= 1;
  const stats: ProfileStat[] = [
    { key: "streak", label: "Study Streak", value: String(streakAlive ? summary?.current_streak_days ?? 0 : 0) },
    { key: "accuracy", label: "Avg Accuracy", value: `${num(summary?.overall_accuracy).toFixed(1)}%` },
    { key: "attempts", label: "Quiz Attempts", value: withCommas(summary?.total_attempts ?? 0) },
    { key: "mocks", label: "Mock Exams", value: String(totalMocks) },
  ];

  /* ── EXAM PATHS (readiness & progress per exam track) ───────────────────── */
  const availMocksByType = new Map(mocksByType.map((r) => [r.exam_type_code, r._count._all]));
  const availQuizzesByType = new Map(
    quizzesByType.filter((r) => r.exam_type_code != null).map((r) => [r.exam_type_code!, r._count._all]),
  );

  // Group user's mock attempts by exam track
  const doneMocksByType = new Map<string, { scoreSum: number; attemptsCount: number; distinctMockIds: Set<string> }>();
  for (const att of userMockAttempts) {
    const code = att.mock_tests?.exam_type_code;
    if (!code) continue;
    const agg = doneMocksByType.get(code) ?? { scoreSum: 0, attemptsCount: 0, distinctMockIds: new Set<string>() };
    agg.scoreSum += num(att.score_percent);
    agg.attemptsCount += 1;
    if (att.mock_test_id) {
      agg.distinctMockIds.add(att.mock_test_id);
    }
    doneMocksByType.set(code, agg);
  }

  // Group user's quiz attempts by exam track
  const doneQuizzesByType = new Map<string, { scoreSum: number; attemptsCount: number; distinctQuizIds: Set<string> }>();
  for (const att of userQuizAttempts) {
    const code = att.quizzes?.exam_type_code;
    if (code) {
      const agg = doneQuizzesByType.get(code) ?? { scoreSum: 0, attemptsCount: 0, distinctQuizIds: new Set<string>() };
      agg.scoreSum += num(att.score_percent);
      agg.attemptsCount += 1;
      if (att.quiz_id) {
        agg.distinctQuizIds.add(att.quiz_id);
      }
      doneQuizzesByType.set(code, agg);
    }
  }

  // Only show the exam the user actually registered for (AKT or KFP). Falls
  // back to every track if their exam_target can't be matched to a known code.
  const regCode = registeredExamCode(
    examTarget,
    examTypes.map((et) => et.code),
  );

  const distinctQuizzesGlobalCount = distinctUserQuizzesCompleted.length;

  const examPaths: ProfileExamPath[] = examTypes
    .filter((et) => (regCode ? et.code === regCode : true))
    .map((et, i) => {
      const mocksTotal = availMocksByType.get(et.code) ?? 0;
      const mockAgg = doneMocksByType.get(et.code);
      
      // If there are distinct mock test items in the DB, count distinct completed.
      // Otherwise use the mock attempts count.
      const mocksDone = mocksTotal > 0
        ? (mockAgg?.distinctMockIds.size ?? 0)
        : (mockAgg?.attemptsCount ?? 0);

      const readiness = mockAgg && mockAgg.attemptsCount > 0 ? Math.round(mockAgg.scoreSum / mockAgg.attemptsCount) : 0;
      
      const nextMilestone =
        mocksTotal > 0 && mocksDone < mocksTotal
          ? `Take mock ${mocksDone + 1} of ${mocksTotal}`
          : readiness < 75
            ? "Reach 75% readiness"
            : "Exam ready";

      // Quizzes for this exam track (falling back to global quiz count if track has no specific quiz tags)
      const trackQuizzesTotal = availQuizzesByType.get(et.code) ?? (totalQuizCount > 0 ? totalQuizCount : 0);
      const quizAgg = doneQuizzesByType.get(et.code);
      const trackQuizzesDone = quizAgg
        ? (quizAgg.distinctQuizIds.size > 0 ? quizAgg.distinctQuizIds.size : quizAgg.attemptsCount)
        : distinctQuizzesGlobalCount;

      const quizzesPercent = trackQuizzesTotal > 0
        ? Math.min(100, Math.max(0, Math.round((trackQuizzesDone / trackQuizzesTotal) * 100)))
        : (trackQuizzesDone > 0 ? 100 : 0);

      return {
        code: et.code,
        name: et.name,
        readiness,
        mocksDone,
        mocksTotal,
        quizzesDone: trackQuizzesDone,
        quizzesTotal: trackQuizzesTotal,
        quizzesPercent,
        nextMilestone,
        accent: ACCENT_BY_CODE[et.code] ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      };
    });

  /* ── QUIZ COMPLETENESS (distinct quizzes finished vs. all admin quizzes) ── */
  const quizzesCompleted = distinctQuizzesGlobalCount;
  const completeness: ProfileCompleteness = {
    quizzesCompleted,
    quizzesTotal: totalQuizCount,
    quizzesPercent: totalQuizCount > 0 ? Math.min(100, Math.max(0, Math.round((quizzesCompleted / totalQuizCount) * 100))) : 0,
  };

  /* ── BADGES (earned achievements) ───────────────────────────────────────── */
  const badges: ProfileBadge[] = earnedBadges
    .filter((ub) => ub.badges)
    .map((ub) => ({
      key: ub.badges!.code,
      name: ub.badges!.name,
      earned: ub.earned_at.toLocaleDateString("en-AU", { day: "2-digit", month: "short" }),
      img: badgeImage(ub.badges!.code, ub.badges!.files?.object_key),
    }));

  return { stats, examPaths, completeness, badges };
}

/* ─── Zero-state for signed-out / not-yet-provisioned users ──────────────── */
function emptyProfile(): ProfileData {
  return {
    stats: [
      { key: "streak", label: "Study Streak", value: "0" },
      { key: "accuracy", label: "Avg Accuracy", value: "0.0%" },
      { key: "attempts", label: "Quiz Attempts", value: "0" },
      { key: "mocks", label: "Mock Exams", value: "0" },
    ],
    examPaths: [],
    completeness: { quizzesCompleted: 0, quizzesTotal: 0, quizzesPercent: 0 },
    badges: [],
  };
}
