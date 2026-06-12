"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useAuth } from "@clerk/nextjs";
import Logo from "./Logo";

// Custom reactive authentication state wrappers since SignedIn/SignedOut are removed in this Clerk version
function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}

interface HeaderProps {
  variant?: "fixed" | "static";
}

const Header = memo(function Header({ variant = "fixed" }: HeaderProps) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Hide the navbar on all admin pages and on test-taking pages (instructions + live test)
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/test/")) {
    return null;
  }

  // Hide the global fixed header if the user is signed in (as signed-in pages render the static header inside DashboardShell)
  // or on pages that explicitly use DashboardShell (e.g. /dashboard, /exam-prep).
  if (variant === "fixed" && (isSignedIn || pathname?.startsWith("/dashboard") || pathname?.startsWith("/exam-prep"))) {
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
        <Link href="/" className="relative group">
          <Logo size="sm" />
          <span className="absolute top-full mt-4 left-0 w-max px-3 py-1.5 bg-slate-800 text-slate-50 text-xs font-medium rounded-lg shadow-lg opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 z-50">
            Return to Landing Page
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/exam-prep"
            className="text-[15px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-300 to-teal-600 bg-[length:200%_auto] animate-gradient-x hover:scale-105 transition-transform duration-300"
          >
            Exam Prep
          </Link>

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
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/sign-up" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Sign up
            </Link>
          </SignedOut>

          <SignedIn>
            <SignOutButton>
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Log out
              </button>
            </SignOutButton>
            <Link href="/dashboard" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1">
              Dashboard &rarr;
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
});

export default Header;
