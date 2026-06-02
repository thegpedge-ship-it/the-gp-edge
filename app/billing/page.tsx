import { redirect } from "next/navigation";

/**
 * /billing is now served under /dashboard/billing.
 * This redirect ensures any existing links continue to work.
 */
export default function BillingRedirect() {
  redirect("/dashboard/billing");
}
