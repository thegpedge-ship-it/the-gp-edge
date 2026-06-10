import { stats } from "./data";

const CARD_BASE = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

export default function StatsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, sub }) => (
        <div key={label} className={`${CARD_BASE} justify-between !p-4 hover:-translate-y-1 hover:border-teal-400/60 dark:hover:border-teal-500/60`}>
          <p className="text-[11px] font-bold text-teal-600/80 dark:text-teal-400 uppercase tracking-wide mb-3">{label}</p>
          <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 tracking-tight leading-none mb-1.5">{value}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
