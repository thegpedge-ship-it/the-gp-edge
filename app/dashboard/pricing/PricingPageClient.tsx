"use client";

/**
 * app/dashboard/pricing/PricingPageClient.tsx
 *
 * Premium SaaS Redesign for The GP Edge Pricing Page.
 * UI/UX redesign with 0 changes to backend, Stripe API integration, or role-awareness logic.
 */

import { useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Zap, Star, Repeat, AlertCircle } from "lucide-react";

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  badge: string | null;
  priceDisplay: string;
  priceNote: string;
  billingType: "one-time" | "monthly" | "yearly";
  amountAUD: number;
  highlight: boolean;
  features: string[];
  cta: string;
  priceId: string;
}

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
      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : plan.billingType === "yearly" ? (
      <Repeat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    );

  return (
    <div
      className={`
        relative flex flex-col justify-between w-full max-w-[440px] p-7 
        transition-all duration-500 backdrop-blur-md rounded-[17px] select-none
        hover:scale-105 active:scale-95 active:rotate-[1.7deg]
        ${plan.highlight
          ? "bg-white/90 dark:bg-slate-900/90 border-[1.5px] border-emerald-500/70 dark:border-emerald-500/50 shadow-[12px_17px_51px_rgba(16,185,129,0.15)] dark:shadow-[12px_17px_51px_rgba(0,0,0,0.3)] hover:border-emerald-500"
          : "bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700/50 shadow-[12px_17px_51px_rgba(0,0,0,0.08)] dark:shadow-[12px_17px_51px_rgba(0,0,0,0.22)] hover:border-slate-300 dark:hover:border-slate-500"
        }
      `}
    >
      {/* Top Badge for Featured Plan */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm whitespace-nowrap">
          <Star className="w-3 h-3 fill-current" />
          {plan.badge}
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {plan.name}
            </h3>
            {isCurrentPlan && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                Current Plan
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {plan.tagline}
          </p>
        </div>

        {/* Price Display */}
        <div className="my-5">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">A$</span>
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {plan.priceDisplay}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            {billingIcon}
            <span>{plan.priceNote}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-5" />

        {/* Features list */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature) => {
            const isMuted = feature.toLowerCase().startsWith("no ");
            return (
              <li
                key={feature}
                className={`flex items-start gap-2.5 text-xs md:text-sm ${isMuted
                    ? "text-slate-400 dark:text-slate-600 line-through"
                    : "text-slate-700 dark:text-slate-300"
                  }`}
              >
                {isMuted ? (
                  <span className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5"
                    strokeWidth={2.2}
                  />
                )}
                <span>{feature}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`
          w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer
          disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]
          ${plan.highlight
            ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/20"
            : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm"
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
    ? `Expires ${new Date(accessExpiresAt).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`
    : null;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200/60 dark:border-emerald-800/40 mb-8 select-none max-w-4xl w-full">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          Active plan: {levelLabel[currentAccessLevel] ?? currentAccessLevel}
        </p>
        {expiryText && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{expiryText}</p>
        )}
      </div>
    </div>
  );
}

// ─── Module access summary ────────────────────────────────────────────────────

const MODULE_ACCESS: Record<
  string,
  { page: string; free: string; paid: string; fullPaidOnly?: boolean }[]
> = {
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

// ─── Page Client Component ─────────────────────────────────────────────────────

export default function PricingPageClient({
  plans,
  userRole,
  currentAccessLevel,
  accessExpiresAt,
}: Props) {
  const moduleRows = MODULE_ACCESS[userRole] ?? MODULE_ACCESS.REGISTRAR;

  return (
    <div className="w-full pb-20 pt-4 px-4 md:px-8 max-w-6xl flex flex-col">
      {/* ── Section 1: Hero Section ───────────────────────────────────────── */}
      <section className="mb-12 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
        {/* Left Side Text Content */}
        <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
          {/* Small Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-955/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 uppercase tracking-[0.14em] mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Pricing & Plans
          </div>

          {/* Large Heading */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            {userRole === "FELLOW"
              ? "Fellowship access plans"
              : "Invest in your fellowship success"}
          </h1>

          {/* Short Description */}
          <p className="font-sans text-sm md:text-base font-normal leading-relaxed text-slate-600 dark:text-slate-400">
            {userRole === "FELLOW" ? (
              <>
                Access your clinical tools and templates with a Fellowship plan.
                <br className="hidden sm:inline" />
                Cancel any time. No lock-in contracts.
              </>
            ) : (
              <>
                Choose the access window that fits your exam timeline.
                <br className="hidden sm:inline" />
                One-time payment, no subscription required.
              </>
            )}
          </p>
        </div>

        {/* Right Side Illustration */}
        <div className="shrink-0 flex items-center justify-center w-56 md:w-72 lg:w-80">
          <Image
            src="/assets/graduation_cap_books.png"
            alt="GP Fellowship Exam Success Illustration"
            width={340}
            height={280}
            priority
            className="w-full h-auto object-contain drop-shadow-xl dark:drop-shadow-[0_10px_30px_rgba(255,255,255,0.05)] transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      </section>

      {/* ── Active Access Banner ───────────────────────────────────────────── */}
      <AccessBanner currentAccessLevel={currentAccessLevel} accessExpiresAt={accessExpiresAt} />

      {/* ── Section 2: Pricing Cards ──────────────────────────────────────── */}
      <section className="mb-16 w-full flex justify-center">
        <div
          className={`grid gap-6 md:gap-8 w-full justify-center ${plans.length === 1
              ? "grid-cols-1 max-w-[440px]"
              : plans.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-4xl"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl"
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

      {/* ── Section 3: Feature Comparison / What's Included Table ──────────── */}
      <section className="w-full max-w-4xl">
        <div className="mb-6 text-left">
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 dark:text-slate-50 mb-1">
            What&apos;s included
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-sans">
            Access limits by module and tier
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="w-[45%] py-4 px-6 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-left">
                  Module
                </th>
                <th className="w-[27.5%] py-4 px-6 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-left">
                  Free Tier
                </th>
                <th className="w-[27.5%] py-4 px-6 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-955/30 text-left">
                  Paid Plans
                </th>
              </tr>
            </thead>
            <tbody>
              {moduleRows.map((row, i) => {
                const isLast = i === moduleRows.length - 1;
                return (
                  <tr
                    key={row.page}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${!isLast ? "border-b border-slate-100 dark:border-slate-800/60" : ""
                      }`}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 text-left">
                      <span>{row.page}</span>
                      {row.fullPaidOnly && (
                        <span className="ml-2 inline-block text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Registrar only
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-left">
                      {row.free}
                    </td>
                    <td className="py-4 px-6 bg-emerald-50/30 dark:bg-emerald-955/10 text-emerald-700 dark:text-emerald-300 font-bold text-left">
                      {row.paid}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-sans">
          Free tier usage limits are lifetime quotas and do not refresh. Once exhausted, upgrading to a paid plan restores full access.
        </p>
      </section>
    </div>
  );
}
