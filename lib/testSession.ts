import { getQuestions } from "./quizData";
import type { Question } from "./quizData";
import { mockTests, subjects } from "@/components/exam-prep/data";

export interface TestConfig {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
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

const TEST_AUTH_KEY = "gpedge_test_authorized";

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

const CUSTOM_TEST_KEY = "gpedge_custom_test_config";

/** Persist the config of a user-built custom quiz before navigating to it. */
export function saveCustomTestConfig(config: Omit<TestConfig, "id">): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CUSTOM_TEST_KEY, JSON.stringify(config));
}

/**
 * Resolve a test's config from its ID against the canonical data sources.
 * URL params are never trusted — an unknown or locked ID returns null.
 */
export function resolveTestConfig(testId: string): TestConfig | null {
  if (testId === "custom") {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(CUSTOM_TEST_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw) as Omit<TestConfig, "id">;
      if (!c.name || !c.questionCount || !c.durationMinutes) return null;
      return { id: "custom", ...c };
    } catch {
      return null;
    }
  }

  const mock = mockTests.find((t) => t.id === testId);
  if (mock) {
    if (mock.status === "locked") return null;
    return {
      id: mock.id,
      name: mock.name,
      questionCount: mock.questionCount,
      durationMinutes: parseDurationToMinutes(mock.duration),
    };
  }

  for (const subject of subjects) {
    for (const subtopic of subject.subtopics) {
      const quiz = subtopic.quizzes.find((q) => q.id === testId);
      if (quiz) {
        return {
          id: quiz.id,
          name: `${subtopic.name} — ${quiz.name}`,
          questionCount: quiz.questionCount,
          durationMinutes: parseDurationToMinutes(quiz.duration),
        };
      }
    }
  }

  return null;
}

/**
 * Fetch the questions for a test. Draws a random subset of the published
 * question bank to fill the requested count until a real backend exists.
 * The bank is shuffled so each attempt yields a different random selection
 * (and order); if the bank is smaller than `count`, it cycles the shuffle.
 */
export async function fetchTestQuestions(count: number): Promise<Question[]> {
  // Simulate network latency so the loading state is visible
  await new Promise((resolve) => setTimeout(resolve, 600));
  const bank = getQuestions().filter((q) => q.status === "published");
  const source = bank.length > 0 ? bank : getQuestions();
  if (source.length === 0) return [];

  // Fisher–Yates shuffle on a copy so selection + order are random
  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return Array.from({ length: count }, (_, i) => {
    const q = shuffled[i % shuffled.length];
    return { ...q, id: i + 1 };
  });
}
