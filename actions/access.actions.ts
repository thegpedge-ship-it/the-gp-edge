"use server";

/**
 * actions/access.actions.ts
 *
 * Thin server action wrapper around lib/access.ts so client components
 * can safely call getUserAccess() through the Server Action boundary.
 * The result is plain JSON — no Prisma objects, no Date instances.
 */

import { ensureDbUser } from "@/lib/user";
import { getUserAccess } from "@/lib/access";

export interface SerializedUserAccess {
  userId: string;
  accessLevel: "FREE" | "REGISTRAR" | "FELLOWSHIP" | "POST_REGISTRAR_UPGRADE";
  /** Any active paid plan ($15/mo, $30/mo, $300/yr, or Registrar). */
  hasPaidAccess: boolean;
  /**
   * True ONLY when access_level === 'REGISTRAR' AND access_expires_at is
   * in the future. This grants full Exam Prep / Quizzes access.
   */
  isRegistrarActive: boolean;
  hasPurchasedRegistrar: boolean;
}

/**
 * Resolve the current signed-in user's access tier.
 * Returns null when no user is signed in or the DB row doesn't exist yet.
 */
export async function getUserAccessAction(): Promise<SerializedUserAccess | null> {
  try {
    const dbUser = await ensureDbUser();
    if (!dbUser?.id) {
      console.log("[getUserAccessAction] ensureDbUser returned null (no authenticated user)");
      return null;
    }

    console.log(`[getUserAccessAction] Calling getUserAccess for dbUser.id: "${dbUser.id}"`);
    const access = await getUserAccess(dbUser.id);
    if (!access) {
      console.log(`[getUserAccessAction] getUserAccess returned null for dbUser.id: "${dbUser.id}"`);
      return null;
    }

    console.log(`[getUserAccessAction] Resolved access for user "${access.userId}":`, {
      accessLevel: access.accessLevel,
      hasPaidAccess: access.hasPaidAccess,
      isRegistrarActive: access.isRegistrarActive,
      hasPurchasedRegistrar: access.hasPurchasedRegistrar,
    });

    return {
      userId: access.userId,
      accessLevel: access.accessLevel,
      hasPaidAccess: access.hasPaidAccess,
      isRegistrarActive: access.isRegistrarActive,
      hasPurchasedRegistrar: access.hasPurchasedRegistrar,
    };
  } catch (err) {
    console.error("[getUserAccessAction] Error resolving user access:", err);
    return null;
  }
}
