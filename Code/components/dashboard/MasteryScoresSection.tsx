"use client";

import { useState } from "react";
import PerformanceCard from "./PerformanceCard";
import AccuracyTrendCard from "./AccuracyTrendCard";

export default function MasteryScoresSection() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 lg:items-stretch gap-6 mb-6">
      <div className="lg:col-span-2">
        <PerformanceCard selected={selected} onSelect={setSelected} />
      </div>
      <div className="lg:col-span-3">
        <AccuracyTrendCard selectedSubject={selected} />
      </div>
    </section>
  );
}
