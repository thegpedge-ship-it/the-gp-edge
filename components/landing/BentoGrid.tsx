"use client";

import { motion } from "framer-motion";

import ExamPrepSimulation from "./simulations/ExamPrepSimulation";
import MbsBillingSimulation from "./simulations/MbsBillingSimulation";
import ClinicalAutofillsSimulation from "./simulations/ClinicalAutofillsSimulation";
import MedicalDirectorySimulation from "./simulations/MedicalDirectorySimulation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

export default function BentoGrid() {
  return (
    <section id="tools" className="pt-6 pb-10 lg:pt-8 lg:pb-14 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-[#5AC8B0] mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Four Core Tools
            </span>
            <h2 className="font-sans text-3xl lg:text-[2.5rem] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-[-0.02em]">
              Everything a registrar needs
            </h2>
          </div>
          <a href="#all-tools" className="text-sm font-medium text-slate-500 dark:text-[#7D8795] hover:text-teal-600 dark:hover:text-[#5AC8B0] active:scale-[0.98] transition-all flex items-center gap-1.5 group">
            View all
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>

        {/* Premium Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-12 gap-4 lg:gap-5"
        >
          {/* Card 1: Exam Prep - Large Feature Card */}
          <ExamPrepSimulation />

          {/* Card 2: Bill Better - Interactive MBS Search */}
          <MbsBillingSimulation />

          {/* Card 3: Autofills with Interactive Copy Animation */}
          <ClinicalAutofillsSimulation />

          {/* Card 4: Medical Directory */}
          <MedicalDirectorySimulation />
        </motion.div>
      </div>
    </section>
  );
}
