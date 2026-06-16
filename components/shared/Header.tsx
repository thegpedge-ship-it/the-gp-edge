"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useAuth } from "@clerk/nextjs";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomePage = pathname === "/";
  const showNavbarLogo = !isHomePage || isScrolled;

  if (!mounted) {
    return null;
  }

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
      ? "w-[80%] mx-auto bg-white/85 dark:bg-[rgba(21,25,34,0.85)] backdrop-blur-[20px] border border-white/50 dark:border-[rgba(255,255,255,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.30)] rounded-2xl px-8 py-4 flex items-center justify-between"
      : `w-[95%] max-w-5xl mx-auto bg-white/85 dark:bg-[rgba(21,25,34,0.85)] backdrop-blur-[20px] border border-white/50 dark:border-[rgba(255,255,255,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.30)] rounded-2xl px-8 ${
          showNavbarLogo ? "py-4" : "py-2.5"
        } flex items-center justify-between transition-all duration-500 ease-in-out`;

  return (
    <header className={outerClass}>
      <div className={innerClass}>
        {/* Logo */}
        <Link href="/" className="relative group flex items-center">
          {showNavbarLogo ? (
            <div className="transition-all duration-500 opacity-100 max-w-[200px] overflow-hidden">
              <Logo size="sm" />
            </div>
          ) : (
            <div className="transition-all duration-500 opacity-100 flex items-baseline whitespace-nowrap">
              <span className="font-light text-slate-500 dark:text-[#A8B1BD]">The</span>
              <span className="font-extrabold text-slate-900 dark:text-[#F5F7FA] tracking-tight ml-1">GP</span>
              <span className="font-medium text-slate-700 dark:text-[#A8B1BD] ml-1">Edge</span>
            </div>
          )}
          <span className="absolute top-full mt-4 left-0 w-max px-3 py-1.5 bg-slate-800 text-slate-50 text-xs font-medium rounded-lg shadow-lg opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 z-50">
            Return to Landing Page
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 transition-all duration-500">
          <Link
            href="/exam-prep"
            className="text-[15px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-300 to-teal-600 bg-[length:200%_auto] animate-gradient-x hover:scale-105 transition-transform duration-300"
          >
            Exam Prep
          </Link>

          <Link
            href="/dashboard/medical-library"
            className="text-[14px] font-medium text-slate-500 dark:text-[#A8B1BD] hover:text-slate-900 dark:hover:text-[#F5F7FA] transition-colors duration-200"
          >
            Medical Library
          </Link>
          <Link
            href="/dashboard/clinical-autofills"
            className="text-[14px] font-medium text-slate-500 dark:text-[#A8B1BD] hover:text-slate-900 dark:hover:text-[#F5F7FA] transition-colors duration-200"
          >
            Clinical Autofills
          </Link>
          <Link
            href="/dashboard/billing"
            className="text-[14px] font-medium text-slate-500 dark:text-[#A8B1BD] hover:text-slate-900 dark:hover:text-[#F5F7FA] transition-colors duration-200"
          >
            MBS Billing
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 dark:text-[#A8B1BD] hover:text-slate-900 dark:hover:text-[#F5F7FA] transition-colors">
              Log in
            </Link>
            <Link href="/sign-up" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Sign up
            </Link>
          </SignedOut>

          <SignedIn>
            <SignOutButton>
              <button className="text-sm font-medium text-slate-600 dark:text-[#A8B1BD] hover:text-slate-900 dark:hover:text-[#F5F7FA] transition-colors">
                Log out
              </button>
            </SignOutButton>
            <Link
              href="/dashboard"
              className={`btn-dashboard-new ${pathname === '/' ? 'interactive' : ''}`}
            >
              <span className="btn-dashboard-span">Dashboard</span>
            </Link>
          </SignedIn>

          <style>{`
            .btn-dashboard-new {
              background: #0d9488;
              color: #ffffff;
              position: relative;
              border: 2px solid rgba(255, 255, 255, 0.3);
              padding: 6px 18px;
              display: inline-flex;
              align-items: center;
              font-size: 13px;
              font-weight: 600;
              border-radius: 9999px;
              cursor: pointer;
              transition: 0.4s cubic-bezier(0.22, 1, 0.36, 1);
              box-shadow: 0px 8px 16px rgba(20, 184, 166, 0.2);
            }
            .dark .btn-dashboard-new {
              border-color: rgba(90,200,176,0.3);
            }
            .btn-dashboard-span {
              display: inline-block;
              transition: 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .btn-dashboard-new.interactive:hover {
              font-size: 14px;
              transform: skew(-2deg);
              padding-right: 32px;
            }
            .btn-dashboard-new::before {
              content: "";
              box-sizing: border-box;
              position: absolute;
              top: 50%;
              left: 70%;
              width: 14px;
              height: 14px;
              margin-top: -7px;
              margin-left: -5px;
              border-radius: 50%;
              border: 2px solid rgba(255,255,255,0.4);
              border-top-color: #ffffff;
              opacity: 0;
              animation: spinner 0.6s linear infinite;
              transition: 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            }
            .btn-dashboard-new.interactive:hover::before {
              opacity: 1;
              left: calc(100% - 24px);
            }
            @keyframes spinner {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
});

export default Header;
