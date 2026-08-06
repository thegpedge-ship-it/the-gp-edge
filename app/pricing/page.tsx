import { redirect } from "next/navigation";

/**
 * /pricing is served under /dashboard/pricing.
 * This redirect ensures any links, bookmarks, or navigations to /pricing work seamlessly without 404.
 */
export default function PricingRedirectPage() {
  redirect("/dashboard/pricing");
}
