"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

const userGrowthData = [
  { month: "January", users: 8420 },
  { month: "February", users: 9180 },
  { month: "March", users: 10050 },
  { month: "April", users: 10890 },
  { month: "May", users: 11740 },
  { month: "June", users: 12847 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        <div className="px-3 py-2">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-semibold text-white">
            {(value / 1000).toFixed(1)}k users
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function UserGrowthChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Growth</p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">User Growth</h3>
        </div>
        <span className="font-serif text-xl text-slate-900 dark:text-slate-50">12,847</span>
      </div>

      <div className="w-full relative">
        <div className="h-80 min-h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowthData} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
              />
              <XAxis
                dataKey="month"
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
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar
                dataKey="users"
                fill="url(#growthGradient)"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Current users: <span className="font-semibold text-slate-700 dark:text-slate-200">12,847</span> active subscribers
        </p>
      </div>
    </motion.div>
  );
}
