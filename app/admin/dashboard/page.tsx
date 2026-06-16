"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardKPIs } from "@/components/admin/DashboardKPIs";
import { DashboardAnalytics } from "@/components/admin/DashboardAnalytics";
import { DashboardIntelligence } from "@/components/admin/DashboardIntelligence";
import { Calendar } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.05, 
      delayChildren: 0.05 
    } 
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.3, 
      ease: [0.22, 1, 0.36, 1] 
    } 
  },
};

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-8 pb-12"
    >
      {/* HEADER SECTION */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6"
      >
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] text-teal-800 dark:text-teal-400 font-bold mb-1 uppercase tracking-widest">
            Executive Admin Console
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Platform{" "}
            <span className="bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
            Real-time operations, core SaaS unit economics, platform user engagement, and system health status.
          </p>
        </div>

        {/* Dynamic Timeframe Selector */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-semibold mr-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Range:</span>
          </div>
          
          <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  timeframe === tf.id
                    ? "bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-450 shadow-sm border border-slate-100 dark:border-slate-700/50"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 1: Key Performance Indicators Grid */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-slate-800 dark:text-slate-100">
            Core Metrics Overview
          </h2>
        </div>
        <DashboardKPIs timeframe={timeframe} />
      </motion.section>

      {/* SECTION 2: Advanced Analytics & Subscriber Distribution */}
      <motion.section variants={itemVariants} className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-slate-800 dark:text-slate-100">
            Business Growth & Analytics
          </h2>
        </div>
        <DashboardAnalytics />
      </motion.section>

      {/* SECTION 3: Admin Intelligence, Operations, & Actions Queue */}
      <motion.section variants={itemVariants} className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-slate-800 dark:text-slate-100">
            Operations Center & Action Queue
          </h2>
        </div>
        <DashboardIntelligence />
      </motion.section>

    </motion.div>
  );
}
