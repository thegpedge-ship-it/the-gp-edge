import { memo } from "react";
import { upcomingExam } from "./data";

const CountdownCard = memo(function CountdownCard() {
  const e = upcomingExam;
  const hrs = Math.floor(e.durationMin / 60);
  const mins = e.durationMin % 60;
  const duration = mins ? `${hrs}h ${mins}m` : `${hrs}h`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
      {/* Left gradient wash */}
      <div className="absolute inset-y-0 left-0 w-[220px] bg-gradient-to-r from-emerald-600/90 via-emerald-500/40 to-transparent dark:from-emerald-800/80 dark:via-emerald-700/30 dark:to-transparent pointer-events-none" />

      {/* Decorative concentric arcs — right side */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[320px] w-[320px] pointer-events-none"
        viewBox="0 0 320 320"
        fill="none"
      >
        {[20, 38, 56, 74, 92, 110, 128, 146, 164, 182, 200, 218, 236, 254, 272, 290, 308].map((r, i) => (
          <circle
            key={r}
            cx="320"
            cy="160"
            r={r}
            stroke="currentColor"
            strokeWidth={1}
            className={
              i < 6
                ? "text-emerald-300/55 dark:text-emerald-600/30"
                : i < 12
                  ? "text-emerald-200/45 dark:text-emerald-700/25"
                  : "text-emerald-100/35 dark:text-emerald-800/20"
            }
          />
        ))}
      </svg>

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 p-6 lg:py-6 lg:pl-5 lg:pr-7">
        {/* Days-to-go tag */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="relative w-[96px] h-[96px] rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 dark:from-emerald-600 dark:to-emerald-800 flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <span className="font-serif text-[44px] leading-none tracking-tight">
              {e.daysAway}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-emerald-200 mt-1.5 font-medium">
              Days to go
            </span>
          </div>

          {/* Title block */}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Next mock
            </p>
            <h3 className="font-serif text-xl lg:text-2xl text-slate-900 dark:text-slate-50 leading-snug">
              {e.name}
            </h3>
          </div>
        </div>

        {/* Info columns */}
        <div className="flex items-center gap-5 lg:gap-7 lg:flex-1 lg:justify-center flex-wrap">
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            value={e.dateLabel}
            sub={e.timeLabel}
          />
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={duration}
            sub="Duration"
          />
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            value={`${e.totalQuestions} questions`}
            sub="Total"
          />
        </div>

        {/* CTA */}
        <div className="flex flex-shrink-0">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-800 dark:bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-all duration-200 active:scale-[0.97] shadow-md shadow-emerald-900/20"
          >
            View study plan
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

function InfoItem({
  icon,
  value,
  sub,
}: {
  icon: React.ReactNode;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
          {value}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
          {sub}
        </p>
      </div>
    </div>
  );
}

export default CountdownCard;
