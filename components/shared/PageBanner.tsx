"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PageBannerProps {
  title: string;
  highlightedText?: string;
  subtitle: string;
  illustrationPath?: string;
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
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      variants={variants || bannerVariants}
      initial={variants ? undefined : "hidden"}
      animate={variants ? undefined : "visible"}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 dark:from-emerald-900/30 dark:via-slate-800 dark:to-teal-900/30 border border-emerald-100/70 dark:border-emerald-800/40 p-6 lg:p-7 shadow-sm"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-emerald-200/40 dark:bg-emerald-700/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-teal-200/30 dark:bg-teal-700/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left side text content */}
        <div className="flex-1 min-w-0">
          {pillText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/60 text-[11px] font-semibold text-teal-700 dark:text-teal-300 mb-2.5 uppercase tracking-[0.15em] border border-emerald-200/50 dark:border-emerald-700/30">
              {pillIcon}
              {pillText}
            </div>
          )}
          <h1 className="font-serif text-xl md:text-2xl text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
            {title}{" "}
            {highlightedText && (
              <span className="text-emerald-600 dark:text-emerald-400">
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

        {/* Right side illustration */}
        {illustrationPath && (
          <div className="hidden md:block shrink-0 relative w-36 h-36 lg:w-40 lg:h-40 animate-float select-none pointer-events-none">
            <Image
              src={illustrationPath}
              alt="Page Illustration"
              fill
              sizes="(max-width: 768px) 0px, (max-width: 1024px) 144px, 160px"
              priority
              className="object-contain filter drop-shadow-lg"
            />
          </div>
        )}

        {/* Right side actions */}
        {actions && (
          <div className="shrink-0 flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
