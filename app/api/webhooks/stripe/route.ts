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
 *   Next.js 16 App Router does NOT auto-parse the body for route handlers,
 *   but we explicitly use req.text() to be safe and explicit.
 *
 * Events handled:
 *   checkout.session.completed        — new purchase (payment or subscription)
 *   customer.subscription.updated     — renewals, plan changes
 *   customer.subscription.deleted     — cancellation / non-renewal
 *   invoice.payment_failed            — failed recurring charge
 */

import { NextResponse } from "next/server";
import { stripe, REGISTRAR_PRICE_IDS, REGISTRAR_ACCESS_MONTHS, priceIdToAccessLevel } from "@/lib/stripe";
import { forfeitFreeQuota } from "@/lib/module-gates";
import prisma from "@/lib/prisma";
import type Stripe from "stripe";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Webhook route ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── 1. Raw body extraction (required for signature verification) ─────────────
  // req.text() gives the raw string. Do NOT call req.json() — that would
  // consume the body stream and invalidate the Stripe signature.
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not configured");
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", msg);
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
        // Acknowledge unhandled events without error so Stripe doesn't retry
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying on application errors;
    // re-throw only for bugs that warrant a retry (network, DB down, etc.)
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
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) {
    console.error("[webhook/checkout.completed] No userId in session", session.id);
    return;
  }

  const priceId = session.metadata?.priceId;
  if (!priceId) {
    console.error("[webhook/checkout.completed] No priceId in metadata", session.id);
    return;
  }

  const accessLevel = priceIdToAccessLevel(priceId);
  if (!accessLevel) {
    console.error("[webhook/checkout.completed] Unknown priceId:", priceId);
    return;
  }

  const now = new Date();

  if (session.mode === "payment" && REGISTRAR_PRICE_IDS.has(priceId)) {
    // ── One-time Registrar purchase ─────────────────────────────────────────
    const months = REGISTRAR_ACCESS_MONTHS[priceId] ?? 6;
    const accessExpiresAt = addMonths(now, months);

    // Mark user as having purchased Registrar (permanent — never unset)
    await prisma.users.update({
      where: { id: userId },
      data: { has_purchased_registrar: true },
    });

    // Upsert subscription row for access control
    await prisma.subscriptions.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        // plan_id is required by schema — use a sentinel UUID for one-time purchases
        // In production, map to a real plans row for Registrar.
        plan_id: "00000000-0000-0000-0000-000000000001",
        cycle: "monthly", // nominal — not used for one-time
        status: "active",
        provider: "stripe",
        provider_sub_id: session.payment_intent as string | undefined,
        access_level: "REGISTRAR",
        access_expires_at: accessExpiresAt,
        payment_mode: "payment",
        stripe_price_id: priceId,
        stripe_checkout_session_id: session.id,
        current_period_start: now,
        current_period_end: accessExpiresAt,
      },
      update: {
        status: "active",
        provider_sub_id: session.payment_intent as string | undefined,
        access_level: "REGISTRAR",
        access_expires_at: accessExpiresAt,
        payment_mode: "payment",
        stripe_price_id: priceId,
        stripe_checkout_session_id: session.id,
        current_period_start: now,
        current_period_end: accessExpiresAt,
        canceled_at: null,
        cancel_at: null,
        updated_at: now,
      },
    });

    // Record the payment
    if (session.payment_intent) {
      await prisma.payments.create({
        data: {
          user_id: userId,
          amount: (session.amount_total ?? 0) / 100, // Stripe stores cents
          currency: (session.currency ?? "aud").toUpperCase() as "AUD",
          status: "succeeded",
          provider_ref: session.payment_intent as string,
          stripe_price_id: priceId,
          paid_at: now,
        },
      });
    }
  } else if (session.mode === "subscription" && session.subscription) {
    // ── Recurring subscription ──────────────────────────────────────────────
    const stripeSub = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    await upsertSubscriptionRow(userId, stripeSub, priceId, session.id);
  }

  // Forfeit remaining free quota for all paid purchases
  await forfeitFreeQuota(userId);
}

/**
 * customer.subscription.updated
 * Handles renewals, plan switches, and trial conversions.
 */
async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const userId = stripeSub.metadata?.userId;
  if (!userId) return;

  const priceId = stripeSub.items.data[0]?.price.id;
  if (!priceId) return;

  await upsertSubscriptionRow(userId, stripeSub, priceId, null);
}

/**
 * customer.subscription.deleted
 * Reverts access to FREE. Preserves has_purchased_registrar permanently.
 */
async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const userId = stripeSub.metadata?.userId;
  if (!userId) return;

  await prisma.subscriptions.updateMany({
    where: { user_id: userId },
    data: {
      status: "canceled",
      access_level: "FREE",
      canceled_at: new Date(),
      updated_at: new Date(),
    },
  });
  // NOTE: has_purchased_registrar is deliberately NOT reset here.
}

/**
 * invoice.payment_failed
 * Marks subscription past_due and reverts access to FREE.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null;
  if (!subscriptionId) return;

  await prisma.subscriptions.updateMany({
    where: { provider_sub_id: subscriptionId },
    data: {
      status: "past_due",
      access_level: "FREE",
      updated_at: new Date(),
    },
  });
}

// ─── Shared upsert logic for recurring subscriptions ─────────────────────────

async function upsertSubscriptionRow(
  userId: string,
  stripeSub: Stripe.Subscription,
  priceId: string,
  checkoutSessionId: string | null
) {
  let accessLevel = priceIdToAccessLevel(priceId);
  if (!accessLevel) {
    console.warn(`[webhook/upsertSubscriptionRow] Unrecognized priceId "${priceId}". Defaulting to FELLOWSHIP.`);
    accessLevel = "FELLOWSHIP";
  }

  const now = new Date();
  const rawSub = stripeSub as any;
  const currentPeriodEndSec =
    rawSub.current_period_end ??
    rawSub.items?.data?.[0]?.current_period_end ??
    Math.floor(now.getTime() / 1000);
  const currentPeriodStartSec =
    rawSub.current_period_start ??
    rawSub.items?.data?.[0]?.current_period_start ??
    Math.floor(now.getTime() / 1000);

  const periodEnd = new Date(currentPeriodEndSec * 1000);
  const periodStart = new Date(currentPeriodStartSec * 1000);

  // Map Stripe status to our subscription_status enum (case-insensitive)
  const statusMap: Record<string, "active" | "trialing" | "past_due" | "canceled" | "expired"> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "expired",
    paused: "past_due",
  };
  const normalizedStripeStatus = (stripeSub.status ?? "").toLowerCase();
  const dbStatus = statusMap[normalizedStripeStatus] ?? "active";

  console.log(`[webhook/upsertSubscriptionRow] User: ${userId}, Stripe status: "${stripeSub.status}" -> dbStatus: "${dbStatus}", accessLevel: "${accessLevel}"`);

  await prisma.subscriptions.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      plan_id: "00000000-0000-0000-0000-000000000002", // sentinel for recurring plans
      cycle: "monthly",
      status: dbStatus,
      provider: "stripe",
      provider_sub_id: stripeSub.id,
      access_level: accessLevel,
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
      provider_sub_id: stripeSub.id,
      access_level: dbStatus === "active" || dbStatus === "trialing" ? accessLevel : "FREE",
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
}
