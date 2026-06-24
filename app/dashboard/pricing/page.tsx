"use client";

import { useState } from "react";
import { HelpCircle, BookOpen, BarChart2, Eye, FileText, GraduationCap, Bot, Calendar, Headphones, CheckCircle2, Star } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started for free",
    priceMonthly: 0,
    priceAnnual: 0,
    priceNoteMonthly: "Forever free",
    priceNoteAnnual: "Forever free",
    highlight: false,
    badge: null as string | null,
    cta: "Create free account",
    ctaHref: "/sign-up",
    ctaVariant: "outline" as "outline" | "solid" | "outlined-green",
    features: [
      "Bill Better — full access",
      "Autofills — 50 templates",
      "Learn-a-Thing — 30 conditions",
      "No exam prep quizzes",
      "No performance tracking",
    ],
  },
  {
    id: "core",
    name: "Core",
    tagline: "Full exam prep access",
    priceMonthly: 39,
    priceAnnual: 31,
    priceNoteMonthly: "Billed monthly, Cancel any time.",
    priceNoteAnnual: "Billed annually, Cancel any time.",
    highlight: true,
    badge: "MOST POPULAR",
    cta: "Start Core plan",
    ctaHref: "/sign-up",
    ctaVariant: "solid" as "outline" | "solid" | "outlined-green",
    features: [
      "Unlimited AKT quiz questions",
      "Unlimited KFP cases",
      "Performance analytics",
      "Blind spot detection",
      "Full Autofills library",
      "Full Learn-a-Thing access",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Everything + AI Tutor",
    priceMonthly: 59,
    priceAnnual: 47,
    priceNoteMonthly: "Billed monthly, Cancel any time.",
    priceNoteAnnual: "Billed annually, Cancel any time.",
    highlight: false,
    badge: null as string | null,
    cta: "Start Premium plan",
    ctaHref: "/sign-up",
    ctaVariant: "outlined-green" as "outline" | "solid" | "outlined-green",
    features: [
      "Everything in Core",
      "AI Tutor — ask questions on any topic",
      "Personalised study schedule",
      "Priority support",
    ],
  },
];

const COMPARISON_ROWS = [
  { icon: HelpCircle, feature: "AKT quiz questions", free: "—", core: "Unlimited", premium: "Unlimited" },
  { icon: BookOpen, feature: "KFP cases", free: "—", core: "Unlimited", premium: "Unlimited" },
  { icon: BarChart2, feature: "Performance analytics", free: "—", core: "✓", premium: "✓" },
  { icon: Eye, feature: "Blind spot detection", free: "—", core: "✓", premium: "✓" },
  { icon: FileText, feature: "Autofills library", free: "50 templates", core: "Full access", premium: "Full access" },
  { icon: GraduationCap, feature: "Learn-a-Thing access", free: "30 conditions", core: "Full access", premium: "Full access" },
  { icon: Bot, feature: "AI tutor", free: "—", core: "—", premium: "✓" },
  { icon: Calendar, feature: "Personalised study schedule", free: "—", core: "—", premium: "✓" },
  { icon: Headphones, feature: "Priority support", free: "—", core: "—", premium: "✓" },
];

const JOURNEY_STEPS = [
  {
    n: 1,
    title: "Start Free",
    desc: "Create your free account and explore the basics.",
  },
  {
    n: 2,
    title: "Unlock Core",
    desc: "Get full access to exam prep tools and analytics.",
  },
  {
    n: 3,
    title: "Add AI Tutor",
    desc: "Upgrade to Premium for AI tutor and priority support.",
  },
];


// ─── Sub-components ───────────────────────────────────────────────────────────

