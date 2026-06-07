"use client";

import { motion } from "framer-motion";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const subscriptions = [
  { user: "Dr. Sarah Chen", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "12 Jan 2026", nextBilling: "12 Jan 2027" },
  { user: "Dr. James Wilson", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "15 Mar 2026", nextBilling: "15 Jun 2026" },
  { user: "Dr. Rachel Green", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "20 Jan 2026", nextBilling: "20 Jan 2027" },
  { user: "Dr. Nina Patel", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "1 Feb 2026", nextBilling: "1 Jun 2026" },
  { user: "Dr. Michael Torres", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "7 Dec 2025", nextBilling: "7 Dec 2026" },
  { user: "Dr. Laura Simmons", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "1 Nov 2025", nextBilling: "1 Jun 2026" },
];

const failedPayments = [
  { user: "Dr. Tom Baker", amount: "$24.00", date: "26 May 2026", reason: "Card declined", retries: 2 },
  { user: "Dr. Emily Watson", amount: "$199.00", date: "24 May 2026", reason: "Insufficient funds", retries: 1 },
];

const refundRequests = [
  { user: "Dr. David Kim", amount: "$24.00", reason: "Accidental purchase", date: "27 May 2026", status: "pending" as const },
  { user: "Dr. Alex Kumar", amount: "$199.00", reason: "Not satisfied", date: "20 May 2026", status: "pending" as const },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 8200 },
  { month: "Feb", revenue: 9800 },
  { month: "Mar", revenue: 11400 },
  { month: "Apr", revenue: 13200 },
  { month: "May", revenue: 15600 },
];

export default function BillingPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl shadow-teal-900/10 flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-36 h-36 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-serif text-2xl lg:text-3xl font-normal text-white tracking-tight leading-tight mb-1">Billing &amp; Subscription</h1>
          <p className="text-sm text-teal-100 font-light">Manage Stripe payments, subscriptions, and revenue</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-teal-200">MRR: $15,600</span>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        </div>
      </motion.div>

      {/* Revenue stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Recurring" value="$15,600" trend={{ value: "18%", positive: true }} accentColor="teal" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Total Revenue" value="$58,200" trend={{ value: "34%", positive: true }} accentColor="emerald" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <StatCard title="Active Subscriptions" value="1,456" trend={{ value: "23%", positive: true }} accentColor="violet" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
        <StatCard title="Churn Rate" value="2.3%" trend={{ value: "0.5%", positive: false }} accentColor="red" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Monthly Revenue</h3>
            <div className="flex items-end justify-between gap-4 h-48">
              {monthlyRevenue.map((m, i) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">${(m.revenue / 1000).toFixed(1)}k</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(m.revenue / maxRevenue) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="w-full rounded-lg bg-gradient-to-t from-teal-500 to-emerald-400 shadow-sm" />
                  <span className="text-xs font-medium text-slate-400">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Failed payments */}
        <motion.div variants={itemVariants} className="bg-red-50/30 backdrop-blur-xl rounded-2xl border border-red-200/60 shadow-md shadow-red-200/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-red-50/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-5 py-4 border-b border-red-100 bg-red-50/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <h3 className="text-sm font-bold text-red-800">Failed Payments</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {failedPayments.map((p, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800">{p.user}</p>
                    <span className="text-sm font-bold text-red-600">{p.amount}</span>
                  </div>
                  <p className="text-xs text-slate-400">{p.reason} · {p.date} · {p.retries} retries</p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-all">Retry</button>
                    <button className="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subscriptions table */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40"><h3 className="text-sm font-bold text-slate-900">Active Subscriptions</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Started</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Next Billing</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((s, i) => (
                  <tr
                    key={i}
                    className="hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{s.user}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{s.plan}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">{s.amount}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{s.start}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{s.nextBilling}</td>
                    <td className="px-4 py-4"><StatusBadge variant={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Refund requests */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Refund Requests</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {refundRequests.map((r, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.user} — <span className="text-amber-600">{r.amount}</span></p>
                  <p className="text-xs text-slate-400">{r.reason} · {r.date}</p>
                </div>
                <div className="flex gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <button className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">Approve</button>
                  <button className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
