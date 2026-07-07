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
const PROFILE_CACHE_VERSION = "v3";

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
    totalQuizCount,
    completedQuizGroups,
  ] = await Promise.all([
    // Running rollup: streak / overall accuracy / lifetime attempt count.
    prisma.user_performance_summary.findUnique({
      where: { user_id: userId },
      select: {
        current_streak_days: true,
        longest_streak_days: true,
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
      select: { score_percent: true, mock_tests: { select: { exam_type_code: true } } },
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

    // Quiz completeness denominator: every admin-created quiz (live).
    prisma.quizzes.count({ where: { deleted_at: null } }),

    // Quiz completeness numerator: distinct quizzes this user has finished.
    prisma.test_attempts.groupBy({
      by: ["quiz_id"],
      where: { user_id: userId, source: "quiz", status: "completed", quiz_id: { not: null } },
    }),
  ]);

  /* ── STATS (telemetry grid) ─────────────────────────────────────────────── */
  const totalMocks = userMockAttempts.length;
  const stats: ProfileStat[] = [
    { key: "streak", label: "Study Streak", value: String(summary?.current_streak_days ?? 0) },
    { key: "accuracy", label: "Avg Accuracy", value: `${num(summary?.overall_accuracy).toFixed(1)}%` },
    { key: "attempts", label: "Quiz Attempts", value: withCommas(summary?.total_attempts ?? 0) },
    { key: "mocks", label: "Mock Exams", value: String(totalMocks) },
  ];

  /* ── EXAM PATHS (readiness per exam track) ──────────────────────────────── */
  const availByType = new Map(mocksByType.map((r) => [r.exam_type_code, r._count._all]));
  const doneByType = new Map<string, { scoreSum: number; count: number }>();
  for (const att of userMockAttempts) {
    const code = att.mock_tests?.exam_type_code;
    if (!code) continue;
    const agg = doneByType.get(code) ?? { scoreSum: 0, count: 0 };
    agg.scoreSum += num(att.score_percent);
    agg.count += 1;
    doneByType.set(code, agg);
  }

  // Only show the exam the user actually registered for (AKT or KFP). Falls
  // back to every track if their exam_target can't be matched to a known code.
  const regCode = registeredExamCode(
    examTarget,
    examTypes.map((et) => et.code),
  );

  const examPaths: ProfileExamPath[] = examTypes
    .filter((et) => (regCode ? et.code === regCode : true))
    // Only surface tracks that actually have mock tests to sit behind them.
    .filter((et) => (availByType.get(et.code) ?? 0) > 0)
    .map((et, i) => {
      const mocksTotal = availByType.get(et.code) ?? 0;
      const agg = doneByType.get(et.code);
      const mocksDone = agg?.count ?? 0;
      const readiness = agg && agg.count > 0 ? Math.round(agg.scoreSum / agg.count) : 0;
      const nextMilestone =
        mocksDone < mocksTotal
          ? `Take mock ${mocksDone + 1} of ${mocksTotal}`
          : readiness < 75
            ? "Reach 75% readiness"
            : "Exam ready";
      return {
        code: et.code,
        name: et.name,
        readiness,
        mocksDone,
        mocksTotal,
        nextMilestone,
        accent: ACCENT_BY_CODE[et.code] ?? ACCENT_CYCLE[i % ACCENT_CYCLE.length],
      };
    });

  /* ── QUIZ COMPLETENESS (distinct quizzes finished vs. all admin quizzes) ── */
  const quizzesCompleted = completedQuizGroups.length;
  const completeness: ProfileCompleteness = {
    quizzesCompleted,
    quizzesTotal: totalQuizCount,
    quizzesPercent: totalQuizCount > 0 ? Math.round((quizzesCompleted / totalQuizCount) * 100) : 0,
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
