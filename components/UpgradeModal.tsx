"use client";

/**
 * components/UpgradeModal.tsx
 *
 * Reusable upgrade prompt modal shown when a free/lower-tier user attempts to
 * access locked content. Provides a brief feature comparison and CTA to
 * the pricing page.
 * Uses createPortal + z-[200] to sit cleanly centered without navbar overlap.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Lock,
  X,
  ClipboardCheck,
  FileText,
  Folder,
  BarChart3,
  BookOpen,
  Search,
  Zap,
  Award,
} from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Context so users understand what they are missing. */
  featureName?: string;
  /** Which access gate triggered this modal. */
  requiredTier?: "paid" | "registrar";
}

const REGISTRAR_GRID_FEATURES = [
  { text: "Create unlimited custom quizzes", icon: ClipboardCheck },
  { text: "Access advanced question types", icon: FileText },
  { text: "Save and manage your quizzes", icon: Folder },
  { text: "Track performance and analytics", icon: BarChart3 },
  { text: "Access full question bank (AKT + KFP)", icon: BookOpen, fullWidth: true },
];

const PAID_GRID_FEATURES = [
  { text: "Unlimited Medical Library access", icon: BookOpen },
  { text: "All Clinical Autofill templates", icon: FileText },
  { text: "MBS Billing search & favourites", icon: Search },
  { text: "Priority content updates", icon: Zap },
  { text: "Full Exam Prep & practice questions", icon: Award, fullWidth: true },
];

export default function UpgradeModal({
  open,
  onClose,
  featureName,
  requiredTier = "paid",
}: UpgradeModalProps) {
  const router = useRouter();
  const isRegistrar = requiredTier === "registrar";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/pricing");
  };

  const features = isRegistrar ? REGISTRAR_GRID_FEATURES : PAID_GRID_FEATURES;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="upgrade-modal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="upgrade-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-6 sm:p-7 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Lock Icon - background removed as requested */}
            <div className="flex justify-center mb-3">
              <div className="flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Lock className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1.5">
                {isRegistrar ? "Registrar Plan Required" : "Upgrade to Unlock"}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {featureName
                  ? `"${featureName}" requires a ${isRegistrar ? "Registrar" : "paid"} plan.`
                  : `This feature is available for ${isRegistrar ? "Registrar" : "paid"} plan users only.`}
              </p>
            </div>

            {/* Lock Callout Banner */}
            <div className="flex items-center gap-3 p-3.5 mb-5 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-teal-900 dark:text-teal-200 leading-snug">
                {isRegistrar
                  ? "Available exclusively to active Registrar plan holders."
                  : "Available on Fellowship ($15/mo), Annual ($300/yr), or Registrar plans."}
              </p>
            </div>

            {/* Section Header with Divider Lines */}
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isRegistrar ? "Registrar plan includes" : "Paid plans include"}
              </span>
            </div>

            {/* Feature Cards 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.text}
                    className={`bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3 flex items-center gap-2.5 transition-all hover:border-teal-300 dark:hover:border-teal-700 ${
                      f.fullWidth ? "col-span-2" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100/70 dark:bg-teal-955/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                      {f.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Buttons Row */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpgrade}
                className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                View Plans & Pricing
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
