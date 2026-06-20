"use client";

import { useState } from "react";

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
  { feature: "AKT quiz questions", free: "—", core: "Unlimited", premium: "Unlimited" },
  { feature: "KFP cases", free: "—", core: "Unlimited", premium: "Unlimited" },
  { feature: "Performance analytics", free: "—", core: "✓", premium: "✓" },
  { feature: "Blind spot detection", free: "—", core: "✓", premium: "✓" },
  { feature: "Autofills library", free: "50 templates", core: "Full access", premium: "Full access" },
  { feature: "Learn-a-Thing access", free: "30 conditions", core: "Full access", premium: "Full access" },
  { feature: "AI tutor", free: "—", core: "—", premium: "✓" },
  { feature: "Personalised study schedule", free: "—", core: "—", premium: "✓" },
  { feature: "Priority support", free: "—", core: "—", premium: "✓" },
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
        minHeight: plan.highlight ? "440px" : "400px",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: "240px" }}>
          {plan.features.map((feature) => {
            const isMuted = feature.toLowerCase().startsWith("no ");
            return (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  fontSize: 12.5,
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
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1.5px solid var(--row-border)",
        overflow: "hidden",
        background: "var(--row-bg)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--table-header-bg)",
              borderBottom: "1.5px solid var(--row-border)",
            }}
          >
            <th
              style={{
                padding: "10px 20px",
                textAlign: "left",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
                width: "38%",
              }}
            >
              Features
            </th>
            <th
              style={{
                padding: "10px 20px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Free
            </th>
            <th
              style={{
                padding: "10px 20px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Core
            </th>
            <th
              style={{
                padding: "10px 20px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Premium
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => {
            const isAlt = i % 2 !== 0;
            return (
              <tr
                key={row.feature}
                style={{
                  background: isAlt ? "var(--table-alt-bg)" : "transparent",
                  borderBottom:
                    i < COMPARISON_ROWS.length - 1
                      ? "1px solid var(--row-border)"
                      : "none",
                }}
              >
                <td
                  style={{
                    padding: "11px 20px",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {row.feature}
                </td>
                <td
                  style={{
                    padding: "11px 20px",
                    textAlign: "center",
                    color:
                      row.free === "—" ? "var(--text-muted)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    fontWeight: row.free !== "—" ? 500 : 400,
                  }}
                >
                  {row.free}
                </td>
                <td
                  style={{
                    padding: "11px 20px",
                    textAlign: "center",
                    color:
                      row.core === "—" ? "var(--text-muted)" : "var(--accent)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    fontWeight: row.core !== "—" ? 600 : 400,
                  }}
                >
                  {row.core}
                </td>
                <td
                  style={{
                    padding: "11px 20px",
                    textAlign: "center",
                    color:
                      row.premium === "—"
                        ? "var(--text-muted)"
                        : "var(--text-secondary)",
                    fontSize: 13,
                    fontFamily: "var(--font-sans)",
                    fontWeight: row.premium !== "—" ? 500 : 400,
                  }}
                >
                  {row.premium}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UpgradeJourney() {
  return (
    <div className="upgrade-journey">
      {JOURNEY_STEPS.map((step, i) => (
        <div key={step.n} className="journey-step-wrapper">
          <div
            style={{
              flex: 1,
              padding: "20px 22px",
              borderRadius: 14,
              border: "1.5px solid var(--row-border)",
              background: "var(--row-bg)",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--row-core-bg)",
                border: "1.5px solid var(--row-core-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
                fontFamily: "var(--font-sans)",
                marginBottom: 10,
                flexShrink: 0,
              }}
            >
              {step.n}
            </div>
            <p
              style={{
                margin: "0 0 5px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {step.title}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.55,
              }}
            >
              {step.desc}
            </p>
          </div>

          {i < JOURNEY_STEPS.length - 1 && (
            <div
              className="journey-arrow"
              style={{
                color: "var(--text-muted)",
                fontSize: 18,
                flexShrink: 0,
                userSelect: "none",
              }}
            >
              →
            </div>
          )}
        </div>
      ))}
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
            height: 480px !important;
            box-shadow: var(--row-shadow-hover) !important;
            z-index: 10;
          }
          .pricing-card-standard {
            height: 430px !important;
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
        <section className="mb-6 flex flex-col items-center text-center max-w-[1040px] mx-auto px-4 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-955/30 text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-800/30 uppercase tracking-[0.12em] mb-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
            </span>
            Simple, transparent pricing
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 mb-1">
            Invest in your fellowship success
          </h1>

          {/* Description */}
          <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-1 max-w-2xl mb-4">
            Start free. Upgrade when you're ready to unlock the full exam prep experience.
          </p>

          {/* Billing Toggle (Centered) */}
          <div className="flex flex-col items-center select-none">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full relative">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`w-20 py-1.5 text-xs font-semibold rounded-full relative z-10 transition-colors duration-200 ${billingCycle === "monthly"
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`w-36 py-1.5 text-xs font-semibold rounded-full relative z-10 transition-colors duration-200 flex items-center justify-center gap-1.5 ${billingCycle === "annual"
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
                  }`}
              >
                <span>Annual</span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 99,
                    background: billingCycle === "annual" ? "rgba(255, 255, 255, 0.2)" : "var(--row-core-bg-badge)",
                    border: billingCycle === "annual" ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid var(--accent)",
                    color: billingCycle === "annual" ? "#ffffff" : "var(--accent)",
                    transition: "all 200ms ease",
                  }}
                >
                  Save 20%
                </span>
              </button>
              {/* Sliding green background indicator */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: billingCycle === "monthly" ? 4 : 88,
                  width: billingCycle === "monthly" ? 80 : 144,
                  height: "calc(100% - 8px)",
                  background: "var(--accent)",
                  borderRadius: 9999,
                  transition: "left 250ms cubic-bezier(0.22, 1, 0.36, 1), width 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
            {/* Note under toggle */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Billed monthly. Cancel any time.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════
            Section 2 — Pricing Cards
        ════════════════════════════════ */}
        <section className="mb-12 lg:mb-12 max-w-[1040px] mx-auto px-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] gap-6 lg:gap-6 lg:items-center">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />
            ))}
          </div>
        </section>

        {/* ════════════════════════════════
            Section 3 — Feature Comparison
        ════════════════════════════════ */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold font-serif text-slate-900 dark:text-slate-50 mb-6">
            Compare features
          </h2>
          <ComparisonTable />
        </section>

        {/* ════════════════════════════════
            Section 4 — Upgrade Journey
        ════════════════════════════════ */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold font-serif text-slate-900 dark:text-slate-50 mb-6">
            Your upgrade journey
          </h2>
          <UpgradeJourney />
        </section>

      </div>
    </>
  );
}
