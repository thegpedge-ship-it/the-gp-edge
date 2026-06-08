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
  progress,
}: AnalyticsCardProps) {
  return (
    <div className={`p-4 bg-white dark:bg-teal-950/20 shadow-lg rounded-2xl border ${themeBorder}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-lg font-medium ${themeLabel}`}>{title}</span>
        <span className={`font-semibold text-sm shrink-0 ${themeAccent}`}>{percentage}</span>
      </div>
      <div className="flex flex-col justify-start">
        <p className={`mt-4 mb-4 text-4xl font-bold text-left leading-none ${themeText}`}>
          {data}
        </p>
        <div className={`relative w-full h-2 rounded-full ${themeProgressTrack}`}>
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${themeProgressFill}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
