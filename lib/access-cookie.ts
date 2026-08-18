/**
 * lib/access-cookie.ts
 *
 * Short-lived, signed, httpOnly cookie cache for a user's access snapshot
 * (role, subscription tier, access level, expiry, free counts).
 *
 * WHY: getUserAccess() in lib/access.ts runs 2 DB queries on EVERY authenticated
 * request (it force-opts-out of Next's data cache so access decisions are never
 * stale). That is correct but costly. This module lets getUserAccess() serve the
 * snapshot straight from the request cookie when it is fresh, avoiding the DB
 * round-trips entirely.
 *
 * SECURITY MODEL:
 *   - The cookie is HMAC-signed (SHA-256) with a server-only secret, so a client
 *     cannot forge or tamper with it to elevate their own access.
 *   - It is httpOnly, so page JavaScript cannot read it.
 *   - The subscription's exact `accessExpiresAt` is embedded and re-checked on
 *     every read, so a plan expiring mid-TTL is honored immediately.
 *   - A short TTL (ACCESS_COOKIE_TTL_MS) bounds staleness for changes that happen
 *     on OTHER requests (e.g. a Stripe webhook cancelling a subscription) which
 *     cannot reach this user's browser cookie.
 *
 * NEXT.JS CONSTRAINT:
 *   - Cookies can be READ in any server context, but only WRITTEN in a Server
 *     Action or Route Handler. writeAccessCookie() therefore swallows the
 *     "can only be modified…" error so it degrades gracefully when called during
 *     a pure Server Component render (the DB result is still returned; it just is
 *     not cached that time).
 */

import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserAccessInfo, UserRole, TrainingStage, AccessLevel } from "@/lib/access";

export const ACCESS_COOKIE_NAME = "gpedge_access";

/** How long a cached snapshot is trusted before a fresh DB read is forced. */
export const ACCESS_COOKIE_TTL_MS = 60_000; // 60 seconds

const SECRET =
  process.env.ACCESS_COOKIE_SECRET ||
  process.env.CLERK_SECRET_KEY ||
  "insecure-dev-secret-change-me";

/**
 * The serialized shape stored inside the cookie. Dates are epoch-ms numbers and
 * every field is primitive so the whole thing is a compact JSON string.
 *
 * `ids` lets us safely match the cookie against whichever identifier a caller
 * passed to getUserAccess (internal id, Clerk id, or email) without a DB lookup.
 */
interface AccessSnapshot {
  v: 1;
  cachedAt: number;
  ids: { internalId: string; clerkUserId: string | null; email: string | null };
  userRole: UserRole;
  trainingStage: TrainingStage;
  hasPurchasedRegistrar: boolean;
  roleReevaluated: boolean;
  accessLevel: AccessLevel;
  isRegistrarActive: boolean;
  hasPaidAccess: boolean;
  freeQuestionsLeft: number;
  freeTemplatesLeft: number;
  freeTopicsLeft: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null; // epoch ms
  accessExpiresAt: number | null; // epoch ms — the exact subscription expiry
  activePriceId: string | null;
  currentPeriodStart: number | null; // epoch ms
}

// ─── Signing ───────────────────────────────────────────────────────────────────

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", SECRET).update(payload).digest());
}

function encode(snapshot: AccessSnapshot): string {
  const payload = b64url(JSON.stringify(snapshot));
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): AccessSnapshot | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payload);
  // Constant-time comparison to avoid signature timing oracles.
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(json) as AccessSnapshot;
    return parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

// ─── Snapshot <-> UserAccessInfo ────────────────────────────────────────────────

