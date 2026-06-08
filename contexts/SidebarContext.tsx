"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const LS_PREF_KEY       = "gp-edge:sidebar-pref";
const LS_ONBOARDING_KEY = "gp-edge:sidebar-onboarding-done";

type SidebarPref = "expanded" | "collapsed" | "auto";

// Floating card: 72px card + 8px left-gap = 80px aside. Content margin = 80 + 8 buffer = 88.
export const SIDEBAR_RAIL_PX  = 88;   // content margin-left when collapsed
export const SIDEBAR_PANEL_PX = 336;  // content margin-left when expanded (320 card + 8 gap + 8 buffer)
export const SIDEBAR_TOP_PX   = 96;   // offset to clear navbar on expand

export const MARGIN_TRANSITION = "margin-left 320ms cubic-bezier(0.22,1,0.36,1)";

interface SidebarCtx {
  isExpanded: boolean;
  ready:      boolean;
  toggle:     () => void;
  setHovered: (h: boolean) => void;
}

const SidebarContext = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [pref,          setPref]          = useState<SidebarPref>("auto");
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [isHovered,     setIsHoveredRaw]  = useState(false);
  const [ready,         setReady]         = useState(false);

  // ── Hydrate + set initial state ──────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_PREF_KEY) as SidebarPref | null;
      if (stored === "expanded" || stored === "collapsed") setPref(stored);
    } catch {}

    try {
      if (localStorage.getItem(LS_ONBOARDING_KEY)) setAutoCollapsed(true);
    } catch {}

    // Enable transitions only AFTER initial state settles (prevents flash)
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Onboarding: show expanded → auto-collapse once, ever ─────────────────
  useEffect(() => {
    if (!ready) return;
    if (pref !== "auto") return;
    try { if (localStorage.getItem(LS_ONBOARDING_KEY)) return; } catch {}

    const t = setTimeout(() => {
      setAutoCollapsed(true);
      try { localStorage.setItem(LS_ONBOARDING_KEY, "1"); } catch {}
    }, 2500);
    return () => clearTimeout(t);
  }, [ready, pref]);

  const toggle = useCallback(() => {
    setPref(prev => {
      const expanded = prev === "expanded" || (prev === "auto" && !autoCollapsed);
      const next = expanded ? "collapsed" : "expanded";
      try { localStorage.setItem(LS_PREF_KEY, next); } catch {}
      return next;
    });
    setAutoCollapsed(false);
  }, [autoCollapsed]);

  const setHovered = useCallback((h: boolean) => setIsHoveredRaw(h), []);

  const isExpanded =
    pref === "expanded" ||
    (pref === "auto" && !autoCollapsed) ||
    isHovered;

  return (
    <SidebarContext.Provider value={{ isExpanded, ready, toggle, setHovered }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
}
