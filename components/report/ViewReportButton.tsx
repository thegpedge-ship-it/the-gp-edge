"use client";

import { useEffect, useState } from "react";
import { FileDown } from "lucide-react";
import { hasReport, viewReport } from "@/lib/report/reportStore";

/* Renders a "View Report" control only when a locally-stored PDF report
   exists for this test (in the browser's IndexedDB). Nothing is rendered
   while checking or when no report is present, so callers can drop it into
   any card unconditionally. */
export default function ViewReportButton({
  testId,
  className,
  variant = "button",
}: {
  testId: string;
  className?: string;
  /** "button" = filled pill; "link" = compact inline link. */
  variant?: "button" | "link";
}) {
  const [available, setAvailable] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasReport(testId)
      .then((has) => {
        if (!cancelled) setAvailable(has);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [testId]);

  if (!available) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (opening) return;
    setOpening(true);
    try {
      const ok = await viewReport(testId);
      if (!ok) setAvailable(await hasReport(testId)); // report was cleared elsewhere
    } finally {
      setOpening(false);
    }
  };

  if (variant === "link") {
    return (
      <button
        onClick={handleClick}
        disabled={opening}
        className={
          className ??
          "inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 disabled:opacity-60 transition-colors"
        }
      >
        <FileDown size={13} strokeWidth={2.2} />
        {opening ? "Opening…" : "View Report"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={opening}
      className={
        className ??
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-60 transition-colors"
      }
    >
      <FileDown size={13} strokeWidth={2.2} />
      {opening ? "Opening…" : "View Report"}
    </button>
  );
}
