"use client";

import { motion } from "framer-motion";

interface AdminPageHeaderProps {
  title: string;
  highlightedText?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variants?: any;
}

export default function AdminPageHeader({
  title,
  highlightedText,
  subtitle,
  actions,
  variants,
}: AdminPageHeaderProps) {
  const defaultVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      variants={variants || defaultVariants}
      initial={variants ? undefined : "hidden"}
      animate={variants ? undefined : "visible"}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30"
    >
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
          {title}{" "}
          {highlightedText && (
            <span className="text-teal-600 dark:text-teal-400">{highlightedText}</span>
          )}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-3">{actions}</div>
      )}
    </motion.div>
  );
}
