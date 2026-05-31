"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, ChevronRight } from "lucide-react";
import { user, badges } from "./data";

// ─── Sticky sidebar constants ───────────────────────────────────────────────────
// Header clearance (sticky top-4, ~80px) + a small breathing gap.
const TOP_SPACING = 96;
const BOTTOM_SPACING = 24;

/**
 * Scroll-direction-aware sticky sidebar (Twitter/Trello behaviour):
 * both columns scroll together; sidebar pins at whichever end it reaches —
 * top when scrolling up, bottom when scrolling down — so sidebars taller than
 * the viewport remain fully accessible.
 */
function useStickyTop(ref: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastY = window.scrollY;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const h = el.offsetHeight;
      if (h === 0) return;
      const vh = window.innerHeight;

      if (h <= vh - TOP_SPACING - BOTTOM_SPACING) {
        el.style.top = `${TOP_SPACING}px`;
        lastY = window.scrollY;
        return;
      }

      const minTop = vh - h - BOTTOM_SPACING;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      const cur = parseFloat(el.style.top || "") || TOP_SPACING;
      const next = Math.min(TOP_SPACING, Math.max(minTop, cur - dy));
      el.style.top = `${next}px`;
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      ro?.disconnect();
    };
  }, [ref]);
}

/**
 * Professional neutral avatar SVG silhouette.
 * Displayed whenever no photo has been uploaded.
 * Consistent with the settings page avatar.
 */
function DefaultAvatar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Default profile avatar"
    >
      <circle cx="48" cy="48" r="48" fill="#E2F0EE" />
      <circle cx="48" cy="33" r="15" fill="#8BBDB8" />
      <path d="M10 84c0-15.464 17.01-28 38-28s38 12.536 38 28" fill="#8BBDB8" />
    </svg>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  useStickyTop(wrapperRef);

  const isProfileActive  = pathname === "/dashboard/profile";
  const isSettingsActive = pathname === "/dashboard/settings";

  return (
    <div
      ref={wrapperRef}
      className="hidden lg:block lg:sticky self-start z-20 ml-4 sm:ml-6 mt-8 mb-4 sm:mb-6"
    >
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3"
      >

        {/* ══════════════════════════════════════════════════════════════════
            PROFILE CARD
            Banner → overlapping avatar → name → credentials
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xl shadow-slate-900/8 overflow-hidden">

          {/* ── Banner ─────────────────────────────────────────────────── */}
          <div className="relative h-[86px] overflow-hidden flex-shrink-0">
            {/* Deep clinical gradient base */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-teal-950 to-slate-900" />

            {/* Radial teal glow accents */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse at 18% 65%, rgba(20,184,166,0.28) 0%, transparent 52%),
                  radial-gradient(ellipse at 82% 22%, rgba(13,148,136,0.22) 0%, transparent 44%)
                `,
              }}
            />

            {/* Subtle diagonal line pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.07]"
              viewBox="0 0 340 86"
              preserveAspectRatio="none"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <line
                  key={i}
                  x1={-30 + i * 48}
                  y1="86"
                  x2={i * 48 + 96}
                  y2="0"
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* GP Edge watermark — bottom-right */}
            <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 opacity-[0.32] select-none pointer-events-none">
              <div className="w-[18px] h-[18px] rounded-[4px] bg-teal-500/50 flex items-center justify-center">
                <span className="text-white text-[7px] font-bold tracking-tight">GP</span>
              </div>
              <span className="text-teal-300 text-[9px] tracking-widest font-medium uppercase">
                The GP Edge
              </span>
            </div>
          </div>

          {/* ── Avatar (overlaps banner by ~half its height) ────────────── */}
          <div className="flex flex-col items-center text-center px-6 pb-6">
            <div className="-mt-[46px] relative z-10">
              <div className="w-[92px] h-[92px] rounded-full overflow-hidden ring-[3.5px] ring-white dark:ring-slate-900 shadow-lg bg-[#E2F0EE]">
                <DefaultAvatar className="w-full h-full" />
              </div>
            </div>

            {/* Name */}
            <h2 className="font-bold text-slate-900 dark:text-slate-50 text-[17px] leading-tight mt-3 tracking-tight">
              Dr. {user.firstName} {user.lastName}
            </h2>

            {/* Primary credential line */}
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
              RACGP Candidate · PGY3
            </p>

            {/* Hospital */}
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 leading-snug">
              {user.hospital}
            </p>

            {/* Live exam status pill */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 animate-pulse" />
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                Preparing for AKT · Aug 2026
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            NAVIGATION — routed links with active state
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">

          {/* My Profile */}
          <Link
            href="/dashboard/profile"
            id="nav-profile-link"
            className={`relative flex items-center gap-3 px-4 py-3.5 text-sm font-medium
                        transition-all duration-150 border-b border-slate-50 dark:border-slate-800 group
              ${isProfileActive
                ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800"
              }`}
          >
            {/* Active left indicator stripe */}
            {isProfileActive && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-teal-500 rounded-r-full" />
            )}
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
              ${isProfileActive
                ? "bg-teal-100 dark:bg-teal-800/50 text-teal-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              }`}
            >
              <User size={15} />
            </span>
            My Profile
            <ChevronRight
              size={14}
              className={`ml-auto transition-transform duration-150 group-hover:translate-x-0.5
                ${isProfileActive ? "text-teal-400" : "text-slate-300"}`}
            />
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            id="nav-settings-link"
            className={`relative flex items-center gap-3 px-4 py-3.5 text-sm font-medium
                        transition-all duration-150 group
              ${isSettingsActive
                ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800"
              }`}
          >
            {isSettingsActive && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-teal-500 rounded-r-full" />
            )}
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
              ${isSettingsActive
                ? "bg-teal-100 dark:bg-teal-800/50 text-teal-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              }`}
            >
              <Settings size={15} />
            </span>
            Settings
            <ChevronRight
              size={14}
              className={`ml-auto transition-transform duration-150 group-hover:translate-x-0.5
                ${isSettingsActive ? "text-teal-400" : "text-slate-300"}`}
            />
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BADGES
           ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">
              Badges
            </p>
            <button type="button" className="text-[10px] font-semibold text-teal-600 hover:text-teal-500">
              View all
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {badges.map((b, i) => (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.65 + i * 0.05 }}
                title={`${b.name} · ${b.earned}`}
                className="group flex flex-col items-center"
              >
                <div className="relative w-11 h-11 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                  <Image
                    src={b.img}
                    alt={b.name}
                    fill
                    sizes="44px"
                    className="object-contain drop-shadow-sm"
                  />
                </div>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 mt-1 text-center leading-tight">
                  {b.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="text-center pb-1">
          <p className="text-[10px] text-slate-400">{user.joinedLabel}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Synced {user.lastSyncedMin}m ago
          </p>
        </div>

      </motion.aside>
    </div>
  );
}
