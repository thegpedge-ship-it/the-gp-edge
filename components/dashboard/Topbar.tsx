"use client";

import { motion } from "framer-motion";
import { greeting } from "./data";

export default function Topbar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-900/20 dark:via-slate-800/40 dark:to-teal-900/20 border border-emerald-100/60 dark:border-emerald-800/40 p-8 lg:p-10 mb-6"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-16 right-1/3 w-64 h-64 rounded-full bg-emerald-200/40 dark:bg-emerald-700/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-teal-200/30 dark:bg-teal-700/15 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0 max-w-xl">
          <p className="inline-flex items-center gap-2 text-[14px] text-slate-600 dark:text-slate-300 font-medium mb-1">
            <span className="text-xl">{greeting.emoji}</span>
            {greeting.salutation}
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            {greeting.title}{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              {greeting.highlight}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {greeting.subtext}
          </p>
        </div>

        {/* Decorative illustration area */}
        <div className="hidden md:block relative w-72 h-40 flex-shrink-0">
          <Sparkles />
          <Stethoscope />
          <Laptop />
          <Plant />
          <CoffeeCup />
        </div>
      </div>
    </motion.section>
  );
}

function Sparkles() {
  const pts = [
    { x: 10, y: 18, s: 10, delay: 0 },
    { x: 60, y: 8, s: 7, delay: 0.2 },
    { x: 250, y: 22, s: 8, delay: 0.4 },
    { x: 220, y: 90, s: 9, delay: 0.1 },
    { x: 110, y: 130, s: 6, delay: 0.3 },
    { x: 30, y: 110, s: 8, delay: 0.5 },
    { x: 270, y: 140, s: 10, delay: 0.25 },
    { x: 180, y: 5, s: 6, delay: 0.45 },
  ];
  return (
    <svg viewBox="0 0 288 160" className="absolute inset-0 w-full h-full">
      {pts.map((p, i) => (
        <motion.path
          key={i}
          d={`M${p.x} ${p.y - p.s} L${p.x + p.s * 0.25} ${p.y - p.s * 0.25} L${p.x + p.s} ${p.y} L${p.x + p.s * 0.25} ${p.y + p.s * 0.25} L${p.x} ${p.y + p.s} L${p.x - p.s * 0.25} ${p.y + p.s * 0.25} L${p.x - p.s} ${p.y} L${p.x - p.s * 0.25} ${p.y - p.s * 0.25} Z`}
          fill={i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#14b8a6" : "#a78bfa"}
          opacity={0.85}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.85 }}
          transition={{ duration: 0.5, delay: 0.3 + p.delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}
    </svg>
  );
}

function Laptop() {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      viewBox="0 0 120 90"
      className="absolute top-6 right-8 w-32 h-24"
    >
      <rect x="14" y="20" width="92" height="56" rx="6" fill="#0f766e" />
      <rect x="20" y="26" width="80" height="44" rx="3" fill="#134e4a" />
      <rect x="8" y="74" width="104" height="6" rx="3" fill="#0d9488" />
      <path
        d="M30 50 L45 50 L48 40 L52 60 L56 35 L60 50 L80 50"
        stroke="#5eead4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="86" cy="44" r="4" fill="#f43f5e" opacity="0.85" />
    </motion.svg>
  );
}

function Stethoscope() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="absolute top-2 left-2 w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-white shadow-md flex items-center justify-center"
    >
      <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.5 3v8a4 4 0 008 0V3M6 21a3 3 0 003-3v-2m6-3a3 3 0 013 3v3a3 3 0 11-6 0" />
        <circle cx="18" cy="9" r="2" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

function Plant() {
  return (
    <motion.svg
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      viewBox="0 0 40 50"
      className="absolute bottom-2 right-2 w-10 h-14"
    >
      <ellipse cx="20" cy="42" rx="14" ry="4" fill="#a16207" opacity="0.3" />
      <path d="M14 42 L13 30 L27 30 L26 42 Z" fill="#92400e" />
      <path d="M20 30 Q14 22 10 14 Q15 18 20 22 Q25 18 30 14 Q26 22 20 30 Z" fill="#10b981" />
      <path d="M20 24 Q17 18 14 12 Q18 14 20 18 Q22 14 26 12 Q23 18 20 24 Z" fill="#34d399" />
    </motion.svg>
  );
}

function CoffeeCup() {
  return (
    <motion.svg
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      viewBox="0 0 40 40"
      className="absolute bottom-4 left-12 w-8 h-8"
    >
      <path d="M8 14 L8 30 Q8 34 12 34 L24 34 Q28 34 28 30 L28 14 Z" fill="#f5f5f4" stroke="#78716c" strokeWidth="1.2" />
      <path d="M28 18 Q34 18 34 23 Q34 28 28 28" fill="none" stroke="#78716c" strokeWidth="1.2" />
      <path d="M14 10 Q15 7 14 4" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M20 10 Q21 7 20 4" stroke="#9ca3af" strokeWidth="1" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}