function PricingCard({
  plan,
  billingCycle,
}: {
  plan: (typeof PLANS)[number];
  billingCycle: "monthly" | "annual";
}) {
  const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceAnnual;
  const priceNote = billingCycle === "monthly" ? plan.priceNoteMonthly : plan.priceNoteAnnual;

  return (
    <div
      className={`pricing-card ${plan.highlight ? "pricing-card-highlight" : "pricing-card-standard"} ${plan.id === "core" ? "order-1 lg:order-2" : plan.id === "free" ? "order-2 lg:order-1" : "order-3 lg:order-3"
        }`}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: plan.highlight ? "32px 24px" : "24px 20px",
        background: plan.highlight ? "var(--row-core-bg)" : "var(--row-bg)",
        border: `1.5px solid ${plan.highlight ? "var(--row-core-border)" : "var(--row-border)"}`,
        boxShadow: "var(--row-shadow)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: plan.highlight ? "480px" : "440px",
        transition: "box-shadow 250ms ease, transform 250ms ease, border-color 250ms ease",
      }}
    >
      {/* Top right inside badge for Core card */}
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "4px 14px",
            borderRadius: 999,
            background: "var(--accent)",
            border: "2px solid #ffffff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "#ffffff",
            fontFamily: "var(--font-sans)",
            zIndex: 10,
            boxShadow: "0 2px 6px rgba(13,148,136,0.15)",
          }}
        >
          {plan.badge === "MOST POPULAR" ? "MOST POPULAR" : plan.badge}
        </div>
      )}

      {/* Header Info (Centered) */}
      <div className="mb-4 flex flex-col items-center">
        <h3
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--accent)",
            fontFamily: "var(--font-sans)",
            textAlign: "center",
          }}
        >
          {plan.name}
        </h3>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            textAlign: "center",
            minHeight: "18px",
          }}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Pricing Block (Centered) */}
      <div className="mb-4 flex flex-col items-center">
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            A$
          </span>
          <span
            style={{
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--accent)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {price}
          </span>
          {plan.priceMonthly > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginLeft: 2,
              }}
            >
              /month
            </span>
          )}
          {/* Display original crossed-out price if annual */}
          {billingCycle === "annual" && plan.priceMonthly > 0 && (
            <span
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                textDecoration: "line-through",
                marginLeft: 6,
              }}
            >
              {plan.priceMonthly}
            </span>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            textAlign: "center",
          }}
        >
          {priceNote}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--row-border)", marginBottom: 16 }} />

      {/* Features List (Left-aligned text list, centered container block) */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", flexGrow: 1 }} className="mb-6">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: "240px" }}>
          {plan.features.map((feature) => {
            const isMuted = feature.toLowerCase().startsWith("no ");
            return (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  fontSize: 13.5,
                  color: isMuted ? "var(--text-muted)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.4,
                  fontWeight: plan.highlight ? 500 : 400,
                }}
              >
                {!isMuted ? (
                  <span style={{ color: "var(--accent)", marginRight: 8, fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>
                ) : (
                  <span style={{ width: 16, flexShrink: 0 }} />
                )}
                <span>{feature}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <div>
        <a
          href={plan.ctaHref}
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 20px",
            borderRadius: 10,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            backgroundColor:
              plan.ctaVariant === "solid"
                ? "var(--accent)"
                : "transparent",
            color:
              plan.ctaVariant === "solid"
                ? "#ffffff"
                : plan.ctaVariant === "outlined-green"
                  ? "var(--accent)"
                  : "var(--text-primary)",
            border:
              plan.ctaVariant === "solid"
                ? "1.5px solid transparent"
                : plan.ctaVariant === "outlined-green"
                  ? "1.5px solid var(--accent)"
                  : "1.5px solid var(--row-border)",
            transition: "all 180ms ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            if (plan.ctaVariant === "solid") {
              el.style.opacity = "0.88";
            } else if (plan.ctaVariant === "outlined-green") {
              el.style.backgroundColor = "rgba(13, 148, 136, 0.06)";
            } else {
              el.style.borderColor = "var(--accent)";
              el.style.color = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.opacity = "1";
            el.style.backgroundColor =
              plan.ctaVariant === "solid"
                ? "var(--accent)"
                : "transparent";
            el.style.borderColor =
              plan.ctaVariant === "solid"
                ? "transparent"
                : plan.ctaVariant === "outlined-green"
                  ? "var(--accent)"
                  : "var(--row-border)";
            el.style.color =
              plan.ctaVariant === "solid"
                ? "#ffffff"
                : plan.ctaVariant === "outlined-green"
                  ? "var(--accent)"
                  : "var(--text-primary)";
          }}
        >
          {plan.cta}
        </a>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const renderCellContent = (value: string) => {
    if (value === "—") {
      return <span className="text-slate-300 dark:text-slate-600 font-medium text-[13px]">—</span>;
    }
    if (value === "✓") {
      return <CheckCircle2 className="w-[18px] h-[18px] text-teal-600 dark:text-teal-400 mx-auto" strokeWidth={2.5} />;
    }
    if (value === "Unlimited") {
      return (
        <div className="flex items-center justify-center gap-1.5 text-teal-600 dark:text-teal-400">
          <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
          <span className="font-medium text-[13px]">Unlimited</span>
        </div>
      );
    }
    if (value === "Full access") {
      return <span className="text-teal-600 dark:text-teal-400 font-medium text-[13px]">{value}</span>;
    }
    return <span className="text-slate-600 dark:text-slate-400 font-medium text-[13px]">{value}</span>;
  };

  return (
    <div className="min-w-[700px] w-full rounded-[18px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible shadow-sm mt-6">
      <table className="w-full text-[13px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className="w-[40%] text-left py-5 px-6 font-semibold text-[10px] tracking-[0.08em] uppercase text-slate-400 dark:text-slate-500 rounded-tl-[18px] border-b border-slate-100 dark:border-slate-800/50">
              Features
            </th>
            <th className="w-[20%] text-center py-5 px-4 font-semibold text-[10px] tracking-[0.08em] uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/50">
              Free
            </th>
            <th className="relative w-[20%] text-center py-5 px-4 font-bold text-[11px] tracking-[0.08em] uppercase text-teal-700 dark:text-teal-400 bg-[#F3FBF7] dark:bg-[rgba(90,200,176,0.06)] border-t-[1.5px] border-x-[1.5px] border-b border-b-slate-100 dark:border-b-slate-800/50 border-t-[#C8E8D8] border-x-[#C8E8D8] dark:border-t-[rgba(90,200,176,0.20)] dark:border-x-[rgba(90,200,176,0.20)] rounded-t-[18px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                <Star className="w-3 h-3 fill-current" />
                Most Popular
              </div>
              Core
            </th>
            <th className="w-[20%] text-center py-5 px-4 font-semibold text-[10px] tracking-[0.08em] uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/50 rounded-tr-[18px]">
              Premium
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => {
            const isLast = i === COMPARISON_ROWS.length - 1;
            const Icon = row.icon;
            return (
              <tr key={row.feature} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className={`py-4 px-6 flex items-center gap-3 text-slate-800 dark:text-slate-200 font-medium text-[13px] ${!isLast ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  {row.feature}
                </td>
                <td className={`py-4 px-4 text-center ${!isLast ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
                  {renderCellContent(row.free)}
                </td>
                <td className={`py-4 px-4 text-center bg-[#F3FBF7] dark:bg-[rgba(90,200,176,0.06)] border-x-[1.5px] border-x-[#C8E8D8] dark:border-x-[rgba(90,200,176,0.20)] group-hover:bg-[#ebf8f1] dark:group-hover:bg-[rgba(90,200,176,0.09)] transition-colors ${!isLast ? 'border-b border-b-slate-100 dark:border-b-slate-800/50' : 'border-b-[1.5px] border-b-[#C8E8D8] dark:border-b-[rgba(90,200,176,0.20)] rounded-b-[18px]'}`}>
                  {renderCellContent(row.core)}
                </td>
                <td className={`py-4 px-4 text-center ${!isLast ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
                  {renderCellContent(row.premium)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}




// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <>
      <style>{`
        /* ── Token layer — light ── */
        :root {
          --accent:           #0d9488;
          --text-primary:     #0f172a;
          --text-secondary:   #475569;
          --text-muted:       #94a3b8;
          --row-bg:           #ffffff;
          --row-border:       rgba(0,0,0,0.08);
          --row-shadow:       0 1px 6px rgba(15,23,42,0.06);
          --row-shadow-hover: 0 6px 20px rgba(15,23,42,0.10);
          --row-core-bg:      #F3FBF7;
          --row-core-bg-badge:#DCEEE6;
          --row-core-border:  #C8E8D8;
          --table-header-bg:  #f8fafc;
          --table-alt-bg:     #fafcfb;
        }

        /* ── Token layer — dark ── */
        .dark {
          --accent:           #5AC8B0;
          --text-primary:     #F5F7FA;
          --text-secondary:   #A8B1BD;
          --text-muted:       #7D8795;
          --row-bg:           #1B212C;
          --row-border:       rgba(255,255,255,0.08);
          --row-shadow:       0 2px 12px rgba(0,0,0,0.28);
          --row-shadow-hover: 0 8px 28px rgba(0,0,0,0.40);
          --row-core-bg:      rgba(90,200,176,0.06);
          --row-core-bg-badge:rgba(90,200,176,0.12);
          --row-core-border:  rgba(90,200,176,0.20);
          --table-header-bg:  rgba(255,255,255,0.03);
          --table-alt-bg:     rgba(255,255,255,0.02);
        }

        /* ── Custom Toggle Switch ── */
        .switch {
          --_switch-bg-clr: var(--row-bg);
          --_switch-padding: 4px;
          --_slider-bg-clr: var(--accent);
          --_slider-bg-clr-on: var(--accent);
          --_slider-txt-clr: #ffffff;
          --_label-padding: 0.6rem 2.5rem;
          --_switch-easing: cubic-bezier(0.47, 1.64, 0.41, 0.8);
          color: var(--text-secondary);
          width: fit-content;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          position: relative;
          isolation: isolate;
          border-radius: 9999px;
          cursor: pointer;
          border: 1px solid var(--row-border);
          font-weight: 600;
          font-size: 13px;
          font-family: var(--font-sans);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .switch input[type="checkbox"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .switch > span {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 300ms ease-in-out 150ms, color 300ms ease;
          padding: var(--_label-padding);
          z-index: 10;
        }
        .switch::before,
        .switch::after {
          content: "";
          position: absolute;
          border-radius: inherit;
          transition: inset 150ms ease-in-out;
        }
        /* switch slider */
        .switch::before {
          background-color: var(--_slider-bg-clr);
          inset: var(--_switch-padding) 50% var(--_switch-padding) var(--_switch-padding);
          transition:
            inset 500ms var(--_switch-easing),
            background-color 500ms ease-in-out;
          z-index: -1;
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1), 0 1px rgba(255, 255, 255, 0.3);
        }
        /* switch bg color */
        .switch::after {
          background-color: var(--_switch-bg-clr);
          inset: 0;
          z-index: -2;
        }
        /* switch hover */
        .switch:has(input:checked):hover::before {
          inset: var(--_switch-padding) var(--_switch-padding) var(--_switch-padding) 45%;
        }
        .switch:has(input:not(:checked)):hover::before {
          inset: var(--_switch-padding) 45% var(--_switch-padding) var(--_switch-padding);
        }
        /* checked - move slider to right */
        .switch:has(input:checked)::before {
          background-color: var(--_slider-bg-clr-on);
          inset: var(--_switch-padding) var(--_switch-padding) var(--_switch-padding) 50%;
        }
        /* switch text colors based on checked state */
        .switch:has(input:not(:checked)) > span:first-of-type {
          color: #ffffff;
        }
        .switch:has(input:checked) > span:last-of-type {
          color: #ffffff;
        }
        /* ── Pricing card animations & states ── */
        .pricing-card {
          box-shadow: var(--row-shadow);
          transition: transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease !important;
        }
        .pricing-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: var(--row-shadow-hover) !important;
          border-color: var(--accent) !important;
        }

        /* ── Card arrangement ── */
        @media (min-width: 1024px) {
          .pricing-card-highlight {
            height: 520px !important;
            box-shadow: var(--row-shadow-hover) !important;
            z-index: 10;
          }
          .pricing-card-standard {
            height: 470px !important;
          }
        }

        /* ── Upgrade journey layout ── */
        .upgrade-journey {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }
        .journey-step-wrapper {
          display: contents;
        }
        .journey-arrow {
          margin: 0 12px;
          align-self: center;
          padding-bottom: 0;
        }

        /* ── Responsive — mobile ── */
        @media (max-width: 767px) {
          .upgrade-journey {
            flex-direction: column;
            gap: 12px;
          }
          .journey-step-wrapper {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .journey-arrow {
            align-self: flex-start;
            margin: 0;
            transform: rotate(90deg);
            font-size: 16px !important;
          }
        }

        /* ── Responsive — tablet ── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .journey-step-wrapper {
            display: contents;
          }
        }
      `}</style>

      <div className="w-full pb-16 pt-2 flex flex-col">
        {/* ════════════════════════════════
            Section 1 — Hero (Centered)
        ════════════════════════════════ */}
        <section className="mb-6 flex flex-col items-start text-left px-8 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-955/30 text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-800/30 uppercase tracking-[0.12em] mb-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
            </span>
            Simple, transparent pricing
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 mb-2 max-w-3xl">
            Invest in your fellowship success
          </h1>

          {/* Description */}
          <p className="font-sans text-lg md:text-xl font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-2 max-w-2xl mb-8">
            Start free. Upgrade when you're ready to unlock the full exam prep experience.
          </p>

          {/* Billing Toggle (Centered) */}
          <div className="flex flex-col items-center select-none w-full mt-4">
            <label htmlFor="billing-toggle" className="switch" aria-label="Toggle Billing">
              <input 
                type="checkbox" 
                id="billing-toggle" 
                checked={billingCycle === "annual"}
                onChange={(e) => setBillingCycle(e.target.checked ? "annual" : "monthly")}
              />
              <span>Monthly</span>
              <span>
                Annual
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 99,
                    background: billingCycle === "annual" ? "rgba(255, 255, 255, 0.2)" : "var(--row-core-bg-badge)",
                    border: billingCycle === "annual" ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid var(--accent)",
                    color: billingCycle === "annual" ? "#ffffff" : "var(--accent)",
                    transition: "all 200ms ease",
                    marginLeft: 2,
                  }}
                >
                  Save 20%
                </span>
              </span>
            </label>
            {/* Note under toggle */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-sans">
              Billed monthly. Cancel any time.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════
            Section 2 — Pricing Cards
        ════════════════════════════════ */}
        <section className="mb-12 lg:mb-12 max-w-[1140px] mx-auto px-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] gap-8 lg:gap-10 lg:items-center">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════════
            Section 3 — Feature Comparison
        ════════════════════════════════ */}
        <section className="mb-16 w-full px-8">
          <div className="text-left mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold font-serif text-slate-900 dark:text-slate-50 mb-2">
              Compare features
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-sans">
              Choose the plan that fits your learning goals
            </p>
          </div>
          <div className="overflow-x-auto pb-4 w-full">
            <ComparisonTable />
          </div>
        </section>



      </div>
    </>
  );
}
