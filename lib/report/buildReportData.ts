/* Turns the raw client state held on the result screen (questions + answers)
   into the ReportData the generator consumes. Pure, browser-safe. */

import type { QuizQuestion } from "@/app/exam-prep/actions";
import type { ReportData, ReportQuestion } from "./types";

export function buildReportData(params: {
  testName: string;
  questions: QuizQuestion[];
  answers: Record<number, number>;
  timeUsedSeconds: number;
}): ReportData {
  const { testName, questions, answers, timeUsedSeconds } = params;

  const reportQuestions: ReportQuestion[] = questions.map((q, i) => ({
    number: i + 1,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    selectedIndex: answers[i] ?? null,
    rationale: q.rationale,
    topic: q.topic,
    difficulty: q.difficulty,
    hadImage: Boolean(q.image),
  }));

  const total = reportQuestions.length;
  const correct = reportQuestions.filter((q) => q.selectedIndex === q.correctIndex).length;
  const attempted = reportQuestions.filter((q) => q.selectedIndex !== null).length;
  const incorrect = attempted - correct;
  const unattempted = total - attempted;
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const dateLabel = new Date().toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    testName,
    dateLabel,
    total,
    correct,
    incorrect,
    unattempted,
    scorePercent,
    accuracyPercent,
    timeUsedSeconds,
    questions: reportQuestions,
  };
}

/** Safe, readable file name for the downloaded PDF. */
export function reportFileName(testName: string): string {
  const slug =
    testName
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "test";
  return `GP-Edge-Report-${slug}.pdf`;
}
