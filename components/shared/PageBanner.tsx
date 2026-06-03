"use client";

import { motion } from "framer-motion";

interface PageBannerProps {
  title: string;
  highlightedText?: string;
  subtitle: string;
  illustrationPath?: string; // Keep to avoid breaking pages passing this prop
  pillText?: string;
  pillIcon?: React.ReactNode;
  actions?: React.ReactNode;
  variants?: any;
}

export default function PageBanner({
  title,
  highlightedText,
  subtitle,
  illustrationPath,
  pillText,
  pillIcon,
  actions,
  variants,
}: PageBannerProps) {
  const bannerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="relative">
      {/* ── Glass banner ──────────────────────────────────────────────── */}
      <motion.div
        variants={variants || bannerVariants}
        initial={variants ? undefined : "hidden"}
        animate={variants ? undefined : "visible"}
        className="relative overflow-hidden bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-slate-100/90 dark:border-slate-800 shadow-md shadow-slate-200/20 dark:shadow-none min-h-[140px] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        {/* Decorative premium gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/[0.04] via-emerald-500/[0.02] to-transparent dark:from-teal-500/[0.03] dark:via-emerald-500/[0.01] dark:to-transparent pointer-events-none z-0" />
        <div className="absolute top-0 right-1/4 w-[280px] h-[280px] bg-gradient-to-br from-teal-400/[0.06] to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        {/* Left side text content */}
        <div className="relative z-10 flex-1 min-w-0">
          {pillText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50/80 dark:bg-teal-950/40 border border-teal-100/50 dark:border-teal-900/30 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-3 uppercase tracking-wider">
              {pillIcon}
              {pillText}
            </div>
          )}
          <h1 className="font-sans text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}{" "}
            {highlightedText && (
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {highlightedText}
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side actions */}
        {actions && (
          <div className="relative z-10 shrink-0 flex items-center gap-3">
            {actions}
          </div>
        )}
      </motion.div>
    </div>
  );
}
