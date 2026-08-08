"use client";

type BadgeVariant =
  | "active"
  | "suspended"
  | "draft"
  | "review"
  | "published"
  | "failed"
  | "premium"
  | "free"
  | "pending"
  | "success"
  | "warning"
  | "archived";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  showDot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
  active: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  published: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  success: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  suspended: {
    bg: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
    dot: "bg-red-500",
  },
  failed: {
    bg: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50",
    dot: "bg-red-500",
  },
  draft: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  review: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  warning: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  premium: {
    bg: "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50",
    dot: "bg-teal-500",
  },
  free: {
    bg: "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  archived: {
    bg: "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({ variant, label, showDot = true }: StatusBadgeProps) {
  const displayLabel = label || variant.charAt(0).toUpperCase() + variant.slice(1);
  const style = variantStyles[variant] || variantStyles.free;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border transition-colors ${style.bg}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      {displayLabel}
    </span>
  );
}
