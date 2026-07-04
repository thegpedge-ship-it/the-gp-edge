"use server";

// ============================================================================
//  Exam-prep backend — server actions for the subject → subtopic → exam →
//  questions flow, plus saving a completed attempt for stats.
//
//  Data model recap (see database/schema.sql):
//    subjects ─< subtopics ─< questions >─ quiz_questions >─ quizzes
//    A quiz has NO direct subtopic link — a quiz "belongs to" a subtopic
//    because its questions do (questions.subtopic_id). The seed
//    (seed_quiz_per_subtopic.sql) builds exactly one quiz per subtopic.
//
//  Auth: reads resolve the signed-in user to filter by their exam target but
//  don't hard-fail without one; the save action requires a signed-in user.
// ============================================================================

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";
import type { difficulty_level } from "@/lib/generated/prisma";

/* ─── Serializable shapes returned to client components ─────────────────── */

export type UiDifficulty = "Easy" | "Medium" | "Hard";

export interface ExamSubject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  subtopicCount: number;
  questionCount: number;
}

export interface ExamSubtopic {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
}

export interface ExamQuiz {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g. "10 min" — display string
  questionCount: number;
  difficulty: UiDifficulty;
}

/** Lightweight payload for the instructions page — IDs only, no answers. */
export interface QuizDetail {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  timeLimitMin: number | null;
  examType: string | null;
  questionIds: string[];
}

/** Full question payload for the quiz-taking page. */
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  rationale: string;
  topic: string; // subtopic (or subject) name, shown in the question header
  difficulty: UiDifficulty;
  examType: string | null;
  image?: string;
}

export interface SaveAttemptAnswer {
  questionId: string;
  /** 0-based index of the chosen option, or null if left unanswered. */
  selectedIndex: number | null;
  timeSpentSeconds?: number;
}

export type AttemptSource = "quiz" | "custom" | "subtopic" | "mock_drill" | "mock_test";

export interface SaveAttemptInput {
  source: AttemptSource;
  /** Required when source === "quiz". */
  quizId?: string;
  /** Required when source === "subtopic". */
  subtopicId?: string;
  /** Required when source === "mock_test". */
  mockTestId?: string;
  /** Display label stored on the attempt (custom quizzes / drills). */
  title?: string;
  /** The full ordered set of question IDs the user was shown. */
  questionIds: string[];
  answers: SaveAttemptAnswer[];
  /** ISO string of when the attempt started; defaults to now. */
  startedAt?: string;
  /** Total seconds the user spent. */
  durationSeconds?: number;
}

export interface SaveAttemptResult {
  ok: boolean;
  attemptId?: string;
  score?: number; // percent, 0-100
  correctCount?: number;
  totalQuestions?: number;
  error?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const DIFFICULTY_LABEL: Record<difficulty_level, UiDifficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Map a free-text exam target ("AKT — Aug 2026") to an exam_types.code. */
function examCodeFromTarget(target: string | null | undefined): string | null {
  if (!target) return null;
  const t = target.toUpperCase();
  if (t.includes("KFP")) return "KFP";
  if (t.includes("AKT")) return "AKT";
  return null;
}

/** Most common difficulty among a set, defaulting to medium. */
function majorityDifficulty(diffs: difficulty_level[]): UiDifficulty {
  if (diffs.length === 0) return "Medium";
  const counts = { easy: 0, medium: 0, hard: 0 } as Record<difficulty_level, number>;
  for (const d of diffs) counts[d]++;
  const winner = (Object.keys(counts) as difficulty_level[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a
  );
  return DIFFICULTY_LABEL[winner];
}

/* ============================================================================
 * STEP 1 — Subjects for the user's exam.
 *   Returns every non-deleted subject that has at least one published question
 *   (optionally scoped to the user's exam type), with subtopic + question counts.
 * ========================================================================== */
export async function getExamSubjects(): Promise<ExamSubject[]> {
  const dbUser = await ensureDbUser();
  const examCode = examCodeFromTarget(dbUser?.exam_target);

  // Published-question counts per subject (optionally for this exam type).
  const questionWhere = {
    status: "published" as const,
    deleted_at: null,
    subject_id: { not: null },
    ...(examCode ? { exam_type_code: examCode } : {}),
  };

  const [subjects, qCounts, stCounts] = await Promise.all([
    prisma.subjects.findMany({
      where: { deleted_at: null },
      orderBy: { sort_order: "asc" },
      select: { id: true, slug: true, name: true, icon: true, color: true },
    }),
    prisma.questions.groupBy({
      by: ["subject_id"],
      where: questionWhere,
      _count: { _all: true },
    }),
    prisma.subtopics.groupBy({
      by: ["subject_id"],
      where: { deleted_at: null },
      _count: { _all: true },
    }),
  ]);

  const qBySubject = new Map(qCounts.map((r) => [r.subject_id, r._count._all]));
  const stBySubject = new Map(stCounts.map((r) => [r.subject_id, r._count._all]));

  return subjects
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      icon: s.icon,
      color: s.color,
      subtopicCount: stBySubject.get(s.id) ?? 0,
      questionCount: qBySubject.get(s.id) ?? 0,
    }))
    // Hide subjects with no questions for this exam so the menu isn't cluttered.
    .filter((s) => s.questionCount > 0);
}

