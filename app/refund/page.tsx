import { redirect } from "next/navigation";

/**
 * /refund redirects to /refund-policy.
 * Ensures any links, bookmarks, or short URLs to /refund work seamlessly.
 */
export default function RefundRedirectPage() {
  redirect("/refund-policy");
}
