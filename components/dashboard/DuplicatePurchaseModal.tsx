"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Calendar } from "lucide-react";

interface Props {
  open: boolean;
  accessExpiresAt: string | null;
  onClose: () => void;
}

function CalendarExclamationIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 21h-9a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M11 15h1" />
      <path d="M12 15v3" />
      <path d="M19 16v3" />
      <path d="M19 22v.01" />
    </svg>
  );
}

export default function DuplicatePurchaseModal({ open, accessExpiresAt, onClose }: Props) {
  const formattedDate = accessExpiresAt
    ? new Date(accessExpiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "end of your current billing period";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-lg bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden p-6 sm:p-8 text-slate-900 dark:text-slate-100 z-10"
          >
            {/* Ambient Background Glow matching GP Edge brand theme */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Section */}
            <div className="flex items-start gap-4 mb-5">
              {/* Standalone Big Black/Dark Icon */}
              <div className="shrink-0 pt-0.5 text-slate-900 dark:text-white">
                <CalendarExclamationIcon className="w-11 h-11 sm:w-12 sm:h-12 stroke-[1.8]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 dark:border-teal-400/20 text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                  </span>
                  Active Subscription
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white leading-snug">
                  Active Subscription Detected
                </h3>
              </div>
            </div>

            {/* Explanatory Body Text */}
            <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              You already have an active plan associated with your account. To prevent unintended duplicate charges, new subscriptions cannot be initiated while an active plan is ongoing.
            </p>

            {/* Status Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/90 mb-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Current Plan Validity
                </span>
                <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 bg-teal-500/10 dark:bg-teal-400/10 px-2 py-0.5 rounded-md border border-teal-500/20 dark:border-teal-400/20 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Active Access
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 pl-5">
                Valid until <span className="text-teal-700 dark:text-teal-300 font-bold">{formattedDate}</span>
              </div>

              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-normal pt-2 border-t border-slate-200/60 dark:border-slate-800/70">
                To switch plans, adjust billing, or change tiers, please manage your subscription from your profile settings.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/dashboard/profile"
                className="group relative w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-md shadow-teal-900/10 hover:shadow-lg hover:shadow-teal-900/20 transition-all duration-200 active:scale-[0.99]"
              >
                <span>Manage / Cancel Subscription</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-2xl font-semibold text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all active:scale-[0.99]"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
