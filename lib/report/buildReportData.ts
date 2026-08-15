/* Turns the raw client state held on the result screen (questions + answers)
   into the ReportData the generator consumes. Pure, browser-safe. */

import type { QuizQuestion } from "@/app/exam-prep/actions";
import type { ReportData, ReportQuestion } from "./types";

export function buildReportData(params: {
  testName: string;
  questions: QuizQuestion[];
  answers: Record<number, number | number[]>;
  timeUsedSeconds: number;
}): ReportData {
  const { testName, questions, answers, timeUsedSeconds } = params;

  let totalPossible = 0;
  let totalEarned = 0;
  let attemptedCount = 0;

  const reportQuestions: ReportQuestion[] = questions.map((q, i) => {
    const rawAnswer = answers[i];
    const isKft = (q.examType || "").toUpperCase() === "KFT" || (q.examType || "").toUpperCase() === "KFP";
    const selectedIndex = Array.isArray(rawAnswer) ? (rawAnswer[0] ?? null) : (rawAnswer ?? null);
    const selectedIndices = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer != null ? [rawAnswer] : [];
    const isAttempted = rawAnswer !== undefined && (Array.isArray(rawAnswer) ? rawAnswer.length > 0 : true);

    if (isAttempted) attemptedCount++;

    let earnedMarks = 0;
    const maxMarks = isKft ? (q.kftCorrectCount || q.kfpCorrectCount || q.correctIndices?.length || 1) : 1;
    totalPossible += maxMarks;

    if (isKft) {
      const correctSet = new Set(q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [q.correctIndex]);
      earnedMarks = selectedIndices.filter((idx) => correctSet.has(idx)).length;
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
      correctIndices: q.correctIndices,
      selectedIndex,
      selectedIndices: isKft ? selectedIndices : undefined,
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
