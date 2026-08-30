"use client";

import { motion } from "framer-motion";

import ExamPrepSimulation from "./simulations/ExamPrepSimulation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

export default function BentoGrid() {
  return (
    <section id="tools" className="pt-16 sm:pt-20 lg:pt-24 pb-10 lg:pb-14 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-[rgba(90,200,176,0.08)] border border-teal-200/60 dark:border-[rgba(90,200,176,0.18)] text-teal-700 dark:text-[#5AC8B0] text-xs font-semibold mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              GP EXAM PREPARATION
            </span>
            <h2 className="font-sans text-3xl lg:text-[2.5rem] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-[-0.02em]">
              Everything a GP needs
            </h2>
          </div>
        </motion.div>

        {/* Full-Width Feature Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="w-full"
        >
          <ExamPrepSimulation />
        </motion.div>
      </div>
    </section>
  );
}
