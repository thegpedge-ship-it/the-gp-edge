"use client";

import { motion } from "framer-motion";
import { user, subscription, badges, heatmap, subjectCoverage, stats, upcomingExam } from "./data";

const heatColor = (v: number) => {
  if (v === 0) return "bg-slate-100 dark:bg-slate-800";
  if (v === 1) return "bg-emerald-200 dark:bg-emerald-900/60";
  if (v === 2) return "bg-emerald-400 dark:bg-emerald-700";
  if (v === 3) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-600 dark:bg-emerald-400";
};

const badgeAccent: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
};

const badgeIcons: Record<string, JSX.Element> = {
  trophy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 21h8m-4-4v4m-4-9a4 4 0 008 0V4H8v8zm-4-4h4m12 0h-4" />,
  spark: <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.6-6.2 4.6 2.4-7.4L2 9.4h7.6z" />,
  flame: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2s4 4 4 8-2 6-4 6-4-2-4-6 4-8 4-8zm0 14a4 4 0 11-4-4" />,
  heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  bolt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />,
};

export default function Sidebar() {
  const readiness = parseInt(stats[0].value);
  const ring = { r: 38, c: 2 * Math.PI * 38 };
  const isPremium = subscription.plan === "Premium";
  const percentile = Math.max(1, Math.round((user.rank / user.totalUsers) * 100));

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex fixed left-6 top-6 bottom-6 w-80 flex-col rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 shadow-glass dark:shadow-glass-dark z-40 overflow-hidden"
    >
      <div className="overflow-y-auto flex-1 px-6 py-7">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              className={`relative rounded-full ${
                isPremium
                  ? "p-[3px] bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 shadow-lg shadow-amber-400/40"
                  : ""
              }`}
            >
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-serif text-3xl ${
                  isPremium ? "ring-2 ring-white dark:ring-slate-900" : "shadow-lg shadow-teal-600/20"
                }`}
              >
                {user.initials}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
          </div>

          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mt-3 leading-tight">
            Dr. {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.bio}</p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v3H5v-3z" />
            </svg>
            <span className="text-[12px] font-bold text-slate-900 dark:text-slate-50">
              Rank #{user.rank}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              · top {percentile}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 w-full">
            <button type="button" className="px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition">
              Edit profile
            </button>
            <button type="button" className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              Settings
            </button>
          </div>
        </div>

        {/* About */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <Row icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-14h10v4H7V7zm0 8h2v2H7v-2zm4 0h2v2h-2v-2z" />} label={user.role} />
          <Row icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z" />} label={user.hospital} />
          <Row icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} label={user.examTarget} />
          <Row icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" />} label={user.contact.racgpId} />
        </div>

        {/* Readiness ring */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 mb-3">
            Exam readiness
          </p>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={ring.r} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-slate-800" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ring.r}
                  fill="none"
                  stroke="url(#readinessGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ring.c}
                  initial={{ strokeDashoffset: ring.c }}
                  animate={{ strokeDashoffset: ring.c * (1 - readiness / 100) }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-2xl text-slate-900 dark:text-slate-50 leading-none">{readiness}%</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">ready</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+4% this week</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Next mock in <span className="font-semibold text-slate-700 dark:text-slate-200">{upcomingExam.daysAway} days</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Streak: <span className="font-semibold text-amber-600 dark:text-amber-400">{stats[1].value} days 🔥</span>
              </p>
            </div>
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              Activity · last 12 weeks
            </p>
            <span className="text-[10px] text-slate-400">{heatmap.filter((v) => v > 0).length} active days</span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 12 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => {
                  const v = heatmap[w * 7 + d] ?? 0;
                  return (
                    <motion.div
                      key={d}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: 0.5 + (w * 7 + d) * 0.004 }}
                      title={`${v} sessions`}
                      className={`w-full aspect-square rounded-[3px] ${heatColor(v)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[9px] text-slate-400">Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <span key={v} className={`w-2.5 h-2.5 rounded-[2px] ${heatColor(v)}`} />
            ))}
            <span className="text-[9px] text-slate-400">More</span>
          </div>
        </div>

        {/* Subject coverage */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              Topic coverage
            </p>
            <span className="text-[10px] text-slate-400">
              {subjectCoverage.covered}/{subjectCoverage.totalTopics}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex">
            {subjectCoverage.buckets.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ width: 0 }}
                animate={{ width: `${(b.count / subjectCoverage.totalTopics) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.6 + i * 0.06 }}
                className={b.color}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {subjectCoverage.buckets.map((b) => (
              <li key={b.label} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${b.color}`} />
                  <span className="text-slate-600 dark:text-slate-300">{b.label}</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              Badges
            </p>
            <button type="button" className="text-[10px] font-semibold text-teal-600 hover:text-teal-500">
              View all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {badges.map((b, i) => (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.04 }}
                title={`${b.name} · ${b.earned}`}
                className="group flex flex-col items-center"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${badgeAccent[b.accent]}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {badgeIcons[b.icon]}
                  </svg>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 text-center leading-tight">
                  {b.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">{user.joinedLabel}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Synced {user.lastSyncedMin}m ago
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

function Row({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-slate-600 dark:text-slate-300">
      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
      <span className="truncate">{label}</span>
    </div>
  );
}
