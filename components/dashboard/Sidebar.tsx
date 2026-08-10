"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — GP Edge · Floating Card Design
//
// Collapsed state:
//   • Compact card, auto-height (fits icon content, no wasted space)
//   • Rail is a NORMAL-FLOW flex column → card height = icon stack height
//   • display:none when expanded → completely out of flow
//
// Expanded state:
//   • Full-height panel, borderRadius 24px on all corners
//   • Panel is position:absolute, inset:0 inside the card
//
// Animation:
//   • Outer <aside>  → width transition (primary animation)
//   • Card           → border-radius + box-shadow transition only
//   • "ready" flag   → all transitions suppressed on first render (no flash)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from "react";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  GraduationCap,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  BarChart2,
  BookOpen,
  Receipt,
  FileEdit,
  Tag,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { user as localUser } from "./data";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { formatJoined } from "@/lib/format";
import { useSidebar, SIDEBAR_TOP_PX } from "@/contexts/SidebarContext";

// ─── Internal layout constants ────────────────────────────────────────────────
const GAP     = 8;   // gap from viewport left edge
const RAIL_W  = 72;  // visual width of collapsed card
const PANEL_W = 320; // full expanded panel width

// ─── Transition timing ────────────────────────────────────────────────────────
const EASE   = "cubic-bezier(0.22, 1, 0.36, 1)";
const DUR    = "320ms";
const OP_DUR = "160ms";

