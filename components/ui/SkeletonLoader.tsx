/**
 * SkeletonLoader — premium, layout-accurate skeleton loading states.
 *
 * Philosophy: Skeletons must MATCH the real page layout as closely as possible.
 * Generic grey blocks are jarring. These components mirror the actual card
 * proportions, grid columns, and sidebar structure of the live dashboard.
 *
 * Components exported:
 *   SkeletonLine    — single animated text-line placeholder
 *   SkeletonCard    — card-shaped placeholder with inner skeleton lines
 *   StatCardSkeleton — matches the 4-stat-tile top row
 *   ContentRowSkeleton — matches a table / list row
 *   SidebarRailSkeleton — matches the collapsed sidebar rail
 *   PageSkeleton    — full-page orchestrated skeleton (used by loading.tsx)
 */

"use client";

import { motion } from "framer-motion";

/* ─── Pulse animation ──────────────────────────────────────────────────────── */
const pulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

/* ─── Stagger container — children animate in sequence ─────────────────────── */
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ─── Primitive: SkeletonLine ───────────────────────────────────────────────── */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <motion.div
      variants={pulse}
      animate="animate"
      className={`rounded-md bg-slate-200 dark:bg-slate-700/60 ${className}`}
    />
  );
}

/* ─── Primitive: SkeletonCard ───────────────────────────────────────────────── */
export function SkeletonCard({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm ${className}`}
    >
      {children ?? (
        <>
          <SkeletonLine className="h-3 w-1/3 mb-3" />
          <SkeletonLine className="h-7 w-1/2 mb-4" />
          <SkeletonLine className="h-2.5 w-full mb-2" />
          <SkeletonLine className="h-2.5 w-4/5" />
        </>
      )}
    </motion.div>
  );
}

/* ─── StatCardSkeleton — mimics the 4 top stat tiles ───────────────────────── */
export function StatCardSkeleton() {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonLine className="h-3 w-24" />
        <motion.div variants={pulse} animate="animate" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/60" />
      </div>
      <SkeletonLine className="h-8 w-16 mb-2" />
      <SkeletonLine className="h-2.5 w-20" />
    </motion.div>
  );
}

/* ─── ContentRowSkeleton — mimics a table / list row ───────────────────────── */
export function ContentRowSkeleton() {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <motion.div variants={pulse} animate="animate" className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/60 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-2/5" />
        <SkeletonLine className="h-2.5 w-1/3" />
      </div>
      <SkeletonLine className="h-5 w-16 rounded-full flex-shrink-0" />
      <SkeletonLine className="h-3 w-12 flex-shrink-0" />
    </motion.div>
  );
}

/* ─── SidebarRailSkeleton — mimics sidebar icon rail ───────────────────────── */
export function SidebarRailSkeleton() {
  return (
    <div className="hidden md:flex flex-col items-center gap-3 pt-4 px-2">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          variants={pulse}
          animate="animate"
          style={{ animationDelay: `${i * 0.1}s` }}
          className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/60"
        />
      ))}
    </div>
  );
}

/* ─── PageSkeleton — full orchestrated skeleton for loading.tsx ─────────────── */
export function PageSkeleton() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-5 pb-8"
    >
      {/* Page heading */}
      <motion.div variants={fadeUp} className="space-y-2 pt-1">
        <SkeletonLine className="h-7 w-44" />
        <SkeletonLine className="h-3.5 w-64" />
      </motion.div>

      {/* 4-col stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main wide card */}
      <SkeletonCard className="min-h-[200px]">
        <div className="flex items-center justify-between mb-5">
          <SkeletonLine className="h-4 w-40" />
          <SkeletonLine className="h-8 w-28 rounded-xl" />
        </div>
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <ContentRowSkeleton key={i} />
          ))}
        </div>
      </SkeletonCard>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonCard className="min-h-[160px]">
          <SkeletonLine className="h-4 w-32 mb-4" />
          <div className="space-y-2.5">
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-5/6" />
            <SkeletonLine className="h-3 w-4/5" />
          </div>
        </SkeletonCard>
        <SkeletonCard className="min-h-[160px]">
          <SkeletonLine className="h-4 w-28 mb-4" />
          <div className="flex items-end gap-2 h-20">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                variants={pulse}
                animate="animate"
                className="flex-1 rounded-t-md bg-slate-200 dark:bg-slate-700/60"
                style={{ height: `${30 + Math.sin(i) * 20 + 30}%` }}
              />
            ))}
          </div>
        </SkeletonCard>
      </div>
    </motion.div>
  );
}

export default SkeletonCard;