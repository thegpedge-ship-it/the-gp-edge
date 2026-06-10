"use client";

import { motion } from "framer-motion";
import { SubjectMenu, SidePanel } from "@/components/exam-prep";

export default function ExamPrepPage() {
  return (
    <div className="relative -mt-2 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>

      {/* ─── Main Content (70-30 split) — fills remaining height ──────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 mt-[15px]"
      >
        {/* ── 70% Left — Subject Menu ─────────────────────────────── */}
        <div className="lg:w-[70%] glass dark:glass-strong rounded-2xl p-4 sm:p-5 pl-2 sm:pl-3 border border-slate-200/50 dark:border-slate-700/40 shadow-lg flex flex-col">
          <SubjectMenu />
        </div>

        {/* ── 30% Right — Side Panel ─────────────────────────────── */}
        <div className="lg:w-[30%] flex flex-col overflow-y-auto scrollbar-hide min-h-0">
          <SidePanel />
        </div>
      </motion.div>
    </div>
  );
}
