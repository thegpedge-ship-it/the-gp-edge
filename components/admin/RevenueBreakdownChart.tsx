"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { motion } from "framer-motion";

const revenueBreakdownData = [
  { date: "Monday", premium: 2400, standard: 1800 },
  { date: "Tuesday", premium: 2210, standard: 1398 },
  { date: "Wednesday", premium: 2290, standard: 980 },
  { date: "Thursday", premium: 2000, standard: 1200 },
  { date: "Friday", premium: 2181, standard: 1490 },
  { date: "Saturday", premium: 2500, standard: 2100 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color?: string;
  }>;
  label?: string;
}

const AdvancedTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);
    
    return (
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        <div className="px-3 py-2 space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: entry.color || (index === 0 ? "#16a34a" : "#86efac") }}
                />
                <span className="text-xs text-slate-300">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">
                ${(entry.value / 1000).toFixed(1)}k
              </span>
            </div>
          ))}
          <div className="border-t border-slate-600 pt-1.5 mt-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Total</span>
            <span className="text-sm font-bold text-green-400">
              ${(total / 1000).toFixed(1)}k
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueBreakdownChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">Revenue Breakdown</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Premium vs Standard subscriptions</p>
        </div>
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-500 cursor-pointer transition-colors">2026 →</span>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Premium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Standard</span>
        </div>
      </div>

      <div className="w-full relative">
        <div className="h-80 min-h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBreakdownData} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-slate-500 dark:text-slate-400"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                content={<AdvancedTooltip />} 
                cursor={{ fill: "rgba(22, 163, 74, 0.1)" }}
                defaultIndex={3}
              />
              <Bar dataKey="premium" stackId="a" fill="#16a34a" radius={[8, 8, 0, 0]} isAnimationActive={true} />
              <Bar dataKey="standard" stackId="a" fill="#86efac" radius={[0, 0, 0, 0]} isAnimationActive={true} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Total weekly revenue: <span className="font-semibold text-slate-700 dark:text-slate-200">$16,800</span>
        </p>
      </div>
    </motion.div>
  );
}
