"use client";

import { motion, useAnimate } from "framer-motion";
import { useEffect, useState } from "react";

export default function ClinicalAutofillsCard() {
  const [scope, animate] = useAnimate();
  const [isCopied, setIsCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const runAnimation = async () => {
      // Reset states
      setIsCopied(false);
      setShowToast(false);

      // 0.0s - 1.0s: Cursor glides in from off-screen to hover over button
      await animate(
        "#cursor",
        { x: ["-60px", "0px"], y: ["40px", "0px"], opacity: [0, 1] },
        { duration: 1.0, ease: [0.22, 1, 0.36, 1] }
      );

      // 1.0s - 1.2s: Click effect - cursor scales down
      await animate(
        "#cursor",
        { scale: [1, 0.85, 1] },
        { duration: 0.2, ease: "easeInOut" }
      );

      // Trigger copied state and toast
      setIsCopied(true);
      setShowToast(true);

      // 1.3s - 3.0s: Hold success state
      await new Promise((resolve) => setTimeout(resolve, 1700));

      // 3.0s - 3.5s: Cursor glides away, toast fades out
      animate(
        "#cursor",
        { x: ["0px", "80px"], y: ["0px", "-30px"], opacity: [1, 0] },
        { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      );

      setShowToast(false);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset button
      setIsCopied(false);

      // 2 second delay before loop repeats
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Restart the loop
      runAnimation();
    };

    const timeout = setTimeout(runAnimation, 1000);
    return () => clearTimeout(timeout);
  }, [animate]);

  return (
    <motion.div
      ref={scope}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
      className="col-span-12 sm:col-span-6 lg:col-span-5 relative bg-white rounded-3xl p-5 lg:p-6 overflow-hidden cursor-pointer border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300 active:scale-[0.99] transition-all duration-300"
    >
      {/* Decorative gradient */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-transparent rounded-full" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Free tier
          </span>
        </div>

        <h3 className="font-sans text-xl lg:text-2xl font-bold text-slate-900 mb-2 tracking-[-0.01em]">
          Clinical Autofills
        </h3>

        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          <span className="font-medium text-teal-600">Copy-paste templates</span> for common GP presentations. Consult better, miss less.
        </p>

        {/* Mock editor box */}
        <div className="relative bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
          {/* Editor header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <img
                  src="/assets/clinical_autofill_icon.png"
                  alt="URTI Template"
                  className="w-7 h-7 object-contain mix-blend-multiply"
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">URTI Template</span>
            </div>

            {/* Copy button with cursor */}
            <div className="relative">
              <motion.button
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isCopied
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-teal-500 text-white shadow-md shadow-teal-500/25 hover:bg-teal-600"
                }`}
              >
                {isCopied ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  "Copy"
                )}
              </motion.button>

              {/* Mac-style cursor */}
              <motion.div
                id="cursor"
                initial={{ opacity: 0, x: "-60px", y: "40px" }}
                className="absolute -bottom-2 -right-2 pointer-events-none z-20"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87a.5.5 0 00.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
                    fill="#1e293b"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Editor content - faded template lines */}
          <div className="space-y-3 font-mono">
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">1</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">Hx:</span>
                <span className="text-xs text-slate-400 ml-1.5">Sore throat x 3 days, no fever, no cough...</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">2</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">O/E:</span>
                <span className="text-xs text-slate-400 ml-1.5">Pharynx erythematous, no exudate...</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-slate-400 w-4 pt-0.5 select-none">3</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-teal-600">Plan:</span>
                <span className="text-xs text-slate-400 ml-1.5">Supportive care, salt water gargles...</span>
              </div>
            </div>
          </div>

          {/* Template count */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">2,600+ templates available</span>
            <span className="text-[11px] font-medium text-teal-600 hover:text-teal-700 cursor-pointer">
              Browse all →
            </span>
          </div>

          {/* Toast notification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: showToast ? 1 : 0,
              y: showToast ? 0 : 20,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Template copied to clipboard
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
