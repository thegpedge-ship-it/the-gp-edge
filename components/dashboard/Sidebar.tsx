"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { user, subscription, badges } from "./data";

// Header clearance (the Header is `sticky top-4`, ~80px tall) + a small gap.
const TOP_SPACING = 96;
const BOTTOM_SPACING = 24;

/**
 * Scroll-direction-aware sticky sidebar (the "Twitter/Trello" behaviour):
 * both columns scroll together, and the sidebar pins at whichever end you
 * reach — its top when scrolling up, its bottom when scrolling down — so a
 * sidebar taller than the viewport is still fully reachable.
 *
 * Implementation: it stays `position: sticky` and we only nudge the sticky
 * `top` within its valid range based on scroll delta (throttled via rAF), so
 * the browser still does the actual compositing.
 *
 *  - Fits in the viewport -> always pinned near the top (`TOP_SPACING`).
 *  - Taller than viewport -> `top` slides between `TOP_SPACING` (pin top) and
 *    `vh - h - BOTTOM_SPACING` (pin bottom) as you scroll.
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
      if (h === 0) return; // hidden (mobile)
      const vh = window.innerHeight;

      // Short enough to fit: keep it pinned at the top.
      if (h <= vh - TOP_SPACING - BOTTOM_SPACING) {
        el.style.top = `${TOP_SPACING}px`;
        lastY = window.scrollY;
        return;
      }

      const minTop = vh - h - BOTTOM_SPACING; // fully scrolled -> bottom pinned
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      const cur = parseFloat(el.style.top || "") || TOP_SPACING;
      const next = Math.min(TOP_SPACING, Math.max(minTop, cur - dy));
      el.style.top = `${next}px`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      ro?.disconnect();
    };
  }, [ref]);
}

export default function Sidebar() {
  const isPremium = subscription.plan === "Premium";
  const percentile = Math.max(1, Math.round((user.rank / user.totalUsers) * 100));
  const wrapperRef = useRef<HTMLDivElement>(null);
  useStickyTop(wrapperRef);

  return (
    <div
      ref={wrapperRef}
      className="hidden lg:block lg:sticky self-start z-20 ml-4 sm:ml-6 mt-8 mb-4 sm:mb-6"
    >
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden"
      >
        <div className="p-7">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              className={`relative rounded-full ${
                isPremium
                  ? "p-[3px] bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500"
                  : ""
              }`}
            >
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-serif text-3xl ${
                  isPremium ? "ring-2 ring-white dark:ring-slate-900" : ""
                }`}
              >
                {user.initials}
              </div>
            </div>
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-50 mt-3 leading-tight">
            Dr. {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.bio}</p>

          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 2h14v3H5v-3z" />
            </svg>
            <span className="text-[12px] font-bold text-amber-700 dark:text-amber-400">
              Rank #{user.rank}
            </span>
            <span className="text-[10px] text-amber-600/70 dark:text-amber-300/70">
              · Top {percentile}%
            </span>
          </div>
        </div>

        {/* Profile + Settings pill buttons */}
        <div className="mt-5 space-y-2">
          <PillButton
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            }
            label="My Profile"
          />
          <PillButton
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.32 4.06a1.65 1.65 0 013.36 0l.18.74a1.65 1.65 0 002.05 1.18l.73-.22a1.65 1.65 0 011.95 2.43l-.38.66a1.65 1.65 0 00.6 2.27l.66.38a1.65 1.65 0 010 2.94l-.66.38a1.65 1.65 0 00-.6 2.27l.38.66a1.65 1.65 0 01-1.95 2.43l-.73-.22a1.65 1.65 0 00-2.05 1.18l-.18.74a1.65 1.65 0 01-3.36 0l-.18-.74a1.65 1.65 0 00-2.05-1.18l-.73.22a1.65 1.65 0 01-1.95-2.43l.38-.66a1.65 1.65 0 00-.6-2.27l-.66-.38a1.65 1.65 0 010-2.94l.66-.38a1.65 1.65 0 00.6-2.27l-.38-.66a1.65 1.65 0 011.95-2.43l.73.22a1.65 1.65 0 002.05-1.18l.18-.74zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            }
            label="Settings"
          />
        </div>

        {/* Info pills */}
        <div className="mt-4 space-y-1.5">
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m-7-3.5l7 3.5 7-3.5" />}
            label={user.role}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z" />}
            label={user.hospital}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
            label={user.examTarget}
          />
          <InfoPill
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 14a4 4 0 10-8 0m8 0H8m8 0v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4m2-4a2 2 0 100-4 2 2 0 000 4z" />}
            label={user.contact.racgpId}
          />
        </div>

        {/* Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
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
                transition={{ duration: 0.3, delay: 0.7 + i * 0.04 }}
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

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">{user.joinedLabel}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Synced {user.lastSyncedMin}m ago
          </p>
        </div>
        </div>
      </motion.aside>
    </div>
  );
}

function PillButton({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <button
      type="button"
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </span>
      <span className="flex-1 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
        {label}
      </span>
      <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function InfoPill({ icon, label }: { icon: JSX.Element; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </span>
      <span className="flex-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
        {label}
      </span>
    </div>
  );
}
