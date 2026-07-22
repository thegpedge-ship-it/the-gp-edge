"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { addUserNotification } from "@/utils/notifications";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  getAdminBillingDataAction,
  updateRefundStatusAction,
  type BillingPageData,
  type SubscriptionItem,
  type FailedPaymentItem,
  type RefundRequestItem,
} from "@/actions/billing.actions";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

export default function BillingPage() {
  const { isReadOnly } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<RefundRequestItem[]>([]);

  const [activeRefund, setActiveRefund] = useState<RefundRequestItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null);
  const [refundNote, setRefundNote] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminBillingDataAction();
      setData(res);
      setRefunds(res.refunds);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load billing data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAction = (refund: RefundRequestItem, type: "approve" | "deny") => {
    if (isReadOnly) return;
    setActiveRefund(refund);
    setActionType(type);
    setRefundNote(
      type === "approve"
        ? "Your refund request has been approved and processed."
        : "Your refund request has been declined because it does not meet our refund guidelines."
    );
  };

  const handleConfirmAction = async () => {
    if (isReadOnly) return;
    if (!activeRefund || !actionType) return;

    try {
      const action = actionType === "approve" ? "approve" : "deny";
      const res = await updateRefundStatusAction(activeRefund.id, action, refundNote);
      if (!res.success) {
        alert(res.error || "Failed to process refund.");
        return;
      }

      addUserNotification(
        actionType === "approve" ? "Refund Approved" : "Refund Request Declined",
        `${actionType === "approve" ? "Your refund of" : "The refund request of"} ${activeRefund.amount} has been ${actionType === "approve" ? "approved" : "declined"}. Note: ${refundNote}`,
        1,
        "custom"
      );

      // Reload real-time data
      const updated = await getAdminBillingDataAction();
      setData(updated);
      setRefunds(updated.refunds);
    } catch (err: any) {
      console.error(err);
      alert("An error occurred while processing the refund.");
    }

    setActiveRefund(null);
    setActionType(null);
    setRefundNote("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <svg className="w-8 h-8 text-teal-700 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Billing Data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-sans">
        <p className="text-red-500 font-semibold mb-3">{error || "Failed to load billing details."}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 font-sans">
      <AdminPageHeader
        title="Billing &"
        highlightedText="Subscription"
        subtitle="Manage Stripe payments, subscriptions, and revenue"
        actions={
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/20 px-3 py-1.5 rounded-full border border-transparent dark:border-slate-800/40">
            <span>MRR: ${data.stats.mrr.toLocaleString()}</span>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
          </div>
        }
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but retrying failed transactions or processing refund requests is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* Revenue stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Average Revenue Per User"
          percentage="+8%"
          data={data.stats.averageRevenuePerUser}
          progress={65}
        />
        <AnalyticsCard
          title="Stripe Success Rate"
          percentage="+0.2%"
          data={data.stats.stripeSuccessRate}
          progress={99}
        />
        <AnalyticsCard
          title="Pending Refunds"
          percentage="+40%"
          data={`${data.stats.pendingRefundsCount} Request${data.stats.pendingRefundsCount === 1 ? "" : "s"}`}
          progress={40}
        />
        <AnalyticsCard
          title="Annual Plan Adoption"
          percentage="+12%"
          data={`${data.stats.annualPlanAdoptionPercent}%`}
          progress={data.stats.annualPlanAdoptionPercent}
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
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/50 px-3 py-1 rounded-full dark:text-teal-400 dark:bg-teal-950/30 dark:border-teal-900/40">{data.stats.activeSubscriptionsCount} Active Subscriptions</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400" style={{ width: `${data.stats.annualPlanAdoptionPercent}%` }} title={`Premium Annual (${data.stats.annualPlanAdoptionPercent}%)`} />
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${100 - data.stats.annualPlanAdoptionPercent}%` }} title={`Premium Monthly (${100 - data.stats.annualPlanAdoptionPercent}%)`} />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Premium Annual: {data.stats.annualPlanAdoptionPercent}%</span>
                <span>Premium Monthly: {100 - data.stats.annualPlanAdoptionPercent}%</span>
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
                    <span className="text-slate-600 dark:text-slate-400">{data.stats.annualSubCount} Users</span>
                    <span className="text-teal-650 dark:text-teal-400 font-bold">${((data.stats.annualSubCount || 0) * 199).toLocaleString()}/yr</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${data.stats.annualPlanAdoptionPercent}%` }} />
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
                    <span className="text-slate-600 dark:text-slate-400">{data.stats.monthlySubCount} Users</span>
                    <span className="text-emerald-650 dark:text-emerald-400 font-bold">${((data.stats.monthlySubCount || 0) * 24).toLocaleString()}/mo</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${100 - data.stats.annualPlanAdoptionPercent}%` }} />
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
              {data.failedPayments.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  No failed payments recorded.
                </div>
              ) : (
                data.failedPayments.map((p, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.user}</p>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.amount}</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{p.reason} · {p.date} · {p.retries} retry</p>
                    <div className="flex gap-2 mt-2">
                      <button 
                        disabled={isReadOnly}
                        className={`px-3 py-1 text-xs font-semibold border rounded-lg transition-all ${isReadOnly ? "opacity-50 cursor-not-allowed text-slate-450 bg-slate-100 border-slate-200 dark:bg-slate-850 dark:border-slate-800" : "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:border-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-900/30"}`}
                      >
                        Retry
                      </button>
                      <button 
                        disabled={isReadOnly}
                        className={`px-3 py-1 text-xs font-semibold border rounded-lg transition-all ${isReadOnly ? "opacity-50 cursor-not-allowed text-slate-450 bg-slate-100 border-slate-200 dark:bg-slate-850 dark:border-slate-800" : "text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-750"}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
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
                {data.subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-xs font-medium text-slate-450 dark:text-slate-500">
                      No subscriptions found in database.
                    </td>
                  </tr>
                ) : (
                  data.subscriptions.map((s, i) => (
                    <tr
                      key={i}
                      className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-200 group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{s.user}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{s.plan}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{s.amount}</td>
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{s.start}</td>
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{s.nextBilling}</td>
                      <td className="px-4 py-4"><StatusBadge variant={s.status} label={s.statusLabel} /></td>
                    </tr>
                  ))
                )}
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
            {refunds.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs font-medium text-slate-450 dark:text-slate-500">
                No refund requests pending or processed.
              </div>
            ) : (
              refunds.map((r, i) => (
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
                        disabled={isReadOnly}
                        className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${isReadOnly ? "opacity-50 cursor-not-allowed text-emerald-450 dark:text-emerald-600 bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-850" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenAction(r, "deny"); }}
                        disabled={isReadOnly}
                        className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${isReadOnly ? "opacity-50 cursor-not-allowed text-red-450 dark:text-red-650 bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-850" : "text-red-700 bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30"}`}
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
              ))
            )}
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
