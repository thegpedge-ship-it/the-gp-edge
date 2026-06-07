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

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  BarChart2,
  BookOpen,
  Receipt,
  Wrench,
} from "lucide-react";
import { user, badges, examPaths, weeklyProgress } from "./data";
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
  { href: "/dashboard",                  icon: LayoutGrid, label: "Dashboard"        },
  { href: "/dashboard/profile",          icon: User,       label: "My Profile"       },
  { href: "/dashboard/billing",          icon: Receipt,    label: "MBS Billing"      },
  { href: "/dashboard/medical-library",  icon: BookOpen,   label: "Medical Library" },
  { href: "/dashboard/tools",            icon: Wrench,     label: "GP Tools"        },
  { href: "/dashboard/settings",         icon: Settings,   label: "Settings"        },
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`,
        background: "linear-gradient(90deg,#14b8a6,#0d9488)",
        borderRadius: 99, transition: "width 600ms ease",
      }} />
    </div>
  );
}

function Sep() {
  return <div style={{ width: 28, height: 1, background: "#e8edf2", margin: "4px 0" }} />;
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

// ─── Expanded panel card wrapper ──────────────────────────────────────────────
function PanelCard({ label, action, children }: {
  label: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 16, border: "1px solid #e8edf2",
      background: "#fff", padding: "14px 16px",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#94a3b8", textTransform: "uppercase" }}>
          {label}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, ready, toggle, setHovered } = useSidebar();

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
          style={{
            position:      "absolute",
            top:           GAP,
            left:          GAP,
            right:         0,
            bottom: GAP,
            borderRadius:  cardBorderRadius,
            background:    "#ffffff",
            border:        "1px solid #e8edf2",
            boxShadow:     cardShadow,
            overflow:      "hidden",
            pointerEvents: "auto",
          }}
        >

          {/* ══ LAYER A — Collapsed Rail ══════════════════════════════════
              Normal-flow flex column (NOT position:absolute).
              This makes the card auto-size to the icon stack's height.
              display:none when expanded removes it from the layout entirely.
          ══════════════════════════════════════════════════════════════════ */}
          <div
            aria-hidden={isExpanded}
            style={{
              display:        isExpanded ? "none" : "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              height:         "100%",
              gap:            0,
            }}
          >
            {/* ── Avatar ── */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              overflow: "hidden", flexShrink: 0,
              boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px #dceeed",
            }}>
              <AvatarSVG size={38} />
            </div>

            <Sep />

            {/* ── Primary nav ── */}
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
              return (
                <Link key={href} href={href} prefetch title={label} style={{
                  position: "relative",
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 10,
                  color: active ? "#0d9488" : "#94a3b8",
                  background: active ? "#f0fdfa" : "transparent",
                  textDecoration: "none",
                  transition: "background 150ms, color 150ms",
                }}>
                  {active && (
                    <span style={{
                      position: "absolute", left: -6, top: 8, bottom: 8,
                      width: 3, background: "#14b8a6", borderRadius: "0 3px 3px 0",
                    }} />
                  )}
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                </Link>
              );
            })}

            <Sep />

            {/* ── Utility icons ── */}
            <RailBtn icon={<BarChart2 size={16} strokeWidth={1.8} />} title="Analytics" />
            <RailBtn icon={<HelpCircle size={16} strokeWidth={1.8} />} title="Help &amp; Support" />

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
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 999,
                    border: "1px solid #e8edf2", background: "#f8fafc",
                    color: "#94a3b8", fontSize: 11, fontWeight: 500,
                    cursor: "pointer", letterSpacing: "0.01em",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.color = "#0d9488"; e.currentTarget.style.borderColor = "#99f6e4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#e8edf2"; }}
                >
                  <ChevronLeft size={12} strokeWidth={2} /> Collapse
                </button>
              </div>

              {/* ── Profile Card ── */}
              <div style={{
                borderRadius: 20, border: "1px solid #e8edf2",
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
              }}>
                {/* Banner */}
                <div style={{
                  position: "relative", height: 82,
                  background: "linear-gradient(135deg, #0f2027 0%, #0d4a49 55%, #0f2027 100%)",
                  overflow: "hidden",
                }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }}
                    viewBox="0 0 288 82" preserveAspectRatio="none">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <line key={i} x1={-30 + i * 52} y1="82" x2={i * 52 + 72} y2="0"
                        stroke="white" strokeWidth="1" />
                    ))}
                  </svg>
                  <div style={{
                    position: "absolute", top: -20, left: "45%",
                    width: 100, height: 100, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)",
                  }} />
                  <div style={{
                    position: "absolute", bottom: 8, right: 10,
                    display: "flex", alignItems: "center", gap: 4, opacity: 0.28,
                  }}>
                    <Image src="/assets/logo.png" alt="The GP Edge" width={15} height={15} style={{ borderRadius: 3, objectFit: "contain" }} />
                    <span style={{ color: "#99f6e4", fontSize: 7, letterSpacing: "0.14em", fontWeight: 600 }}>
                      THE GP EDGE
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", textAlign: "center",
                  padding: "0 18px 18px", background: "#fff",
                }}>
                  <div style={{
                    marginTop: -42, width: 84, height: 84,
                    borderRadius: "50%", overflow: "hidden",
                    boxShadow: "0 0 0 3px #fff, 0 2px 10px rgba(15,23,42,0.12)",
                    background: "#DCEEED", zIndex: 1,
                  }}>
                    <AvatarSVG size={84} />
                  </div>
                  <p style={{ margin: "9px 0 2px", fontWeight: 700, fontSize: 15.5, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    Dr. {user.firstName} {user.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#475569", fontWeight: 500 }}>
                    RACGP Candidate · PGY3
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>{user.hospital}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                    Rank <strong style={{ color: "#334155", fontWeight: 600 }}>#{user.rank}</strong> of {user.totalUsers.toLocaleString()}
                  </p>
                  <div style={{
                    marginTop: 10,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 999,
                    background: "#f0fdfa", border: "1px solid #99f6e4",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0d9488" }}>
                      Preparing for AKT · Aug 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Navigation ── */}
              <div style={{
                borderRadius: 16, border: "1px solid #e8edf2",
                background: "#fff", overflow: "hidden",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                {NAV.map(({ href, icon: Icon, label }, i) => {
                  const active = href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                  return (
                    <Link key={href} href={href} prefetch style={{
                      position: "relative",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 14px",
                      borderBottom: i < NAV.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: active ? "#f0fdfa" : "#fff",
                      color: active ? "#0d9488" : "#475569",
                      fontSize: 13.5, fontWeight: active ? 600 : 450,
                      textDecoration: "none",
                      transition: "background 150ms, color 150ms",
                    }}>
                      {active && (
                        <span style={{
                          position: "absolute", left: 0, top: 8, bottom: 8,
                          width: 3, background: "#14b8a6", borderRadius: "0 3px 3px 0",
                        }} />
                      )}
                      <span style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "#ccfbf1" : "#f8fafc",
                        color: active ? "#0d9488" : "#94a3b8",
                        transition: "background 150ms, color 150ms",
                      }}>
                        <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                      </span>
                      {label}
                      <ChevronRight size={12} strokeWidth={2}
                        style={{ marginLeft: "auto", color: active ? "#5eead4" : "#e2e8f0" }} />
                    </Link>
                  );
                })}
              </div>

              {/* ── Exam Readiness ── */}
              <PanelCard label="Exam Readiness">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {examPaths.map(exam => (
                    <div key={exam.code}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{exam.code}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0d9488" }}>{exam.readiness}%</span>
                      </div>
                      <ProgressBar value={exam.readiness} />
                    </div>
                  ))}
                </div>
              </PanelCard>

              {/* ── Weekly Goal ── */}
              <PanelCard label="Weekly Goal">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Questions</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                    {weeklyProgress.totalQs} / {weeklyProgress.goalQs}
                  </span>
                </div>
                <ProgressBar value={(weeklyProgress.totalQs / weeklyProgress.goalQs) * 100} />
                <p style={{ margin: "7px 0 0", fontSize: 10.5, color: "#94a3b8" }}>
                  {weeklyProgress.goalQs - weeklyProgress.totalQs} more to reach your goal
                </p>
              </PanelCard>

              {/* ── Badges ── */}
              <PanelCard label="Badges" action={
                <button style={{ border: "none", background: "none", fontSize: 11, fontWeight: 600, color: "#0d9488", cursor: "pointer", padding: 0 }}>
                  View all
                </button>
              }>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                  {badges.map(b => (
                    <div key={b.key} title={`${b.name} · ${b.earned}`}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ position: "relative", width: 38, height: 38 }}>
                        <Image src={b.img} alt={b.name} fill sizes="38px"
                          style={{ objectFit: "contain", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))" }} />
                      </div>
                      <span style={{ fontSize: 7.5, color: "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </PanelCard>

              {/* ── Help & Support ── */}
              <button style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 14,
                border: "1px solid #e8edf2", background: "#fff",
                color: "#475569", fontSize: 13.5, fontWeight: 450,
                cursor: "pointer", width: "100%", textAlign: "left",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                transition: "background 150ms, color 150ms",
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#f8fafc", color: "#94a3b8",
                }}>
                  <HelpCircle size={14} strokeWidth={1.8} />
                </span>
                Help &amp; Support
              </button>

              {/* Footer */}
              <div style={{ textAlign: "center", paddingTop: 4 }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#cbd5e1" }}>{user.joinedLabel}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#cbd5e1" }}>Synced {user.lastSyncedMin}m ago</p>
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
function MobileDrawer({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        style={{
          position: "fixed", top: 90, left: 12, zIndex: 40,
          width: 38, height: 38, borderRadius: 10,
          background: "#fff", border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#64748b", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(15,23,42,0.1)",
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div onClick={() => setOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 48,
        background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: `opacity 200ms ${ease}`,
      }} />

      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 49,
        width: 270, background: "#fff",
        boxShadow: "4px 0 24px rgba(15,23,42,0.14)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: `transform 280ms ${ease}`,
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Navigation</span>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} prefetch style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 10,
                background: active ? "#f0fdfa" : "transparent",
                border: `1px solid ${active ? "#99f6e4" : "transparent"}`,
                color: active ? "#0d9488" : "#475569",
                fontSize: 13.5, fontWeight: active ? 600 : 450,
                textDecoration: "none",
              }}>
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
