"use client";

import { motion } from "framer-motion";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

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
      <AdminPageHeader
        title="Billing &"
        highlightedText="Subscription"
        subtitle="Manage Stripe payments, subscriptions, and revenue"
        actions={
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/20 px-3 py-1.5 rounded-full border border-transparent dark:border-slate-800/40">
            <span>MRR: $15,600</span>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
          </div>
        }
        variants={itemVariants}
      />

      {/* Revenue stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Average Revenue Per User" value="$14.50" trend={{ value: "8%", positive: true }} accentColor="teal" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard title="Stripe Success Rate" value="99.4%" trend={{ value: "0.2%", positive: true }} accentColor="emerald" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
        <StatCard title="Pending Refunds" value="2 Requests" trend={{ value: "40%", positive: false }} accentColor="slate" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Annual Plan Adoption" value="68%" trend={{ value: "12%", positive: true }} accentColor="teal" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription breakdown panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subscription Plan Adoption</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-semibold">Distribution of premium users by payment tier</p>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full">1,456 Active Subscriptions</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400" style={{ width: "68%" }} title="Premium Annual (68%)" />
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: "32%" }} title="Premium Monthly (32%)" />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1">
                <span>Premium Annual: 68%</span>
                <span>Premium Monthly: 32%</span>
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold text-slate-800">Premium Annual</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">$199/yr</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">990 Users</span>
                    <span className="text-teal-600 font-bold">$197,010/yr</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: "68%" }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-800">Premium Monthly</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">$24/mo</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">466 Users</span>
                    <span className="text-emerald-600 font-bold">$11,184/mo</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: "32%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing gateway health */}
            <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Stripe Gateway: Connected</span>
              </div>
              <span>Webhooks: Operational (100% success rate)</span>
            </div>
          </div>
        </motion.div>

        {/* Failed payments */}
        <motion.div variants={itemVariants} className="bg-slate-50/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-md shadow-slate-200/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-slate-50/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-5 py-4 border-b border-slate-200/60 bg-slate-50/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Failed Payments</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {failedPayments.map((p, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800">{p.user}</p>
                    <span className="text-sm font-bold text-slate-700">{p.amount}</span>
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
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
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
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-md shadow-slate-200/30 overflow-hidden relative">
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
