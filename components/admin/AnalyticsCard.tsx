"use client";

import {
  themeAccent,
  themeBorder,
  themeLabel,
  themeProgressFill,
  themeProgressTrack,
  themeText,
} from "@/lib/adminTheme";

interface AnalyticsCardProps {
  title: string;
  percentage: string;
  data: string;
  progress: number;
}

export function AnalyticsCard({
  title,
  percentage,
  data,
}: AnalyticsCardProps) {
  return (
    <div className={`p-4 bg-white dark:bg-teal-950/20 shadow-lg rounded-2xl border ${themeBorder}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[13px] font-semibold tracking-wide uppercase text-slate-400 dark:text-slate-500`}>{title}</span>
        <span className={`font-semibold text-xs shrink-0 ${themeAccent}`}>{percentage}</span>
      </div>
      <div className="flex flex-col justify-start">
        <p className={`mt-3 text-3xl font-bold text-left leading-none ${themeText}`}>
          {data}
        </p>
      </div>
    </div>
  );
}
