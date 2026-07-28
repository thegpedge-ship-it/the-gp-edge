/**
 * lib/module-gates.ts
 *
 * Atomic free-quota decrement functions for each module.
 * All decrements use Prisma's atomic { decrement: 1 } with a WHERE guard
 * (free_*_left > 0) to prevent race conditions when a user triggers
 * multiple simultaneous requests.
 *
 * Pattern:
 *   - updateMany returns { count: 0 } if the quota was already 0 → access denied.
 *   - updateMany returns { count: 1 } if the decrement succeeded → access granted.
 *
 * These functions are meant to be called from Server Actions or API routes,
 * never from client-side code.
 */

import prisma from "@/lib/prisma";
import { getUserAccess } from "@/lib/access";

// ─── Page 1 — Exam Prep ───────────────────────────────────────────────────────

/**
 * Check whether a user can access Exam Prep and, for free users, atomically
 * consume one question from their lifetime quota.
 *
 * Returns:
 *   { granted: true,  remaining: number }  — access allowed
 *   { granted: false, remaining: 0 }       — quota exhausted or no access
 */
export async function consumeExamPrepQuestion(userId: string): Promise<{
  granted: boolean;
  remaining: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { granted: false, remaining: 0 };

  // Full paid access — no quota deduction needed
  if (access.isRegistrarActive) {
    return { granted: true, remaining: Infinity as unknown as number };
  }

  // Free user — attempt atomic decrement (WHERE free_questions_left > 0)
  const result = await prisma.users.updateMany({
    where: {
      id: userId,
      free_questions_left: { gt: 0 },
    },
    data: {
      free_questions_left: { decrement: 1 },
    },
  });

  if (result.count === 0) {
    // Already at 0, or user not found
    return { granted: false, remaining: 0 };
  }

  // Fetch updated count (one extra read, but keeps code clear)
  const updated = await prisma.users.findUnique({
    where: { id: userId },
    select: { free_questions_left: true },
  });

  return {
    granted: true,
    remaining: updated?.free_questions_left ?? 0,
  };
}

// ─── Page 2 — Note Templates ──────────────────────────────────────────────────

/**
 * Check whether a user can access a note template and, for free users,
 * atomically consume one template from their lifetime quota.
 */
export async function consumeTemplateAccess(userId: string): Promise<{
  granted: boolean;
  remaining: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { granted: false, remaining: 0 };

  // Any active paid tier grants full template access
  if (access.hasPaidAccess) {
    return { granted: true, remaining: Infinity as unknown as number };
  }

  // Free user — atomic decrement
  const result = await prisma.users.updateMany({
    where: {
      id: userId,
      free_templates_left: { gt: 0 },
    },
    data: {
      free_templates_left: { decrement: 1 },
    },
  });

  if (result.count === 0) {
    return { granted: false, remaining: 0 };
  }

  const updated = await prisma.users.findUnique({
    where: { id: userId },
    select: { free_templates_left: true },
  });

  return {
    granted: true,
    remaining: updated?.free_templates_left ?? 0,
  };
}

// ─── Page 3 — Study / Clinical Notes ─────────────────────────────────────────

/**
 * Check whether a user can access a study topic and, for free users,
 * atomically consume one topic from their lifetime quota.
 */
export async function consumeStudyTopicAccess(userId: string): Promise<{
  granted: boolean;
  remaining: number;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { granted: false, remaining: 0 };

  // Any active paid tier grants full study access
  if (access.hasPaidAccess) {
    return { granted: true, remaining: Infinity as unknown as number };
  }

  // Free user — atomic decrement
  const result = await prisma.users.updateMany({
    where: {
      id: userId,
      free_topics_left: { gt: 0 },
    },
    data: {
      free_topics_left: { decrement: 1 },
    },
  });

  if (result.count === 0) {
    return { granted: false, remaining: 0 };
  }

  const updated = await prisma.users.findUnique({
    where: { id: userId },
    select: { free_topics_left: true },
  });

  return {
    granted: true,
    remaining: updated?.free_topics_left ?? 0,
  };
}

// ─── Page 4 — MBS Billing ─────────────────────────────────────────────────────

/**
 * Check whether a user can access the MBS Billing page.
 * Free users have ZERO access — no quota, no deduction.
 */
export async function checkMBSAccess(userId: string): Promise<{
  granted: boolean;
}> {
  const access = await getUserAccess(userId);
  if (!access) return { granted: false };
  return { granted: access.hasPaidAccess };
}

// ─── Quota forfeiture (called by webhook on paid purchase) ────────────────────

/**
 * When a user first purchases any paid plan, forfeit their remaining free
 * quota immediately. This ensures that once their subscription expires,
 * they are prompted to re-subscribe (not given a fresh free batch).
 *
 * Called by the Stripe webhook on checkout.session.completed.
 */
export async function forfeitFreeQuota(userId: string): Promise<void> {
  await prisma.users.update({
    where: { id: userId },
    data: {
      free_questions_left: 0,
      free_templates_left: 0,
      free_topics_left: 0,
    },
  });
}
