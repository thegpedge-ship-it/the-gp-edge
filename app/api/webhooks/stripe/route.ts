/**
 * app/api/webhooks/stripe/route.ts
 *
 * POST /api/webhooks/stripe
 *
 * Receives and processes Stripe webhook events.
 *
 * ⚠️  IMPORTANT — Raw body requirement:
 *   Stripe's signature verification (stripe.webhooks.constructEvent) requires
 *   the EXACT raw bytes of the request body — NOT the parsed JSON object.
 *   We use `await req.text()` to get the raw string before any parsing.
 *
 * Events handled:
 *   checkout.session.completed        — new purchase (payment or subscription)
 *   customer.subscription.created     — initial subscription object creation
 *   customer.subscription.updated     — renewals, plan changes
 *   customer.subscription.deleted     — cancellation / non-renewal
 *   invoice.payment_failed            — failed recurring charge
 *
 * ─── WHY upsert({ where: { provider_sub_id } }) instead of { user_id } ─────
 *   The subscriptions.user_id column has a PARTIAL unique index
 *   (WHERE status IN ['active','trialing','past_due']). Prisma's upsert()
 *   requires a FULL unique constraint — partial indexes are not supported.
 *   Using provider_sub_id (which is a full @unique) as the upsert key
 *   is the correct approach for recurring subscriptions.
 *   For one-time payments, stripe_checkout_session_id (also @unique) is used.
 */

import { NextResponse } from "next/server";
import {
  stripe,
  REGISTRAR_PRICE_IDS,
  REGISTRAR_ACCESS_MONTHS,
  priceIdToAccessLevel,
} from "@/lib/stripe";
import { forfeitFreeQuota } from "@/lib/module-gates";
import prisma from "@/lib/prisma";
import type Stripe from "stripe";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Resolve the Neon DB user ID from a Stripe event payload using
 * a 3-tier fallback strategy.
 *
 * Tier 1: client_reference_id / metadata.userId (set at checkout creation)
 * Tier 2: match by stripe_customer_id persisted on the users record
 * Tier 3: fetch customer email from Stripe API → match users.email
 */
async function resolveUserId(
  tier1Id: string | null | undefined,
  stripeCustomerId: string | null | undefined,
  customerDetailsEmail?: string | null
): Promise<string | null> {
  // Tier 1
  if (tier1Id) {
    console.log("[webhook/resolveUserId] ✅ Tier 1: userId from metadata:", tier1Id);
    return tier1Id;
  }

  // Tier 2: match by stripe_customer_id in DB
  if (stripeCustomerId) {
    const matched = await prisma.users.findUnique({
      where: { stripe_customer_id: stripeCustomerId },
      select: { id: true },
    });
    if (matched) {
      console.log("[webhook/resolveUserId] ✅ Tier 2: userId via stripe_customer_id:", matched.id);
      return matched.id;
    }
  }

  // Tier 3a: match by customer_details.email (checkout sessions)
  if (customerDetailsEmail) {
    const matched = await prisma.users.findUnique({
      where: { email: customerDetailsEmail },
      select: { id: true },
    });
    if (matched) {
      console.log("[webhook/resolveUserId] ✅ Tier 3a: userId via customer_details.email:", matched.id);
      return matched.id;
    }
  }

  // Tier 3b: fetch customer from Stripe API and match by email
  if (stripeCustomerId) {
    try {
      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (!stripeCustomer.deleted) {
        const email = (stripeCustomer as Stripe.Customer).email;
        if (email) {
          const matched = await prisma.users.findUnique({
            where: { email },
            select: { id: true },
          });
          if (matched) {
            console.log("[webhook/resolveUserId] ✅ Tier 3b: userId via Stripe customer email:", matched.id);
            return matched.id;
          }
        }
      }
    } catch (err) {
      console.warn("[webhook/resolveUserId] Stripe customer email lookup failed:", err);
    }
  }

  console.error(
    "[webhook/resolveUserId] ❌ All tiers exhausted — could not resolve userId.",
    { stripeCustomerId, customerDetailsEmail }
  );
  return null;
}

/**
 * Look up a real plan_id from the DB by slug, with fallback to first plan.
 * Returns null if no plans exist (should never happen in production).
 */
async function resolvePlanId(slug: string): Promise<string | null> {
  const plan = await prisma.plans.findUnique({ where: { slug }, select: { id: true } });
  if (plan) return plan.id;

  // Fallback: any active plan
  const fallback = await prisma.plans.findFirst({
    where: { is_active: true },
    select: { id: true },
    orderBy: { sort_order: "asc" },
  });
  if (fallback) {
    console.warn(`[webhook/resolvePlanId] Slug "${slug}" not found; falling back to plan ${fallback.id}`);
    return fallback.id;
  }

  console.error("[webhook/resolvePlanId] ❌ No plans exist in the database!");
  return null;
}

