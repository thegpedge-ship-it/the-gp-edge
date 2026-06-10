"use client";

import { memo, useState, useEffect } from "react";
import { upcomingExam } from "./data";

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

const CountdownCard = memo(function CountdownCard() {
  const e = upcomingExam;
  const hrs = Math.floor(e.durationMin / 60);
  const mins = e.durationMin % 60;
  const duration = mins ? `${hrs}h ${mins}m` : `${hrs}h`;
  const [registered, setRegistered] = useState(false);
  const countdown = useCountdown(e.daysAway);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
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

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 p-6 lg:py-6 lg:pl-6 lg:pr-7">
        {/* Countdown + title */}
        <div className="flex items-center gap-5 flex-shrink-0">
          {/* Countdown units */}
          <div className="flex items-center gap-1.5">
            <CountdownUnit value={countdown.days} label="Days" />
            <span className="text-emerald-400 dark:text-emerald-500 font-light text-2xl leading-none pb-4 select-none">:</span>
            <CountdownUnit value={countdown.hours} label="Hrs" />
            <span className="text-emerald-400 dark:text-emerald-500 font-light text-2xl leading-none pb-4 select-none">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px self-stretch bg-emerald-200 dark:bg-emerald-800/60" />
          <div className="lg:hidden h-px w-full bg-emerald-200 dark:bg-emerald-800/60" />

          {/* Title block */}
          <div className="min-w-0 flex items-center">
            <h3 className="font-serif text-xl lg:text-[26px] text-slate-900 dark:text-slate-50 leading-snug">
              {e.name}
            </h3>
          </div>
        </div>

        {/* Info columns */}
        <div className="flex items-center gap-5 lg:gap-7 lg:flex-1 lg:justify-center flex-wrap">
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            value={e.dateLabel}
            sub={e.timeLabel}
          />
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            value={duration}
            sub="Duration"
          />
          <InfoItem
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            value={`${e.totalQuestions} questions`}
            sub="Total"
          />
        </div>

        {/* Register CTA */}
        <div className="flex flex-shrink-0">
          <button
            type="button"
            onClick={() => setRegistered((r) => !r)}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 active:scale-[0.97] shadow-md ${
              registered
                ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-900/20 hover:bg-emerald-700 dark:hover:bg-emerald-400"
                : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-600 shadow-emerald-200/30 dark:shadow-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700"
            }`}
          >
            {registered ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
                <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 007.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 01-4.5 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            )}
            Register
          </button>
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

function InfoItem({
  icon,
  value,
  sub,
}: {
  icon: React.ReactNode;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
          {value}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
          {sub}
        </p>
      </div>
    </div>
  );
}

export default CountdownCard;