/* ============================================================================
 * STEP 2 — Subtopics in a subject (lazy-loaded when a subject is clicked).
 * ========================================================================== */
export async function getSubtopics(subjectId: string): Promise<ExamSubtopic[]> {
  const dbUser = await ensureDbUser();
  const examCode = examCodeFromTarget(dbUser?.exam_target);

  const [subtopics, qCounts] = await Promise.all([
    prisma.subtopics.findMany({
      where: { subject_id: subjectId, deleted_at: null },
      orderBy: { sort_order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.questions.groupBy({
      by: ["subtopic_id"],
      where: {
        subject_id: subjectId,
        status: "published",
        deleted_at: null,
        subtopic_id: { not: null },
        ...(examCode ? { exam_type_code: examCode } : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const bySubtopic = new Map(qCounts.map((r) => [r.subtopic_id, r._count._all]));

  return subtopics.map((st) => ({
    id: st.id,
    name: st.name,
    slug: st.slug,
    questionCount: bySubtopic.get(st.id) ?? 0,
  }));
}

/* ============================================================================
 * STEP 3 — Exams (quizzes) available in a subtopic.
 *   A quiz qualifies if any of its questions belong to this subtopic.
 * ========================================================================== */
export async function getQuizzesForSubtopic(subtopicId: string): Promise<ExamQuiz[]> {
  const quizzes = await prisma.quizzes.findMany({
    where: {
      deleted_at: null,
      status: "active",
      quiz_questions: {
        some: {
          questions: { subtopic_id: subtopicId, deleted_at: null, status: "published" },
        },
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      time_limit_min: true,
      quiz_questions: {
        select: {
          questions: {
            select: { difficulty: true, status: true, deleted_at: true },
          },
        },
      },
    },
  });

  return quizzes.map((quiz) => {
    const live = quiz.quiz_questions
      .map((qq) => qq.questions)
      .filter((q): q is NonNullable<typeof q> => !!q && q.status === "published" && !q.deleted_at);
    return {
      id: quiz.id,
      name: quiz.name,
      description: quiz.description ?? "",
      duration: quiz.time_limit_min ? `${quiz.time_limit_min} min` : "Untimed",
      questionCount: live.length,
      difficulty: majorityDifficulty(live.map((q) => q.difficulty)),
    };
  });
}

/* ============================================================================
 * STEP 4 — Question IDs for a quiz (drives the instructions page).
 * ========================================================================== */
export async function getQuizQuestionIds(quizId: string): Promise<QuizDetail | null> {
  const quiz = await prisma.quizzes.findFirst({
    where: { id: quizId, deleted_at: null },
    select: {
      id: true,
      name: true,
      description: true,
      time_limit_min: true,
      exam_type_code: true,
      quiz_questions: {
        orderBy: { position: "asc" },
        select: {
          question_id: true,
          questions: { select: { status: true, deleted_at: true } },
        },
      },
    },
  });
  if (!quiz) return null;

  const questionIds = quiz.quiz_questions
    .filter((qq) => qq.questions && qq.questions.status === "published" && !qq.questions.deleted_at)
    .map((qq) => qq.question_id);

  return {
    id: quiz.id,
    name: quiz.name,
    description: quiz.description ?? "",
    questionCount: questionIds.length,
    timeLimitMin: quiz.time_limit_min,
    examType: quiz.exam_type_code,
    questionIds,
  };
}

/* ============================================================================
 * STEP 5 — Full questions by ID (drives the quiz-taking page).
 *   Preserves the order of the supplied `ids`.
 *
 *   NOTE: correctIndex is included so the existing client-side result screen
 *   keeps working. Grading is ALSO done authoritatively server-side in
 *   saveQuizAttempt — never trust the client for the saved score.
 * ========================================================================== */
export async function getQuestionsByIds(ids: string[]): Promise<QuizQuestion[]> {
  if (ids.length === 0) return [];

  // NOTE: question_options is fetched as its own query, not via the questions
  // relation. Prisma introspected the partial unique index uq_question_one_correct
  // as a full @unique on question_id, so questions.question_options is generated
  // as a 1:1 (single) relation and would only return one of the four options.
  const [rows, options] = await Promise.all([
    prisma.questions.findMany({
      where: { id: { in: ids }, deleted_at: null, status: "published" },
      select: {
        id: true,
        stem: true,
        rationale: true,
        difficulty: true,
        exam_type_code: true,
        subtopics: { select: { name: true } },
        subjects: { select: { name: true } },
      },
    }),
    prisma.question_options.findMany({
      where: { question_id: { in: ids } },
      orderBy: { position: "asc" },
      select: { question_id: true, label: true, is_correct: true },
    }),
  ]);

  const optionsByQ = new Map<string, { label: string; is_correct: boolean }[]>();
  for (const o of options) {
    const list = optionsByQ.get(o.question_id) ?? [];
    list.push({ label: o.label, is_correct: o.is_correct });
    optionsByQ.set(o.question_id, list);
  }

  const byId = new Map(rows.map((q) => [q.id, q]));

  // Re-order to match the requested id order; drop any that no longer exist.
  return ids
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map((q) => {
      const opts = optionsByQ.get(q.id) ?? [];
      const options = opts.map((o) => o.label);
      const correctIndex = opts.findIndex((o) => o.is_correct);
      return {
        id: q.id,
        text: q.stem,
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        rationale: q.rationale ?? "",
        topic: q.subtopics?.name ?? q.subjects?.name ?? "General",
        difficulty: DIFFICULTY_LABEL[q.difficulty],
        examType: q.exam_type_code,
        // image: resolved from files/R2 once question images exist — none seeded yet.
      };
    });
}

/* ============================================================================
 * STEP 6 — Save a completed attempt (summary + stats).
 *   Writes ONE completed test_attempts row, then rolls up
 *   user_performance_summary and user_subject_mastery. No per-question
 *   snapshots (per chosen "Summary + stats only" mode).
 *
 *   Grading is authoritative: option correctness is read from the DB, not the
 *   client. Inserting the row already `completed` avoids the update-lock trigger.
 * ========================================================================== */
export async function saveQuizAttempt(input: SaveAttemptInput): Promise<SaveAttemptResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You're not signed in." };

  const dbUser = await ensureDbUser();
  if (!dbUser) return { ok: false, error: "Could not load your account. Please refresh." };

  // Validate the source ↔ id pairing the DB CHECK (chk_attempt_source) enforces.
  if (input.source === "quiz" && !input.quizId)
    return { ok: false, error: "Missing quiz reference." };
  if (input.source === "subtopic" && !input.subtopicId)
    return { ok: false, error: "Missing subtopic reference." };
  if (input.source === "mock_test" && !input.mockTestId)
    return { ok: false, error: "Missing mock test reference." };

  const questionIds = input.questionIds;
  if (questionIds.length === 0) return { ok: false, error: "This attempt has no questions." };

  // Authoritative question + option data — correctness is read from the DB,
  // never trusted from the client. Options are fetched directly (see the note in
  // getQuestionsByIds about the 1:1-relation introspection quirk).
  const [qRows, optionRows] = await Promise.all([
    prisma.questions.findMany({
      where: { id: { in: questionIds }, deleted_at: null },
      select: { id: true, subject_id: true },
    }),
    prisma.question_options.findMany({
      where: { question_id: { in: questionIds } },
      select: { question_id: true, position: true, is_correct: true },
    }),
  ]);

  const subjectByQ = new Map(qRows.map((q) => [q.id, q.subject_id]));
  const correctIsByQ = new Map<string, Map<number, boolean>>();
  for (const o of optionRows) {
    const m = correctIsByQ.get(o.question_id) ?? new Map<number, boolean>();
    m.set(o.position, o.is_correct);
    correctIsByQ.set(o.question_id, m);
  }

  const answerByQ = new Map(input.answers.map((a) => [a.questionId, a]));

  // Grade against the DB, and aggregate per-subject for mastery.
  let correctCount = 0;
  const bySubject = new Map<string, { correct: number; incorrect: number; total: number }>();

  for (const qid of questionIds) {
    const selected = answerByQ.get(qid)?.selectedIndex ?? null;
    if (selected === null || selected === undefined) continue; // unanswered

    const isCorrect = correctIsByQ.get(qid)?.get(selected) === true;
    if (isCorrect) correctCount++;

    const subjectId = subjectByQ.get(qid);
    if (subjectId) {
      const agg = bySubject.get(subjectId) ?? { correct: 0, incorrect: 0, total: 0 };
      agg.total++;
      if (isCorrect) agg.correct++;
      else agg.incorrect++;
      bySubject.set(subjectId, agg);
    }
  }

  const totalQuestions = questionIds.length;
  const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const durationSeconds = input.durationSeconds ?? null;
  const now = new Date();

  try {
    const attemptId = await prisma.$transaction(async (tx) => {
      // 1. The completed attempt row (insert-as-completed → no lock-trigger fight).
      const attempt = await tx.test_attempts.create({
        data: {
          user_id: dbUser.id,
          source: input.source,
          quiz_id: input.source === "quiz" ? input.quizId : undefined,
          subtopic_id: input.source === "subtopic" ? input.subtopicId : undefined,
          mock_test_id: input.source === "mock_test" ? input.mockTestId : undefined,
          title_snapshot: input.title ?? null,
          status: "completed",
          total_questions: totalQuestions,
          correct_count: correctCount,
          score_percent: scorePercent.toFixed(2),
          duration_seconds: durationSeconds ?? undefined,
          started_at: startedAt,
          submitted_at: now,
          last_seen_at: now,
        },
        select: { id: true },
      });

      // 2. Performance summary rollup (+ daily streak).
      const summary = await tx.user_performance_summary.findUnique({
        where: { user_id: dbUser.id },
      });

      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = startOfDay(now);
      let currentStreak = 1;
      if (summary?.last_active_date) {
        const last = startOfDay(new Date(summary.last_active_date));
        const dayMs = 86_400_000;
        const gap = Math.round((today.getTime() - last.getTime()) / dayMs);
        if (gap === 0) currentStreak = summary.current_streak_days; // already active today
        else if (gap === 1) currentStreak = summary.current_streak_days + 1;
        else currentStreak = 1; // streak broken
      }

      const newTotalAttempts = (summary?.total_attempts ?? 0) + 1;
      const newTotalQuestions = (summary?.total_questions ?? 0) + totalQuestions;
      const newTotalCorrect = (summary?.total_correct ?? 0) + correctCount;
      const overallAccuracy =
        newTotalQuestions > 0 ? (newTotalCorrect / newTotalQuestions) * 100 : 0;
      const longestStreak = Math.max(summary?.longest_streak_days ?? 0, currentStreak);

      await tx.user_performance_summary.upsert({
        where: { user_id: dbUser.id },
        create: {
          user_id: dbUser.id,
          total_attempts: 1,
          total_questions: totalQuestions,
          total_correct: correctCount,
          overall_accuracy: overallAccuracy.toFixed(2),
          current_streak_days: currentStreak,
          longest_streak_days: longestStreak,
          last_active_date: today,
        },
        update: {
          total_attempts: newTotalAttempts,
          total_questions: newTotalQuestions,
          total_correct: newTotalCorrect,
          overall_accuracy: overallAccuracy.toFixed(2),
          current_streak_days: currentStreak,
          longest_streak_days: longestStreak,
          last_active_date: today,
        },
      });

      // 3. Per-subject mastery rollup (weak / developing / strong).
      for (const [subjectId, agg] of bySubject) {
        const existing = await tx.user_subject_mastery.findUnique({
          where: { user_id_subject_id: { user_id: dbUser.id, subject_id: subjectId } },
        });
        const total = (existing?.total_answered ?? 0) + agg.total;
        const correct = (existing?.correct_count ?? 0) + agg.correct;
        const incorrect = (existing?.incorrect_count ?? 0) + agg.incorrect;
        const masteryPercent = total > 0 ? (correct / total) * 100 : 0;
        const strength =
          masteryPercent >= 75 ? "strong" : masteryPercent >= 50 ? "developing" : "weak";

        await tx.user_subject_mastery.upsert({
          where: { user_id_subject_id: { user_id: dbUser.id, subject_id: subjectId } },
          create: {
            user_id: dbUser.id,
            subject_id: subjectId,
            correct_count: agg.correct,
            incorrect_count: agg.incorrect,
            total_answered: agg.total,
            mastery_percent: masteryPercent.toFixed(2),
            strength,
            last_attempt_at: now,
          },
          update: {
            correct_count: correct,
            incorrect_count: incorrect,
            total_answered: total,
            mastery_percent: masteryPercent.toFixed(2),
            strength,
            last_attempt_at: now,
          },
        });
      }

      return attempt.id;
    });

    return {
      ok: true,
      attemptId,
      score: Math.round(scorePercent),
      correctCount,
      totalQuestions,
    };
  } catch {
    return { ok: false, error: "Could not save your attempt. Please try again." };
  }
}

/* ============================================================================
 * EXTRA — full subject→subtopic tree (for the Create-Quiz modal, which needs
 * every subtopic up-front for select-all / totals).
 * ========================================================================== */
export interface ExamTreeSubject extends ExamSubject {
  subtopics: ExamSubtopic[];
}

export async function getExamTree(): Promise<ExamTreeSubject[]> {
  const dbUser = await ensureDbUser();
  const examCode = examCodeFromTarget(dbUser?.exam_target);
  const examFilter = examCode ? { exam_type_code: examCode } : {};

  const [subjects, subtopics, qBySubject, qBySubtopic] = await Promise.all([
    prisma.subjects.findMany({
      where: { deleted_at: null },
      orderBy: { sort_order: "asc" },
      select: { id: true, slug: true, name: true, icon: true, color: true },
    }),
    prisma.subtopics.findMany({
      where: { deleted_at: null },
      orderBy: { sort_order: "asc" },
      select: { id: true, slug: true, name: true, subject_id: true },
    }),
    prisma.questions.groupBy({
      by: ["subject_id"],
      where: { status: "published", deleted_at: null, subject_id: { not: null }, ...examFilter },
      _count: { _all: true },
    }),
    prisma.questions.groupBy({
      by: ["subtopic_id"],
      where: { status: "published", deleted_at: null, subtopic_id: { not: null }, ...examFilter },
      _count: { _all: true },
    }),
  ]);

  const qBySub = new Map(qBySubject.map((r) => [r.subject_id, r._count._all]));
  const qByStop = new Map(qBySubtopic.map((r) => [r.subtopic_id, r._count._all]));

  const subtopicsBySubject = new Map<string, ExamSubtopic[]>();
  for (const st of subtopics) {
    const list = subtopicsBySubject.get(st.subject_id) ?? [];
    list.push({
      id: st.id,
      name: st.name,
      slug: st.slug,
      questionCount: qByStop.get(st.id) ?? 0,
    });
    subtopicsBySubject.set(st.subject_id, list);
  }

  return subjects
    .map((s) => {
      const sts = subtopicsBySubject.get(s.id) ?? [];
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        color: s.color,
        subtopicCount: sts.length,
        questionCount: qBySub.get(s.id) ?? 0,
        // Only offer subtopics that actually have questions for this exam.
        subtopics: sts.filter((st) => st.questionCount > 0),
      };
    })
    .filter((s) => s.questionCount > 0);
}

/* ============================================================================
 * EXTRA — build a random question set from chosen subtopics (Create Quiz) or
 * the whole bank (Mock Drill, when subtopicIds is empty).
 * ========================================================================== */
export interface CustomQuestionSet {
  name: string;
  questionIds: string[];
}

export async function buildCustomQuestionSet(params: {
  subtopicIds: string[];
  count: number;
  title?: string;
}): Promise<CustomQuestionSet> {
  const dbUser = await ensureDbUser();
  const examCode = examCodeFromTarget(dbUser?.exam_target);

  const rows = await prisma.questions.findMany({
    where: {
      status: "published",
      deleted_at: null,
      ...(examCode ? { exam_type_code: examCode } : {}),
      ...(params.subtopicIds.length ? { subtopic_id: { in: params.subtopicIds } } : {}),
    },
    select: { id: true },
  });

  // Fisher–Yates shuffle, then take the requested count.
  const ids = rows.map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const take = Math.max(1, Math.min(params.count, ids.length));

  return { name: params.title ?? "Custom Quiz", questionIds: ids.slice(0, take) };
}

/* ============================================================================
 * EXTRA — mock tests (full simulations). Reads the mock_tests table; returns
 * [] until any are seeded, so the UI shows an empty state instead of dummy data.
 * ========================================================================== */
export interface UiMockTest {
  id: string;
  name: string;
  subtitle: string | null;
  questionCount: number;
  durationMin: number;
  availability: "available" | "locked";
  unlockHint: string | null;
  /** Per-user history. */
  attempts: number;
  bestScore: number | null;
  completed: boolean;
}

export async function getMockTests(): Promise<UiMockTest[]> {
  const dbUser = await ensureDbUser();

  const tests = await prisma.mock_tests.findMany({
    where: { deleted_at: null },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      subtitle: true,
      question_count: true,
      duration_min: true,
      availability: true,
      unlock_hint: true,
    },
  });
  if (tests.length === 0) return [];

  // Per-user attempt history for these mocks (best score + count).
  const attempts = dbUser
    ? await prisma.test_attempts.groupBy({
        by: ["mock_test_id"],
        where: {
          user_id: dbUser.id,
          source: "mock_test",
          status: "completed",
          mock_test_id: { in: tests.map((t) => t.id) },
        },
        _count: { _all: true },
        _max: { score_percent: true },
      })
    : [];
  const statByMock = new Map(attempts.map((a) => [a.mock_test_id, a]));

  return tests.map((t) => {
    const stat = statByMock.get(t.id);
    const best = stat?._max.score_percent;
    return {
      id: t.id,
      name: t.name,
      subtitle: t.subtitle,
      questionCount: t.question_count,
      durationMin: t.duration_min,
      availability: t.availability === "locked" ? "locked" : "available",
      unlockHint: t.unlock_hint,
      attempts: stat?._count._all ?? 0,
      bestScore: best != null ? Math.round(Number(best)) : null,
      completed: (stat?._count._all ?? 0) > 0,
    };
  });
}

/** Ordered question IDs for a mock test (drives its instructions/start pages). */
export async function getMockTestQuestionIds(mockTestId: string): Promise<QuizDetail | null> {
  const mock = await prisma.mock_tests.findFirst({
    where: { id: mockTestId, deleted_at: null },
    select: {
      id: true,
      name: true,
      subtitle: true,
      duration_min: true,
      exam_type_code: true,
      mock_test_questions: {
        orderBy: { position: "asc" },
        select: {
          question_id: true,
          questions: { select: { status: true, deleted_at: true } },
        },
      },
    },
  });
  if (!mock) return null;

  const questionIds = mock.mock_test_questions
    .filter((mq) => mq.questions && mq.questions.status === "published" && !mq.questions.deleted_at)
    .map((mq) => mq.question_id);

  return {
    id: mock.id,
    name: mock.name,
    description: mock.subtitle ?? "",
    questionCount: questionIds.length,
    timeLimitMin: mock.duration_min,
    examType: mock.exam_type_code,
    questionIds,
  };
}
