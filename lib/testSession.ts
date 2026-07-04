// Client-side bridge for the test-taking flow.
//
// The real question data lives in Postgres and is fetched through the server
// actions in app/exam-prep/actions.ts. When the user clicks "Start" anywhere
// (a subtopic quiz, a custom quiz, the mock drill, a mock test) we resolve the
// concrete question-id set up-front and stash a "test plan" in sessionStorage.
// The instructions page reads it for the summary; the start page reads it to
// fetch the questions and, on submit, to save the attempt. The `testId` in the
// URL is just an opaque key that must match the stashed plan.

import type { AttemptSource } from "@/app/exam-prep/actions";

export interface TestPlan {
  /** URL key — the quiz UUID, a mock UUID, or "custom" / "drill". */
  testId: string;
  source: AttemptSource;
  quizId?: string;
  subtopicId?: string;
  mockTestId?: string;
  name: string;
  questionIds: string[];
  durationMinutes: number;
  /** Whether a countdown timer (with auto-submit) applies. Mock tests only. */
  timed: boolean;
}

/** Config the instructions / start pages render. Derived from a TestPlan. */
export interface TestConfig {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
  timed: boolean;
}

/** Parse strings like "10 min", "45 min", "3 hrs", "4 hrs" into minutes. */
export function parseDurationToMinutes(duration: string): number {
  const value = parseFloat(duration) || 0;
  if (/h/i.test(duration)) return Math.round(value * 60);
  return Math.round(value);
}

/** Build the URL for the instructions page of a test. */
export function buildInstructionsUrl(testId: string): string {
  return `/test/${testId}/instructions`;
}

const PLAN_KEY = "gpedge_active_test_plan";
const TEST_AUTH_KEY = "gpedge_test_authorized";

/** Persist the resolved plan before navigating into the test flow. */
export function saveTestPlan(plan: TestPlan): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

/** Read the active plan, but only if it matches the requested testId. */
export function loadTestPlan(testId: string): TestPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as TestPlan;
    if (plan.testId !== testId || !Array.isArray(plan.questionIds) || plan.questionIds.length === 0) {
      return null;
    }
    return plan;
  } catch {
    return null;
  }
}

/** Derive the lighter TestConfig the pages render. */
export function planToConfig(plan: TestPlan): TestConfig {
  return {
    id: plan.testId,
    name: plan.name,
    questionCount: plan.questionIds.length,
    durationMinutes: plan.durationMinutes,
    timed: plan.timed,
  };
}

/** Grant a one-time pass to start this test — called by the instructions page only. */
export function authorizeTestStart(testId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TEST_AUTH_KEY, testId);
}

/**
 * Consume the one-time pass. Returns false when the start page was opened
 * directly via URL instead of through the instructions page.
 */
export function consumeTestAuthorization(testId: string): boolean {
  if (typeof window === "undefined") return false;
  const authorized = sessionStorage.getItem(TEST_AUTH_KEY) === testId;
  sessionStorage.removeItem(TEST_AUTH_KEY);
  return authorized;
}
