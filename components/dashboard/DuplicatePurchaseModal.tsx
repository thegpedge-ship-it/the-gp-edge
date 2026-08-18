"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

interface Props {
  open: boolean;
  accessExpiresAt: string | null;
  onClose: () => void;
}

export default function DuplicatePurchaseModal({ open, accessExpiresAt, onClose }: Props) {
  if (!open) return null;

  const formattedDate = accessExpiresAt
    ? new Date(accessExpiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "end of your current billing period";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 text-slate-900 dark:text-slate-100">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-955/40 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold font-serif mb-2">Active Subscription Detected</h3>

        <p className="font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          You currently have an active plan valid until{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-semibold">{formattedDate}</strong>. You cannot purchase a new subscription until your current plan is canceled and reaches the end of its billing cycle.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/dashboard/profile"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-md shadow-teal-600/20 transition-all"
          >
            Manage / Cancel Subscription
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl font-semibold text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}
