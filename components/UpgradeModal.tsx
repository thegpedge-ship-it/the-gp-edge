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
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-auto">

              {/* Gradient header */}
              <div className={`px-6 pt-8 pb-6 ${isRegistrar ? "bg-gradient-to-br from-teal-950 via-slate-900 to-amber-950 border-b border-amber-500/20" : "bg-gradient-to-br from-teal-800 to-emerald-900"}`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isRegistrar ? "bg-amber-500/20 border border-amber-400/30 text-amber-400" : "bg-white/20 text-white"}`}>
                  {isRegistrar ? (
                    <Shield className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {isRegistrar ? "Registrar Plan Required" : "Upgrade to Unlock"}
                </h2>
                <p className="text-sm text-white/80">
                  {featureName
                    ? `"${featureName}" requires a ${isRegistrar ? "Registrar" : "paid"} plan.`
                    : `This content is locked behind a ${isRegistrar ? "Registrar" : "paid"} plan.`}
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Lock badge */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    {isRegistrar
                      ? "Available exclusively to active Registrar plan holders."
                      : "Available on Fellowship ($15/mo), Annual ($300/yr), or Registrar plans."}
                  </p>
                </div>

                {/* Feature list */}
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {isRegistrar ? "Registrar plan includes" : "Paid plans include"}
                </p>
                <ul className="space-y-2 mb-6">
                  {(isRegistrar ? REGISTRAR_FEATURES : PAID_FEATURES).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isRegistrar ? "text-amber-500" : "text-emerald-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTAs */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleUpgrade}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
                      isRegistrar
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                    }`}
                  >
                    View Plans & Pricing
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
