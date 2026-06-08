"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";

const chartData = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 305 },
  { month: "March", visitors: 237 },
  { month: "April", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "June", visitors: 214 },
];

export function VisitorsChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[12px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mb-1">Analytics</p>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-50">Monthly Visitors</h3>
        </div>
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-500 cursor-pointer transition-colors">2026 →</span>
      </div>

      {/* Chart */}
      <div className="w-full relative mb-6">
        <div className="h-80 min-h-80 aspect-auto">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid 
              vertical={false} 
              stroke="currentColor" 
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray="0"
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
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-3 py-2">
                        <p className="text-xs text-slate-400 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-white">
                          {payload[0].value} visitors
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="visitors"
              fill="url(#colorGradient)"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <LabelList
                position="top"
                offset={12}
                fill="currentColor"
                className="text-slate-600 dark:text-slate-300"
                fontSize={13}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Footer insight */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex gap-2 items-center text-sm">
          <div className="flex gap-2 leading-none font-medium text-slate-700 dark:text-slate-200">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            Trending up by 5.2% this month
          </div>
        </div>
        <p className="leading-none text-muted-foreground text-xs text-slate-500 dark:text-slate-400 mt-2">
          Showing total visitors for the last 6 months
        </p>
      </div>
    </motion.div>
  );
}
