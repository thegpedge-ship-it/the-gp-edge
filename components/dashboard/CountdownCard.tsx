import { memo } from "react";
import type { ReactNode } from "react";
import { upcomingExam } from "./data";

/**
 * CountdownCard — upcoming exam countdown banner.
 * - No entry animation — handled by PageTransition.
 * - Wrapped in React.memo.
 */
const CountdownCard = memo(function CountdownCard() {
  const e = upcomingExam;
  const hrs = Math.floor(e.durationMin / 60);
  const mins = e.durationMin % 60;
  const duration = mins ? `${hrs}h ${mins}m` : `${hrs}h`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 dark:from-emerald-900/30 dark:via-slate-900 dark:to-teal-900/30 border border-emerald-100/70 dark:border-emerald-800/40 p-6 lg:p-7 shadow-sm">
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-emerald-200/40 dark:bg-emerald-700/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-teal-200/30 dark:bg-teal-700/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Countdown emblem */}
        <div className="flex items-center gap-4 lg:gap-5 flex-shrink-0">
          <div className="relative w-[92px] h-[92px] rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <span className="font-serif text-5xl leading-none tracking-tight">{e.daysAway}</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/80 mt-1.5">
              days to go
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-teal-700 dark:text-teal-300 mb-1.5">
              Next mock
            </p>
            <h3 className="font-serif text-xl lg:text-2xl text-slate-900 dark:text-slate-50 leading-snug">
              {e.name}
            </h3>
          </div>
        </div>

        {/* Detail chips */}
        <div className="flex flex-wrap gap-2 lg:flex-1 lg:justify-center">
          <Chip>
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {e.dateLabel} · {e.timeLabel}
          </Chip>
          <Chip>
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {duration}
          </Chip>
          <Chip>
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {e.totalQuestions} questions
          </Chip>
        </div>

        {/* CTA */}
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 active:scale-[0.97]"
          >
            View study plan
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/60 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 backdrop-blur-sm">
      {children}
    </span>
  );
}

export default CountdownCard;
