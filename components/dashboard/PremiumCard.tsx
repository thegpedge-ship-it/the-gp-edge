"use client";

import { motion } from "framer-motion";
import { subscription } from "./data";

export default function PremiumCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 text-white p-6 shadow-xl"
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/30">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" />
            </svg>
            {subscription.plan}
          </span>
        </div>

        <h3 className="font-serif text-xl mb-1">All features unlocked</h3>
        <p className="text-xs text-slate-300 mb-4">Renews {subscription.renewsOn}</p>

        <ul className="space-y-1.5 mb-5">
          {subscription.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-slate-200">
              <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-white hover:bg-white/15 transition"
        >
          Manage subscription
        </button>
      </div>
    </motion.div>
  );
}
