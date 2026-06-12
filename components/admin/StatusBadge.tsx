"use client";

import { themeBadge } from "@/lib/adminTheme";

type BadgeVariant = "active" | "suspended" | "draft" | "review" | "published" | "failed" | "premium" | "free" | "pending" | "success" | "warning" | "archived";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  showDot?: boolean;
}

export default function StatusBadge({ variant, label, showDot = true }: StatusBadgeProps) {
  const displayLabel = label || variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${themeBadge}`}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-teal-700 dark:bg-teal-500" />}
      {displayLabel}
    </span>
  );
}
