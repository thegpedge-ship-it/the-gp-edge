"use client";

import { useState } from "react";
import PerformanceCard from "./PerformanceCard";
import AccuracyTrendCard from "./AccuracyTrendCard";

type SubjectPerf = {
  subject: string;
  mastery: number;
  change: number;
  color: string;
  correct: number;
  incorrect: number;
  unattempted: number;
};
type MockScore = { date: string; score: number };
type TestBreakdown = Record<
  string,
  { test: string; correct: number; incorrect: number; unattempted: number }[]
>;

export default function MasteryScoresSection({
  performance,
  mockScores,
  subjectBreakdown,
}: {
  performance?: SubjectPerf[];
  mockScores?: MockScore[];
  subjectBreakdown?: TestBreakdown;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 lg:items-stretch gap-6 mb-6">
      <div className="lg:col-span-2 flex">
        <PerformanceCard selected={selected} onSelect={setSelected} performance={performance} />
      </div>
      <div className="lg:col-span-3 flex">
        <AccuracyTrendCard
          selectedSubject={selected}
          exams={mockScores}
          performance={performance}
          subjectBreakdown={subjectBreakdown}
        />
      </div>
    </section>
  );
}
