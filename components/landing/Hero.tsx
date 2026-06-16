"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";

// Scroll-aware logo — only visible at top of the hero section
function HeroCornerLogo() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY < 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed top-4 left-4 z-40 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <Image
        src="/assets/logo.png"
        alt="The GP Edge"
        width={64}
        height={64}
        className="h-16 w-16 object-contain rounded-2xl"
        priority
      />
    </div>
  );
}

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
function useCountUp(target: number, duration: number = 1.5, delay: number = 0.3) {
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
      { threshold: 0.2 }
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
}

const stats: StatConfig[] = [
  { rawValue: 4800, suffix: "+", label: "Questions", variant: "default", delay: 0.0 },
  { rawValue: 180, suffix: "+", label: "MBS Items", variant: "teal", delay: 0.1 },
  { rawValue: 2600, suffix: "+", label: "Autofills", variant: "dark", delay: 0.2 },
  { rawValue: 300, suffix: "+", label: "Conditions", variant: "default", delay: 0.3 },
];

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
          ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white border border-slate-700/80 shadow-xl shadow-slate-900/30 dark:from-[#0F1115] dark:via-[#151922] dark:to-[#0F1115] dark:border-[rgba(255,255,255,0.08)]"
          : "bg-white dark:bg-[#1B212C] text-slate-900 dark:text-[#F5F7FA] border border-slate-200/80 dark:border-[rgba(255,255,255,0.05)] shadow-md shadow-slate-200/60 dark:shadow-none hover:shadow-lg hover:border-teal-200 dark:hover:border-[rgba(255,255,255,0.1)]"
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

        {/* Count-up number */}
        <div
          ref={ref}
          className={`font-sans text-3xl md:text-4xl font-bold tracking-tighter leading-none mb-1 tabular-nums ${isDefault ? "text-slate-900" : "text-white"
            }`}
        >
          {displayStr}
        </div>

        <div className={`font-sans text-xs sm:text-sm font-semibold uppercase tracking-wide ${isTeal ? "text-teal-100" : isDark ? "text-slate-400" : "text-slate-500"
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
  const { isSignedIn } = useAuth();

  return (
    <section className="relative flex items-center overflow-hidden min-h-screen pb-8 lg:pb-10">
      {/* Logo pinned to top-left, only visible before scroll */}
      <HeroCornerLogo />

      {/* ── Light mode: soft teal radial glow at top ── */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]" />

      {/* ── Dark mode: calm radial gradient, no busy patterns ── */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `radial-gradient(
            circle at center,
            rgba(90,200,176,0.08) 0%,
            rgba(90,200,176,0.03) 35%,
            transparent 70%
          ), #0F1115`,
        }}
      />

      {/* Light mode: dot grid overlay (hidden in dark) */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226,232,240)_1px,transparent_0)] bg-[size:24px_24px] opacity-60" />

      {/* Light mode: soft gradient orbs (hidden in dark) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:hidden">
        <div className="absolute -top-[200px] right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-teal-200/40 via-emerald-100/30 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/60 to-teal-100/40 rounded-full blur-[80px]" />
      </div>

      <div className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20 ${
        isSignedIn ? "pt-6 sm:pt-8 lg:pt-10" : "pt-20 sm:pt-24 lg:pt-28"
      }`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-[1fr,420px] gap-12 lg:gap-20 items-center"
        >
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Eyebrow Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/80 dark:bg-[rgba(90,200,176,0.08)] border border-teal-200/50 dark:border-[rgba(90,200,176,0.18)] mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-xs font-semibold text-teal-700 dark:text-[#5AC8B0] uppercase tracking-wider">
                Built for GP Registrars
              </span>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-[#F5F7FA] mb-6"
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
              className="font-sans text-lg md:text-xl font-normal leading-relaxed text-slate-600 dark:text-[#A8B1BD] max-w-xl mb-10"
            >
              <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">Adaptive mock exams</span>, interactive{" "}
              <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">MBS billing tools</span>, and real-world{" "}
              <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">clinical templates</span>—everything you need to ace the AKT and KFP.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6">
              <style>{`
                .btn-start-free-new {
                  position: relative;
                  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                  box-shadow: 0px 10px 20px rgba(20, 184, 166, 0.2);
                  padding: 0.9rem 1.75rem;
                  background-color: #0d9488;
                  border-radius: 9999px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  color: #ffffff;
                  gap: 8px;
                  font-weight: 700;
                  border: 3px solid rgba(255, 255, 255, 0.3);
                  outline: none;
                  overflow: hidden;
                  font-size: 16px;
                  width: 100%;
                }
                .dark .btn-start-free-new {
                  box-shadow: 0px 10px 20px rgba(90, 200, 176, 0.15);
                  border-color: rgba(90, 200, 176, 0.2);
                }
                @media (min-width: 640px) { .btn-start-free-new { width: auto; } }

                .btn-start-free-icon {
                  width: 20px;
                  height: 20px;
                  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .btn-start-free-new:hover {
                  transform: scale(1.03);
                  border-color: rgba(255, 255, 255, 0.6);
                  box-shadow: 0px 12px 24px rgba(20, 184, 166, 0.3);
                }
                .dark .btn-start-free-new:hover {
                  border-color: rgba(90, 200, 176, 0.4);
                }

                .btn-start-free-new:hover .btn-start-free-icon {
                  transform: translateX(4px);
                }

                .btn-start-free-new:hover::before {
                  animation: start-free-shine 1.5s ease-out infinite;
                }

                .btn-start-free-new::before {
                  content: "";
                  position: absolute;
                  width: 100px;
                  height: 100%;
                  background-image: linear-gradient(
                     120deg,
                     rgba(255, 255, 255, 0) 30%,
                     rgba(255, 255, 255, 0.8),
                     rgba(255, 255, 255, 0) 70%
                  );
                  top: 0;
                  left: -100px;
                  opacity: 0.6;
                }

                @keyframes start-free-shine {
                  0% { left: -100px; }
                  60% { left: 100%; }
                  to { left: 100%; }
                }
                .btn-explore {
                  align-items: center;
                  background-color: #FFFFFF;
                  border: 1px solid rgba(0, 0, 0, 0.1);
                  border-radius: 9999px;
                  box-shadow: rgba(0, 0, 0, 0.02) 0 1px 3px 0;
                  box-sizing: border-box;
                  color: rgba(0, 0, 0, 0.85);
                  cursor: pointer;
                  display: inline-flex;
                  font-size: 16px;
                  font-weight: 600;
                  justify-content: center;
                  padding: 1rem 1.75rem;
                  text-decoration: none;
                  transition: all 250ms;
                  width: 100%;
                }
                @media (min-width: 640px) { .btn-explore { width: auto; } }
                .btn-explore:hover, .btn-explore:focus {
                  border-color: rgba(0, 0, 0, 0.15);
                  box-shadow: rgba(0, 0, 0, 0.1) 0 4px 12px;
                  color: rgba(0, 0, 0, 0.65);
                }
                .btn-explore:hover { transform: translateY(-1px); }
                .btn-explore:active {
                  background-color: #F0F0F1;
                  border-color: rgba(0, 0, 0, 0.15);
                  box-shadow: rgba(0, 0, 0, 0.06) 0 2px 4px;
                  color: rgba(0, 0, 0, 0.65);
                  transform: translateY(0);
                }
              `}</style>
              <a
                href="/signup"
                className="btn-start-free-new"
              >
                Start for free
                <svg fill="currentColor" viewBox="0 0 24 24" className="btn-start-free-icon">
                  <path clipRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" fillRule="evenodd" />
                </svg>
              </a>
              <a
                href="#tools"
                className="btn-explore"
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
            <div className="relative p-6 rounded-[2rem] bg-white/60 dark:bg-[rgba(21,25,34,0.6)] backdrop-blur-xl border border-white dark:border-[rgba(255,255,255,0.08)] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-slate-900/5 dark:ring-white/5">
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/80 via-transparent to-teal-50/30 dark:from-[rgba(255,255,255,0.05)] dark:to-transparent pointer-events-none" />

              {/* Dashboard header */}
              <div className="relative flex items-center justify-between mb-4 pl-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Snapshot</span>
              </div>

              {/* Stats Grid */}
              <div className="relative grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <StatCard key={stat.label} stat={stat} index={index} />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
