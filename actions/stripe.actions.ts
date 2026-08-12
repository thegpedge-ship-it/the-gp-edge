"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

async function getOrFetchStripeCustomerId(dbUser: { id: string; stripe_customer_id: string | null; email: string }): Promise<string | null> {
  if (dbUser.stripe_customer_id) return dbUser.stripe_customer_id;
  if (!dbUser.email) return null;

  try {
    const searchRes = await stripe.customers.list({ email: dbUser.email, limit: 1 });
    if (searchRes.data.length > 0) {
      const customerId = searchRes.data[0].id;
      await prisma.users.update({
        where: { id: dbUser.id },
        data: { stripe_customer_id: customerId }
      });
      return customerId;
    }
  } catch (err) {
    console.error("[getOrFetchStripeCustomerId] Failed to search Stripe:", err);
  }
  return null;
}

export async function createBillingPortalSessionAction(): Promise<{ url?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Not authenticated" };

    const dbUser = await ensureDbUser();
    if (!dbUser) return { error: "User profile not found" };

    const customerId = await getOrFetchStripeCustomerId(dbUser);

    if (!customerId) {
      return { error: "No billing history found for this account email." };
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

export async function submitCancellationFeedbackAction(reason: string, feedback?: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Not authenticated" };

    const dbUser = await ensureDbUser();
    if (!dbUser || !dbUser.id) return { error: "User profile not found" };

    const feedbackModel = (prisma as any).cancellationFeedback || (prisma as any).cancellation_feedback;
    
    if (!feedbackModel) {
      throw new Error("Prisma cancellation model is undefined. Please restart your Next.js dev server or run 'npx prisma generate'.");
    }

    await feedbackModel.create({
      data: {
        user_id: dbUser.id,
        reason,
        feedback: feedback || null,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("❌ Cancellation Feedback DB Error:", err);
    return { error: err.message || "Failed to submit feedback." };
  }
}

export async function getLatestInvoicePdfAction(): Promise<{ url?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Not authenticated" };

    const dbUser = await ensureDbUser();
    if (!dbUser) return { error: "User profile not found" };

    const customerId = await getOrFetchStripeCustomerId(dbUser);
    if (!customerId) {
      return { error: "No billing history found for this account email." };
    }

    // First Choice: Stripe Charges (Payment Receipts) guarantee showing amount paid.
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 10,
    });

    const successfulCharge = charges.data.find(c => c.status === "succeeded" && c.receipt_url);
    if (successfulCharge?.receipt_url) {
      return { url: successfulCharge.receipt_url };
    }

    // Second Choice: Fallback to Invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    let invoiceToReturn = invoices.data.find(inv => inv.status === "paid" && (inv.invoice_pdf || inv.hosted_invoice_url));

    if (!invoiceToReturn) {
      // If an open/draft invoice is found for a completed payment, pay it on the fly
      const openInvoice = invoices.data.find(inv => inv.status === "open" || inv.status === "draft");
      if (openInvoice) {
        try {
          invoiceToReturn = await stripe.invoices.pay(openInvoice.id, {
            paid_out_of_band: true,
          });
        } catch (err) {
          console.warn("[getLatestInvoicePdfAction] Could not auto-pay open invoice:", err);
        }
      }
    }

    if (!invoiceToReturn) {
      return { error: "No invoices or receipts found for this account." };
    }

    const invoiceUrl = invoiceToReturn.invoice_pdf || invoiceToReturn.hosted_invoice_url;
    if (!invoiceUrl) {
      return { error: "Invoice PDF is not available yet." };
    }

    return { url: invoiceUrl };
  } catch (err) {
    console.error("[getLatestInvoicePdfAction] Error:", err);
    return { error: "Failed to fetch invoice. Please try again later." };
  }
}
