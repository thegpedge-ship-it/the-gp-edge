"use client";

/**
 * app/dashboard/pricing/PricingPageClient.tsx
 *
 * Client component for the pricing page.
 * Receives the server-filtered plan list and renders the UI.
 * Handles the Stripe checkout redirect on CTA click.
 */

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Zap, Star, Repeat, AlertCircle } from "lucide-react";
import type { PricingPlan } from "./page";

interface Props {
  plans: PricingPlan[];
  userRole: string;
  currentAccessLevel: string;
  accessExpiresAt: string | null;
}

// ─── Checkout handler ─────────────────────────────────────────────────────────

async function startCheckout(priceId: string): Promise<void> {
  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to start checkout");
  }

  const { url } = await res.json();
  if (url) window.location.href = url;
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentAccessLevel,
}: {
  plan: PricingPlan;
  currentAccessLevel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isCurrentPlan =
    (plan.id === "registrar_6mo" || plan.id === "registrar_12mo") &&
    currentAccessLevel === "REGISTRAR";

  function handleClick() {
    setError(null);

    if (!plan.priceId || (plan.priceId.startsWith("price_") && plan.priceId.endsWith("_here"))) {
      setError("Stripe Price ID is not configured in .env. Please update your environment variables with real Stripe Price IDs.");
      return;
    }

    startTransition(async () => {
      try {
        await startCheckout(plan.priceId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const billingIcon =
    plan.billingType === "one-time" ? (
      <Zap className="w-3 h-3" />
    ) : plan.billingType === "yearly" ? (
      <Repeat className="w-3 h-3" />
    ) : (
      <Clock className="w-3 h-3" />
    );

  return (
    <div
      className={`
        relative flex flex-col rounded-[22px] border p-7 transition-all duration-200
        ${plan.highlight
          ? "border-teal-400/60 dark:border-teal-500/40 bg-gradient-to-b from-teal-50/80 to-white dark:from-teal-950/30 dark:to-slate-900/80 shadow-lg shadow-teal-100/50 dark:shadow-teal-950/30"
          : "border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 shadow-md"
        }
      `}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm whitespace-nowrap">
          <Star className="w-3 h-3 fill-current" />
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
            {plan.name}
          </h3>
          {isCurrentPlan && (
            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-wider">
              Current Plan
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">A$</span>
          <span className="text-5xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
            {plan.priceDisplay}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {billingIcon}
          <span>{plan.priceNote}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800/60 mb-5" />

      {/* Features */}
      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
        {plan.features.map((feature) => {
          const isMuted = feature.toLowerCase().startsWith("no ");
          return (
            <li
              key={feature}
              className={`flex items-start gap-2.5 text-sm ${
                isMuted ? "text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {isMuted ? (
                <span className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              )}
              {feature}
            </li>
          );
        })}
      </ul>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`
          w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
          ${plan.highlight
            ? "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-sm hover:shadow"
            : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
          }
        `}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8v8z" fill="currentColor" className="opacity-75" />
            </svg>
            Redirecting to checkout…
          </span>
        ) : (
          plan.cta
        )}
      </button>
    </div>
  );
}

// ─── Access level banner ──────────────────────────────────────────────────────

function AccessBanner({
  currentAccessLevel,
  accessExpiresAt,
}: {
  currentAccessLevel: string;
  accessExpiresAt: string | null;
}) {
  if (currentAccessLevel === "FREE") return null;

  const levelLabel: Record<string, string> = {
    REGISTRAR: "Registrar",
    FELLOWSHIP: "Fellowship",
    POST_REGISTRAR_UPGRADE: "Post-Registrar Upgrade",
  };

  const expiryText = accessExpiresAt
    ? `Expires ${new Date(accessExpiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
    : null;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 mb-8 select-none">
      <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" strokeWidth={2} />
      <div>
        <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
          Active plan: {levelLabel[currentAccessLevel] ?? currentAccessLevel}
        </p>
        {expiryText && (
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{expiryText}</p>
        )}
      </div>
    </div>
  );
}

// ─── Module access summary ────────────────────────────────────────────────────

const MODULE_ACCESS: Record<string, { page: string; free: string; paid: string; fullPaidOnly?: boolean }[]> = {
  REGISTRAR: [
    { page: "Exam Prep (AKT & KFP)", free: "15 questions (lifetime)", paid: "Unlimited", fullPaidOnly: true },
    { page: "Note Templates", free: "5 templates (lifetime)", paid: "Full access" },
    { page: "Medical Library", free: "10 topics (lifetime)", paid: "Full access" },
    { page: "MBS Billing", free: "Locked", paid: "Full access" },
  ],
  FELLOW: [
    { page: "Exam Prep (AKT & KFP)", free: "15 questions (lifetime)", paid: "Not included" },
    { page: "Note Templates", free: "5 templates (lifetime)", paid: "Full access" },
    { page: "Medical Library", free: "10 topics (lifetime)", paid: "Full access" },
    { page: "MBS Billing", free: "Locked", paid: "Full access" },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPageClient({
  plans,
  userRole,
  currentAccessLevel,
  accessExpiresAt,
}: Props) {
  const moduleRows = MODULE_ACCESS[userRole] ?? MODULE_ACCESS.REGISTRAR;

  return (
    <>
      <style>{`
        :root {
          --accent: #0d9488;
        }
        .dark {
          --accent: #5AC8B0;
        }
      `}</style>

      <div className="w-full pb-16 pt-2 flex flex-col">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="mb-8 flex flex-col items-start text-left px-1 w-full">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-955/30 text-[10px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-800/30 uppercase tracking-[0.12em] mb-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
            </span>
            Pricing & Plans
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50 mb-3 max-w-3xl">
            {userRole === "FELLOW"
              ? "Fellowship access plans"
              : "Invest in your fellowship success"}
          </h1>
          <p className="font-sans text-lg md:text-xl font-normal leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl">
            {userRole === "FELLOW"
              ? "Access your clinical tools and templates with a Fellowship plan."
              : "Choose the access window that fits your exam timeline. One-time payment, no subscription required."}
          </p>
        </section>

        {/* ── Current plan banner ───────────────────────────────────────────── */}
        <div className="px-1">
          <AccessBanner currentAccessLevel={currentAccessLevel} accessExpiresAt={accessExpiresAt} />
        </div>

        {/* ── Plan cards ────────────────────────────────────────────────────── */}
        <section className="mb-14 px-1 w-full">
          <div
            className={`grid gap-6 ${
              plans.length === 1
                ? "grid-cols-1 max-w-sm"
                : plans.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentAccessLevel={currentAccessLevel}
              />
            ))}
          </div>
        </section>

        {/* ── Module access table ───────────────────────────────────────────── */}
        <section className="px-1 w-full">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold font-serif text-slate-900 dark:text-slate-50 mb-1">
              What's included
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-sans">
              Access limits by module and tier
            </p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[560px] rounded-[18px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th className="w-[45%] text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      Module
                    </th>
                    <th className="w-[27.5%] text-center py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      Free Tier
                    </th>
                    <th className="w-[27.5%] text-center py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 border-b border-teal-100 dark:border-teal-900/40 bg-teal-50/60 dark:bg-teal-950/20">
                      Paid Plans
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {moduleRows.map((row, i) => {
                    const isLast = i === moduleRows.length - 1;
                    return (
                      <tr key={row.page} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className={`py-4 px-6 font-medium text-slate-800 dark:text-slate-200 ${!isLast ? "border-b border-slate-100 dark:border-slate-800/50" : ""}`}>
                          {row.page}
                          {row.fullPaidOnly && (
                            <span className="ml-2 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Registrar only
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-4 text-center text-slate-500 dark:text-slate-400 ${!isLast ? "border-b border-slate-100 dark:border-slate-800/50" : ""}`}>
                          {row.free}
                        </td>
                        <td className={`py-4 px-4 text-center bg-teal-50/40 dark:bg-teal-950/10 text-teal-700 dark:text-teal-300 font-medium ${!isLast ? "border-b border-teal-100/60 dark:border-teal-900/30" : ""}`}>
                          {row.paid}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-sans">
            Free tier usage limits are lifetime quotas and do not refresh.
            Once exhausted, upgrading to a paid plan restores full access.
          </p>
        </section>
      </div>
    </>
  );
}
