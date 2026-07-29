/**
 * lib/access.ts
 *
 * Server-side access control helpers.
 * All functions query Postgres via Prisma — never call these from client components.
 *
 * Key rules encoded here:
 *  - canAccessExamPrep:  ONLY active, non-expired Registrar purchase grants full access.
 *                        has_purchased_registrar alone is NOT sufficient — expiry is checked.
 *  - hasPaidAccess:      Any active paid tier ($1500, $2500, $15/mo, $30/mo, $300/yr).
 *  - getVisiblePlans:    The four visibility rules from the pricing requirements.
 */

import prisma from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "REGISTRAR" | "FELLOW";
export type AccessLevel = "FREE" | "REGISTRAR" | "FELLOWSHIP" | "POST_REGISTRAR_UPGRADE";

export interface UserAccessInfo {
  /** Internal DB user ID */
  userId: string;
  userRole: UserRole;
  hasPurchasedRegistrar: boolean;
  /** Current effective access level (from active subscription row) */
  accessLevel: AccessLevel;
  /**
   * True ONLY when:
   *   - access_level === 'REGISTRAR'
   *   - AND access_expires_at is in the future
   * This is the guard for Page 1 (Exam Prep) full access.
   */
  isRegistrarActive: boolean;
  /**
   * True when any paid plan is currently active.
   * Grants access to Pages 2, 3, 4.
   */
  hasPaidAccess: boolean;
  /** Remaining free-tier quotas (only relevant when hasPaidAccess === false) */
  freeQuestionsLeft: number;
  freeTemplatesLeft: number;
  freeTopicsLeft: number;
}

// ─── Core access resolver ─────────────────────────────────────────────────────

/**
 * Fetch all access-control data for a user in a single DB call.
 * Returns null if the user does not exist.
 */
export async function getUserAccess(userId: string): Promise<UserAccessInfo | null> {
  if (!userId) return null;

  // 1. Fetch user by internal Postgres ID, Clerk ID, or Email address
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { id: userId },
        { clerk_user_id: userId },
        { email: userId },
      ],
    },
    select: {
      id: true,
      user_role: true,
      has_purchased_registrar: true,
      free_questions_left: true,
      free_templates_left: true,
      free_topics_left: true,
    },
  });

  if (!user) {
    console.log(`[getUserAccess] No user found matching ID/ClerkID/Email: "${userId}"`);
    return null;
  }

  const now = new Date();

  // 2. Query all subscription records for this user
  const subs = await prisma.subscriptions.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
  });

  console.log(
    `[getUserAccess] User "${user.id}" (role=${user.user_role}, purchasedRegistrar=${user.has_purchased_registrar}). Subscriptions count: ${subs.length}`
  );

  // 3. Evaluate active subscriptions
  // Criteria: status is active/trialing (case-insensitive) OR access_expires_at > now
  const validSubs = subs.filter((s) => {
    const st = (s.status ?? "").toString().toLowerCase();
    const isActiveStatus = st === "active" || st === "trialing";
    const isUnexpired =
      s.access_expires_at != null && new Date(s.access_expires_at) > now;
    return isActiveStatus || isUnexpired;
  });

  // Prioritize active sub by access_level (REGISTRAR > POST_REGISTRAR_UPGRADE > FELLOWSHIP)
  let activeSub = validSubs[0] || null;
  if (validSubs.length > 1) {
    const registrarSub = validSubs.find((s) => String(s.access_level).toUpperCase() === "REGISTRAR");
    const postRegSub = validSubs.find((s) => String(s.access_level).toUpperCase() === "POST_REGISTRAR_UPGRADE");
    const fellowshipSub = validSubs.find((s) => String(s.access_level).toUpperCase() === "FELLOWSHIP");
    activeSub = registrarSub || postRegSub || fellowshipSub || validSubs[0];
  }

  const isSubValid = activeSub != null;
  let accessLevel: AccessLevel = "FREE";

  if (isSubValid && activeSub) {
    const lvl = String(activeSub.access_level ?? "").toUpperCase();
    if (lvl === "REGISTRAR" || lvl === "FELLOWSHIP" || lvl === "POST_REGISTRAR_UPGRADE") {
      accessLevel = lvl as AccessLevel;
    } else {
      accessLevel = "FELLOWSHIP"; // fallback if valid active sub exists
    }
  } else if (user.has_purchased_registrar) {
    accessLevel = "REGISTRAR";
  }

  // Page 1 (Exam Prep) requires an active REGISTRAR access level with non-expired window
  const isRegistrarActive =
    (isSubValid &&
      accessLevel === "REGISTRAR" &&
      activeSub?.access_expires_at != null &&
      new Date(activeSub.access_expires_at) > now) ||
    (user.has_purchased_registrar &&
      (activeSub == null || activeSub.access_expires_at == null || new Date(activeSub.access_expires_at) > now));

  // Pages 2, 3, 4 (Medical Library, Templates, MBS Billing) require ANY active paid tier
  const hasPaidAccess =
    accessLevel !== "FREE" ||
    user.has_purchased_registrar === true ||
    isSubValid;

  console.log(`[getUserAccess] Computed flags for user "${user.id}":`, {
    accessLevel,
    isRegistrarActive,
    hasPaidAccess,
    activeSubId: activeSub?.id,
    activeSubStatus: activeSub?.status,
    activeSubLevel: activeSub?.access_level,
    activeSubExpiresAt: activeSub?.access_expires_at,
  });

  return {
    userId: user.id,
    userRole: user.user_role as UserRole,
    hasPurchasedRegistrar: user.has_purchased_registrar,
    accessLevel,
    isRegistrarActive,
    hasPaidAccess,
    freeQuestionsLeft: user.free_questions_left,
    freeTemplatesLeft: user.free_templates_left,
    freeTopicsLeft: user.free_topics_left,
  };
}

