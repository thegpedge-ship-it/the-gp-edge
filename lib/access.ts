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
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      user_role: true,
      has_purchased_registrar: true,
      free_questions_left: true,
      free_templates_left: true,
      free_topics_left: true,
      subscriptions: {
        select: {
          access_level: true,
          access_expires_at: true,
          status: true,
        },
      },
    },
  });

  if (!user) return null;

  const sub = user.subscriptions;
  const now = new Date();

  // Determine current access level. A subscription row may exist with status
  // 'canceled' or 'expired' — in those cases access reverts to FREE.
  const accessLevel: AccessLevel =
    sub && ["active", "trialing"].includes(sub.status)
      ? (sub.access_level as AccessLevel)
      : "FREE";

  // ⚠️  CRITICAL: Page 1 requires BOTH:
  //   1. access_level === 'REGISTRAR' (not just has_purchased_registrar)
  //   2. access_expires_at is in the future (the 6/12 month window hasn't closed)
  // A user who has has_purchased_registrar=true but whose Registrar period has
  // expired (and is now on $15/mo) must NOT get full Exam Prep access.
  const isRegistrarActive =
    accessLevel === "REGISTRAR" &&
    sub?.access_expires_at != null &&
    sub.access_expires_at > now;

  const hasPaidAccess = accessLevel !== "FREE";

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

// ─── Per-page access checks ───────────────────────────────────────────────────

/**
 * Page 1 — Exam Prep (AKT & KFP)
 * Full access requires an ACTIVE (not expired) Registrar purchase.
 * $15/mo, $30/mo, $300/yr plans do NOT grant full Exam Prep access.
 */
export async function canAccessExamPrep(userId: string): Promise<{
  hasFullAccess: boolean;
  freeQuestionsLeft: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false, freeQuestionsLeft: 0 };
  return {
    hasFullAccess: access.isRegistrarActive,
    freeQuestionsLeft: access.freeQuestionsLeft,
  };
}

/**
 * Page 2 — Note Templates
 * Full access: any active paid tier.
 * Free: limited to free_templates_left (lifetime quota).
 */
export async function canAccessTemplates(userId: string): Promise<{
  hasFullAccess: boolean;
  freeTemplatesLeft: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false, freeTemplatesLeft: 0 };
  return {
    hasFullAccess: access.hasPaidAccess,
    freeTemplatesLeft: access.freeTemplatesLeft,
  };
}

/**
 * Page 3 — Study / Clinical Notes
 * Full access: any active paid tier.
 * Free: limited to free_topics_left (lifetime quota).
 */
export async function canAccessStudy(userId: string): Promise<{
  hasFullAccess: boolean;
  freeTopicsLeft: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { hasFullAccess: false, freeTopicsLeft: 0 };
  return {
    hasFullAccess: access.hasPaidAccess,
    freeTopicsLeft: access.freeTopicsLeft,
  };
}

/**
 * Page 4 — MBS Billing
 * Free users: completely locked (0 access).
 * Any active paid tier: full access.
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
