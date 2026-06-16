"use client";

import React from "react";
import { themeBorder, themeText } from "@/lib/adminTheme";

interface AnalyticsCardProps {
  title: string;
  percentage: string;
  data: string;
  progress?: number;
}

export function AnalyticsCard({
  title,
  percentage,
  data,
  progress,
}: AnalyticsCardProps) {
  const cleanPercentage = percentage ? percentage.trim() : "";
  
  // A percentage starting with '+' or '-' or matching decimal percent is a trend
  const isTrend = 
    cleanPercentage.startsWith("+") || 
    cleanPercentage.startsWith("-") || 
    /^[+-]?\d+(\.\d+)?%$/.test(cleanPercentage);

  const hasCurrency = data ? data.startsWith("$") : false;
  const displayValue = hasCurrency ? data.slice(1) : data;

  return (
    <div className={`p-[22px_24px_18px] bg-white dark:bg-slate-900 border ${themeBorder} rounded-[28px] shadow-[0_1px_1px_rgba(14,17,22,0.04),0_20px_40px_-24px_rgba(14,17,22,0.18)] dark:shadow-none hover:shadow-md transition-all duration-300 w-full`}>
      <header className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
          <svg 
            className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            aria-hidden="true"
          >
            <rect width={20} height={12} x={2} y={6} rx={2} />
            <circle cx={12} cy={12} r={2} />
            <path d="M6 12h.01" />
            <path d="M18 12h.01" />
          </svg>
          {title}
        </span>
        
        {/* If percentage is NOT a trend (e.g. "7 days", "15 active", "Requires review"), render it as a range badge */}
        {!isTrend && cleanPercentage && (
          <span className="h-6 px-2.5 inline-grid place-items-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 select-none">
            {cleanPercentage}
          </span>
        )}
      </header>

      <div className={`font-sans font-bold text-3xl lg:text-4xl tracking-tight leading-none ${themeText} tabular-nums mt-1`}>
        {hasCurrency && (
          <span className="text-xl lg:text-2xl font-semibold text-slate-400 dark:text-slate-500 mr-0.5">
            $
          </span>
        )}
        {displayValue}
      </div>

      {/* If percentage IS a trend, render it as a green/red delta trend */}
      {isTrend && cleanPercentage && (
        <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold ${
          cleanPercentage.startsWith("-") 
            ? "text-rose-500 dark:text-rose-400" 
            : "text-emerald-600 dark:text-emerald-450"
        }`}>
          <svg 
            className={`w-3.5 h-3.5 ${cleanPercentage.startsWith("-") ? "rotate-180" : ""}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            aria-hidden="true"
          >
            <path d="m7 17 5-5 5 5" />
            <path d="M7 7h10v10" />
          </svg>
          {cleanPercentage} vs. last period
        </div>
      )}

      {/* Renders progress bar if progress is provided */}
      {progress !== undefined && (
        <div className="flex h-2 mt-4.5 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100/50 dark:border-slate-800/50" aria-hidden="true">
          <span className="bg-teal-700 dark:bg-teal-600 h-full rounded-full" style={{ flex: progress }} />
          <span className="bg-slate-200 dark:bg-slate-800 h-full" style={{ flex: 100 - progress }} />
        </div>
      )}

      {/* Renders legend if progress is provided */}
      {progress !== undefined && (
        <footer className="flex gap-4 mt-3 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 select-none">
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full inline-block bg-teal-700 dark:bg-teal-600" />
            Active ({progress}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full inline-block bg-slate-200 dark:bg-slate-800" />
            Other ({100 - progress}%)
          </span>
        </footer>
      )}
    </div>
  );
}
