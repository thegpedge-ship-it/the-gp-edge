import { reviewSummary } from "./data";

const CARD_BASE = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

export default function ReviewPastResults() {
  return (
    <div className={CARD_BASE}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-50 dark:from-teal-900/10 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="font-bold text-teal-800 dark:text-teal-200 text-xl leading-snug mb-2 group-hover:text-teal-600 transition-colors">Review Past Results</h3>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">Track progress, monitor your improvement over time, and view detailed breakdowns of your performance across all test topics.</p>
          <button className="mt-6 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            View Detailed Results
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>

        <div className="flex-1 w-full lg:max-w-md">
          <div className="grid grid-cols-2 gap-4">
            {reviewSummary.map(({ label, value }) => (
              <div key={label} className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <span className="text-[11px] font-bold text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest mb-1">{label}</span>
                <span className="font-extrabold text-teal-900 dark:text-teal-100 text-lg">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
