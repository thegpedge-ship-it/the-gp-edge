"use client";

import { motion } from "framer-motion";
import Logo from "./Logo";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 inset-x-0 mx-auto w-[95%] max-w-5xl z-50 bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl px-8 py-4 flex items-center justify-between"
    >
      {/* Logo */}
      <Logo size="sm" />

      {/* Navigation - Standard links + VIP Exam Prep */}
      <nav className="hidden md:flex items-center gap-6">
        {/* Standard Links - Subtle & Clean */}
        <a
          href="#tools"
          className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
        >
          Tools
        </a>
        
        {/* VIP Exam Prep Highlight - Animated Gradient */}
        <a
          href="#exam-prep"
          className="text-[15px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-300 to-teal-600 bg-[length:200%_auto] animate-gradient-x hover:scale-105 transition-transform duration-300"
        >
          Exam Prep
        </a>
        
        {/* Standard Links - Subtle & Clean */}
        <a
          href="#billing"
          className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
        >
          Billing
        </a>
        <a
          href="#about"
          className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
        >
          About
        </a>
      </nav>

      {/* CTA Buttons */}
      <div className="flex items-center gap-4">
        <a
          href="/login"
          className="hidden sm:inline-flex text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
        >
          Log in
        </a>
        <a
          href="/signup"
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-full shadow-md shadow-teal-600/20 transition-all duration-200 hover:-translate-y-0.5"
        >
          Get started
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </motion.header>
  );
}
