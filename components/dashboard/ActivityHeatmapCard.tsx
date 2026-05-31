"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { studyActivity } from "./data";

const MONTHS = 12; // trailing one year
const ROWS = 7; // days stacked per column
const GAP = 3; // px between cells (and columns within a month)
const BLOCK_GAP = 9; // px gap between month blocks — the "cut"
const MIN_CELL = 8; // never smaller than this
const MAX_CELL = 12; // keep squares compact even on wide cards
const DEFAULT_CELL = 11; // SSR / pre-measure cell size

// Fixed month names — avoids server/client locale mismatches (hydration errors).
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Map a day's solved-question count to a 0–4 intensity level.
const levelFor = (count: number) => {
  if (count <= 0) return 0;
  if (count < 10) return 1;
  if (count < 18) return 2;
  if (count < 27) return 3;
  return 4;
};

// Green scale tuned for both light and dark themes (gray → bright green).
const heatClass = (lvl: number) =>
  [
    "bg-slate-200 dark:bg-slate-800",
    "bg-emerald-200 dark:bg-emerald-900",
    "bg-emerald-400 dark:bg-emerald-700",
    "bg-emerald-500 dark:bg-emerald-600",
    "bg-emerald-600 dark:bg-emerald-400",
  ][lvl];

// Parse "YYYY-MM-DD" as a local date (no timezone drift).
const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const fmtKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface Day {
  key: string;
  count: number;
  level: number;
  date: Date;
  future: boolean;
  label: string;
}

interface MonthBlock {
  label: string;
  columns: Day[][]; // each column holds up to 7 sequential days
  days: Day[];
}

// Build the trailing 12 months. Each month is its own block: its days (1..end)
// are chunked into columns of 7, so the sequence visibly "cuts" at each month.
const buildMonths = (): MonthBlock[] => {
  const counts = new Map(studyActivity.map((a) => [a.date, a.count]));
  const anchorKey = studyActivity.reduce(
    (max, a) => (a.date > max ? a.date : max),
    studyActivity[0]?.date ?? fmtKey(new Date())
  );
  const anchor = parseDate(anchorKey);
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - (MONTHS - 1), 1);

  return Array.from({ length: MONTHS }, (_, i) => {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const days: Day[] = Array.from({ length: daysInMonth }, (_, k) => {
      const date = new Date(y, m, k + 1);
      const key = fmtKey(date);
      const count = counts.get(key) ?? 0;
      return {
        key,
        count,
        level: levelFor(count),
        date,
        future: date > anchor,
        label: `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`,
      };
    });

    const columns: Day[][] = [];
    for (let c = 0; c < days.length; c += ROWS) columns.push(days.slice(c, c + ROWS));

    return { label: MONTH_SHORT[first.getMonth()], columns, days };
  });
};

// Measure the container and derive a square cell size that fills the full width,
// accounting for the within-month and between-month gaps.
const useCellSize = (ref: React.RefObject<HTMLDivElement>, totalCols: number, blocks: number) => {
  const [size, setSize] = useState(DEFAULT_CELL);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const innerGaps = totalCols - blocks; // column gaps inside blocks
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) {
        const avail = w - innerGaps * GAP - (blocks - 1) * BLOCK_GAP;
        const fit = Math.floor(avail / totalCols);
        setSize(Math.min(MAX_CELL, Math.max(MIN_CELL, fit)));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, totalCols, blocks]);
  return size;
};

export default function ActivityHeatmapCard() {
  const gridRef = useRef<HTMLDivElement>(null);
  const months = buildMonths();
  const totalCols = months.reduce((s, b) => s + b.columns.length, 0);
  const cell = useCellSize(gridRef, totalCols, months.length);

  const allDays = months.flatMap((b) => b.days).filter((d) => !d.future);
  const activeDays = allDays.filter((d) => d.count > 0).length;
  const totalQuestions = allDays.reduce((sum, d) => sum + d.count, 0);

  let maxStreak = 0;
  let run = 0;
  for (const d of allDays) {
    if (d.count > 0) {
      run += 1;
      maxStreak = Math.max(maxStreak, run);
    } else {
      run = 0;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          <span className="text-emerald-600 dark:text-emerald-400">{totalQuestions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>{" "}
          questions answered in the past year
        </h3>
        <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Total active days:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{activeDays}</span>
          </span>
          <span>
            Max streak:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{maxStreak}</span>
          </span>
        </div>
      </div>

      <div ref={gridRef} className="w-full min-w-0 overflow-hidden">
        <div className="flex justify-between" style={{ gap: BLOCK_GAP }}>
          {months.map((block, bi) => (
            <div key={bi} className="flex flex-col" style={{ gap: 6 }}>
              <div className="flex items-start" style={{ gap: GAP }}>
                {block.columns.map((col, ci) => (
                  <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
                    {col.map((d) => (
                      <div
                        key={d.key}
                        title={`${d.label}: ${d.count} question${d.count === 1 ? "" : "s"}`}
                        className={`rounded-[4px] ${d.future ? "opacity-0" : heatClass(d.level)}`}
                        style={{ width: cell, height: cell }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{block.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <span className="mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span key={lvl} className={`w-3 h-3 rounded-[4px] ${heatClass(lvl)}`} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </motion.div>
  );
}
