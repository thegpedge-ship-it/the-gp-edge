"use client";

import { motion } from "framer-motion";

export function DashboardIntelligence() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CARD 1: Platform Activity Overview */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50 dark:border-slate-800/85">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-450 dark:text-slate-500 mb-0.5">Live Snapshot</p>
              <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-50">Platform Activity</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/10 px-2 py-0.5 rounded-full">
              Updated just now
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Active Users Today (DAU)",
                value: "2,482",
                subtext: "+8.2% vs yesterday",
                trending: "up"
              },
              {
                label: "New Premium Upgrades",
                value: "12 upgrades",
                subtext: "last 24 hours",
                trending: "up"
              },
              {
                label: "Subscription Cancellations",
                value: "3 cancellations",
                subtext: "last 7 days",
                trending: "neutral"
              },
              {
                label: "Registrations Awaiting Review",
                value: "14 practitioners",
                subtext: "require badge checks",
                trending: "neutral"
              },
              {
                label: "New Modules Published",
                value: "6 modules",
                subtext: "updated this week",
                trending: "up"
              },
              {
                label: "Low Engagement Trials",
                value: "45 accounts",
                subtext: "inactive for 5+ days",
                trending: "neutral"
              }
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pb-3 last:pb-0 border-b border-slate-50/50 dark:border-slate-800/20 last:border-b-0">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{activity.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{activity.subtext}</p>
                </div>

                <div className="text-right">
                  <span className="font-serif font-bold text-slate-900 dark:text-slate-100 block">
                    {activity.value}
                  </span>
                  {activity.trending === "up" ? (
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Trending up
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 mt-4 text-[10px] text-slate-450 dark:text-slate-500 flex justify-between">
          <span>Weekly retention: 86.6%</span>
          <span>Trial conv. benchmark: 15%</span>
        </div>
      </motion.div>

      {/* CARD 2: Admin Action Center */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.05 } }
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50 dark:border-slate-800/85">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-450 dark:text-slate-500 mb-0.5">Critical Queue</p>
              <h3 className="font-serif text-lg font-semibold text-slate-900 dark:text-slate-50">Admin Action Center</h3>
            </div>
            <span className="inline-flex items-center justify-center bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 text-xs font-bold h-5 px-2 rounded-full">
              4 Decisions Required
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Refund Requests Pending",
                desc: "5 user subscription cancellations pending refund validation",
                priority: "high"
              },
              {
                title: "Flagged Content Audit",
                desc: "User flagged cardiology quiz question Q#2841 for correction",
                priority: "medium"
              },
              {
                title: "Educator Module Approval",
                desc: "12 new course modules waiting approval for publication",
                priority: "medium"
              },
              {
                title: "Practitioner Credentials",
                desc: "Dr. Allan Vance uploaded registration badge verification request",
                priority: "low"
              }
            ].map((task, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  task.priority === "high" 
                    ? "border-teal-200 bg-teal-50/5 dark:border-teal-900/30" 
                    : task.priority === "medium" 
                    ? "border-teal-100/60 bg-teal-50/5 dark:border-teal-950/10" 
                    : "border-slate-100 bg-slate-50/5 dark:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{task.title}</h4>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      task.priority === "high" 
                        ? "bg-teal-800/10 text-teal-800 dark:bg-teal-500/20 dark:text-teal-400" 
                        : task.priority === "medium" 
                        ? "bg-teal-500/10 text-teal-700 dark:bg-teal-500/10 dark:text-teal-450" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1.5 leading-relaxed">{task.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-50 dark:border-slate-800/80 mt-4 text-[10px] text-slate-450 dark:text-slate-500">
          Last action processed: 42 mins ago
        </div>
      </motion.div>

    </div>
  );
}