// ─── Stripe status → DB status mapping ────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  "active" | "trialing" | "past_due" | "canceled" | "expired"
> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "past_due",
  incomplete: "past_due",
  incomplete_expired: "expired",
  paused: "past_due",
};

// ─── Webhook route ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log("[webhook] ▶ Received POST request");

  // ── 1. Raw body extraction ────────────────────────────────────────────────
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[webhook] ❌ Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] ❌ STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // ── 2. Signature verification ─────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`[webhook] ✅ Event verified: ${event.type} (id: ${event.id})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] ❌ Signature verification failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  // ── 3. Route event to the appropriate handler ─────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[webhook] ℹ️ Unhandled event type: ${event.type} — ignoring`);
    }
  } catch (err) {
    console.error(`[webhook] ❌ Handler error for ${event.type}:`, err);
    return new Response("Handler error — check logs", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

/**
 * checkout.session.completed
 *
 * Fires when a user completes a checkout flow for EITHER:
 *   - mode: 'payment'       → one-time Registrar purchase ($1500/$2500)
 *   - mode: 'subscription'  → Fellowship or Post-Registrar Upgrade
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[webhook/checkout.completed] Processing session ${session.id}, mode: ${session.mode}`);

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const userId = await resolveUserId(
    session.client_reference_id ?? session.metadata?.userId,
    stripeCustomerId,
    session.customer_details?.email
  );

  if (!userId) {
    console.error(
      "[webhook/checkout.completed] ❌ Could not resolve userId — aborting",
      { sessionId: session.id, customerId: stripeCustomerId }
    );
    return;
  }

  // Persist stripe_customer_id on users record
  if (stripeCustomerId) {
    await prisma.users
      .update({
        where: { id: userId },
        data: { stripe_customer_id: stripeCustomerId },
      })
      .catch((err) =>
        console.warn("[webhook/checkout.completed] Could not save stripe_customer_id:", err.message)
      );
    console.log(`[webhook/checkout.completed] Saved stripe_customer_id ${stripeCustomerId} → user ${userId}`);
  }

  const priceId =
    session.metadata?.priceId ??
    (session.line_items?.data[0]?.price?.id ?? null);

  if (!priceId) {
    console.error("[webhook/checkout.completed] ❌ No priceId found in metadata or line_items — aborting");
    return;
  }

  const accessLevel = priceIdToAccessLevel(priceId);
  if (!accessLevel) {
    console.error(`[webhook/checkout.completed] ❌ Unknown priceId "${priceId}" — aborting`);
    return;
  }

  console.log(`[webhook/checkout.completed] userId=${userId}, priceId=${priceId}, accessLevel=${accessLevel}`);

  const now = new Date();

  if (session.mode === "payment" && REGISTRAR_PRICE_IDS.has(priceId)) {
    // ── One-time Registrar purchase ───────────────────────────────────────────
    console.log("[webhook/checkout.completed] → One-time payment branch");

    const months = REGISTRAR_ACCESS_MONTHS[priceId] ?? 6;
    const accessExpiresAt = addMonths(now, months);

    // Mark user as having purchased Registrar
    await prisma.users.update({
      where: { id: userId },
      data: { has_purchased_registrar: true },
    });

    const planId = await resolvePlanId("registrar");
    if (!planId) {
      console.error("[webhook/checkout.completed] ❌ Could not resolve plan_id — aborting subscription upsert");
      return;
    }

    const paymentIntentId = session.payment_intent as string | null | undefined;
    const checkoutSessionId = session.id;

    // Upsert using stripe_checkout_session_id (full @unique — safe for Prisma upsert)
    const upserted = await prisma.subscriptions.upsert({
      where: { stripe_checkout_session_id: checkoutSessionId },
      create: {
        user_id: userId,
        plan_id: planId,
        cycle: "monthly",
        status: "active",
        provider: "stripe",
        provider_sub_id: paymentIntentId ?? null,
        access_level: "REGISTRAR",
        access_expires_at: accessExpiresAt,
        payment_mode: "payment",
        stripe_price_id: priceId,
        stripe_checkout_session_id: checkoutSessionId,
        current_period_start: now,
        current_period_end: accessExpiresAt,
      },
      update: {
        status: "active",
        provider_sub_id: paymentIntentId ?? null,
        access_level: "REGISTRAR",
        access_expires_at: accessExpiresAt,
        payment_mode: "payment",
        stripe_price_id: priceId,
        current_period_start: now,
        current_period_end: accessExpiresAt,
        canceled_at: null,
        cancel_at: null,
        updated_at: now,
      },
    });
    console.log(`[webhook/checkout.completed] ✅ Subscription upserted in Neon: ${upserted.id}`);

    // Record the payment
    if (paymentIntentId) {
      await prisma.payments
        .create({
          data: {
            user_id: userId,
            subscription_id: upserted.id,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "aud").toUpperCase() as "AUD",
            status: "succeeded",
            provider_ref: paymentIntentId,
            stripe_price_id: priceId,
            paid_at: now,
          },
        })
        .catch((err) =>
          console.warn("[webhook/checkout.completed] Payment record insert warning:", err.message)
        );
    }
  } else if (session.mode === "subscription" && session.subscription) {
    // ── Recurring subscription ────────────────────────────────────────────────
    console.log("[webhook/checkout.completed] → Recurring subscription branch");
    const subId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

    const stripeSub = await stripe.subscriptions.retrieve(subId);
    console.log(`[webhook/checkout.completed] Retrieved Stripe subscription ${stripeSub.id}, status: ${stripeSub.status}`);

    await upsertSubscriptionRow(userId, stripeSub, priceId, session.id);
  } else {
    console.warn(`[webhook/checkout.completed] Unhandled mode "${session.mode}" or missing subscription — skipping`);
  }

  // Forfeit remaining free quota for all paid purchases
  await forfeitFreeQuota(userId);
  console.log(`[webhook/checkout.completed] ✅ Done for user ${userId}`);
}

/**
 * customer.subscription.created / customer.subscription.updated
 * Handles renewals, plan switches, and trial conversions.
 */
async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  console.log(`[webhook/subscription.updated] Processing sub ${stripeSub.id}, status: ${stripeSub.status}`);

  const stripeCustomerId =
    typeof stripeSub.customer === "string"
      ? stripeSub.customer
      : stripeSub.customer?.id ?? null;

  const userId = await resolveUserId(
    stripeSub.metadata?.userId,
    stripeCustomerId,
    null
  );

  if (!userId) {
    console.error(
      "[webhook/subscription.updated] ❌ No matching userId found — aborting",
      { subId: stripeSub.id, customerId: stripeCustomerId }
    );
    return;
  }

  const priceId = stripeSub.items.data[0]?.price.id;
  if (!priceId) {
    console.error("[webhook/subscription.updated] ❌ No priceId on subscription — aborting");
    return;
  }

  await upsertSubscriptionRow(userId, stripeSub, priceId, null);
}

/**
 * customer.subscription.deleted
 * Reverts access to FREE. Preserves has_purchased_registrar permanently.
 */
async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  console.log(`[webhook/subscription.deleted] Processing sub ${stripeSub.id}`);

  // Update the specific row directly using provider_sub_id (full @unique)
  const existing = await prisma.subscriptions.findUnique({
    where: { provider_sub_id: stripeSub.id },
    select: { id: true },
  });

  if (!existing) {
    // Fallback: resolve user and update all their subscriptions
    const stripeCustomerId =
      typeof stripeSub.customer === "string"
        ? stripeSub.customer
        : stripeSub.customer?.id ?? null;

    const userId = await resolveUserId(
      stripeSub.metadata?.userId,
      stripeCustomerId,
      null
    );

    if (userId) {
      await prisma.subscriptions.updateMany({
        where: { user_id: userId },
        data: {
          status: "canceled",
          access_level: "FREE",
          canceled_at: new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`[webhook/subscription.deleted] Updated subscriptions for user ${userId} to canceled`);
    }
    return;
  }

  await prisma.subscriptions.update({
    where: { id: existing.id },
    data: {
      status: "canceled",
      access_level: "FREE",
      canceled_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log(`[webhook/subscription.deleted] ✅ Subscription ${existing.id} marked canceled`);
}

/**
 * invoice.payment_failed
 * Marks subscription past_due and reverts access to FREE.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null;
  if (!subscriptionId) return;

  console.log(`[webhook/invoice.payment_failed] Marking sub ${subscriptionId} as past_due`);

  const existing = await prisma.subscriptions.findUnique({
    where: { provider_sub_id: subscriptionId },
    select: { id: true },
  });

  if (existing) {
    await prisma.subscriptions.update({
      where: { id: existing.id },
      data: {
        status: "past_due",
        access_level: "FREE",
        updated_at: new Date(),
      },
    });
    console.log(`[webhook/invoice.payment_failed] ✅ Subscription ${existing.id} marked past_due`);
  } else {
    console.warn(`[webhook/invoice.payment_failed] No subscription found for provider_sub_id ${subscriptionId}`);
  }
}

// ─── Shared upsert logic for recurring subscriptions ─────────────────────────

/**
 * Upsert a subscription row for a recurring Stripe Subscription object.
 *
 * KEY FIX: We upsert using provider_sub_id (which has a full @unique constraint)
 * instead of user_id (which only has a PARTIAL unique index — not supported by
 * Prisma's upsert). This is the primary fix for the empty subscriptions table.
 */
async function upsertSubscriptionRow(
  userId: string,
  stripeSub: Stripe.Subscription,
  priceId: string,
  checkoutSessionId: string | null
) {
  console.log(`[webhook/upsertSubscriptionRow] userId=${userId}, subId=${stripeSub.id}, priceId=${priceId}`);

  let accessLevel = priceIdToAccessLevel(priceId);
  if (!accessLevel) {
    console.warn(
      `[webhook/upsertSubscriptionRow] Unknown priceId "${priceId}" — defaulting to FELLOWSHIP`
    );
    accessLevel = "FELLOWSHIP";
  }

  const rawSub = stripeSub as any;
  const now = new Date();

  const currentPeriodEndSec: number =
    rawSub.current_period_end ??
    rawSub.items?.data?.[0]?.current_period_end ??
    Math.floor(now.getTime() / 1000);

  const currentPeriodStartSec: number =
    rawSub.current_period_start ??
    rawSub.items?.data?.[0]?.current_period_start ??
    Math.floor(now.getTime() / 1000);

  const periodEnd = new Date(currentPeriodEndSec * 1000);
  const periodStart = new Date(currentPeriodStartSec * 1000);

  const normalizedStripeStatus = (stripeSub.status ?? "").toLowerCase();
  const dbStatus = STATUS_MAP[normalizedStripeStatus] ?? "active";

  // Determine billing cycle from Stripe price interval
  const interval = stripeSub.items.data[0]?.price?.recurring?.interval;
  const dbCycle: "monthly" | "annual" = interval === "year" ? "annual" : "monthly";

  const isActive = dbStatus === "active" || dbStatus === "trialing";
  const effectiveAccessLevel = isActive ? accessLevel : "FREE";

  console.log(
    `[webhook/upsertSubscriptionRow] Stripe status: "${stripeSub.status}" → dbStatus: "${dbStatus}", accessLevel: "${effectiveAccessLevel}"`
  );

  const stripeCustomerId =
    typeof stripeSub.customer === "string"
      ? stripeSub.customer
      : (stripeSub.customer as any)?.id ?? null;

  // Resolve plan_id from DB (required FK — cannot be null or sentinel)
  const planId = await resolvePlanId("fellowship");
  if (!planId) {
    console.error("[webhook/upsertSubscriptionRow] ❌ Could not resolve plan_id — aborting");
    return;
  }

  // ─── CRITICAL FIX: Upsert using provider_sub_id (full @unique) ────────────
  // user_id has only a PARTIAL unique index — Prisma upsert() requires a FULL
  // unique constraint. provider_sub_id is @unique without conditions, so it
  // works correctly as the upsert discriminator.
  const upserted = await prisma.subscriptions.upsert({
    where: { provider_sub_id: stripeSub.id },
    create: {
      user_id: userId,
      plan_id: planId,
      cycle: dbCycle,
      status: dbStatus,
      provider: "stripe",
      provider_sub_id: stripeSub.id,
      access_level: effectiveAccessLevel,
      access_expires_at: periodEnd,
      payment_mode: "subscription",
      stripe_price_id: priceId,
      stripe_checkout_session_id: checkoutSessionId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
    },
    update: {
      status: dbStatus,
      access_level: effectiveAccessLevel,
      access_expires_at: periodEnd,
      payment_mode: "subscription",
      stripe_price_id: priceId,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
      canceled_at: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
      updated_at: now,
    },
  });

  // Also persist stripe_customer_id on the users record (idempotent)
  if (stripeCustomerId) {
    await prisma.users
      .update({
        where: { id: userId },
        data: { stripe_customer_id: stripeCustomerId },
      })
      .catch((e) => console.warn("[webhook/upsertSubscriptionRow] stripe_customer_id update warning:", e.message));
  }

  console.log(`[webhook/upsertSubscriptionRow] ✅ Subscription Table Updated in Neon: ${upserted.id}`);
}
