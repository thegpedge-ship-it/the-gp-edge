"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { studyActivity } from "./data";

const MONTHS = 12;
const ROWS = 7;
const GAP = 3;
const BLOCK_GAP = 9;
const MIN_CELL = 8;
const MAX_CELL = 12;
const DEFAULT_CELL = 11;

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const levelFor = (count: number) => {
  if (count <= 0) return 0;
  if (count < 10) return 1;
  if (count < 18) return 2;
  if (count < 27) return 3;
  return 4;
};

const heatClass = (lvl: number) =>
  [
    "bg-slate-200 dark:bg-slate-800",
    "bg-emerald-200 dark:bg-emerald-900",
    "bg-emerald-400 dark:bg-emerald-700",
    "bg-emerald-500 dark:bg-emerald-600",
    "bg-emerald-600 dark:bg-emerald-400",
  ][lvl];

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
  columns: Day[][];
  days: Day[];
}

function buildMonths(): MonthBlock[] {
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
        label: `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`,
      };
    });

    const columns: Day[][] = [];
    for (let c = 0; c < days.length; c += ROWS) columns.push(days.slice(c, c + ROWS));

    return { label: MONTH_SHORT[first.getMonth()], columns, days };
  });
}

function useCellSize(ref: React.RefObject<HTMLDivElement>, totalCols: number, blocks: number) {
  const [size, setSize] = useState(DEFAULT_CELL);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const innerGaps = totalCols - blocks;
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
}

/**
 * ActivityHeatmapCard — Study activity GitHub-style heatmap.
 * - buildMonths() is now memoized — runs once, not on every render.
 * - Derived stats (allDays, activeDays, totalQuestions, maxStreak) are memoized.
 * - Wrapped in React.memo.
 * - No entry animation — handled by PageTransition.
 */
const ActivityHeatmapCard = memo(function ActivityHeatmapCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Memoize month data — pure computation, only runs once
  const months = useMemo(() => buildMonths(), []);
  const totalCols = useMemo(() => months.reduce((s, b) => s + b.columns.length, 0), [months]);
  const cell = useCellSize(gridRef, totalCols, months.length);

  const [tip, setTip] = useState<{ x: number; y: number; label: string; count: number } | null>(null);
  const showTip = (e: MouseEvent, day: Day) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: day.label, count: day.count });
  };

  // Memoize derived stats
  const { allDays, activeDays, totalQuestions, maxStreak } = useMemo(() => {
    const allDays = months.flatMap((b) => b.days).filter((d) => !d.future);
    const activeDays = allDays.filter((d) => d.count > 0).length;
    const totalQuestions = allDays.reduce((sum, d) => sum + d.count, 0);
    let maxStreak = 0;
    let run = 0;
    for (const d of allDays) {
      if (d.count > 0) { run += 1; maxStreak = Math.max(maxStreak, run); }
      else { run = 0; }
    }
    return { allDays, activeDays, totalQuestions, maxStreak };
  }, [months]);

  return (
    <div
      ref={cardRef}
      className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          <span className="text-emerald-600 dark:text-emerald-400">
            {totalQuestions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </span>{" "}
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
                        onMouseEnter={d.future ? undefined : (e) => showTip(e, d)}
                        onMouseMove={d.future ? undefined : (e) => showTip(e, d)}
                        onMouseLeave={() => setTip(null)}
                        className={`rounded-[4px] ${d.future ? "opacity-0" : `${heatClass(d.level)} cursor-pointer hover:ring-2 hover:ring-emerald-500/40`}`}
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

      {/* Hover tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 dark:bg-slate-700 text-white px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          <span className="block text-[11px] font-semibold leading-tight">
            {tip.count} question{tip.count === 1 ? "" : "s"}
          </span>
          <span className="block text-[10px] text-slate-300 leading-tight">{tip.label}</span>
        </div>
      )}
    </div>
  );
});

export default ActivityHeatmapCard;