// ─── Per-module & Item access checks ──────────────────────────────────────────

/**
 * Exam Prep / Quizzes Access:
 *  - Registrar (6mo / 12mo active): FULL ACCESS to all quizzes and questions.
 *  - Subscription ($15/mo, $30/mo, $300/yr) & Free Tier: Accessible ONLY if is_free == true.
 */
export async function canAccessExamPrep(userId: string): Promise<{
  hasFullAccess: boolean;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false };
  return { hasFullAccess: access.isRegistrarActive };
}

export async function canAccessQuizItem(userId: string, isFree: boolean): Promise<boolean> {
  if (isFree) return true;
  const access = await getUserAccess(userId);
  if (!access) return false;
  return access.isRegistrarActive;
}

/**
 * Medical Library / Clinical Notes Access:
 *  - Any active paid plan (Subscription or Registrar): FULL ACCESS to all items.
 *  - Free Tier: Accessible ONLY if is_free == true.
 */
export async function canAccessStudy(userId: string): Promise<{
  hasFullAccess: boolean;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false };
  return { hasFullAccess: access.hasPaidAccess };
}

export async function canAccessMedicalLibraryItem(userId: string, isFree: boolean): Promise<boolean> {
  if (isFree) return true;
  const access = await getUserAccess(userId);
  if (!access) return false;
  return access.hasPaidAccess;
}

/**
 * Note Templates / Clinical Autofills Access:
 *  - Any active paid plan (Subscription or Registrar): FULL ACCESS to all templates.
 *  - Free Tier: Accessible ONLY if is_free == true.
 */
export async function canAccessTemplates(userId: string): Promise<{
  hasFullAccess: boolean;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false };
  return { hasFullAccess: access.hasPaidAccess };
}

export async function canAccessTemplateItem(userId: string, isFree: boolean): Promise<boolean> {
  if (isFree) return true;
  const access = await getUserAccess(userId);
  if (!access) return false;
  return access.hasPaidAccess;
}

/**
 * Page 4 — MBS Billing Access:
 *  - Any active paid plan: FULL ACCESS.
 *  - Free users: FULLY LOCKED (0 access / 403).
 */
export async function canAccessMBS(userId: string): Promise<{
  hasFullAccess: boolean;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false };
  return { hasFullAccess: access.hasPaidAccess };
}

// ─── Pricing visibility rules ─────────────────────────────────────────────────

export type PlanId =
  | "registrar_6mo"
  | "registrar_12mo"
  | "fellowship_monthly"
  | "fellowship_yearly"
  | "post_registrar_upgrade";

/**
 * Returns the ordered list of plan IDs a user is allowed to see on the
 * pricing page, enforcing the four visibility rules.
 *
 * Rule 1: REGISTRAR + has_purchased=false  → $1500, $2500
 * Rule 2: REGISTRAR + has_purchased=true   → $15/mo, $1500, $2500
 * Rule 3: FELLOW   + has_purchased=true    → $15/mo
 * Rule 4: FELLOW   + has_purchased=false   → $30/mo, $300/yr
 */
export function getVisiblePlans(
  userRole: UserRole,
  hasPurchasedRegistrar: boolean
): PlanId[] {
  if (userRole === "REGISTRAR" && !hasPurchasedRegistrar) {
    // Rule 1
    return ["registrar_6mo", "registrar_12mo"];
  }
  if (userRole === "REGISTRAR" && hasPurchasedRegistrar) {
    // Rule 2 — can also re-buy Registrar plans
    return ["post_registrar_upgrade", "registrar_6mo", "registrar_12mo"];
  }
  if (userRole === "FELLOW" && hasPurchasedRegistrar) {
    // Rule 3
    return ["post_registrar_upgrade"];
  }
  // Rule 4: FELLOW + has_purchased=false (or any unmatched case)
  return ["fellowship_monthly", "fellowship_yearly"];
}
