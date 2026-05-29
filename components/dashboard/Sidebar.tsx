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

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" /> },
  { href: "/medical-library", label: "Medical Library", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
];

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
      className="hidden lg:flex sticky top-0 h-screen flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200/70 dark:border-slate-800 z-40 overflow-hidden"
    >
      <div className="overflow-y-auto flex-1 p-7 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              className={`relative rounded-full ${
                isPremium
                  ? "p-[3px] bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500"
                  : ""
              }`}
            >
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-serif text-3xl ${
                  isPremium ? "ring-2 ring-white dark:ring-slate-900" : ""
                }`}
              >
                {user.initials}
              </div>
            </div>
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mt-3 leading-tight">
            Dr. {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.bio}</p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v3H5v-3z" />
            </svg>
            <span className="text-[12px] font-bold text-amber-700 dark:text-amber-400">
              Rank #{user.rank}
            </span>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-300/70">
              · Top {percentile}%
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-5 space-y-2">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} icon={link.icon} label={link.label} />
          ))}
        </div>

        {/* Profile + Settings pill buttons */}
        <div className="mt-5 space-y-2">
          <PillButton
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            }
            label="My Profile"
          />
          <PillButton
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.32 4.06a1.65 1.65 0 013.36 0l.18.74a1.65 1.65 0 002.05 1.18l.73-.22a1.65 1.65 0 011.95 2.43l-.38.66a1.65 1.65 0 00.6 2.27l.66.38a1.65 1.65 0 010 2.94l-.66.38a1.65 1.65 0 00-.6 2.27l.38.66a1.65 1.65 0 01-1.95 2.43l-.73-.22a1.65 1.65 0 00-2.05 1.18l-.18.74a1.65 1.65 0 01-3.36 0l-.18-.74a1.65 1.65 0 00-2.05-1.18l-.73.22a1.65 1.65 0 01-1.95-2.43l.38-.66a1.65 1.65 0 00-.6-2.27l-.66-.38a1.65 1.65 0 010-2.94l.66-.38a1.65 1.65 0 00.6-2.27l-.38-.66a1.65 1.65 0 011.95-2.43l.73.22a1.65 1.65 0 002.05-1.18l.18-.74zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            }
            label="Settings"
          />
        </div>

        {/* Study Readiness */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 mb-3">
            Study Readiness
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
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ↑ +4%
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">vs last week</p>
              <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1.5 leading-snug">
                Next mock in <span className="font-bold">{upcomingExam.daysAway} days</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Streak: <span className="font-bold text-amber-600 dark:text-amber-400">{stats[1].value} days 🔥</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info pills */}
        <div className="mt-5 space-y-2">
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m-7-3.5l7 3.5 7-3.5" />}
            label={user.role}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z" />}
            label={user.hospital}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            label={user.examTarget}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 14a4 4 0 10-8 0m8 0H8m8 0v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4m2-4a2 2 0 100-4 2 2 0 000 4z" />}
            label={user.contact.racgpId}
          />
        </div>

        {/* Activity heatmap */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              Activity · 12 weeks
            </p>
            <span className="text-[10px] text-slate-400">{heatmap.filter((v) => v > 0).length}d active</span>
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

function PillButton({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <button
      type="button"
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </span>
      <span className="flex-1 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </span>
      <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function InfoPill({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
      <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </span>
      <span className="flex-1 text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">
        {label}
      </span>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: JSX.Element; label: string }) {
  return (
    <a
      href={href}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-100 dark:border-slate-700/60 hover:border-teal-200 dark:hover:border-teal-800 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </span>
      <span className="flex-1 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </span>
      <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
