"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { addUserNotification } from "@/utils/notifications";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const subscriptions = [
  { user: "Account #1082", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "12 Jan 2026", nextBilling: "12 Jan 2027" },
  { user: "Account #1094", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "15 Mar 2026", nextBilling: "15 Jun 2026" },
  { user: "Account #1101", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "20 Jan 2026", nextBilling: "20 Jan 2027" },
  { user: "Account #1115", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "1 Feb 2026", nextBilling: "1 Jun 2026" },
  { user: "Account #1123", plan: "Premium Annual", amount: "$199/yr", status: "active" as const, start: "7 Dec 2025", nextBilling: "7 Dec 2026" },
  { user: "Account #1138", plan: "Premium Monthly", amount: "$24/mo", status: "active" as const, start: "1 Nov 2025", nextBilling: "1 Jun 2026" },
];

const failedPayments = [
  { user: "Account #1204", amount: "$24.00", date: "26 May 2026", reason: "Card declined", retries: 2 },
  { user: "Account #1198", amount: "$199.00", date: "24 May 2026", reason: "Insufficient funds", retries: 1 },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 8200 },
  { month: "Feb", revenue: 9800 },
  { month: "Mar", revenue: 11400 },
  { month: "Apr", revenue: 13200 },
  { month: "May", revenue: 15600 },
];

interface RefundRequest {
  user: string;
  amount: string;
  reason: string;
  date: string;
  status: "pending" | "approved" | "denied";
  note?: string;
}

export default function BillingPage() {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));

  const [refunds, setRefunds] = useState<RefundRequest[]>([
    { user: "Account #1267", amount: "$24.00", reason: "Accidental purchase", date: "27 May 2026", status: "pending" },
    { user: "Account #1189", amount: "$199.00", reason: "Not satisfied with service", date: "20 May 2026", status: "pending" },
  ]);

  const [activeRefund, setActiveRefund] = useState<RefundRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null);
  const [refundNote, setRefundNote] = useState("");

  const handleOpenAction = (refund: RefundRequest, type: "approve" | "deny") => {
    setActiveRefund(refund);
    setActionType(type);
    setRefundNote(
      type === "approve"
        ? "Your refund request has been approved and processed."
        : "Your refund request has been declined because it does not meet our refund guidelines."
    );
  };

  const handleConfirmAction = () => {
    if (!activeRefund || !actionType) return;
    setRefunds((prev) =>
      prev.map((r) =>
        r.user === activeRefund.user && r.amount === activeRefund.amount
          ? { ...r, status: actionType === "approve" ? "approved" : "denied", note: refundNote }
          : r
      )
    );

    addUserNotification(
      actionType === "approve" ? "Refund Approved" : "Refund Request Declined",
      `${actionType === "approve" ? "Your refund of" : "The refund request of"} ${activeRefund.amount} has been ${actionType === "approve" ? "approved" : "declined"}. Note: ${refundNote}`,
      1,
      "custom"
    );

    setActiveRefund(null);
    setActionType(null);
    setRefundNote("");
  };

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
        <AnalyticsCard
          title="Average Revenue Per User"
          percentage="+8%"
          data="$14.50"
          progress={65}
        />
        <AnalyticsCard
          title="Stripe Success Rate"
          percentage="+0.2%"
          data="99.4%"
          progress={99}
        />
        <AnalyticsCard
          title="Pending Refunds"
          percentage="+40%"
          data="2 Requests"
          progress={40}
        />
        <AnalyticsCard
          title="Annual Plan Adoption"
          percentage="+12%"
          data="68%"
          progress={68}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription breakdown panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/10 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subscription Plan Adoption</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">Distribution of premium users by payment tier</p>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full dark:text-teal-400 dark:bg-teal-950/30 dark:border-teal-900/40">1,456 Active Subscriptions</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400" style={{ width: "68%" }} title="Premium Annual (68%)" />
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: "32%" }} title="Premium Monthly (32%)" />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Premium Annual: 68%</span>
                <span>Premium Monthly: 32%</span>
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Premium Annual</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">$199/yr</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">990 Users</span>
                    <span className="text-teal-650 dark:text-teal-400 font-bold">$197,010/yr</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: "68%" }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Premium Monthly</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">$24/mo</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">466 Users</span>
                    <span className="text-emerald-650 dark:text-emerald-400 font-bold">$11,184/mo</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: "32%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing gateway health */}
            <div className="flex items-center justify-between border-t border-slate-100/60 dark:border-slate-800/60 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Stripe Gateway: Connected</span>
              </div>
              <span>Webhooks: Operational (100% success rate)</span>
            </div>
          </div>
        </motion.div>

        {/* Failed payments */}
        <motion.div variants={itemVariants} className="bg-slate-50/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-md shadow-slate-200/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-slate-900/40 via-transparent to-slate-50/10 dark:to-slate-950/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-550 dark:bg-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Failed Payments</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {failedPayments.map((p, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.user}</p>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.amount}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{p.reason} · {p.date} · {p.retries} retries</p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-all dark:bg-teal-950/40 dark:border-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-900/30">Retry</button>
                    <button className="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-750">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subscriptions table */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Subscriptions</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40 dark:border-slate-800">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Started</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Next Billing</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((s, i) => (
                  <tr
                    key={i}
                    className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{s.user}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{s.plan}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{s.amount}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{s.start}</td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{s.nextBilling}</td>
                    <td className="px-4 py-4"><StatusBadge variant={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Refund requests */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800 shadow-md shadow-slate-200/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/85 via-transparent to-teal-50/5 dark:to-teal-950/10 pointer-events-none rounded-2xl" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Refund Requests</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {refunds.map((r, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.user} — <span className="text-amber-600 dark:text-amber-400">{r.amount}</span></p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{r.reason} · {r.date}</p>
                  {r.note && (
                    <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 font-medium bg-teal-50/60 dark:bg-teal-950/20 px-2.5 py-0.5 rounded-lg border border-teal-100/60 dark:border-teal-900/40 w-fit">
                      Note: {r.note}
                    </p>
                  )}
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenAction(r, "approve"); }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenAction(r, "deny"); }}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all cursor-pointer dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Deny
                    </button>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    r.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400"
                  }`}>
                    {r.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Action modal for refund reason note */}
      <AnimatePresence>
        {activeRefund && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => { setActiveRefund(null); setActionType(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {actionType === "approve" ? "Approve Refund" : "Deny Refund"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                    {activeRefund.user} · {activeRefund.amount}
                  </p>
                </div>
                <button
                  onClick={() => { setActiveRefund(null); setActionType(null); }}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Add a Note/Message for the User
                  </label>
                  <textarea
                    rows={4}
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all resize-none text-slate-800 dark:text-slate-200"
                    placeholder="Enter reason for approval or denial..."
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-normal">
                    This note will be logged in the system and sent to the user's notification feed.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setActiveRefund(null); setActionType(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]`}
                  style={{
                    background:
                      actionType === "approve"
                        ? "linear-gradient(135deg, #0f766e, #115e59)"
                        : "linear-gradient(135deg, #dc2626, #b91c1c)",
                  }}
                >
                  Confirm {actionType === "approve" ? "Approval" : "Denial"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
