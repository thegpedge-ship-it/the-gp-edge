"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import StatCard from "@/components/admin/StatCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const monthlyRevenue = [
  { month: "Jan", revenue: 8200 },
  { month: "Feb", revenue: 9800 },
  { month: "Mar", revenue: 11400 },
  { month: "Apr", revenue: 13200 },
  { month: "May", revenue: 15600 },
  { month: "Jun", revenue: 17100 },
];

const userGrowth = [
  { month: "Jan", users: 8420 },
  { month: "Feb", users: 9180 },
  { month: "Mar", users: 10050 },
  { month: "Apr", users: 10890 },
  { month: "May", users: 11740 },
  { month: "Jun", users: 12847 },
];

const recentActivity = [
  { user: "Dr. James Wilson", action: "Subscribed to Premium", time: "15 mins ago", type: "billing" as const },
  { user: "Dr. Emily Watson", action: "Created new account", time: "1 hour ago", type: "signup" as const },
  { user: "Dr. Priya Sharma", action: "Uploaded CSV (142 questions)", time: "2 hours ago", type: "upload" as const },
  { user: "Dr. Michael Torres", action: "Upgraded to Annual plan", time: "3 hours ago", type: "billing" as const },
  { user: "Dr. Alex Kumar", action: "Flagged Question #2847", time: "4 hours ago", type: "flag" as const },
  { user: "Dr. Rachel Green", action: "Renewed subscription", time: "5 hours ago", type: "billing" as const },
];

const activityTypeIcon: Record<string, React.ReactNode> = {
  billing: (
    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
  ),
  signup: (
    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
      <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
    </div>
  ),
  upload: (
    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    </div>
  ),
  flag: (
    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
    </div>
  ),
};

export default function DashboardPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map((d) => d.revenue));
  const maxUsers = Math.max(...userGrowth.map((d) => d.users));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Welcome banner — Topbar style with illustration */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-900/20 dark:via-slate-800/40 dark:to-teal-900/20 border border-emerald-100/60 dark:border-emerald-800/40 p-8 lg:p-10"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 right-1/3 w-64 h-64 rounded-full bg-emerald-200/40 dark:bg-emerald-700/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-teal-200/30 dark:bg-teal-700/15 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0 max-w-xl">
            <p className="inline-flex items-center gap-2 text-[14px] text-slate-600 dark:text-slate-300 font-medium mb-1">
              Good morning, Siddhant!
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              Your admin{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                cockpit
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Business overview and platform operations at a glance.
            </p>
          </div>

          {/* Welcome illustration */}
          <div
            className="hidden lg:block relative w-[280px] aspect-[786/442] flex-shrink-0"
            style={{ willChange: "transform" }}
          >
            <Image
              src="/assets/admin_dashboard_illustration.png"
              alt="Admin managing platform cockpit"
              fill
              priority
              sizes="280px"
              className="object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </motion.section>

      {/* Revenue & business stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value="$17,100"
          trend={{ value: "18%", positive: true }}
          accentColor="emerald"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Total Revenue (YTD)"
          value="$75,300"
          trend={{ value: "34%", positive: true }}
          accentColor="teal"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          title="Active Subscribers"
          value="1,456"
          trend={{ value: "23%", positive: true }}
          accentColor="emerald"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Churn Rate"
          value="2.3%"
          trend={{ value: "0.5%", positive: false }}
          accentColor="slate"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
        />
      </motion.div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue chart */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
              <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">Monthly Revenue</h3>
            </div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 cursor-pointer transition-colors">2026 →</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-44">
            {monthlyRevenue.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">${(m.revenue / 1000).toFixed(1)}k</span>
                <div className="w-full flex-1 relative flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full rounded-md ${i === monthlyRevenue.length - 1 ? "bg-gradient-to-t from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-700 hover:bg-emerald-105 dark:hover:bg-emerald-800/30"} transition-all`}
                  />
                </div>
                <span className={`text-[11px] font-bold mt-1 ${i === monthlyRevenue.length - 1 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>{m.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User growth chart */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Growth</p>
              <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">User Growth</h3>
            </div>
            <span className="font-serif text-xl text-slate-900 dark:text-slate-50">12,847</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-44">
            {userGrowth.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{(m.users / 1000).toFixed(1)}k</span>
                <div className="w-full flex-1 relative flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.users / maxUsers) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full rounded-md ${i === userGrowth.length - 1 ? "bg-gradient-to-t from-teal-500 to-emerald-400 shadow-lg shadow-teal-500/20" : "bg-slate-100 dark:bg-slate-700 hover:bg-teal-105 dark:hover:bg-teal-800/30"} transition-all`}
                  />
                </div>
                <span className={`text-[11px] font-bold mt-1 ${i === userGrowth.length - 1 ? "text-teal-600 dark:text-teal-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>{m.month}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity feed + Platform overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Activity</p>
              <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-0">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 relative pl-0 pb-4 last:pb-0">
                {i < recentActivity.length - 1 && (
                  <div className="absolute left-4 top-9 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
                )}
                <div className="relative z-10 flex-shrink-0">
                  {activityTypeIcon[activity.type]}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">{activity.user}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{activity.action}</p>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 pt-0.5">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform overview */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="mb-4">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Platform</p>
            <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">Overview</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Question Bank", value: "4,847", sub: "2,341 published", pct: 72 },
              { label: "Autofill Templates", value: "156", sub: "142 active", pct: 91 },
              { label: "Clinical Content", value: "89", sub: "67 published", pct: 75 },
              { label: "Storage Used", value: "2.4 GB", sub: "of 10 GB", pct: 24 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                  <span className="text-sm font-serif font-semibold text-slate-900 dark:text-slate-50">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Business Funnel & Unit Economics */}
      <motion.div variants={itemVariants} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Marketing & Sales</p>
              <h3 className="font-serif text-xl text-slate-900 dark:text-slate-50">Unit Economics & Funnel</h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            LTV:CAC Ratio 7.1x
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Customer Acquisition Cost", value: "$45.20", detail: "Target: <$50.00" },
            { name: "Customer Lifetime Value", value: "$320.00", detail: "Avg Lifespan: 14mo" },
            { name: "Trial-to-Paid Conversion", value: "18.4%", detail: "Target: >15.0%" },
            { name: "Average Order Value", value: "$128.50", detail: "+5.3% vs last month" },
          ].map((metric) => (
            <div key={metric.name} className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 p-4 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{metric.name}</p>
              </div>
              <p className="font-serif text-2xl text-slate-900 dark:text-slate-50 leading-none">{metric.value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{metric.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
