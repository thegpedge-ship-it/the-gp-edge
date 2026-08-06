/**
 * app/api/stripe/create-checkout-session/route.ts
 *
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for any of the five pricing plans.
 * Returns { url: string } — the client redirects to this URL.
 *
 * Payment mode is determined automatically:
 *   - Registrar $1500 / $2500 → mode: 'payment'   (one-time)
 *   - Fellowship / Post-Reg   → mode: 'subscription' (recurring)
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { stripe, REGISTRAR_PRICE_IDS } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body as { priceId?: string };

    if (!priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    // ── Resolve DB user ───────────────────────────────────────────────────────
    const dbUser = await prisma.users.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: { id: true, email: true, stripe_customer_id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Active Subscription Backend Guard ──────────────────────────────────────
    const activeSub = await prisma.subscriptions.findFirst({
      where: {
        user_id: dbUser.id,
        status: { in: ["active", "trialing"] },
      },
    });

    if (activeSub && activeSub.access_expires_at && new Date(activeSub.access_expires_at) > new Date()) {
      return NextResponse.json(
        { error: "You already have an active subscription. Please manage your subscription from your Profile page." },
        { status: 400 }
      );
    }

    // ── Determine checkout mode ────────────────────────────────────────────────
    const isOneTimePayment = REGISTRAR_PRICE_IDS.has(priceId);
    const mode = isOneTimePayment ? "payment" : "subscription";

    // ── Build success / cancel URLs ───────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const successUrl = `${baseUrl}/dashboard/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/pricing?canceled=true`;

    // ── Create Checkout Session ────────────────────────────────────────────────
    const sessionConfig: any = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: dbUser.id,
      metadata: {
        userId: dbUser.id,
        priceId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    };

    if (dbUser.stripe_customer_id) {
      sessionConfig.customer = dbUser.stripe_customer_id;
    } else {
      sessionConfig.customer_email = dbUser.email;
    }

    if (mode === "payment") {
      sessionConfig.invoice_creation = { enabled: true };
    } else if (mode === "subscription") {
      sessionConfig.subscription_data = {
        metadata: {
          userId: dbUser.id,
          priceId,
        },
      };
      sessionConfig.billing_address_collection = "auto";
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/create-checkout-session]", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create Stripe checkout session";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
