"use client";

import React from "react";

export default function ClockLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes dialSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="relative w-[30px] h-[30px] rounded-full border-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 scale-125 shrink-0">
        <div
          className="absolute w-0 h-[10px] block border-l-2 border-slate-900 dark:border-slate-100 rounded-[1px] left-[13px] top-[3px] origin-bottom"
          style={{ animation: "dialSpin 1s linear infinite" }}
        />
        <div
          className="absolute w-0 h-[10px] block border-l-2 border-slate-900 dark:border-slate-100 rounded-[1px] left-[13px] top-[3px] origin-bottom"
          style={{ animation: "dialSpin 40s linear infinite" }}
        />
      </div>
    </div>
  );
}
