import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ensureDbUser, isOnboarded, toDbProfile } from "@/lib/user";
import { getUserAccess } from "@/lib/access";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RoleReevaluationModal from "@/components/RoleReevaluationModal";

// Force a fresh DB read on every request — the layout checks live subscription
// expiry and must never serve a cached result. Without this, changing
// access_expires_at in Neon would not revoke access until Next.js cache expires.
export const dynamic = "force-dynamic";

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
  const accessInfo = dbUser?.id ? await getUserAccess(dbUser.id) : null;

  // Determine if we need to prompt the user to re-evaluate their career stage.
  // Conditions (ALL must be true):
  //   1. User has previously purchased a Registrar package (permanent flag)
  //   2. Their Registrar access is no longer active (expired or no active sub row)
  //   3. Their training_stage is still REGISTRAR (not already upgraded)
  //   4. They have NOT yet answered the re-evaluation prompt (role_reevaluated = false)
  const isRegistrarExpired = Boolean(
    accessInfo &&
      accessInfo.hasPurchasedRegistrar &&
      !accessInfo.isRegistrarActive &&
      accessInfo.trainingStage === "REGISTRAR" &&
      !accessInfo.roleReevaluated
  );

  return (
    <>
      {isRegistrarExpired && <RoleReevaluationModal open={true} />}
      <DashboardShell profile={toDbProfile(dbUser)} showSidebar>
        {children}
      </DashboardShell>
    </>
  );
}
