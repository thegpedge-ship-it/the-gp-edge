"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export async function createBillingPortalSessionAction(): Promise<{ url?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Not authenticated" };

    const dbUser = await ensureDbUser();
    if (!dbUser) return { error: "User profile not found" };

    const customerId = dbUser.stripe_customer_id;

    if (!customerId) {
      return { error: "No billing history or Stripe customer ID found for this account. Please complete a plan purchase first." };
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const baseUrl = host.startsWith("http") ? host : `https://${host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/profile`,
    });

    return { url: portalSession.url };
  } catch (err) {
    console.error("[createBillingPortalSessionAction] Error:", err);
    return { error: "Failed to open billing portal. Please try again later." };
  }
}
