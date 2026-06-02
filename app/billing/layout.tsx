/**
 * /billing layout — minimal passthrough.
 * The page.tsx immediately redirects to /dashboard/billing.
 * No sidebar, no header — server-side redirect fires before layout renders content.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
