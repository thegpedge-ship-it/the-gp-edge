"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  FileQuestion,
  ClipboardList,
  BookOpen,
  FileEdit,
  Users,
  Bell,
  CreditCard,
  ShieldCheck,
  Search,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  HelpCircle,
  Lock,
} from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";

// ─── Internal layout constants ────────────────────────────────────────────────
const GAP     = 8;   // gap from viewport left/top edge
const RAIL_W  = 72;  // visual width of collapsed card
const PANEL_W = 320; // full expanded panel width

// ─── Transition timing ────────────────────────────────────────────────────────
const EASE   = "cubic-bezier(0.22, 1, 0.36, 1)";
const DUR    = "320ms";
const OP_DUR = "160ms";

// ─── Nav Groups configuration ────────────────────────────────────────────────
const navGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutGrid },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Questions", href: "/admin/questions", icon: FileQuestion },
      { label: "Quizzes", href: "/admin/quizzes", icon: ClipboardList },
      { label: "Medical Content", href: "/admin/content", icon: BookOpen },
      { label: "Autofill Templates", href: "/admin/autofill", icon: FileEdit },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Billing", href: "/admin/billing", icon: CreditCard },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit & Security", href: "/admin/audit", icon: ShieldCheck },
      { label: "Search", href: "/admin/search", icon: Search },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

