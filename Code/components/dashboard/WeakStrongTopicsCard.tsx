import { memo } from "react";
import { weakTopics, strongTopics } from "./data";

/**
 * WeakStrongTopicsCard — topic analysis panel.
 * - Server Component (no interactivity, no hooks needed).
 * - Wrapped in React.memo.
 * - No entry animation — handled by PageTransition.
 */
const WeakStrongTopicsCard = memo(function WeakStrongTopicsCard() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-7">
      <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
        Topic analysis
      </p>
      <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mb-6">
        Where to focus
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Weakest topics</p>
          </div>
          <ul className="space-y-2.5">
            {weakTopics.map((t) => (
              <li
                key={t.name}
                className="rounded-xl border border-dashed border-rose-300 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-900/10 px-3 py-2.5"
              >
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug">{t.name}</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[11px] text-slate-500">{t.attempts} attempts</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{t.accuracy}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Strongest topics</p>
          </div>
          <ul className="space-y-2.5">
            {strongTopics.map((t) => (
              <li
                key={t.name}
                className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2.5"
              >
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug">{t.name}</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-[11px] text-slate-500">{t.attempts} attempts</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t.accuracy}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

export default WeakStrongTopicsCard;
