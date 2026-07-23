"use client";

import { memo, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { studyActivity as fallbackActivity } from "./data";

type ActivityDay = { date: string; count: number };

const VISIBLE_MONTHS = 8;
// How far back (in months) the user may page. Stepping is VISIBLE_MONTHS at a time.
const MIN_OFFSET = -32;
const ROWS = 7;
const GAP = 3;
const BLOCK_GAP = 9;
const MIN_CELL = 8;
const MAX_CELL = 14;
const DEFAULT_CELL = 12;

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
  active: boolean;
  date: Date;
  future: boolean;
  label: string;
}

interface MonthBlock {
  label: string;
  year: number;
  monthIndex: number;
  columns: Day[][];
  days: Day[];
}

/**
 * Build `count` month-blocks ending `endOffset` months from the current month.
 * endOffset is <= 0 (0 = the window ends on the current month).
 */
function buildMonths(studyActivity: ActivityDay[], endOffset: number, count: number): MonthBlock[] {
  const counts = new Map(studyActivity.map((a) => [a.date, a.count]));
  // Anchor everything on today so "future" days stay masked regardless of window.
  const anchorKey = fmtKey(new Date());
  const anchor = parseDate(anchorKey);
  const lastFirst = new Date(anchor.getFullYear(), anchor.getMonth() + endOffset, 1);
  const start = new Date(lastFirst.getFullYear(), lastFirst.getMonth() - (count - 1), 1);

  return Array.from({ length: count }, (_, i) => {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const y = first.getFullYear();
    const m = first.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const days: Day[] = Array.from({ length: daysInMonth }, (_, k) => {
      const date = new Date(y, m, k + 1);
      const key = fmtKey(date);
      // Presence in the map = the user was active that day (visited or answered).
      // Any active day is at least level 1; more questions push it darker.
      const active = counts.has(key);
      const count = counts.get(key) ?? 0;
      return {
        key,
        count,
        level: active ? Math.max(1, levelFor(count)) : 0,
        active,
        date,
        future: date > anchor,
        label: `${WEEKDAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`,
      };
    });

    const columns: Day[][] = [];
    for (let c = 0; c < days.length; c += ROWS) columns.push(days.slice(c, c + ROWS));

    return { label: MONTH_SHORT[m], year: y, monthIndex: m, columns, days };
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
 * - Shows an 8-month window; ‹ › page ±8 months.
 * - buildMonths() / derived stats are memoized per window.
 * - Wrapped in React.memo. No entry animation — handled by PageTransition.
 */
const ActivityHeatmapCard = memo(function ActivityHeatmapCard({
  studyActivity = fallbackActivity,
}: {
  studyActivity?: ActivityDay[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // endOffset: months from the current month to the last visible month (<= 0).
  const [endOffset, setEndOffset] = useState(0);
  const canNext = endOffset < 0;
  const canPrev = endOffset > MIN_OFFSET;

  // Memoize month data — recompute only when the activity list or window changes.
  const months = useMemo(
    () => buildMonths(studyActivity, endOffset, VISIBLE_MONTHS),
    [studyActivity, endOffset],
  );
  const totalCols = useMemo(() => months.reduce((s, b) => s + b.columns.length, 0), [months]);
  const cell = useCellSize(gridRef, totalCols, months.length);

  const periodLabel = useMemo(() => {
    const first = months[0];
    const last = months[months.length - 1];
    if (first.year === last.year) {
      return `${first.label} – ${last.label} ${last.year}`;
    }
    return `${first.label} ${first.year} – ${last.label} ${last.year}`;
  }, [months]);

  const [tip, setTip] = useState<{ x: number; y: number; label: string; text: string } | null>(null);
  const showTip = (e: MouseEvent, day: Day) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const text = !day.active
      ? "No activity"
      : day.count > 0
        ? `${day.count} question${day.count === 1 ? "" : "s"}`
        : "Visited";
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: day.label, text });
  };

  // Memoize derived stats over the visible window
  const totalQuestions = useMemo(
    () =>
      months
        .flatMap((b) => b.days)
        .filter((d) => !d.future)
        .reduce((sum, d) => sum + d.count, 0),
    [months],
  );

  return (
    <div
      ref={cardRef}
      className="relative flex h-full flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm p-5"
    >
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            <span className="text-emerald-600 dark:text-emerald-400">
              {totalQuestions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>{" "}
            questions answered
          </h3>

          {/* 6-month window navigation */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setEndOffset((o) => Math.max(MIN_OFFSET, o - VISIBLE_MONTHS))}
              disabled={!canPrev}
              aria-label="Previous 8 months"
              className="grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[104px] text-center text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {periodLabel}
            </span>
            <button
              type="button"
              onClick={() => setEndOffset((o) => Math.min(0, o + VISIBLE_MONTHS))}
              disabled={!canNext}
              aria-label="Next 8 months"
              className="grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={gridRef} className="w-full min-w-0 flex-1 overflow-hidden">
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

      <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
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
            {tip.text}
          </span>
          <span className="block text-[10px] text-slate-300 leading-tight">{tip.label}</span>
        </div>
      )}
    </div>
  );
});

export default ActivityHeatmapCard;
