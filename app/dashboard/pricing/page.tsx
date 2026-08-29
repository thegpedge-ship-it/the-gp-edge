/**
 * app/dashboard/pricing/page.tsx
 *
 * Role-aware pricing page.
 * Server Component: reads user role + purchase history from DB, then renders
 * only the plans the current user is eligible to see.
 *
 * Visibility rules (enforced server-side via getVisiblePlans):
 *   Rule 1: REGISTRAR + has_purchased=false  → $1,500 & $2,500 Registrar plans
 *   Rule 2: REGISTRAR + has_purchased=true   → $15/mo Post-Reg Upgrade + Registrar plans
 *   Rule 3: FELLOW   + has_purchased=true    → $15/mo Post-Reg Upgrade only
 *   Rule 4: FELLOW   + has_purchased=false   → $30/mo & $300/yr Fellowship plans
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getVisiblePlans, getUserAccess, type PlanId } from "@/lib/access";
import PricingPageClient, { type PricingPlan } from "./PricingPageClient";

// Force a fresh DB read — subscription expiry must be evaluated live.
export const dynamic = "force-dynamic";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const ALL_PLANS: Record<PlanId, PricingPlan> = {
  registrar_6mo: {
    id: "registrar_6mo",
    name: "6-Month Exam Prep Plan",
    tagline: "Full exam prep access for your placement",
    badge: null,
    priceDisplay: "880",
    priceNote: "One-time payment · 6 months access",
    billingType: "one-time",
    amountAUD: 880,
    highlight: false,
    features: [
      "Unlimited AKT & KFP exam-level questions",
      "Deep explanations with guidelines reference",
      "Custom quiz builder, mocks & adaptive mode",
      "Full curriculum tracking & peer benchmarking",
      "Weekly updates when clinical guidelines change",
      "6 months of uninterrupted access",
    ],
    cta: "Get 6-Month Access",
    priceId: process.env.STRIPE_PRICE_REGISTRAR_6MONTH ?? "",
  },
  registrar_12mo: {
    id: "registrar_12mo",
    name: "12-Month Exam Prep Plan",
    tagline: "Best value - full year of exam prep",
    badge: "BEST VALUE",
    priceDisplay: "1,250",
    priceNote: "One-time payment · 12 months access",
    billingType: "one-time",
    amountAUD: 1250,
    highlight: true,
    features: [
      "Everything in the 6-Month plan",
      "12 months of uninterrupted access",
      "Save $510 vs two 6-month purchases",
      "Priority clinical support",
    ],
    cta: "Get 12-Month Access",
    priceId: process.env.STRIPE_PRICE_REGISTRAR_12MONTH ?? "",
  },
  fellowship_monthly: {
    id: "fellowship_monthly",
    name: "Fellowship",
    tagline: "Monthly access for Fellows",
    badge: null,
    priceDisplay: "30",
    priceNote: "AUD / month · Cancel any time",
    billingType: "monthly",
    amountAUD: 30,
    highlight: false,
    features: [
      "Full Note Templates library",
      "Full Medical Library access",
      "MBS Billing page - full access",
      "Cancel any time",
    ],
    cta: "Start Monthly Plan",
    priceId: process.env.STRIPE_PRICE_FELLOWSHIP_MONTHLY ?? "",
  },
  fellowship_yearly: {
    id: "fellowship_yearly",
    name: "Fellowship - Annual",
    tagline: "Save with a full year upfront",
    badge: "SAVE 17%",
    priceDisplay: "300",
    priceNote: "AUD / year · Save $60 vs monthly",
    billingType: "yearly",
    amountAUD: 300,
    highlight: true,
    features: [
      "Everything in Fellowship Monthly",
      "Pay once, save $60 per year",
      "Annual billing",
    ],
    cta: "Start Annual Plan",
    priceId: process.env.STRIPE_PRICE_FELLOWSHIP_YEARLY ?? "",
  },
  post_registrar_upgrade: {
    id: "post_registrar_upgrade",
    name: "Post-Registrar Upgrade",
    tagline: "Keep your clinical tools after fellowship",
    badge: null,
    priceDisplay: "15",
    priceNote: "AUD / month · Cancel any time",
    billingType: "monthly",
    amountAUD: 15,
    highlight: false,
    features: [
      "Full Note Templates library",
      "Full Medical Library access",
      "MBS Billing page - full access",
      "No exam prep (not included at this tier)",
      "Cancel any time",
    ],
    cta: "Start Upgrade Plan",
    priceId: process.env.STRIPE_PRICE_POST_REGISTRAR_MONTHLY ?? "",
  },
};

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function PricingPage() {
  // Auth
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  // Fetch user role + purchase history from DB
  let dbUser: any = null;
  try {
    dbUser = await prisma.users.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: {
        id: true,
        user_role: true,
        training_stage: true,
        role_title: true,
        has_purchased_registrar: true,
        subscriptions: {
          select: { access_level: true, status: true, access_expires_at: true, cancel_at: true, stripe_price_id: true },
        },
      },
    });
  } catch (err) {
    console.warn("[PricingPage] training_stage fallback triggered:", err);
    dbUser = await prisma.users.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: {
        id: true,
        user_role: true,
        role_title: true,
        has_purchased_registrar: true,
        subscriptions: {
          select: { access_level: true, status: true, access_expires_at: true, cancel_at: true, stripe_price_id: true },
        },
      },
    });
  }

  if (!dbUser) redirect("/onboarding");

  const isFellow =
    String(dbUser.training_stage ?? "").toUpperCase() === "FELLOW" ||
    String(dbUser.user_role ?? "").toUpperCase() === "FELLOW" ||
    String(dbUser.role_title ?? "").toLowerCase().includes("fellow") ||
    String(dbUser.role_title ?? "").toLowerCase().includes("post-reg");

  const trainingStage = isFellow ? "FELLOW" : "REGISTRAR";
  const userRole = isFellow ? "FELLOW" : "REGISTRAR";

  // Build ordered plan list for the client (universally showing only 6-month and 12-month Exam Prep plans)
  const visiblePlanIds: PlanId[] = ["registrar_6mo", "registrar_12mo"];
  const plans = visiblePlanIds.map((id) => {
    const plan = { ...ALL_PLANS[id] };
    return plan;
  });

  // Determine if the user already has an active, non-expired subscription.
  // NOTE: We check both status AND access_expires_at here because getUserAccess
  // auto-expires rows on the next authenticated request — but this page does its
  // own inline query. Checking access_expires_at ensures correct behavior even
  // if the auto-expiry hasn't run yet (e.g. very first load after manual DB edit).
  const now = new Date();
  const activeSub = Array.isArray(dbUser.subscriptions)
    ? dbUser.subscriptions.find(
        (s: { status: string; access_level: string; access_expires_at: Date | null; cancel_at: Date | null; stripe_price_id: string | null }) =>
          (s.status === "active" || s.status === "trialing") &&
          s.access_expires_at != null &&
          new Date(s.access_expires_at) > now
      ) ?? null
    : null;

  const currentAccessLevel =
    activeSub
      ? (activeSub.access_level as string)
      : dbUser.has_purchased_registrar
      ? "REGISTRAR"
      : "FREE";

  const accessInfo = await getUserAccess(dbUser.id);

  return (
    <PricingPageClient
      plans={plans}
      userRole={dbUser.user_role}
      trainingStage={trainingStage}
      currentAccessLevel={currentAccessLevel}
      accessExpiresAt={activeSub?.access_expires_at?.toISOString() ?? null}
      cancelAtPeriodEnd={activeSub?.cancel_at != null}
      activePriceId={activeSub?.stripe_price_id ?? null}
      hasPaidAccess={currentAccessLevel !== "FREE" || dbUser.has_purchased_registrar}
      hasPurchasedRegistrar={dbUser.has_purchased_registrar}
      activePlanName={accessInfo?.planName ?? null}
    />
  );
}
