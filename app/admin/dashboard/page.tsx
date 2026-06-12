"use client";

import { motion } from "framer-motion";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { VisitorsChart } from "@/components/admin/VisitorsChart";
import { MonthlyRevenueChart } from "@/components/admin/MonthlyRevenueChart";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const recentActivity = [
  { user: "New subscription", action: "Premium Annual plan activated", time: "15 mins ago", type: "billing" as const },
  { user: "Payment received", action: "$199.00 via Stripe — Annual Plan", time: "1 hour ago", type: "billing" as const },
  { user: "Autofill template published", action: "Mental Health Assessment · Psychiatry", time: "2 hours ago", type: "signup" as const },
  { user: "Subscription upgraded", action: "Monthly → Annual plan conversion", time: "3 hours ago", type: "billing" as const },
  { user: "Question flagged", action: "Question #2847 sent to review queue", time: "4 hours ago", type: "flag" as const },
  { user: "Subscription renewed", action: "Premium Annual renewal processed", time: "5 hours ago", type: "billing" as const },
];



export default function DashboardPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.section
        variants={itemVariants}
        className="flex items-center justify-between gap-6"
      >
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-widest">
            Admin Console
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Platform{" "}
            <span className="bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
              Overview
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Revenue, subscribers, and platform operations at a glance.
          </p>
        </div>
      </motion.section>

      {/* Revenue & business stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Monthly Recurring Revenue"
          percentage="+18%"
          data="$17,100"
          progress={76}
        />
        <AnalyticsCard
          title="Total Revenue (YTD)"
          percentage="+34%"
          data="$75,300"
          progress={85}
        />
        <AnalyticsCard
          title="Active Subscribers"
          percentage="+23%"
          data="1,456"
          progress={72}
        />
        <AnalyticsCard
          title="Churn Rate"
          percentage="-0.5%"
          data="2.3%"
          progress={23}
        />
      </motion.div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue chart - Recharts */}
        <MonthlyRevenueChart />

        {/* User growth chart - Recharts */}
        <UserGrowthChart />
      </div>

      {/* Visitors chart with recharts */}
      <VisitorsChart />

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
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${activity.type === "billing" ? "bg-teal-500" : activity.type === "flag" ? "bg-amber-400" : "bg-slate-300"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{activity.user}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{activity.action}</p>
                  </div>
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
                <div className="h-1 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-800 dark:bg-teal-600 rounded-full"
                    style={{ width: `${item.pct}%` }}
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
