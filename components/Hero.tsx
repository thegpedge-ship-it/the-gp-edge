"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Count-up hook using framer-motion animate
function useCountUp(target: number, duration: number = 2.2, delay: number = 0.5) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current as HTMLElement);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timeout = setTimeout(() => {
      const controls = animate(0, target, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [started, target, duration, delay]);

  return { display, ref };
}

interface StatConfig {
  rawValue: number;
  suffix: string;
  label: string;
  variant: "default" | "teal" | "dark";
  delay: number;
  iconType: "filetext" | "pill" | "zap" | "stethoscope";
}

const stats: StatConfig[] = [
  { rawValue: 4800, suffix: "+", label: "Questions", variant: "default", delay: 0.0, iconType: "filetext" },
  { rawValue: 180, suffix: "+", label: "MBS Items", variant: "teal", delay: 0.1, iconType: "pill" },
  { rawValue: 2600, suffix: "+", label: "Autofills", variant: "dark", delay: 0.2, iconType: "zap" },
  { rawValue: 300, suffix: "+", label: "Conditions", variant: "default", delay: 0.3, iconType: "stethoscope" },
];

// Icon component mapping
const StatIcon = ({ type, variant }: { type: StatConfig["iconType"]; variant: StatConfig["variant"] }) => {
  const isTeal = variant === "teal";
  const isDark = variant === "dark";

  let src = "";
  let alt = "";

  switch (type) {
    case "filetext":
      src = "/assets/hero_questions.png";
      alt = "Questions";
      break;
    case "pill":
      src = "/assets/hero_mbs.png";
      alt = "MBS Items";
      break;
    case "zap":
      src = "/assets/hero_autofills.png";
      alt = "Autofills";
      break;
    case "stethoscope":
      src = "/assets/hero_conditions.png";
      alt = "Conditions";
      break;
  }

  const imgClass = isTeal
    ? "w-6 h-6 object-contain invert mix-blend-screen brightness-200"
    : isDark
      ? "w-6 h-6 object-contain invert mix-blend-screen contrast-125"
      : "w-6 h-6 object-contain mix-blend-multiply";

  return <img src={src} alt={alt} className={imgClass} />;
};

function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
  const { display, ref } = useCountUp(stat.rawValue, 2.0, 0.4 + stat.delay);

  const displayStr = display >= 1000
    ? `${Math.floor(display / 1000)},${String(display % 1000).padStart(3, "0")}${stat.suffix}`
    : `${display}${stat.suffix}`;

  const isTeal = stat.variant === "teal";
  const isDark = stat.variant === "dark";
  const isDefault = stat.variant === "default";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.4 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden ${isTeal
        ? "bg-gradient-to-br from-teal-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/30 border border-teal-400/30"
        : isDark
          ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white border border-slate-700/80 shadow-xl shadow-slate-900/30"
          : "bg-white text-slate-900 border border-slate-200/80 shadow-md shadow-slate-200/60 hover:shadow-lg hover:border-teal-200"
        }`}
    >
      {/* Inner shimmer gradient overlay */}
      {isTeal && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none rounded-2xl" />
      )}
      {isDark && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:12px_12px] rounded-2xl" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl" />
        </>
      )}
      {isDefault && (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-teal-50/0 group-hover:from-teal-50/60 group-hover:to-emerald-50/30 transition-all duration-400 pointer-events-none rounded-2xl" />
      )}

      <div className="relative z-10">
        {/* Icon badge - refined circular container */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
          isTeal 
            ? "bg-white/20" 
            : isDark 
              ? "bg-slate-700/80 border border-slate-600" 
              : "bg-slate-50 border border-slate-100 shadow-sm"
          }`}>
          <StatIcon type={stat.iconType} variant={stat.variant} />
        </div>

        {/* Count-up number */}
        <div
          ref={ref}
          className={`font-sans text-[2rem] lg:text-[2.25rem] font-bold tracking-tight leading-none mb-1 tabular-nums ${isDefault ? "text-slate-900" : "text-white"
            }`}
        >
          {displayStr}
        </div>

        <div className={`text-xs font-semibold uppercase tracking-wider ${isTeal ? "text-teal-100" : isDark ? "text-slate-400" : "text-slate-500"
          }`}>
          {stat.label}
        </div>

        {/* Accent bars */}
        <div className="mt-4 flex items-center gap-1.5">
          <div className={`h-1 rounded-full transition-all duration-500 group-hover:w-10 w-8 ${isTeal ? "bg-white/50" : isDark ? "bg-teal-400" : "bg-teal-400"
            }`} />
          <div className={`h-1 rounded-full w-4 ${isTeal ? "bg-white/25" : isDark ? "bg-teal-400/40" : "bg-teal-200"
            }`} />
          <div className={`h-1 rounded-full w-2 ${isTeal ? "bg-white/15" : isDark ? "bg-teal-400/20" : "bg-teal-100"
            }`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative flex items-center overflow-hidden pb-8 lg:pb-10">
      {/* Premium ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]" />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60" />

      {/* Soft gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[200px] right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-teal-200/40 via-emerald-100/30 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/60 to-teal-100/40 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-40 lg:pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-[1fr,420px] gap-12 lg:gap-20 items-center"
        >
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Eyebrow Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/80 border border-teal-200/50 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Built for GP Registrars
              </span>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-sans text-[2.75rem] sm:text-[3.25rem] lg:text-[4rem] font-bold text-slate-900 leading-[1.05] tracking-[-0.03em] mb-6"
            >
              Study smarter.{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                  Pass with confidence.
                </span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-slate-600 max-w-xl mb-10 leading-[1.65] tracking-[-0.01em]"
            >
              <span className="font-medium text-teal-600">Adaptive mock exams</span>, interactive{" "}
              <span className="font-medium text-teal-600">MBS billing tools</span>, and real-world{" "}
              <span className="font-medium text-teal-600">clinical templates</span>—everything you need to ace the AKT and KFP.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6">
              <a
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 text-white px-8 py-4 rounded-full hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 w-full sm:w-auto"
              >
                Start for free
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#tools"
                className="inline-flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-900 px-6 py-4 rounded-full hover:bg-slate-100 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
              >
                Explore tools
              </a>
            </motion.div>

            {/* Micro-copy */}
            <motion.p variants={itemVariants} className="text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free to start. No credit card required.
            </motion.p>
          </div>

          {/* Right Column - Dashboard Snapshot Stats Widget */}
          <motion.div variants={itemVariants} className="relative">
            {/* Container panel - premium glassmorphic Apple-style */}
            <div className="relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white shadow-2xl ring-1 ring-slate-900/5">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/80 via-transparent to-teal-50/30 pointer-events-none" />

              {/* Ghosted logo - top left corner branding */}
              <div className="absolute top-4 left-4 w-5 h-5 z-10">
                <Image
                  src="/assets/logo.jpeg"
                  alt="The GP Edge"
                  fill
                  className="rounded-[6px] object-cover opacity-40 grayscale"
                  priority
                />
              </div>

              {/* Dashboard header */}
              <div className="relative flex items-center justify-between mb-4 pl-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Snapshot</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                  </span>
                  Live
                </span>
              </div>

              {/* Stats Grid */}
              <div className="relative grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <StatCard key={stat.label} stat={stat} index={index} />
                ))}
              </div>

              {/* Bottom label */}
              <div className="relative mt-4 pt-4 border-t border-slate-200/40 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Updated in real-time</span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  All systems active
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
