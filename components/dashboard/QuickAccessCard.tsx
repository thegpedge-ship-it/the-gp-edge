import { memo } from "react";
import Link from "next/link";
import { quickAccess as fallbackQuickAccess } from "./data";

type QuickAccessItem = {
  key: string;
  title: string;
  caption: string;
  accent?: string;
  badge?: string;
};

const HREF_MAP: Record<string, string> = {
  mbs: "/dashboard/billing",
  autofills: "/dashboard/clinical-autofills",
  conditions: "/dashboard/medical-library",
};

const QuickAccessCard = memo(function QuickAccessCard({
  quickAccess = fallbackQuickAccess,
}: {
  quickAccess?: QuickAccessItem[];
}) {
  const visibleItems = quickAccess.filter((q) => q.key !== "notes" && HREF_MAP[q.key]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7">
      <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-4">
        Quick access
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {visibleItems.map((q) => {
          const href = HREF_MAP[q.key] || "/dashboard";

          return (
            <Link
              key={q.key}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 min-h-[84px] flex flex-col justify-center hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out"
            >
              <div className="pr-10">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  {q.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {q.caption}
                </p>
              </div>

              {/* Arrow — vertically centered */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-200 ease-out shrink-0">
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

export default QuickAccessCard;
