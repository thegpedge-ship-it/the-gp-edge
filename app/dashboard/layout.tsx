import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ensureDbUser, isOnboarded, toDbProfile } from "@/lib/user";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Dashboard layout — intentionally a Server Component.
 * All client-side context (SidebarProvider, motion, etc.) lives in
 * DashboardShell to avoid Next.js App Router provider/children boundary issues.
 *
 * Acts as the auth gate: ensures a DB user exists and that onboarding is
 * complete before any dashboard page renders. This also catches Google OAuth
 * users, who never see a sign-up form.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // currentUser() throws "Not Found" if the session points at a deleted user
  // (e.g. right after account deletion, before the cookie is cleared). Treat
  // any failure as "not signed in" instead of crashing the layout.
  let clerkUser = null;
  try {
    clerkUser = await currentUser();
  } catch {
    clerkUser = null;
  }
  if (!clerkUser) redirect("/sign-in");
  if (!isOnboarded(clerkUser)) redirect("/onboarding");

  const dbUser = await ensureDbUser();

  return <DashboardShell profile={toDbProfile(dbUser)}>{children}</DashboardShell>;
}
