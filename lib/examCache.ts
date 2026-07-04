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
} from "@/app/exam-prep/actions";
import type {
  ExamSubject,
  ExamSubtopic,
  ExamQuiz,
  ExamTreeSubject,
  UiMockTest,
} from "@/app/exam-prep/actions";

const PREFIX = "gpedge_exam_cache:";

/** How long a cached entry stays fresh before it's re-fetched. */
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Stored shape: the value plus the time it was written (epoch ms). */
type Entry<T> = { t: number; v: T };

/**
 * Read-through cache with a TTL: return the stored value if it's still fresh,
 * otherwise fetch, store (stamped with `Date.now()`), and return. Expired or
 * malformed entries are discarded and re-fetched.
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

  const data = await fetcher();

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ t: Date.now(), v: data }));
    } catch {
      /* quota / private mode — caching is best-effort, ignore */
    }
  }
  return data;
}

/* ─── Cached reads (same signatures as the underlying server actions) ───── */

export function cachedExamSubjects(): Promise<ExamSubject[]> {
  return cached("subjects", getExamSubjects);
}

export function cachedSubtopics(subjectId: string): Promise<ExamSubtopic[]> {
  return cached(`subtopics:${subjectId}`, () => getSubtopics(subjectId));
}

export function cachedQuizzes(subtopicId: string): Promise<ExamQuiz[]> {
  return cached(`quizzes:${subtopicId}`, () => getQuizzesForSubtopic(subtopicId));
}

export function cachedExamTree(): Promise<ExamTreeSubject[]> {
  return cached("tree", getExamTree);
}

export function cachedMockTests(): Promise<UiMockTest[]> {
  return cached("mock_tests", getMockTests);
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