function Sep() {
  return <div className="sidebar-sep" style={{ width: 28, height: 1, margin: "4px 0" }} />;
}

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  onMouseEnter,
  onMouseLeave,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentAdmin } = useAdminRole();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("gpedge_admin_logged_in");
    window.dispatchEvent(new Event("gpedge_admin_changed"));
    router.push("/admin/login");
    if (onMobileClose) onMobileClose();
  };

  const initials = currentAdmin.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const OT = ready ? `opacity ${OP_DUR} ease` : "none";
  const isExpanded = !collapsed;
  const asideW = isExpanded ? PANEL_W + GAP : RAIL_W + GAP;
  const cardBorderRadius = 24;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:block"
        aria-label="Admin navigation"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position:      "fixed",
          top:           56, // Height of AdminTopbar (h-14)
          left:          0,
          height:        "calc(100dvh - 56px)",
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
              Normal-flow flex column (auto-height support).
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
            {/* ── Avatar / Logo ── */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              overflow: "hidden", flexShrink: 0,
              boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px #dceeed",
              marginBottom: 8,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
            }}>
              A
            </div>

            <Sep />

            {/* ── Primary nav ── */}
            {allNavItems.map(({ href, icon: Icon, label }) => {
              const isActive = href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname.startsWith(href);
              const itemKey = href.split("/").filter(Boolean)[1] || "dashboard";
              const hasPermission = currentAdmin.permissions.includes(itemKey);

              return (
                <Link
                  key={href}
                  href={href}
                  title={`${label}${!hasPermission ? " (Locked)" : ""}`}
                  className={`sidebar-nav-link${isActive ? " active" : ""}`}
                  style={{
                    position: "relative",
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10,
                    textDecoration: "none",
                    transition: "background 150ms, color 150ms",
                    opacity: hasPermission ? 1 : 0.45,
                  }}
                >
                  {isActive && (
                    <span className="sidebar-active-bar" style={{
                      position: "absolute", left: -6, top: 8, bottom: 8,
                      width: 3, borderRadius: "0 3px 3px 0",
                    }} />
                  )}
                  {hasPermission ? (
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  ) : (
                    <Lock size={15} strokeWidth={2} />
                  )}
                </Link>
              );
            })}

            <Sep />

            {/* ── Utility icons ── */}
            <button
              onClick={handleLogout}
              title="Log out session"
              className="sidebar-rail-btn"
              style={{
                width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10, border: "none",
                cursor: "pointer", flexShrink: 0,
                transition: "background 150ms, color 150ms",
              }}
            >
              <LogOut size={16} strokeWidth={1.8} />
            </button>

            <Sep />

            {/* ── Expand handle ── */}
            <button
              onClick={onToggle}
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
              position:absolute, fills the card height.
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
                  onClick={onToggle}
                  className="
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full
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

              {/* ── Admin Profile Card ── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
              }}>
                {/* Banner */}
                <div style={{
                  position: "relative",
                  height: 82,
                  background: "linear-gradient(135deg, #111827, #0f766e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4, opacity: 0.85,
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
                      ADMIN PANEL
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", textAlign: "center",
                  padding: "0 18px 18px",
                }}>
                  <div style={{
                    marginTop: -42, width: 84, height: 84,
                    borderRadius: "50%", overflow: "hidden",
                    boxShadow: "0 0 0 3px #fff, 0 2px 10px rgba(15,23,42,0.12)",
                    background: "linear-gradient(135deg, #10b981, #06b6d4)",
                    color: "#fff",
                    zIndex: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                  }}>
                    {initials}
                  </div>
                  <p className="font-sans text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100" style={{ margin: "9px 0 2px" }}>
                    {currentAdmin.name}
                  </p>
                  <p className="font-sans text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider" style={{ margin: 0 }}>
                    {currentAdmin.role}
                  </p>
                  <p className="font-sans text-xs font-medium text-slate-400 dark:text-slate-500" style={{ margin: "2px 0 0" }}>
                    {currentAdmin.email}
                  </p>
                  <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 whitespace-nowrap" style={{
                    marginTop: 10,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 14px", borderRadius: 999,
                  }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 animate-pulse" />
                    <span className="font-sans text-[11px] font-bold tracking-wide text-teal-700 dark:text-teal-400 uppercase">
                      Admin Session Active
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Navigation Groups ── */}
              {navGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-1.5">
                  <span className="font-sans text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">
                    {group.title}
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                  }}>
                    {group.items.map(({ href, icon: Icon, label }) => {
                      const isActive = href === "/admin/dashboard"
                        ? pathname === "/admin/dashboard"
                        : pathname.startsWith(href);
                      const itemKey = href.split("/").filter(Boolean)[1] || "dashboard";
                      const hasPermission = currentAdmin.permissions.includes(itemKey);

                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onMobileClose}
                          className={`
                            relative flex items-center gap-2.5 px-3.5 py-2.5
                            transition-all duration-150 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0
                            ${!hasPermission ? "opacity-50" : ""}
                            ${isActive
                              ? "bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-sans text-sm md:text-base font-semibold"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-sans text-sm md:text-base font-medium"
                            }
                          `}
                          style={{ textDecoration: "none" }}
                        >
                          {isActive && (
                            <span style={{
                              position: "absolute", left: 0, top: 8, bottom: 8,
                              width: 3, background: "#14b8a6", borderRadius: "0 3px 3px 0",
                            }} />
                          )}
                          <span className={`
                            w-7.5 h-7.5 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-150
                            ${isActive
                              ? "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-400"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            }
                          `} style={{ width: 30, height: 30 }}>
                            {hasPermission ? (
                              <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                            ) : (
                              <Lock size={13} strokeWidth={2} />
                            )}
                          </span>
                          <span>{label}</span>
                          {!hasPermission ? (
                            <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-sans font-bold uppercase tracking-wider">Locked</span>
                          ) : (
                            <ChevronRight size={12} strokeWidth={2}
                              className={`ml-auto transition-colors ${isActive ? "text-teal-400 dark:text-teal-500" : "text-slate-300 dark:text-slate-700"}`} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ── Log out ── */}
              <button
                onClick={handleLogout}
                className="
                  flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
                  border border-slate-200 dark:border-slate-800
                  bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100
                  font-sans text-sm md:text-base font-medium
                  transition-all duration-150 cursor-pointer w-full text-left shadow-sm
                "
              >
                <span className="w-7.5 h-7.5 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500" style={{ width: 30, height: 30 }}>
                  <LogOut size={14} strokeWidth={1.8} />
                </span>
                <span>Log out session</span>
              </button>

              {/* Footer / Info */}
              <div className="text-center pt-2">
                <p className="font-sans text-[10px] font-normal text-slate-400 dark:text-slate-500 m-0">v2.1 · Production Server</p>
              </div>

            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Overlay backdrop */}
        <div
          onClick={onMobileClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 48,
            background: "rgba(15,23,42,0.3)",
            backdropFilter: "blur(4px)",
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? "auto" : "none",
            transition: `opacity 280ms ${EASE}`,
          }}
        />

        {/* Drawer panel */}
        <div
          className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 49,
            width: 280,
            boxShadow: "4px 0 24px rgba(15,23,42,0.14)",
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: `transform 280ms ${EASE}`,
            overflowY: "auto",
          }}
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-850">
            <span className="font-sans text-sm font-bold text-slate-800 dark:text-slate-200">Admin Controls</span>
            <button
              onClick={onMobileClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3 flex flex-col gap-4">
            {navGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-1">
                <span className="font-sans text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">
                  {group.title}
                </span>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(({ href, icon: Icon, label }) => {
                    const isActive = href === "/admin/dashboard"
                      ? pathname === "/admin/dashboard"
                      : pathname.startsWith(href);
                    const itemKey = href.split("/").filter(Boolean)[1] || "dashboard";
                    const hasPermission = currentAdmin.permissions.includes(itemKey);

                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onMobileClose}
                        className={`
                          flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 border border-transparent
                          ${!hasPermission ? "opacity-50" : ""}
                          ${isActive
                            ? "bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 font-sans text-sm font-semibold border-teal-100 dark:border-teal-900/40"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-sans text-sm font-medium"
                          }
                        `}
                        style={{ textDecoration: "none" }}
                      >
                        {hasPermission ? <Icon size={15} /> : <Lock size={14} />}
                        <span>{label}</span>
                        {!hasPermission && (
                          <span className="ml-auto text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">Locked</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-150
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 font-sans text-sm font-semibold border border-transparent w-full text-left cursor-pointer
              "
            >
              <LogOut size={15} /> Log out session
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
