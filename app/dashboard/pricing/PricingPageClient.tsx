"use client";

/**
 * app/dashboard/pricing/PricingPageClient.tsx
 *
 * Premium SaaS Redesign for The GP Edge Pricing Page.
 * UI/UX redesign with 0 changes to backend, Stripe API integration, or role-awareness logic.
 */

import { useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Zap, Star, Repeat, AlertCircle, Calendar, Award, CreditCard, FileText, Loader2, X } from "lucide-react";
import DuplicatePurchaseModal from "@/components/dashboard/DuplicatePurchaseModal";
import CancellationSurveyModal from "@/components/dashboard/CancellationSurveyModal";
import { createBillingPortalSessionAction, getLatestInvoicePdfAction } from "@/actions/stripe.actions";

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  badge: string | null;
  priceDisplay: string;
  strikeThroughPrice?: string;
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
  trainingStage?: "REGISTRAR" | "FELLOW" | "OTHER";
  currentAccessLevel: string;
  accessExpiresAt: string | null;
  cancelAtPeriodEnd?: boolean;
  activePriceId?: string | null;
  hasPaidAccess?: boolean;
  hasPurchasedRegistrar?: boolean;
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
  hasPaidAccess,
  activePriceId,
  accessExpiresAt,
  onAttemptActivePurchase,
}: {
  plan: PricingPlan;
  currentAccessLevel: string;
  hasPaidAccess?: boolean;
  activePriceId?: string | null;
  accessExpiresAt?: string | null;
  onAttemptActivePurchase: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  
  // 1. Check if the user's access term is currently valid
  const isAccessActive = accessExpiresAt != null && new Date(accessExpiresAt) > now;
  
  // 2. Identify the EXACT plan card using the original Price ID
  const isThisSpecificPlan = isAccessActive && Boolean(activePriceId) && plan.priceId === activePriceId;

  // Formatting expiration string
  let expiryDisplay = null;
  if (isThisSpecificPlan && accessExpiresAt) {
    const expDate = new Date(accessExpiresAt);
    const diffTime = Math.max(0, expDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formatter = new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    expiryDisplay = `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${formatter.format(expDate)})`;
  }

  function handleClick() {
    setError(null);

    // Active Subscription Guard: Block duplicate checkout if user already has an active paid plan
    if (hasPaidAccess) {
      onAttemptActivePurchase();
      return;
    }

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

  return (
    <div
      className="
        relative flex flex-col justify-between w-full max-w-md mx-auto p-6 md:p-7 
        transition-all duration-500 rounded-[20px] select-none
        hover:scale-[1.02] active:scale-[0.99]
        bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700
      "
    >
      {/* Top Badge for Active Plan */}
      {isThisSpecificPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-white text-[10px] font-extrabold tracking-widest uppercase shadow-sm whitespace-nowrap bg-emerald-600 dark:bg-emerald-500">
          <Star className="w-3 h-3 fill-current" />
          Your Active Plan
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {plan.name}
            </h3>
          </div>
          {expiryDisplay && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2.5 py-0.5 inline-block">
              {expiryDisplay}
            </p>
          )}
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {plan.tagline}
          </p>
        </div>

        {/* Price Display */}
        <div className="my-5">
          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
            {plan.strikeThroughPrice && (
              <span className="text-xl md:text-2xl font-bold text-slate-400 dark:text-slate-500 line-through decoration-red-500/80 mr-1">
                AUD {plan.strikeThroughPrice}
              </span>
            )}
            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">AUD</span>
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
              {plan.priceDisplay}
            </span>
            {plan.billingType === "monthly" && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/month</span>
            )}
            {plan.billingType === "yearly" && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/year</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
            {plan.billingType === "one-time" ? (
              <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            )}
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
                className={`flex items-start gap-3 text-xs md:text-sm ${
                  isMuted
                    ? "text-slate-400 dark:text-slate-600 line-through"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${
                    isMuted
                      ? "bg-slate-300 dark:bg-slate-700"
                      : "bg-emerald-600 dark:bg-emerald-400"
                  }`}
                />
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
        disabled={isPending || isThisSpecificPlan}
        className={`
          w-full py-3.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer
          disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]
          ${isThisSpecificPlan
            ? "bg-emerald-100 dark:bg-emerald-955/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/80 shadow-sm"
            : "bg-[#387e59] hover:bg-[#2d6648] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20"
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
        ) : isThisSpecificPlan ? (
          "Current Active Plan"
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
  cancelAtPeriodEnd,
}: {
  currentAccessLevel: string;
  accessExpiresAt: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const [pendingAction, setPendingAction] = useState<"invoice" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  function handlePortalRedirect(actionType: "invoice" | "cancel") {
    setError(null);
    setPendingAction(actionType);

    const actionPromise = actionType === "invoice" 
      ? getLatestInvoicePdfAction() 
      : createBillingPortalSessionAction();

    actionPromise.then((res) => {
      if (res.url) {
        if (actionType === "invoice") {
          window.open(res.url, '_blank');
          setPendingAction(null);
        } else {
          window.location.href = res.url;
        }
      } else {
        setError(res.error || (actionType === "invoice" ? "Could not fetch invoice PDF." : "Could not launch Stripe billing portal."));
        setPendingAction(null);
      }
    }).catch(() => {
      setError("An unexpected error occurred.");
      setPendingAction(null);
    });
  }

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
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-5 rounded-2xl bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-200/60 dark:border-emerald-800/40 mb-8 select-none max-w-4xl w-full mx-auto">
      <div className="flex items-center gap-3 w-full">
        <div>
          <p className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
            Active plan: {levelLabel[currentAccessLevel] ?? currentAccessLevel}
            {cancelAtPeriodEnd && <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-xl">Canceled</span>}
          </p>
          {expiryText && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">{expiryText}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={() => handlePortalRedirect("invoice")}
          disabled={pendingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          {pendingAction === "invoice" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Download Invoices
        </button>
        <button
          type="button"
          onClick={() => {
            if (!cancelAtPeriodEnd) {
              setShowCancelModal(true);
            } else {
              handlePortalRedirect("cancel");
            }
          }}
          disabled={pendingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          {pendingAction === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {cancelAtPeriodEnd ? "Reactivate Subscription" : "Cancel Subscription"}
        </button>
      </div>

      {error && (
        <div className="fixed top-24 right-6 z-[100] max-w-sm p-4 rounded-xl bg-red-50/95 dark:bg-red-950/95 border border-red-500/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold">Action failed</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <CancellationSurveyModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
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
  trainingStage = "REGISTRAR",
  currentAccessLevel,
  accessExpiresAt,
  cancelAtPeriodEnd,
  activePriceId,
  hasPaidAccess,
  hasPurchasedRegistrar,
}: Props) {
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const isFellow =
    String(trainingStage ?? "").toUpperCase() === "FELLOW" ||
    String(userRole ?? "").toUpperCase() === "FELLOW";

  // STRICT RULE ENFORCEMENT:
  // 1. FELLOW: Never show $1,500 (registrar_6mo) or $2,500 (registrar_12mo) packages under any circumstance.
  // 2. REGISTRAR: Never show $30/mo (fellowship_monthly) or $300/yr (fellowship_yearly) subscriptions under any circumstance.
  const sanitizedPlans = isFellow
    ? plans.filter((p) => p.id !== "registrar_6mo" && p.id !== "registrar_12mo")
    : plans.filter((p) => p.id !== "fellowship_monthly" && p.id !== "fellowship_yearly");

  const orderedPlans = [...sanitizedPlans].sort((a, b) => a.amountAUD - b.amountAUD);

  const moduleRows = MODULE_ACCESS[isFellow ? "FELLOW" : "REGISTRAR"] ?? MODULE_ACCESS.REGISTRAR;

  return (
    <>
      <DuplicatePurchaseModal
        open={showDuplicateModal}
        accessExpiresAt={accessExpiresAt}
        onClose={() => setShowDuplicateModal(false)}
      />

      <div className="w-full pb-20 pt-4 px-4 md:px-8 max-w-7xl flex flex-col mx-auto">
        {/* ── Section 1: Hero Section ───────────────────────────────────────── */}
        <section className="mb-12 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
          {/* Left Side Text Content */}
          <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-955/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 uppercase tracking-[0.14em] mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {isFellow ? "Post-Registrar & Fellow Plans" : "Registrar & Exam Prep Plans"}
            </div>

            {/* Large Heading */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              {isFellow
                ? "Fellowship & Clinical Tools Plans"
                : "Invest in your fellowship success"}
            </h1>


          </div>

          {/* Right Side Illustration */}
          <div className="shrink-0 flex items-center justify-center w-56 md:w-72 lg:w-80">
            <Image
              src="/assets/pricing_page.png"
              alt="GP Fellowship Exam Success Illustration"
              width={340}
              height={280}
              priority
              className="w-full h-auto object-contain drop-shadow-xl dark:drop-shadow-[0_10px_30px_rgba(255,255,255,0.05)] transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </section>

        {/* ── Active Access Banner ───────────────────────────────────────────── */}
        <AccessBanner 
          currentAccessLevel={currentAccessLevel} 
          accessExpiresAt={accessExpiresAt} 
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />

        {/* ── Section 2: Pricing Cards ──────────────────────────────────────── */}
        <section className="mb-16 w-full flex justify-center">
          <div
            className={`grid gap-6 w-full mx-auto justify-center ${
              orderedPlans.length === 1
                ? "grid-cols-1 max-w-md"
                : orderedPlans.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-4xl"
                : "grid-cols-1 md:grid-cols-3 max-w-7xl"
            }`}
          >
            {orderedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentAccessLevel={currentAccessLevel}
                hasPaidAccess={hasPaidAccess}
                activePriceId={activePriceId}
                accessExpiresAt={accessExpiresAt}
                onAttemptActivePurchase={() => setShowDuplicateModal(true)}
              />
            ))}
          </div>
        </section>

        {/* ── Section 3: Feature Comparison / What's Included Table ──────────── */}
        <section className="w-full">
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
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        !isLast ? "border-b border-slate-100 dark:border-slate-800/60" : ""
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 text-left">
                        <span>{row.page}</span>
                        {row.fullPaidOnly && (
                          <span className="ml-2 inline-block text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-xl uppercase tracking-wider">
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
    </>
  );
}
