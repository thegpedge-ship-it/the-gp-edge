"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockExamScores, subjectTestBreakdown, performance } from "./data";

const AccuracyTrendCard = memo(function AccuracyTrendCard({
  selectedSubject,
}: {
  selectedSubject: string | null;
}) {
  const exams = mockExamScores;
  const latest = exams[exams.length - 1];
  const prev = exams.length >= 2 ? exams[exams.length - 2] : null;
  const delta = prev ? latest.score - prev.score : 0;

  const W = 300;
  const H = 90;
  const PAD_X = 6;
  const INNER_W = W - PAD_X * 2;

  const [hovered, setHovered] = useState<number | null>(null);

  const { linePath, areaPath, coords } = useMemo(() => {
    const scores = exams.map((e) => e.score);
    const min = Math.min(...scores) - 4;
    const max = Math.max(...scores) + 4;
    const toX = (i: number) =>
      PAD_X + (i / (scores.length - 1)) * INNER_W;
    const toY = (v: number) => H - ((v - min) / (max - min)) * H;

    const coords = scores.map((s, i) => ({ x: toX(i), y: toY(s) }));

    const linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${H} L${coords[0].x.toFixed(1)},${H} Z`;
    return { linePath, areaPath, coords };
  }, [exams, INNER_W]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      let closest = 0;
      let minDist = Infinity;
      coords.forEach((c, i) => {
        const dist = Math.abs(c.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setHovered(closest);
    },
    [coords]
  );

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  const subjectData = selectedSubject ? subjectTestBreakdown[selectedSubject] : null;
  const subjectRow = selectedSubject ? performance.find((r) => r.subject === selectedSubject) : null;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6 h-full">
      <AnimatePresence mode="wait">
        {!selectedSubject ? (
          <motion.div
            key="line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
                  Mock Exam Scores
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 dark:text-slate-50">
                    {latest.score}%
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        delta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}% vs prev
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                {exams.length} exams
              </span>
            </div>

            <div className="relative">
              <svg
                viewBox={`0 0 ${W} ${H + 14}`}
                className="w-full h-[220px] cursor-crosshair"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="mockScoreArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={areaPath}
                  fill="url(#mockScoreArea)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                />
                {coords.map((c, i) => (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={hovered === i ? 4 : i === coords.length - 1 ? 3.5 : 2}
                    fill={hovered === i ? "#0d9488" : i === coords.length - 1 ? "#0d9488" : "#0d948850"}
                    stroke="white"
                    strokeWidth={hovered === i || i === coords.length - 1 ? 1.5 : 0}
                    className="transition-all duration-150"
                  />
                ))}
                {hovered !== null && (
                  <line
                    x1={coords[hovered].x}
                    y1={0}
                    x2={coords[hovered].x}
                    y2={H}
                    stroke="#0d9488"
                    strokeWidth={0.8}
                    strokeDasharray="3,3"
                    opacity={0.5}
                  />
                )}
              </svg>
              {hovered !== null && (
                <div
                  className="absolute -top-12 pointer-events-none z-10 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs shadow-lg whitespace-nowrap transition-all duration-100"
                  style={{
                    left: `${(coords[hovered].x / W) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <p className="font-semibold">{exams[hovered].score}%</p>
                  <p className="text-slate-300 text-[10px]">{exams[hovered].date}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
              {exams
                .filter((_, i) => {
                  if (exams.length <= 6) return true;
                  return i === 0 || i === exams.length - 1 || i % Math.ceil(exams.length / 5) === 0;
                })
                .map((e) => (
                  <span key={e.date}>{e.date.split(" ").slice(0, 2).join(" ")}</span>
                ))}
            </div>
          </motion.div>
        ) : subjectData ? (
          <motion.div
            key={`subject-${selectedSubject}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 mb-1">
                  {selectedSubject} — Test Breakdown
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 dark:text-slate-50">
                    {subjectRow?.mastery}%
                  </span>
                  {subjectRow && subjectRow.change !== 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        subjectRow.change > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {subjectRow.change > 0 ? "+" : ""}
                      {subjectRow.change}% vs prev
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-8">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Correct</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-red-400" />
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Incorrect</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Skipped</span>
                </div>
              </div>
            </div>

            {/* Grouped bar chart */}
            <div className="flex items-end gap-3 h-[200px]">
              {subjectData.map((test, ti) => {
                const max = Math.max(
                  ...subjectData.flatMap((t) => [t.correct, t.incorrect, t.unattempted])
                );
                return (
                  <div key={test.test} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-[3px] w-full h-[170px]">
                      <BarWithTooltip
                        value={test.correct}
                        max={max}
                        delay={ti * 0.08}
                        color="bg-emerald-500"
                        label="Correct"
                      />
                      <BarWithTooltip
                        value={test.incorrect}
                        max={max}
                        delay={ti * 0.08 + 0.05}
                        color="bg-red-400"
                        label="Incorrect"
                      />
                      <BarWithTooltip
                        value={test.unattempted}
                        max={max}
                        delay={ti * 0.08 + 0.1}
                        color="bg-slate-300 dark:bg-slate-600"
                        label="Skipped"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {test.test}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

function BarWithTooltip({
  value,
  max,
  delay,
  color,
  label,
}: {
  value: number;
  max: number;
  delay: number;
  color: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  const pct = (value / max) * 100;
  return (
    <div
      className="relative flex-1 h-full flex items-end"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {show && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap z-10 pointer-events-none"
          style={{ bottom: `calc(${pct}% + 6px)` }}
        >
          {value}
        </div>
      )}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.5, delay }}
        className={`w-full rounded-t-md min-h-[2px] ${color}`}
      />
    </div>
  );
}

export default AccuracyTrendCard;
