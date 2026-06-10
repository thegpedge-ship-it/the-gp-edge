"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

interface HeaderProps {
  variant?: "fixed" | "static";
}

const Header = memo(function Header({ variant = "fixed" }: HeaderProps) {
  const pathname = usePathname();

  // Hide the navbar on all admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Hide the global fixed header on pages that use DashboardShell (which has its own static header)
  if (variant === "fixed" && (pathname?.startsWith("/dashboard") || pathname?.startsWith("/exam-prep"))) {
    return null;
  }
  const outerClass =
    variant === "static"
      ? "sticky top-4 z-50 w-full bg-transparent border-none shadow-none mt-4 sm:mt-6"
      : "fixed top-6 inset-x-0 w-full z-50 bg-transparent border-none shadow-none";

  const innerClass =
    variant === "static"
      ? "w-[80%] mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-lg rounded-2xl px-8 py-4 flex items-center justify-between"
      : "w-[95%] max-w-5xl mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-lg rounded-2xl px-8 py-4 flex items-center justify-between";

  return (
    <header className={outerClass}>
      <div className={innerClass}>
        {/* Logo */}
        <Logo size="sm" />

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/exam-prep"
            className="text-[15px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-300 to-teal-600 bg-[length:200%_auto] animate-gradient-x hover:scale-105 transition-transform duration-300"
          >
            Exam Prep
          </Link>

          <a
            href="#gp-toolkit"
            className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            GP Toolkit
          </a>
          <Link
            href="/dashboard/medical-library"
            className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            Medical Library
          </Link>
          <Link
            href="/dashboard/clinical-autofills"
            className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            Clinical Autofills
          </Link>
          <Link
            href="/dashboard/billing"
            className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            MBS Billing
          </Link>
          <a
            href="#about"
            className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            About
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-full shadow-md shadow-teal-600/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
});

export default Header;
