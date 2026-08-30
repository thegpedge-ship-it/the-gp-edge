"use client";

import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const { isSignedIn } = useAuth();

  return (
    <section className={`relative flex items-center justify-center ${isSignedIn ? "min-h-[calc(100vh-96px)]" : "min-h-screen"} py-8 lg:py-12`}>
      <div
        className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isSignedIn ? "pt-2 sm:pt-4" : "pt-12 sm:pt-16"
        }`}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center text-center max-w-6xl lg:max-w-7xl mx-auto"
        >
          {/* Main Content Column */}
          <div className="text-center flex flex-col items-center justify-center max-w-5xl lg:max-w-6xl mx-auto">
            {/* Positioning Badge */}
            <motion.div variants={itemVariants} className="mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-emerald-200/80 dark:border-[rgba(90,200,176,0.3)] bg-emerald-50/90 dark:bg-[#151922] text-emerald-800 dark:text-emerald-300 font-sans text-xs md:text-sm font-semibold shadow-xs">
                <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Built for GP registrars, designed for smarter preparation.</span>
              </div>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-serif text-5xl sm:text-7xl md:text-[84px] lg:text-[96px] xl:text-[104px] font-bold leading-[1.02] tracking-tight text-slate-900 dark:text-[#F5F7FA] text-center mb-5 sm:mb-6"
            >
              Study smarter.
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Pass with confidence.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="font-sans text-lg sm:text-xl md:text-2xl font-normal leading-relaxed text-slate-600 dark:text-[#A8B1BD] max-w-4xl mx-auto mb-9 text-center"
            >
              Adaptive <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">mock exams</span>, comprehensive{" "}
              <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">AKT &amp; KFP question banks</span>, and detailed{" "}
              <span className="font-medium text-teal-600 dark:text-[#5AC8B0]">performance analytics</span> - everything you need to pass with confidence.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <style>{`
                .btn-start-free-new {
                  position: relative;
                  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                  box-shadow: 0px 10px 20px rgba(20, 184, 166, 0.2);
                  padding: 1rem 2.25rem;
                  background-color: #0d9488;
                  border-radius: 14px;
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
                  font-size: 17px;
                  width: 100%;
                  text-decoration: none;
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
                  border-radius: 14px;
                  box-shadow: rgba(0, 0, 0, 0.02) 0 1px 3px 0;
                  box-sizing: border-box;
                  color: rgba(0, 0, 0, 0.85);
                  cursor: pointer;
                  display: inline-flex;
                  font-size: 17px;
                  font-weight: 600;
                  justify-content: center;
                  padding: 1rem 2.25rem;
                  text-decoration: none;
                  transition: all 250ms;
                  width: 100%;
                }
                .dark .btn-explore {
                  background-color: #1e293b;
                  border-color: rgba(255, 255, 255, 0.08);
                  color: #f3f4f6;
                }
                @media (min-width: 640px) { .btn-explore { width: auto; } }
                .btn-explore:hover, .btn-explore:focus {
                  border-color: rgba(0, 0, 0, 0.15);
                  box-shadow: rgba(0, 0, 0, 0.1) 0 4px 12px;
                  color: rgba(0, 0, 0, 0.65);
                }
                .dark .btn-explore:hover {
                  border-color: rgba(255, 255, 255, 0.2);
                  color: #ffffff;
                  background-color: #334155;
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
              <a href="/signup" className="btn-start-free-new">
                Start for free
                <svg fill="currentColor" viewBox="0 0 24 24" className="btn-start-free-icon">
                  <path
                    clipRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                    fillRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#tools" className="btn-explore">
                Explore tools
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
