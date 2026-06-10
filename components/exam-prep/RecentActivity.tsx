import { recentActivities, studyTargets } from "./data";

const CARD_BASE = "glass dark:glass-strong rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl hover:border-teal-400/60 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col group relative overflow-hidden";

export default function RecentActivity() {
  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
      {/* Recent Activity */}
      <div className={CARD_BASE}>
        <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px] mb-5">Recent Activity</h2>
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_1.5fr_auto] gap-4 text-[10px] text-teal-600/70 dark:text-teal-500/70 uppercase tracking-widest font-bold pb-3 border-b border-teal-200/50 dark:border-teal-800/50">
            <span>Date</span><span>Activity</span><span>Result</span>
          </div>
          {recentActivities.map(({ date, activity, result, type }) => (
            <div key={`${date}-${activity}`} className="grid grid-cols-[1fr_1.5fr_auto] gap-4 items-center py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors px-2 -mx-2 rounded-lg">
              <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{date}</span>
              <span className="text-[14px] font-bold text-teal-900 dark:text-teal-100">{activity}</span>
              <span className={`text-[13px] font-bold px-2.5 py-1 rounded-md ${type === "progress" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"}`}>{result}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Study Targets */}
      <div className={`${CARD_BASE} flex flex-col`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-teal-800 dark:text-teal-200 text-[16px]">Upcoming Study Targets</h2>
          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full border border-teal-100/50 dark:border-teal-800/50">This Week</span>
        </div>
        <div className="space-y-4 flex-1">
          {studyTargets.map(({ task, done }) => (
            <div key={task} className="flex items-start gap-3.5 group cursor-pointer">
              <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${done ? "bg-teal-500 border-teal-500" : "border-slate-300 dark:border-slate-600 group-hover:border-teal-400 dark:bg-slate-800 bg-white"}`}>
                {done && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[14px] font-medium transition-colors ${done ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300 group-hover:text-teal-800 dark:group-hover:text-teal-200"}`}>{task}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80">
          <div className="flex justify-between items-center text-[12px] text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-teal-600/80 dark:text-teal-500/80">Week Progress</span>
            <span className="font-bold text-teal-800 dark:text-teal-200">2 / 5 Complete</span>
          </div>
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