// ─── Nav items ───────────────────────────────────────────────────────────────
const NAV = [
  { href: "/dashboard",                  icon: LayoutGrid,     label: "Dashboard"        },
  { href: "/exam-prep",                   icon: GraduationCap,  label: "Exam Prep"        },
  { href: "/dashboard/profile",          icon: User,           label: "My Profile"       },
  { href: "/dashboard/billing",          icon: Receipt,        label: "MBS Billing"      },
  { href: "/dashboard/medical-library",  icon: BookOpen,       label: "Medical Library" },
  { href: "/dashboard/clinical-autofills",icon: FileEdit,       label: "Clinical Autofills" },
  { href: "/dashboard/pricing",          icon: Tag,            label: "Pricing"         },
  { href: "/dashboard/settings",         icon: Settings,       label: "Settings"        },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function AvatarSVG({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-label="Profile avatar">
      <circle cx="48" cy="48" r="48" fill="#DCEEED" />
      <circle cx="48" cy="33" r="15" fill="#7BBDB8" />
      <path d="M10 84c0-15.464 17.01-28 38-28s38 12.536 38 28" fill="#7BBDB8" />
    </svg>
  );
}


function Sep() {
  // Use a CSS class so it adapts to dark mode via globals
  return <div className="sidebar-sep" style={{ width: 28, height: 1, margin: "4px 0" }} />;
}

// ─── Collapsed rail icon button ───────────────────────────────────────────────
function RailBtn({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <button title={title} style={{
      width: 40, height: 40,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 10, border: "none",
      background: "transparent", color: "#b0bec5",
      cursor: "pointer", flexShrink: 0,
      transition: "background 150ms, color 150ms",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.color = "#0d9488"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#b0bec5"; }}>
      {icon}
    </button>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, ready, toggle, setHovered } = useSidebar();
  const { user } = useUser();
  const profile = useProfile();

  const leaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEnter = useCallback(() => {
    if (leaveRef.current) clearTimeout(leaveRef.current);
    setHovered(true);
  }, [setHovered]);
  const onLeave = useCallback(() => {
    leaveRef.current = setTimeout(() => setHovered(false), 350);
  }, [setHovered]);
  useEffect(() => () => { if (leaveRef.current) clearTimeout(leaveRef.current); }, []);

  const OT = ready ? `opacity ${OP_DUR} ease` : "none";

  // ── Outer aside width (collapsed = RAIL_W + GAP, expanded = PANEL_W + GAP) ─
  const asideW = isExpanded ? PANEL_W + GAP : RAIL_W + GAP;

  // ── Card: top/left fixed, bottom only set when expanded (auto-height when collapsed) ─
  const cardBorderRadius = 24;
  const cardShadow = "0 4px 24px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.05)";

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:block"
        aria-label="Dashboard navigation"
        style={{
          position:      "fixed",
          top:           SIDEBAR_TOP_PX,
          left:          0,
          height:        `calc(100dvh - ${SIDEBAR_TOP_PX}px)`,
          width:         asideW,
          zIndex:        40,
          overflow:      "visible",
          pointerEvents: "none",
          willChange:    "width",
          transition:    ready ? `width ${DUR} ${EASE}` : "none",
        }}
      >
        {/* ── Visual card ─────────────────────────────────────────────── */}
        <div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="sidebar-card bg-white dark:bg-[#151922] border border-[#e8edf2] dark:border-white/10 shadow-[0_4px_24px_rgba(15,23,42,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          style={{
            position:      "absolute",
            top:           GAP,
            left:          GAP,
            right:         0,
            ...(isExpanded ? { bottom: GAP } : {}),
            borderRadius:  cardBorderRadius,
            overflow:      "hidden",
            pointerEvents: "auto",
          }}
        >
          <style>{`
            .sidebar-card {
              /* Relies on Tailwind classes for background, border, and shadow */
            }
            .dark .sidebar-card {
              /* Relies on Tailwind classes for background, border, and shadow */
            }
            .sidebar-sep {
              background: #e8edf2;
            }
            .dark .sidebar-sep {
              background: rgba(255,255,255,0.07);
            }
            .sidebar-nav-link {
              color: #94a3b8;
              background: transparent;
            }
            .sidebar-nav-link:hover {
              background: #f0fdfa;
              color: #0d9488;
            }
            .sidebar-nav-link.active {
              color: #0d9488;
              background: #f0fdfa;
            }
            .dark .sidebar-nav-link {
              color: #A8B1BD;
              background: transparent;
            }
            .dark .sidebar-nav-link:hover {
              background: rgba(90,200,176,0.07);
              color: #5AC8B0;
            }
            .dark .sidebar-nav-link.active {
              color: #5AC8B0;
              background: rgba(90,200,176,0.12);
            }
            .sidebar-active-bar {
              background: #14b8a6;
            }
            .dark .sidebar-active-bar {
              background: #5AC8B0;
            }
            .sidebar-rail-btn {
              color: #b0bec5;
              background: transparent;
            }
            .sidebar-rail-btn:hover {
              background: #f0fdfa;
              color: #0d9488;
            }
            .dark .sidebar-rail-btn {
              color: #7D8795;
            }
            .dark .sidebar-rail-btn:hover {
              background: rgba(90,200,176,0.07);
              color: #5AC8B0;
            }
          `}</style>

          {/* ══ LAYER A — Collapsed Rail ══════════════════════════════════
              Normal-flow flex column (NOT position:absolute).
              This makes the card auto-size to the icon stack's height.
              display:none when expanded removes it from the layout entirely.
          ══════════════════════════════════════════════════════════════════ */}
          <div
            aria-hidden={isExpanded}
            style={{
              display:       isExpanded ? "none" : "flex",
              flexDirection: "column",
              alignItems:    "center",
              padding:       "12px 0",
              gap:           0,
            }}
          >
            {/* ── Avatar ── */}
            <Link
              href="/dashboard/profile"
              title="My Profile"
              className="block rounded-full cursor-pointer transition-transform duration-150 hover:scale-105"
              style={{
                width: 38, height: 38, borderRadius: "50%",
                overflow: "hidden", flexShrink: 0,
                boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px #dceeed",
                marginBottom: 8,
                position: "relative",
              }}
            >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User Avatar"}
                  fill
                  sizes="38px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <AvatarSVG size={38} />
              )}
            </Link>

            <Sep />

            {/* ── Primary nav ── */}
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  title={label}
                  className={`sidebar-nav-link${active ? " active" : ""}`}
                  style={{
                    position: "relative",
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10,
                    textDecoration: "none",
                    transition: "background 150ms, color 150ms",
                  }}
                >
                  {active && (
                    <span className="sidebar-active-bar" style={{
                      position: "absolute", left: -6, top: 8, bottom: 8,
                      width: 3, borderRadius: "0 3px 3px 0",
                    }} />
                  )}
                  <Icon size={18} strokeWidth={1.8} />
                </Link>
              );
            })}

            <Sep />

            {/* ── Utility icons ── */}
            <RailBtn icon={<BarChart2 size={18} strokeWidth={1.8} />} title="Analytics" />
            <RailBtn icon={<HelpCircle size={18} strokeWidth={1.8} />} title="Help &amp; Support" />
            <SignOutButton>
              <button title="Log out" className="sidebar-rail-btn" style={{
                width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10, border: "none",
                cursor: "pointer", flexShrink: 0,
                transition: "background 150ms, color 150ms",
              }}>
                <LogOut size={18} strokeWidth={1.8} />
              </button>
            </SignOutButton>

            <Sep />

            {/* ── Expand handle ── */}
            <button
              onClick={toggle}
              title="Expand sidebar"
              style={{
                width: 40, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10, border: "none",
                background: "transparent", color: "#cbd5e1",
                cursor: "pointer", flexShrink: 0,
                transition: "background 150ms, color 150ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.color = "#0d9488"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#cbd5e1"; }}
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          {/* ══ LAYER B — Expanded Panel ══════════════════════════════════
              position:absolute, fills the full-height card.
          ══════════════════════════════════════════════════════════════════ */}
          <div
            aria-hidden={!isExpanded}
            style={{
              position:       "absolute",
              inset:          0,
              width:          PANEL_W,
              opacity:        isExpanded ? 1 : 0,
              pointerEvents:  isExpanded ? "auto" : "none",
              transition:     OT,
              overflowY:      "auto",
              overflowX:      "hidden",
              scrollbarWidth: "thin",
              scrollbarColor: "#e2e8f0 transparent",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 14px 32px" }}>

              {/* Collapse button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={toggle}
                  className="
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-xl
                    border border-slate-200 dark:border-slate-800
                    bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400
                    hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-900/50
                    font-sans text-[11px] font-semibold tracking-wide
                    cursor-pointer transition-all duration-150
                  "
                >
                  <ChevronLeft size={12} strokeWidth={2} /> Collapse
                </button>
              </div>

              {/* ── Profile Card (Clickable link to My Profile) ── */}
              <Link
                href="/dashboard/profile"
                title="View My Profile"
                className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700/60 hover:shadow-[0_4px_20px_rgba(15,23,42,0.11)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 cursor-pointer transition-all duration-200 ease-out"
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
                  textDecoration: "none",
                }}
              >
                {/* Banner */}
                <div style={{
                  position: "relative", height: 82,
                  overflow: "hidden",
                }}>
                  <Image
                    src="/assets/profile/banner.png"
                    alt="Profile Banner"
                    fill
                    sizes="288px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                  <div style={{
                    position: "absolute", bottom: 8, right: 10,
                    display: "flex", alignItems: "center", gap: 4, opacity: 0.8,
                    zIndex: 2,
                  }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: 3,
                      background: "rgba(20,184,166,0.95)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "#fff", fontSize: 6, fontWeight: 700, lineHeight: 1 }}>GP</span>
                    </div>
                    <span style={{ color: "#ffffff", fontSize: 7, letterSpacing: "0.14em", fontWeight: 600 }}>
                      THE GP EDGE
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", textAlign: "center",
                  padding: "0 18px 18px",
                }}>
                  <div
                    className="transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                    style={{
                      marginTop: -42, width: 84, height: 84,
                      borderRadius: "50%", overflow: "hidden",
                      boxShadow: "0 0 0 3px #fff, 0 2px 10px rgba(15,23,42,0.12)",
                      background: "#DCEEED", zIndex: 1,
                      position: "relative",
                    }}
                  >
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || "User Avatar"}
                        fill
                        sizes="84px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <AvatarSVG size={84} />
                    )}
                  </div>
                  <p className="font-sans text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors duration-150" style={{ margin: "9px 0 2px" }}>
                    {user?.fullName || "User"}
                  </p>
                  <p className="font-sans text-sm font-medium text-slate-600 dark:text-slate-400" style={{ margin: 0 }}>
                    {profile.roleTitle || "GP Registrar"}
                  </p>
                  {profile.hospital && (
                    <p className="font-sans text-sm font-medium text-slate-600 dark:text-slate-400" style={{ margin: "2px 0 0" }}>
                      {profile.hospital}
                    </p>
                  )}
                  <p className="font-sans text-sm font-medium text-slate-600 dark:text-slate-400" style={{ margin: "2px 0 0" }}>
                    Rank <strong className="font-semibold text-slate-900 dark:text-slate-100">#{localUser.rank}</strong> of {localUser.totalUsers.toLocaleString()}
                  </p>
                  {profile.examTarget && (
                    <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 group-hover:border-teal-300 dark:group-hover:border-teal-800 whitespace-nowrap transition-colors duration-150" style={{
                      marginTop: 10,
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 18px", borderRadius: 12,
                    }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      <span className="font-sans text-xs md:text-[13px] font-semibold tracking-wide text-teal-700 dark:text-teal-400">
                        {profile.examTarget}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* ── Navigation ── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                {NAV.map(({ href, icon: Icon, label }, i) => {
                  const active = href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch
                      className={`
                        group relative flex items-center gap-3 px-3.5 py-2.5
                        transition-all duration-150 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0
                        ${active
                          ? "bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-sans text-sm md:text-[15px] font-semibold"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-sans text-sm md:text-[15px] font-medium"
                        }
                      `}
                      style={{ textDecoration: "none" }}
                    >
                      {active && (
                        <span style={{
                          position: "absolute", left: 0, top: 8, bottom: 8,
                          width: 3, background: "#14b8a6", borderRadius: "0 3px 3px 0",
                        }} />
                      )}
                      <span className={`
                        w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-150
                        ${active
                          ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-400"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:bg-teal-50/50 dark:group-hover:bg-teal-950/30"
                        }
                      `}>
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span>{label}</span>
                      <ChevronRight size={14} strokeWidth={1.8}
                        className={`ml-auto transition-colors ${active ? "text-teal-500 dark:text-teal-400" : "text-slate-300 dark:text-slate-700 group-hover:text-slate-400"}`} />
                    </Link>
                  );
                })}
              </div>

              {/* ── Help & Support ── */}
              <button className="
                group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl
                border border-slate-200 dark:border-slate-800
                bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400
                hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100
                font-sans text-sm md:text-[15px] font-medium
                transition-all duration-150 cursor-pointer w-full text-left shadow-sm
              ">
                <span className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:bg-teal-50/50 dark:group-hover:bg-teal-950/30 transition-all duration-150">
                  <HelpCircle size={18} strokeWidth={1.8} />
                </span>
                <span>Help &amp; Support</span>
              </button>

              {/* ── Log out ── */}
              <SignOutButton>
                <button className="
                  group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl
                  border border-slate-200 dark:border-slate-800
                  bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/40
                  font-sans text-sm md:text-[15px] font-medium
                  transition-all duration-150 cursor-pointer w-full text-left shadow-sm
                ">
                  <span className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-all duration-150">
                    <LogOut size={18} strokeWidth={1.8} />
                  </span>
                  <span>Log out</span>
                </button>
              </SignOutButton>

              {/* Footer */}
              <div className="text-center pt-1">
                <p className="font-sans text-xs font-normal text-slate-400 dark:text-slate-500 m-0 mb-0.5">{formatJoined(profile.joinedAt)}</p>
                <p className="font-sans text-xs font-normal text-slate-400 dark:text-slate-500 m-0">Synced {localUser.lastSyncedMin}m ago</p>
              </div>

            </div>
          </div>

        </div>
      </aside>

      <MobileDrawer pathname={pathname} />
    </>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
