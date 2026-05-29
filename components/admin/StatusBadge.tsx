"use client";

type BadgeVariant = "active" | "suspended" | "draft" | "review" | "published" | "failed" | "premium" | "free" | "pending" | "success" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  suspended: "bg-red-50 text-red-700 border-red-200/60",
  draft: "bg-slate-100 text-slate-600 border-slate-200/60",
  review: "bg-amber-50 text-amber-700 border-amber-200/60",
  published: "bg-teal-50 text-teal-700 border-teal-200/60",
  failed: "bg-red-50 text-red-700 border-red-200/60",
  premium: "bg-violet-50 text-violet-700 border-violet-200/60",
  free: "bg-slate-100 text-slate-600 border-slate-200/60",
  pending: "bg-amber-50 text-amber-700 border-amber-200/60",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  warning: "bg-amber-50 text-amber-700 border-amber-200/60",
};

const dotStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-500",
  suspended: "bg-red-500",
  draft: "bg-slate-400",
  review: "bg-amber-500",
  published: "bg-teal-500",
  failed: "bg-red-500",
  premium: "bg-violet-500",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {displayLabel}
    </span>
  );
}
