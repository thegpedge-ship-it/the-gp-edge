import { redirect } from "next/navigation";

/**
 * /privacy redirects to /privacy-policy.
 * Ensures any links, bookmarks, or referenced URLs to /privacy work seamlessly without 404.
 */
export default function PrivacyRedirectPage() {
  redirect("/privacy-policy");
}