// The open/close trigger (hamburger) lives in the navbar (see Header.tsx) and
// drives this drawer through SidebarContext. This component renders only the
// overlay + slide-in panel.
function MobileDrawer({ pathname }: { pathname: string }) {
  const { mobileOpen: open, setMobileOpen } = useSidebar();
  const setOpen = setMobileOpen;
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className="lg:hidden">
      <div onClick={() => setOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: `opacity 200ms ${ease}`,
      }} />

      <div
        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 61,
          width: 270,
          boxShadow: "4px 0 24px rgba(15,23,42,0.14)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: `transform 280ms ${ease}`,
          overflowY: "auto",
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" aria-label="Home" className="flex items-center">
            <Image
              src="/assets/logo.png"
              alt="The GP Edge"
              width={240}
              height={160}
              className="w-auto h-9 object-contain"
              priority
            />
          </Link>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 flex flex-col gap-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150
                  ${active
                    ? "bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-sans text-sm md:text-base font-semibold border border-teal-100 dark:border-teal-900/40"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-sans text-sm md:text-base font-medium border border-transparent"
                  }
                `}
                style={{ textDecoration: "none" }}
              >
                <Icon size={18} strokeWidth={1.8} /> {label}
              </Link>
            );
          })}
          
          <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
          <SignOutButton>
            <button className="
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150
              text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-rose-600 dark:hover:text-rose-400 font-sans text-sm md:text-base font-medium border border-transparent w-full text-left cursor-pointer
            ">
              <LogOut size={18} strokeWidth={1.8} /> Log out
            </button>
          </SignOutButton>

          {/* Appearance — last option. A plain button (not a toggle switch),
              shown only in the mobile drawer since the navbar toggle is hidden
              on small screens. */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="
              flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-150
              text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-sans text-sm md:text-base font-medium border border-transparent w-full text-left cursor-pointer
            "
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>
    </div>
  );
}
