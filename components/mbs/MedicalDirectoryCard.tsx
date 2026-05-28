"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const conditionTags = [
  { name: "Diabetes", icon: "🩸" },
  { name: "HTN", icon: "❤️" },
  { name: "Asthma", icon: "🫁" },
  { name: "GORD", icon: "🔥" },
  { name: "Osteoarthritis", icon: "🦴" },
  { name: "Depression", icon: "🧠" },
  { name: "Melanoma", icon: "🌿" },
  { name: "Heart Failure", icon: "💓" },
  { name: "COPD", icon: "💨" },
  { name: "UTI", icon: "💧" },
  { name: "Migraine", icon: "⚡" },
  { name: "Hypothyroidism", icon: "🔬" },
];

const carouselCycles = [
  [
    { name: "Type 2 Diabetes", category: "Endocrine" },
    { name: "Hypertension", category: "Cardiovascular" },
    { name: "Asthma", category: "Respiratory" },
  ],
  [
    { name: "Hypothyroidism", category: "Endocrine" },
    { name: "Atrial Fibrillation", category: "Cardiovascular" },
    { name: "Sleep Apnea", category: "Respiratory" },
  ],
  [
    { name: "Osteoporosis", category: "Musculoskeletal" },
    { name: "Bipolar Disorder", category: "Mental Health" },
    { name: "Rosacea", category: "Dermatology" },
  ],
];

const categoryColors: Record<string, string> = {
  Endocrine: "bg-amber-100 text-amber-700 border-amber-200",
  Cardiovascular: "bg-rose-100 text-rose-700 border-rose-200",
  Respiratory: "bg-sky-100 text-sky-700 border-sky-200",
  Musculoskeletal: "bg-orange-100 text-orange-700 border-orange-200",
  "Mental Health": "bg-purple-100 text-purple-700 border-purple-200",
  Dermatology: "bg-pink-100 text-pink-700 border-pink-200",
};

const categoryIcons: Record<string, string> = {
  Endocrine: "🧬",
  Cardiovascular: "❤️",
  Respiratory: "🫁",
  Musculoskeletal: "🦴",
  "Mental Health": "🧠",
  Dermatology: "✨",
};

export default function MedicalDirectoryCard() {
  const [currentCycle, setCurrentCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCycle((prev) => (prev + 1) % carouselCycles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="col-span-12 lg:col-span-7 relative bg-white rounded-3xl p-5 lg:p-6 overflow-hidden cursor-pointer border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300 active:scale-[0.99] transition-all duration-300"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left side - Content and Carousel */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Free tier
            </span>
          </div>

          <h3 className="font-sans text-xl lg:text-2xl font-bold text-slate-900 mb-2 tracking-[-0.01em]">
            Medical Directory
          </h3>

          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            <span className="font-medium text-teal-600">300+ conditions</span> catalogued. Browse, search, and revise on the go.
          </p>

          {/* Search bar and carousel */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            {/* Search input */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-9 bg-white rounded-lg flex items-center px-3 border border-slate-200/80 shadow-sm">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="ml-2 text-sm text-slate-400">Search conditions...</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>

            {/* Looping carousel */}
            <div className="relative h-[120px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCycle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, position: "absolute", width: "100%" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2"
                >
                  {carouselCycles[currentCycle].map((condition, i) => (
                    <motion.div
                      key={condition.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{categoryIcons[condition.category]}</span>
                        <span className="text-sm font-medium text-slate-700">{condition.name}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${categoryColors[condition.category]}`}>
                        {condition.category}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {carouselCycles.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentCycle ? "w-4 bg-teal-500" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Staggered condition tags */}
        <div className="lg:w-[220px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Browse by Condition
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
            {conditionTags.map((tag, i) => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                whileHover={{ scale: 1.05 }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md hover:border-teal-300 active:scale-[0.96] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-sm">{tag.icon}</span>
                <span className="text-[11px] font-medium">{tag.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
