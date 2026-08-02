/**
 * lib/stripe.ts
 *
 * Singleton Stripe server-side client.
 * Import this in API routes and server actions — never in client components.
 */
import Stripe from "stripe";

// Do not throw at module evaluation time so Next.js static builds pass even if env is not loaded.
// Stripe will throw when actually used if the key is invalid.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-06-24.dahlia" as any,
  typescript: true,
});

/**
 * The set of Stripe Price IDs that correspond to one-time Registrar payments.
 * Used by the checkout and webhook handlers to determine payment mode.
 */
export const REGISTRAR_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_REGISTRAR_6MONTH,
  process.env.STRIPE_PRICE_REGISTRAR_12MONTH,
]);

/**
 * How many months of access each Registrar price grants.
 */
export const REGISTRAR_ACCESS_MONTHS: Record<string, number> = {
  [process.env.STRIPE_PRICE_REGISTRAR_6MONTH ?? ""]: 6,
  [process.env.STRIPE_PRICE_REGISTRAR_12MONTH ?? ""]: 12,
};

/**
 * Maps a Stripe Price ID to its access_level_kind value.
 */
export function priceIdToAccessLevel(
  priceId: string
): "REGISTRAR" | "FELLOWSHIP" | "POST_REGISTRAR_UPGRADE" | null {
  if (REGISTRAR_PRICE_IDS.has(priceId)) return "REGISTRAR";
  if (
    priceId === process.env.STRIPE_PRICE_FELLOWSHIP_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_FELLOWSHIP_YEARLY
  )
    return "FELLOWSHIP";
  if (priceId === process.env.STRIPE_PRICE_POST_REGISTRAR_MONTHLY)
    return "POST_REGISTRAR_UPGRADE";
  return null;
}
