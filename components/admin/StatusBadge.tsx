"use client";

type BadgeVariant = "active" | "suspended" | "draft" | "review" | "published" | "failed" | "premium" | "free" | "pending" | "success" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-700/40",
  suspended: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600",
  draft: "bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600",
  review: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-700/40",
  published: "bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-700/40",
  failed: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-700/40",
  premium: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-700/40",
  free: "bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600",
  pending: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-700/40",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-700/40",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-700/40",
};

const dotStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-500",
  suspended: "bg-slate-400",
  draft: "bg-slate-400",
  review: "bg-amber-500",
  published: "bg-teal-500",
  failed: "bg-rose-500",
  premium: "bg-emerald-500",
  free: "bg-slate-400",
  pending: "bg-amber-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  showDot?: boolean;
}

export default function StatusBadge({ variant, label, showDot = true }: StatusBadgeProps) {
  const displayLabel = label || variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${variantStyles[variant]}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {displayLabel}
    </span>
  );
}
