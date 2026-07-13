"use client";

import { memo, useState, useEffect } from "react";
import { upcomingExam as fallbackExam } from "./data";

type UpcomingExam = {
  name: string;
  dateLabel: string;
  timeLabel: string;
  daysAway: number;
  totalQuestions: number;
  durationMin: number;
};

function useCountdown(daysAway: number) {
  const [target] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysAway);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  });

  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc), 60_000);
    return () => clearInterval(id);
  }, [target]);

  return time;
}

const CountdownCard = memo(function CountdownCard({
  exam = fallbackExam,
}: {
  exam?: UpcomingExam;
}) {
  const e = exam;
  const countdown = useCountdown(e.daysAway);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
      {/* Decorative concentric arcs — right side */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[320px] w-[320px] pointer-events-none"
        viewBox="0 0 320 320"
        fill="none"
      >
        {[20, 38, 56, 74, 92, 110, 128, 146, 164, 182, 200, 218, 236, 254, 272, 290, 308].map((r, i) => (
          <circle
            key={r}
            cx="320"
            cy="160"
            r={r}
            stroke="currentColor"
            strokeWidth={1}
            className={
              i < 6
                ? "text-emerald-300/55 dark:text-emerald-600/30"
                : i < 12
                  ? "text-emerald-200/45 dark:text-emerald-700/25"
                  : "text-emerald-100/35 dark:text-emerald-800/20"
            }
          />
        ))}
      </svg>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 p-6 lg:p-8 text-center">
        {/* Exam name */}
        <div className="min-w-0">
          <h3 className="font-serif text-2xl lg:text-3xl text-slate-900 dark:text-slate-50 leading-snug">
            {e.name}
          </h3>
        </div>

        {/* Countdown units */}
        <div className="flex items-center justify-center gap-1.5">
          <CountdownUnit value={countdown.days} label="Days" />
          <span className="text-emerald-400 dark:text-emerald-500 font-light text-2xl leading-none pb-4 select-none">:</span>
          <CountdownUnit value={countdown.hours} label="Hrs" />
          <span className="text-emerald-400 dark:text-emerald-500 font-light text-2xl leading-none pb-4 select-none">:</span>
          <CountdownUnit value={countdown.minutes} label="Min" />
        </div>
      </div>
    </div>
  );
});

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-[3px]">
        {display.split("").map((digit, i) => (
          <span
            key={i}
            className="w-[30px] h-[40px] rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white font-mono text-xl font-bold flex items-center justify-center shadow-sm shadow-emerald-800/20"
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="text-[9px] uppercase tracking-[0.15em] font-semibold text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}

export default CountdownCard;