function toSnapshot(
  access: UserAccessInfo,
  ids: AccessSnapshot["ids"],
  accessExpiresAt: Date | null,
): AccessSnapshot {
  return {
    v: 1,
    cachedAt: Date.now(),
    ids,
    userRole: access.userRole,
    trainingStage: access.trainingStage,
    hasPurchasedRegistrar: access.hasPurchasedRegistrar,
    roleReevaluated: access.roleReevaluated,
    accessLevel: access.accessLevel,
    isRegistrarActive: access.isRegistrarActive,
    hasPaidAccess: access.hasPaidAccess,
    freeQuestionsLeft: access.freeQuestionsLeft,
    freeTemplatesLeft: access.freeTemplatesLeft,
    freeTopicsLeft: access.freeTopicsLeft,
    cancelAtPeriodEnd: access.cancelAtPeriodEnd,
    currentPeriodEnd: access.currentPeriodEnd ? access.currentPeriodEnd.getTime() : null,
    accessExpiresAt: accessExpiresAt ? accessExpiresAt.getTime() : null,
    activePriceId: access.activePriceId,
    currentPeriodStart: access.currentPeriodStart ? access.currentPeriodStart.getTime() : null,
  };
}

function fromSnapshot(s: AccessSnapshot): UserAccessInfo {
  return {
    userId: s.ids.internalId,
    userRole: s.userRole,
    trainingStage: s.trainingStage,
    hasPurchasedRegistrar: s.hasPurchasedRegistrar,
    roleReevaluated: s.roleReevaluated,
    accessLevel: s.accessLevel,
    isRegistrarActive: s.isRegistrarActive,
    hasPaidAccess: s.hasPaidAccess,
    freeQuestionsLeft: s.freeQuestionsLeft,
    freeTemplatesLeft: s.freeTemplatesLeft,
    freeTopicsLeft: s.freeTopicsLeft,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    currentPeriodEnd: s.currentPeriodEnd != null ? new Date(s.currentPeriodEnd) : null,
    activePriceId: s.activePriceId,
    currentPeriodStart: s.currentPeriodStart != null ? new Date(s.currentPeriodStart) : null,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Return the cached access snapshot for `userId` if a valid, fresh, non-expired
 * cookie exists — otherwise null (caller must fall back to the DB).
 *
 * `userId` may be the internal DB id, the Clerk user id, or the email — it is
 * matched against all three identifiers recorded in the cookie.
 */
export async function readAccessCookie(userId: string): Promise<UserAccessInfo | null> {
  try {
    const raw = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
    if (!raw) return null;

    const snap = decode(raw);
    if (!snap) return null;

    // Must belong to the user being asked about.
    const { internalId, clerkUserId, email } = snap.ids;
    if (userId !== internalId && userId !== clerkUserId && userId !== email) {
      return null;
    }

    const now = Date.now();

    // TTL guard — bounds staleness for out-of-band changes (webhooks etc.).
    if (now - snap.cachedAt >= ACCESS_COOKIE_TTL_MS) return null;

    // Exact subscription-expiry guard — a plan that lapsed mid-TTL is honored
    // immediately, never served from cache as still-active.
    if (snap.accessExpiresAt != null && snap.accessExpiresAt <= now) return null;

    return fromSnapshot(snap);
  } catch {
    return null;
  }
}

/**
 * Persist `access` into the signed cookie. No-op (swallowed) when called from a
 * context where Next.js forbids cookie writes (e.g. a Server Component render).
 */
export async function writeAccessCookie(
  access: UserAccessInfo,
  ids: AccessSnapshot["ids"],
  accessExpiresAt: Date | null,
): Promise<void> {
  try {
    const token = encode(toSnapshot(access, ids, accessExpiresAt));
    (await cookies()).set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.ceil(ACCESS_COOKIE_TTL_MS / 1000),
    });
  } catch {
    // Cookie writes are only allowed in Server Actions / Route Handlers.
    // In a pure RSC render this throws; we ignore it and simply don't cache.
  }
}

/**
 * Invalidate the cached snapshot. Call after a mutation on THIS request that
 * changes access (e.g. the user switching career stage) so the next read is
 * forced back to the DB instead of waiting out the TTL.
 */
export async function clearAccessCookie(): Promise<void> {
  try {
    (await cookies()).delete(ACCESS_COOKIE_NAME);
  } catch {
    // Not in a writable context — ignore.
  }
}
