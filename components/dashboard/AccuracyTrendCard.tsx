"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { mockExamScores, user } from "./data";

const AccuracyTrendCard = memo(function AccuracyTrendCard() {
  const exams = mockExamScores;
  const latest = exams[exams.length - 1];
  const prev = exams.length >= 2 ? exams[exams.length - 2] : null;
  const delta = prev ? latest.score - prev.score : 0;

  const W = 300;
  const H = 90;
  const PAD_X = 6;
  const INNER_W = W - PAD_X * 2;

  const [hovered, setHovered] = useState<number | null>(null);

  const { linePath, areaPath, coords } = useMemo(() => {
    const scores = exams.map((e) => e.score);
    const min = Math.min(...scores) - 4;
    const max = Math.max(...scores) + 4;
    const toX = (i: number) =>
      PAD_X + (i / (scores.length - 1)) * INNER_W;
    const toY = (v: number) => H - ((v - min) / (max - min)) * H;

    const coords = scores.map((s, i) => ({ x: toX(i), y: toY(s) }));

    const linePath = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${H} L${coords[0].x.toFixed(1)},${H} Z`;
    return { linePath, areaPath, coords };
  }, [exams, INNER_W]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      let closest = 0;
      let minDist = Infinity;
      coords.forEach((c, i) => {
        const dist = Math.abs(c.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setHovered(closest);
    },
    [coords]
  );

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Mock exam scores
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl text-slate-900 dark:text-slate-50">
              {latest.score}%
            </span>
            {delta !== 0 && (
              <span
                className={`text-xs font-semibold ${
                  delta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta}% vs prev
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
          {exams.length} exams
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H + 14}`}
          className="w-full h-24 cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="mockScoreArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#mockScoreArea)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#0d9488"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />

          {/* Data points */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hovered === i ? 4 : i === coords.length - 1 ? 3.5 : 2}
              fill={hovered === i ? "#0d9488" : i === coords.length - 1 ? "#0d9488" : "#0d948850"}
              stroke="white"
              strokeWidth={hovered === i || i === coords.length - 1 ? 1.5 : 0}
              className="transition-all duration-150"
            />
          ))}

          {/* Hover vertical line */}
          {hovered !== null && (
            <line
              x1={coords[hovered].x}
              y1={0}
              x2={coords[hovered].x}
              y2={H}
              stroke="#0d9488"
              strokeWidth={0.8}
              strokeDasharray="3,3"
              opacity={0.5}
            />
          )}
        </svg>

        {/* Tooltip */}
        {hovered !== null && (
          <div
            className="absolute -top-12 pointer-events-none z-10 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs shadow-lg whitespace-nowrap transition-all duration-100"
            style={{
              left: `${(coords[hovered].x / W) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-semibold">{exams[hovered].score}%</p>
            <p className="text-slate-300 text-[10px]">{exams[hovered].date}</p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
        {exams
          .filter((_, i) => {
            if (exams.length <= 6) return true;
            return i === 0 || i === exams.length - 1 || i % Math.ceil(exams.length / 5) === 0;
          })
          .map((e) => (
            <span key={e.date}>{e.date.split(" ").slice(0, 2).join(" ")}</span>
          ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 00-3.6 10.8c.4.3.6.8.6 1.3v.4h6v-.4c0-.5.2-1 .6-1.3A6 6 0 0012 3z" />
            <path d="M9 19h6M10 21.5h4" />
          </svg>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Steady climb, {user.firstName}. Your mock scores are trending up — trust the process.
          </p>
        </div>
      </div>
    </div>
  );
});

export default AccuracyTrendCard;
