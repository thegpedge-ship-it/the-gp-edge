"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wrench, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";

interface MaintenanceCardProps {
  moduleName?: string;
  message?: string;
  backHref?: string;
  onRefresh?: () => void;
}

export default function MaintenanceCard({
  moduleName = "This Section",
  message = "We are currently performing scheduled updates and maintenance. Please check back shortly!",
  backHref = "/dashboard",
  onRefresh,
}: MaintenanceCardProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-lg w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-amber-200/80 dark:border-amber-900/60 rounded-3xl p-8 shadow-xl shadow-amber-500/5 dark:shadow-slate-950/50 relative overflow-hidden text-center"
      >
        {/* Subtle background ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Maintenance Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-6 relative">
          <Wrench className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-200 rounded-full border-2 border-white dark:border-slate-900" />
        </div>

        {/* Status Tag */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Maintenance In Progress
        </span>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {moduleName} Under Maintenance
        </h3>

        {/* Message */}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          {message}
        </p>

        {/* Estimated Recovery Info */}
        <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Engineers are actively deploying updates. Service will resume shortly.</span>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
          )}

          <button
            onClick={() => (onRefresh ? onRefresh() : window.location.reload())}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
