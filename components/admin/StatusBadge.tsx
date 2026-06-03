"use client";

type BadgeVariant = "active" | "suspended" | "draft" | "review" | "published" | "failed" | "premium" | "free" | "pending" | "success" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  suspended: "bg-slate-200 text-slate-800 border-slate-300",
  draft: "bg-slate-100 text-slate-600 border-slate-200/60",
  review: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  published: "bg-teal-50 text-teal-700 border-teal-200/60",
  failed: "bg-slate-200 text-slate-800 border-slate-300",
  premium: "bg-teal-50/50 text-teal-800 border-teal-200/40",
  free: "bg-slate-100 text-slate-600 border-slate-200/60",
  pending: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  warning: "bg-slate-100 text-slate-750 border-slate-200",
};

const dotStyles: Record<BadgeVariant, string> = {
  active: "bg-emerald-500",
  suspended: "bg-slate-400",
  draft: "bg-slate-400",
  review: "bg-emerald-500",
  published: "bg-teal-500",
  failed: "bg-slate-500",
  premium: "bg-teal-500",
  free: "bg-slate-400",
  pending: "bg-emerald-500",
  success: "bg-emerald-500",
  warning: "bg-slate-500",
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
