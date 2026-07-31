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
import { getVisiblePlans, type PlanId } from "@/lib/access";
import PricingPageClient, { type PricingPlan } from "./PricingPageClient";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const ALL_PLANS: Record<PlanId, PricingPlan> = {
  registrar_6mo: {
    id: "registrar_6mo",
    name: "Registrar — 6 Month",
    tagline: "Full exam prep access for your placement",
    badge: null,
    priceDisplay: "1,500",
    priceNote: "One-time payment · 6 months access",
    billingType: "one-time",
    amountAUD: 1500,
    highlight: false,
    features: [
      "Full AKT + KFP exam prep — unlimited questions",
      "Performance analytics & blind-spot detection",
      "Full Note Templates library",
      "Full Medical Library access",
      "MBS Billing page — full access",
      "6 months of access from purchase date",
    ],
    cta: "Get 6-Month Access",
    priceId: process.env.STRIPE_PRICE_REGISTRAR_6MONTH ?? "",
  },
  registrar_12mo: {
    id: "registrar_12mo",
    name: "Registrar — 12 Month",
    tagline: "Best value — full year of exam prep",
    badge: "BEST VALUE",
    priceDisplay: "2,500",
    priceNote: "One-time payment · 12 months access",
    billingType: "one-time",
    amountAUD: 2500,
    highlight: true,
    features: [
      "Everything in the 6-Month plan",
      "12 months of uninterrupted access",
      "Save $500 vs two 6-month purchases",
      "Priority support",
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
      "MBS Billing page — full access",
      "Cancel any time",
    ],
    cta: "Start Monthly Plan",
    priceId: process.env.STRIPE_PRICE_FELLOWSHIP_MONTHLY ?? "",
  },
  fellowship_yearly: {
    id: "fellowship_yearly",
    name: "Fellowship — Annual",
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
      "MBS Billing page — full access",
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
  const dbUser = await prisma.users.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: {
      id: true,
      user_role: true,
      has_purchased_registrar: true,
      subscriptions: {
        select: { access_level: true, status: true, access_expires_at: true },
      },
    },
  });

  if (!dbUser) redirect("/onboarding");

  // Determine which plan IDs this user is allowed to see
  const visiblePlanIds = getVisiblePlans(
    dbUser.user_role as "REGISTRAR" | "FELLOW",
    dbUser.has_purchased_registrar
  );

  // Build ordered plan list for the client
  const plans = visiblePlanIds.map((id) => ALL_PLANS[id]);

  // Determine if the user already has an active subscription to show status
  const activeSub = dbUser.subscriptions;
  const currentAccessLevel =
    activeSub && ["active", "trialing"].includes(activeSub.status)
      ? (activeSub.access_level as string)
      : "FREE";

  return (
    <PricingPageClient
      plans={plans}
      userRole={dbUser.user_role}
      currentAccessLevel={currentAccessLevel}
      accessExpiresAt={activeSub?.access_expires_at?.toISOString() ?? null}
    />
  );
}
