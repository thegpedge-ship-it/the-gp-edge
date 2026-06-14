"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { TrendingUp, Users, CreditCard, Sparkles, Layers } from "lucide-react";

// 6 Months chronological mock data
const monthlyData = [
  { month: "Jan", mrr: 8200, oneOff: 2400, subscribers: 842, totalUsers: 910, visitors: 1120 },
  { month: "Feb", mrr: 9800, oneOff: 3100, subscribers: 918, totalUsers: 1020, visitors: 1250 },
  { month: "Mar", mrr: 11400, oneOff: 2900, subscribers: 1005, totalUsers: 1150, visitors: 1410 },
  { month: "Apr", mrr: 13200, oneOff: 3800, subscribers: 1089, totalUsers: 1280, visitors: 1340 },
  { month: "May", mrr: 15600, oneOff: 4200, subscribers: 1174, totalUsers: 1410, visitors: 1590 },
  { month: "Jun", mrr: 17100, oneOff: 4800, subscribers: 1456, totalUsers: 1680, visitors: 1820 }
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl p-3 text-xs space-y-1.5">
        <p className="font-semibold text-slate-400 border-b border-slate-700 pb-1 mb-1">{label} 2026</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 font-medium">{entry.name}</span>
            </div>
            <span className="font-serif font-bold text-white">
              {entry.dataKey === "mrr" || entry.dataKey === "oneOff" 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState<"revenue" | "growth" | "visitors">("revenue");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tabbed Analytics Panel */}
      <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
        <div>
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Platform Trends</p>
              <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-50">Analytics Center</h3>
            </div>
            
            <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800/80 self-start sm:self-center">
              {[
                { id: "revenue", label: "Revenue" },
                { id: "growth", label: "Users" },
                { id: "visitors", label: "Traffic" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm border border-slate-100 dark:border-slate-850"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Rendering Container */}
          <div className="h-72 w-full relative">
            <AnimatePresence mode="wait">
              {activeTab === "revenue" && (
                <motion.div
                  key="revenue"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        name="MRR"
                        type="monotone"
                        dataKey="mrr"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Line
                        name="One-off Purchases"
                        type="monotone"
                        dataKey="oneOff"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {activeTab === "growth" && (
                <motion.div
                  key="growth"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        name="Subscribers"
                        type="monotone"
                        dataKey="subscribers"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Line
                        name="Total Registered"
                        type="monotone"
                        dataKey="totalUsers"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {activeTab === "visitors" && (
                <motion.div
                  key="visitors"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor" }}
                        className="text-slate-400 dark:text-slate-500 font-medium"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        name="Unique Visitors"
                        type="monotone"
                        dataKey="visitors"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/80">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {activeTab === "revenue" && "MRR has grown 108% since January 2026. Premium Annual plans compose 53.6% of new signups."}
            {activeTab === "growth" && "Conversion of trial-to-paid is up 1.2% in June. Active base represents 86.6% retention."}
            {activeTab === "visitors" && "Traffic peaks during exam cycles. Standard bounce rate is stable at 24.3%."}
          </span>
        </div>
      </div>

      {/* Subscription Breakdown & Engagement Metrics */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Subscription mix</p>
          <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-50 mb-5">Plan Distribution</h3>
          
          <div className="space-y-4">
            {[
              { name: "Premium Annual", count: "780 users", share: "53.6%", mrr: "$13,000", pct: 54, color: "bg-teal-700 dark:bg-teal-600" },
              { name: "Premium Monthly", count: "476 users", share: "32.7%", mrr: "$3,330", pct: 33, color: "bg-emerald-600 dark:bg-emerald-500" },
              { name: "Basic Monthly", count: "200 users", share: "13.7%", mrr: "$770", pct: 14, color: "bg-teal-500 dark:bg-teal-400" },
              { name: "Free Trial (Active)", count: "1,220 users", share: "-", mrr: "$0", pct: 78, color: "bg-slate-400 dark:bg-slate-600" }
            ].map((plan) => (
              <div key={plan.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.color.split(" ")[0]}`} />
                    {plan.name}
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {plan.count} ({plan.share})
                  </span>
                </div>
                
                <div className="h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden flex">
                  <div className={`h-full rounded-full ${plan.color}`} style={{ width: `${plan.pct}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>MRR Impact</span>
                  <span className="font-serif font-bold text-slate-800 dark:text-slate-300">{plan.mrr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement overview */}
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 mt-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 mb-0.5">DAU / MAU</span>
              <span className="font-serif text-lg font-bold text-slate-800 dark:text-slate-100">65.4%</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
              <span className="block text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Avg Session</span>
              <span className="font-serif text-lg font-bold text-slate-800 dark:text-slate-100">18m 42s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
