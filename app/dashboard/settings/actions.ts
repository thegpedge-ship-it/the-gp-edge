"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export type ProfileUpdate = {
  hospital?: string | null;
  location?: string | null;
  roleTitle?: string | null;
  examTarget?: string | null;
  racgpId?: string | null;
  bio?: string | null;
};

export type ActionResult = { ok: boolean; error?: string };

/**
 * Update the user's own profile fields in our Postgres `users` table.
 *
 * Only keys that are actually present on `input` are written, so each form
 * (Account, Exam Prep, …) can submit just the slice it owns. Empty strings are
 * stored as NULL. Identity (name/email) and password are owned by Clerk and are
 * NOT handled here — see the client side for those.
 */
export async function updateProfileInfo(input: ProfileUpdate): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You're not signed in." };

  // Make sure the row exists (e.g. Google users who never hit onboarding writes).
  const dbUser = await ensureDbUser();
  if (!dbUser) return { ok: false, error: "Could not load your account. Please refresh." };

  const norm = (v: string | null | undefined) => {
    if (v === undefined) return undefined; // key absent → don't touch column
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };

  const columns: Record<string, string | null> = {};
  const mapping: [keyof ProfileUpdate, string][] = [
    ["hospital", "hospital"],
    ["location", "location"],
    ["roleTitle", "role_title"],
    ["examTarget", "exam_target"],
    ["racgpId", "racgp_id"],
    ["bio", "bio"],
  ];
  for (const [key, column] of mapping) {
    const value = norm(input[key]);
    if (value !== undefined) columns[column] = value;
  }

  if (Object.keys(columns).length === 0) return { ok: true };

  try {
    await prisma.users.update({ where: { clerk_user_id: userId }, data: columns });
  } catch {
    return { ok: false, error: "Something went wrong saving your changes." };
  }

  // Refresh the cached dashboard so the sidebar/profile pick up the new values.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/**
 * Permanently delete ALL of the signed-in user's data from our database.
 *
 * Runs with the authenticated session (`auth()`), so it's reliable and secure —
 * it can only ever delete the caller's own data. The client calls this BEFORE
 * deleting the Clerk identity (while the session is still valid).
 *
 * Completeness: most tables referencing `users` are ON DELETE CASCADE, so a
 * single `users` delete removes study history, attempts, results, subscription,
 * payments, badges, bookmarks, preferences, notifications, mastery, etc. Two
 * tables are ON DELETE SET NULL (`autofill_usages`, `files.uploaded_by`), so we
 * handle those explicitly here so no row tied to the user survives.
 */
export async function deleteOwnAccountData(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You're not signed in." };

  let fileIds: string[] = [];
  try {
    fileIds = await prisma.$transaction(async (tx) => {
      const u = await tx.users.findUnique({
        where: { clerk_user_id: userId },
        select: { id: true, avatar_file_id: true },
      });
      if (!u) return [];

      // Capture the user's file ids BEFORE deleting the user — otherwise the
      // ON DELETE SET NULL on files.uploaded_by erases the link.
      const owned = await tx.files.findMany({
        where: { uploaded_by: u.id },
        select: { id: true },
      });
      const ids = owned.map((f) => f.id);
      if (u.avatar_file_id) ids.push(u.avatar_file_id);

      // SET NULL table — remove explicitly so no orphan usage row remains.
      await tx.autofill_usages.deleteMany({ where: { user_id: u.id } });

      // Deleting the user cascades every ON DELETE CASCADE table.
      await tx.users.delete({ where: { id: u.id } });

      return ids;
    });
  } catch {
    return { ok: false, error: "Could not delete your account data." };
  }

  // Best-effort removal of the user's own files now that they're unlinked. Done
  // per-file so one row pinned by protected content (condition_documents is
  // ON DELETE RESTRICT) can't block deleting the rest.
  for (const id of fileIds) {
    try {
      await prisma.files.delete({ where: { id } });
    } catch {
      // Referenced elsewhere — leave it; its uploaded_by is already NULL.
    }
  }

  return { ok: true };
}
