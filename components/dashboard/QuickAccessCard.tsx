import { memo } from "react";
import Link from "next/link";
import { quickAccess } from "./data";

/**
 * QuickAccessCard — quick access grid.
 * - No entry animation — handled by PageTransition.
 * - Removed per-item stagger (overkill for 4 items, causes layout shift).
 * - Wrapped in React.memo.
 * - Hover states retained.
 */
const QuickAccessCard = memo(function QuickAccessCard() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7">
      <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">
        Quick access
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickAccess.map((q) => (
          <Link
            key={q.key}
            href={
              q.key === "mbs"
                ? "/dashboard/billing"
                : q.key === "conditions"
                ? "/dashboard/medical-library"
                : q.key === "autofills"
                ? "/dashboard/tools"
                : "/dashboard/profile"
            }
            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 min-h-[78px] flex flex-col justify-center hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="pr-9">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {q.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{q.caption}</p>
            </div>

            {/* Arrow — vertically centered */}
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors duration-200">
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            </span>

            {/* Hover underline accent */}
            <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-emerald-400 to-teal-500 group-hover:w-full transition-all duration-300" />
          </Link>
        ))}
      </div>
    </div>
  );
});

export default QuickAccessCard;
