"use client";

import { motion } from "framer-motion";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import LiveStudentSimulator from "@/components/admin/LiveStudentSimulator";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const weeklyData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 82 },
  { day: "Wed", value: 71 },
  { day: "Thu", value: 93 },
  { day: "Fri", value: 88 },
  { day: "Sat", value: 45 },
  { day: "Sun", value: 78 },
];

const recentActivity = [
  { user: "Dr. Sarah Chen", action: "Completed AKT Mock Exam", time: "2 mins ago", type: "quiz" as const },
  { user: "Dr. James Wilson", action: "Subscribed to Premium", time: "15 mins ago", type: "billing" as const },
  { user: "Dr. Priya Sharma", action: "Uploaded CSV (142 questions)", time: "1 hour ago", type: "upload" as const },
  { user: "Dr. Michael Torres", action: "Reached 90% readiness score", time: "2 hours ago", type: "achievement" as const },
  { user: "Dr. Emily Watson", action: "Created new account", time: "3 hours ago", type: "signup" as const },
  { user: "Dr. Alex Kumar", action: "Flagged Question #2847", time: "4 hours ago", type: "flag" as const },
];

const weakTopics = [
  { topic: "Mental Health", accuracy: 58, attempts: 342, trend: "down" },
  { topic: "Dermatology", accuracy: 62, attempts: 289, trend: "up" },
  { topic: "Paediatrics", accuracy: 64, attempts: 256, trend: "stable" },
  { topic: "Women's Health", accuracy: 67, attempts: 198, trend: "up" },
];

const strongTopics = [
  { topic: "Cardiology", accuracy: 92, attempts: 1204, trend: "up" },
  { topic: "Respiratory", accuracy: 88, attempts: 987, trend: "up" },
  { topic: "Musculoskeletal", accuracy: 85, attempts: 756, trend: "stable" },
  { topic: "Gastroenterology", accuracy: 83, attempts: 654, trend: "up" },
];

const activityTypeIcon: Record<string, React.ReactNode> = {
  quiz: (
    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    </div>
  ),
  billing: (
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    </div>
  ),
  upload: (
    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    </div>
  ),
  achievement: (
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    </div>
  ),
  signup: (
    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
      <svg className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
    </div>
  ),
  flag: (
    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
    </div>
  ),
};

export default function DashboardPage() {
  const maxWeekly = Math.max(...weeklyData.map((d) => d.value));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Page header styled like the greeting-band from index (1).html */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">
            Welcome back, Siddhant.
          </h1>
          <p className="text-sm text-teal-100 font-light">Here&apos;s your platform overview and administrative statistics.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-teal-200">Last updated: just now</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
          </span>
        </div>
      </motion.div>

      {/* Primary stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="12,847"
          trend={{ value: "12%", positive: true }}
          accentColor="teal"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Active Users"
          value="3,219"
          trend={{ value: "8%", positive: true }}
          accentColor="emerald"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Premium Subscribers"
          value="1,456"
          trend={{ value: "23%", positive: true }}
          accentColor="slate"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
        <StatCard
          title="Quiz Attempts"
          value="89,234"
          trend={{ value: "5%", positive: true }}
          accentColor="emerald"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </motion.div>

      {/* Secondary stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-5 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Avg Readiness</p>
                <p className="text-xl font-bold text-slate-900 leading-none mt-1">74%</p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: "74%" }} />
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-5 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-slate-100/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Weakest Topic</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">Mental Health</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-semibold">58% accuracy across 342 attempts</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-5 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-emerald-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Strongest Topic</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">Cardiology</p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">92% accuracy across 1,204 attempts</p>
          </div>
        </div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Quiz attempts per day</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-lg p-1">
                <button className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 rounded-md shadow-sm">Week</button>
                <button className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-md">Month</button>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 h-48">
              {weeklyData.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{d.value}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / maxWeekly) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full rounded-lg ${
                      d.value === maxWeekly
                        ? "bg-gradient-to-t from-teal-600 to-teal-400 shadow-lg shadow-teal-500/10"
                        : "bg-slate-100 hover:bg-teal-100/50 transition-colors"
                    }`}
                  />
                  <span className={`text-xs font-semibold ${d.value === maxWeekly ? "text-teal-600" : "text-slate-400"}`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent activity feed */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  {activityTypeIcon[activity.type]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-semibold truncate">{activity.user}</p>
                    <p className="text-xs text-slate-500 truncate">{activity.action}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Topic performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weakest Topics */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-slate-100/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">Weakest Topics</h3>
            </div>
            <div className="space-y-4">
              {weakTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">{t.attempts} attempts</span>
                      <span className="text-sm font-bold text-slate-650">{t.accuracy}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.accuracy}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Strongest Topics */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-emerald-50/5 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">Strongest Topics</h3>
            </div>
            <div className="space-y-4">
              {strongTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">{t.attempts} attempts</span>
                      <span className="text-sm font-bold text-emerald-600">{t.accuracy}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.accuracy}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Live Student Portal Preview */}
      <motion.div variants={itemVariants} className="space-y-3">
        <LiveStudentSimulator
          weakTopicWeight={75}
          difficultyScaling={60}
          spacedRepetition={true}
          topicPriorities={[
            { topic: "Mental Health", weight: 85, auto: true },
            { topic: "Dermatology", weight: 72, auto: true },
            { topic: "Paediatrics", weight: 68, auto: false },
            { topic: "Women's Health", weight: 60, auto: true },
            { topic: "Respiratory", weight: 15, auto: true },
            { topic: "Cardiology", weight: 10, auto: true },
          ]}
        />
      </motion.div>

      {/* System Health & Platform Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System health monitor */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">System Health</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">All Systems Operational</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "API Server", status: "operational", latency: "23ms", uptime: "99.98%" },
                { name: "Database", status: "operational", latency: "5ms", uptime: "99.99%" },
                { name: "CDN / Assets", status: "operational", latency: "12ms", uptime: "100%" },
                { name: "Auth Service", status: "operational", latency: "45ms", uptime: "99.95%" },
              ].map((service) => (
                <div key={service.name} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 hover:border-teal-200/60 transition-all group">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-xs font-semibold text-slate-700">{service.name}</p>
                  </div>
                  <p className="text-lg font-serif text-slate-900 leading-none">{service.latency}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">↑ {service.uptime} uptime</p>
                </div>
              ))}
            </div>
            {/* Mini response time chart */}
            <div className="mt-4 flex items-end gap-[2px] h-8">
              {Array.from({ length: 40 }).map((_, i) => {
                const h = 15 + Math.random() * 80;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.4, delay: i * 0.02 }}
                    className={`flex-1 rounded-sm ${h > 70 ? "bg-teal-300" : "bg-emerald-300"}`}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">API response times — last 2 hours</p>
          </div>
        </div>

        {/* Quick platform stats */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Overview</h3>
            <div className="space-y-4">
              {[
                { label: "Question Bank", value: "4,847", sub: "2,341 published", pct: 72 },
                { label: "Autofill Templates", value: "156", sub: "142 active", pct: 91 },
                { label: "Clinical Content", value: "89", sub: "67 published", pct: 75 },
                { label: "Storage Used", value: "2.4 GB", sub: "of 10 GB", pct: 24 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
