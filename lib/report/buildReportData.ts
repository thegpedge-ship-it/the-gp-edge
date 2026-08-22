/* Turns the raw client state held on the result screen (questions + answers)
   into the ReportData the generator consumes. Pure, browser-safe. */

import type { QuizQuestion } from "@/app/exam-prep/actions";
import type { ReportData, ReportQuestion } from "./types";

function isQuestionCorrect(q: ReportQuestion): boolean {
  if (q.selectedIndices.length === 0) return false;
  const correctSet = new Set(q.correctIndices);
  const selectedSet = new Set(q.selectedIndices);
  return (
    correctSet.size === selectedSet.size &&
    [...correctSet].every((i) => selectedSet.has(i))
  );
}

export function buildReportData(params: {
  testName: string;
  questions: QuizQuestion[];
  answers: Record<number, number[]>;
  timeUsedSeconds: number;
}): ReportData {
  const { testName, questions, answers, timeUsedSeconds } = params;

  let totalPossible = 0;
  let totalEarned = 0;
  let attemptedCount = 0;

  const reportQuestions: ReportQuestion[] = questions.map((q, i) => {
    const selectedIndices = answers[i] ?? [];
    const selectedIndex = selectedIndices[0] ?? null;
    const isAttempted = selectedIndices.length > 0;
    const isKft = (q.examType || "").toUpperCase() === "KFP" || (q.examType || "").toUpperCase() === "KFP";

    if (isAttempted) attemptedCount++;

    let earnedMarks = 0;
    const maxMarks = isKft ? (q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 1) : 1;
    totalPossible += maxMarks;

    const correctIndices = q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [q.correctIndex];

    if (isKft) {
      earnedMarks = selectedIndices.filter((idx) => correctIndices.includes(idx)).length;
    } else {
      if (selectedIndex === q.correctIndex) {
        earnedMarks = 1;
      }
    }
    totalEarned += earnedMarks;

    return {
      number: i + 1,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      correctIndices,
      selectedIndex,
      selectedIndices,
      examType: q.examType,
      kftCorrectCount: q.kftCorrectCount || q.kfpCorrectCount,
      kfpCorrectCount: q.kftCorrectCount || q.kfpCorrectCount,
      earnedMarks,
      maxMarks,
      rationale: q.rationale,
      topic: q.topic,
      difficulty: q.difficulty,
      hadImage: Boolean(q.image),
    };
  });

  const total = reportQuestions.length;
  const correct = totalEarned;
  const incorrect = totalPossible - totalEarned;
  const unattempted = total - attemptedCount;
  const scorePercent = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const accuracyPercent = attemptedCount > 0 ? Math.round((totalEarned / (attemptedCount > 0 ? totalPossible : 1)) * 100) : 0;

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
