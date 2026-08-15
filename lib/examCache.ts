// Session-scoped cache for the exam-prep menu data.
//
// Subjects / subtopics / quizzes are admin-authored and effectively static for
// the duration of a browsing session, so once fetched we keep them in
// sessionStorage and read from there instead of hitting the server again on
// every page visit, subject re-open, or component remount. The cache lives for
// the tab session and is wiped when the tab closes (or via clearExamCache).

import {
  getExamSubjects,
  getSubtopics,
  getQuizzesForSubtopic,
  getExamTree,
  getMockTests,
  getMockTestQuestionIds,
} from "@/app/exam-prep/actions";
import type {
  ExamSubject,
  ExamSubtopic,
  ExamQuiz,
  ExamTreeSubject,
  UiMockTest,
  QuizDetail,
} from "@/app/exam-prep/actions";

const PREFIX = "gpedge_exam_cache:";

/** How long a cached entry stays fresh before it's re-fetched. */
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Stored shape: the value plus the time it was written (epoch ms). */
type Entry<T> = { t: number; v: T };

/**
 * Promises for reads currently in flight, keyed by storage key. A second caller
 * that asks for the same key while a fetch is pending re-uses that promise
 * instead of firing its own round-trip. This lets us prefetch a key at page
 * mount and have the owning component's own `cached*()` call ride the same
 * request rather than duplicating it.
 */
const inflight = new Map<string, Promise<unknown>>();

/**
 * Read-through cache with a TTL: return the stored value if it's still fresh,
 * otherwise fetch, store (stamped with `Date.now()`), and return. Expired or
 * malformed entries are discarded and re-fetched. Concurrent reads of the same
 * key are de-duplicated so only one request goes to the server.
 */
async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const storageKey = PREFIX + key;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw !== null) {
        const entry = JSON.parse(raw) as Entry<T>;
        if (entry && typeof entry.t === "number" && Date.now() - entry.t < ttlMs) {
          return entry.v;
        }
        sessionStorage.removeItem(storageKey); // expired or unrecognised shape
      }
    } catch {
      /* corrupt entry or storage disabled — fall through to a fresh fetch */
    }
  }

  // Coalesce concurrent misses onto a single in-flight request.
  const pending = inflight.get(storageKey) as Promise<T> | undefined;
  if (pending) return pending;

  const request = (async () => {
    const data = await fetcher();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ t: Date.now(), v: data }));
      } catch {
        /* quota / private mode — caching is best-effort, ignore */
      }
    }
    return data;
  })();

  inflight.set(storageKey, request);
  try {
    return await request;
  } finally {
    inflight.delete(storageKey);
  }
}

/* ─── Cached reads (same signatures as the underlying server actions) ───── */

export function cachedExamSubjects(examCode?: string): Promise<ExamSubject[]> {
  const key = examCode ? `subjects:${examCode}` : "subjects";
  return cached(key, () => getExamSubjects(examCode));
}

export function cachedSubtopics(subjectId: string, examCode?: string): Promise<ExamSubtopic[]> {
  const key = examCode ? `subtopics:${subjectId}:${examCode}` : `subtopics:${subjectId}`;
  return cached(key, () => getSubtopics(subjectId, examCode));
}

export function cachedQuizzes(subtopicId: string): Promise<ExamQuiz[]> {
  return cached(`quizzes:${subtopicId}`, () => getQuizzesForSubtopic(subtopicId));
}

export function cachedExamTree(examCode?: string): Promise<ExamTreeSubject[]> {
  const key = examCode ? `tree:${examCode}` : "tree";
  return cached(key, () => getExamTree(examCode));
}

export function cachedMockTests(examCode?: string): Promise<UiMockTest[]> {
  return getMockTests(examCode);
}

/**
 * A mock test's ordered question IDs (drives the "Start" flow). The question set
 * is admin-authored and static for a session, so we cache it: re-starting the
 * same mock is then instant and never re-hits the server.
 */
export function cachedMockTestQuestionIds(mockTestId: string): Promise<QuizDetail | null> {
  return cached(`mock_test_qids:${mockTestId}`, () => getMockTestQuestionIds(mockTestId));
}

/**
 * Invalidate just the mock-tests entry. Unlike subjects/subtopics/quizzes (which
 * are static), mock-test cards carry per-user attempt stats, so this is cleared
 * after an attempt is saved so the next read reflects the new history.
 */
export function clearMockTestsCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PREFIX + "mock_tests");
  } catch {
    /* storage disabled — nothing to clear */
  }
}

/** Drop all cached exam-prep data (e.g. on sign-out, or to force a refresh). */
export function clearExamCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    /* storage disabled — nothing to clear */
  }
}
