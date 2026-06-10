"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import {
  getUserNotifications,
  dismissUserNotification,
  GPEdgeNotification,
} from "@/utils/notifications";

export default function NewQuestionsNotificationCard() {
  const [activeNotification, setActiveNotification] = useState<GPEdgeNotification | null>(null);

  const refreshNotification = () => {
    const list = getUserNotifications();
    const active = list.find((n) => !n.dismissed);
    setActiveNotification(active || null);
  };

  useEffect(() => {
    refreshNotification();

    window.addEventListener("gpedge-new-notification", refreshNotification);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gpedge_new_questions_notification") {
        refreshNotification();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("gpedge-new-notification", refreshNotification);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleDismiss = () => {
    if (activeNotification) {
      dismissUserNotification(activeNotification.id);
    }
  };

  if (!activeNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, y: -20, marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto", y: 0, marginBottom: 24 }}
        exit={{ opacity: 0, height: 0, y: -20, marginBottom: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/60 dark:from-teal-950/20 dark:via-slate-900/50 dark:to-emerald-950/20 backdrop-blur-xl border border-teal-100/70 dark:border-teal-900/40 rounded-3xl p-6 lg:p-7 shadow-sm"
      >
        {/* Decorative ambient glowing backdrops */}
        <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-teal-200/20 dark:bg-teal-700/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-emerald-200/20 dark:bg-emerald-700/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pr-8">
          <div className="flex items-start gap-4 lg:gap-5">
            {/* Glow Icon badge */}
            <div className="relative flex-shrink-0 mt-0.5">
              <span className="absolute inset-0 rounded-2xl bg-teal-500/10 blur-sm animate-pulse-slow" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-widest bg-teal-50/80 dark:bg-teal-950/30 px-2 py-0.5 rounded border border-teal-100/50 dark:border-teal-900/20">
                  Update
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {new Date(activeNotification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                {activeNotification.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                {activeNotification.message}
              </p>
            </div>
          </div>

          {/* Action buttons (Dismiss & Start Practice) */}
          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 bg-white/80 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800/50 rounded-full transition-all active:scale-[0.97]"
            >
              Dismiss
            </button>
            <a
              href="/dashboard/medical-library"
              onClick={handleDismiss}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-xs font-extrabold text-white rounded-full transition-all shadow-md shadow-teal-500/25 flex items-center gap-1.5 active:scale-[0.97]"
            >
              Start Practice
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Dismiss absolute X button positioned nicely inside the card */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 lg:top-6 lg:right-6 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all z-20"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
