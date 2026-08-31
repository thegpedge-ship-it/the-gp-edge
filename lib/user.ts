// Server-side helpers for bridging a Clerk identity to our own `users` row.
//
// Clerk owns authentication and gives us only email + name (and, for Google
// OAuth, an avatar URL). Everything else on the `users` table — postgraduate
// year, exam target, terms acceptance, medical degree, fellowship status, etc.
// — is collected from the onboarding form and lives in our Neon Postgres database.
//
// `onboardingComplete` is stored on the Clerk user's publicMetadata rather than
// as a DB column, so the auth layer can gate access without a DB round-trip and
// without a schema migration.
import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import type { DbProfile } from "@/contexts/ProfileContext";
import { EMPTY_PROFILE } from "@/contexts/ProfileContext";

type DbUserRow = NonNullable<Awaited<ReturnType<typeof ensureDbUser>>>;

/**
 * Ensure a `users` row exists for the currently signed-in Clerk user and keep
 * the Clerk-owned identity fields (email + name) in sync.
 *
 * Idempotent and safe to call on every authenticated request — it never
 * overwrites the profile fields a user fills in during onboarding. Works for
 * both email/password and Google OAuth sign-ups.
 *
 * Returns the DB user, or `null` if there is no authenticated user (or the
 * Clerk account somehow has no email address).
 */
import { cache } from "react";

export const ensureDbUser = cache(async () => {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    // Account is mid-deletion. During the delete flow the DB row is removed while
    // the Clerk session is still briefly valid, and a concurrent server render
    // (e.g. the dashboard layout revalidating after Clerk's reverification) would
    // otherwise resurrect a skeleton row here. `deleteOwnAccountData` sets this
    // flag before deleting the row, so we must not recreate it.
    if (clerkUser.publicMetadata?.accountDeleted) return null;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;

    // `email` is NOT NULL + unique in the schema — we can't create a row without it.
    if (!email) return null;

    const identity = {
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
    };

    // Both `clerk_user_id` AND `email` are unique. A plain upsert keyed on
    // `clerk_user_id` would take the `create` branch for a never-seen Clerk id and
    // then collide on `email` (P2002) whenever a row with that email already
    // exists under a *different* clerk id — e.g. the user deleted their Clerk
    // account and signed up again, or has both an email/password and a Google
    // identity sharing one email. So reconcile on both keys explicitly.

    // 1. Known Clerk identity → just keep email/name fresh.
    const byClerk = await prisma.users.findUnique({
      where: { clerk_user_id: clerkUser.id },
    });
    if (byClerk) {
      if (
        byClerk.email === email &&
        byClerk.first_name === identity.first_name &&
        byClerk.last_name === identity.last_name
      ) {
        return byClerk;
      }
      return await prisma.users.update({
        where: { clerk_user_id: clerkUser.id },
        data: { email, ...identity },
      });
    }

    // 2. No row for this Clerk id, but one already exists for this email under a
    //    stale clerk id — reclaim it rather than creating a duplicate.
    const byEmail = await prisma.users.findUnique({ where: { email } });
    if (byEmail) {
      return await prisma.users.update({
        where: { id: byEmail.id },
        data: { clerk_user_id: clerkUser.id, ...identity },
      });
    }

    // 3. Brand-new user.
    try {
      return await prisma.users.create({
        data: { clerk_user_id: clerkUser.id, email, ...identity },
      });
    } catch (err) {
      // Lost a race with a concurrent ensureDbUser for the same identity (two
      // requests both saw no row and both tried to create). The row now exists, so
      // return it instead of surfacing the unique-constraint error.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const existing =
          (await prisma.users.findUnique({ where: { clerk_user_id: clerkUser.id } })) ??
          (await prisma.users.findUnique({ where: { email } }));
        if (existing) return existing;
      }
      throw err;
    }
  } catch (err) {
    console.error("[ensureDbUser] Error resolving user profile:", err);
    return null;
  }
});

/** Whether this Clerk user has finished the onboarding form. */
export function isOnboarded(clerkUser: User | null): boolean {
  return Boolean(clerkUser?.publicMetadata?.onboardingComplete);
}

/** Map a DB user row to the serializable shape shared with client components. */
export function toDbProfile(dbUser: DbUserRow | null): DbProfile {
  if (!dbUser) return EMPTY_PROFILE;
  return {
    roleTitle: dbUser.role_title,
    location: dbUser.location,
    examTarget: dbUser.exam_target,
    postgraduateYear: dbUser.postgraduate_year,
    examTargetCode: dbUser.exam_target_code,
    primaryMedicalDegree: dbUser.primary_medical_degree,
    fellowshipStatus: dbUser.fellowship_status,
    country: dbUser.country,
    stateTerritory: dbUser.state_territory,
    joinedAt: dbUser.joined_at ? dbUser.joined_at.toISOString() : null,
  };
}
