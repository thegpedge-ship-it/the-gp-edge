"use client";

/**
 * components/UpgradeModal.tsx
 *
 * Reusable upgrade prompt modal shown when a free/lower-tier user attempts to
 * access locked content. Provides a brief feature comparison and CTA to
 * the pricing page.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, Sparkles, X, CheckCircle2, ArrowRight, Shield } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Context so users understand what they are missing. */
  featureName?: string;
  /** Which access gate triggered this modal. */
  requiredTier?: "paid" | "registrar";
}

const PAID_FEATURES = [
  "Unlimited Medical Library access",
  "All Clinical Autofill templates",
  "MBS Billing search & favourites",
  "Priority content updates",
];

const REGISTRAR_FEATURES = [
  "Everything in Fellowship plans",
  "Full Exam Prep access",
  "All quizzes (AKT + KFP)",
  "Unlimited practice questions",
  "6 or 12-month registrar support",
];

export default function UpgradeModal({
  open,
  onClose,
  featureName,
  requiredTier = "paid",
}: UpgradeModalProps) {
  const router = useRouter();
  const isRegistrar = requiredTier === "registrar";

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/pricing");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="upgrade-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="upgrade-panel"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            {/* Border Accent Card */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-600/40 dark:border-emerald-500/40 p-6 sm:p-7 overflow-hidden pointer-events-auto transition-colors duration-200">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Section (Compact & Clean) */}
              <div className="flex items-start gap-4 pr-6 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isRegistrar
                    ? "bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50"
                    : "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/50"
                }`}>
                  {isRegistrar ? (
                    <Shield className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {isRegistrar ? "Registrar Plan Required" : "Upgrade to Unlock"}
                  </h2>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {featureName
                      ? `"${featureName}" requires a ${isRegistrar ? "Registrar" : "paid"} plan.`
                      : `This content is locked behind a ${isRegistrar ? "Registrar" : "paid"} plan.`}
                  </p>
                </div>
              </div>

              {/* Yellow / Amber Callout Banner */}
              <div className="flex items-start gap-3 p-3.5 mb-5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/40 rounded-xl">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 leading-snug">
                  {isRegistrar
                    ? "Available exclusively to active Registrar plan holders."
                    : "Available on Fellowship ($15/mo), Annual ($300/yr), or Registrar plans."}
                </p>
              </div>

              {/* Paid Plans Include Feature List */}
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {isRegistrar ? "REGISTRAR PLAN INCLUDES" : "PAID PLANS INCLUDE"}
                </p>
                <ul className="space-y-3">
                  {(isRegistrar ? REGISTRAR_FEATURES : PAID_FEATURES).map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isRegistrar ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleUpgrade}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all shadow-sm active:scale-[0.98] ${
                    isRegistrar
                      ? "border-amber-500 text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      : "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  View Plans & Pricing
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-1 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-center"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
