"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";

export type ProfileUpdate = {
  location?: string | null;
  roleTitle?: string | null;
  examTarget?: string | null;
  postgraduateYear?: number | null;
  examTargetCode?: string | null;
  primaryMedicalDegree?: string | null;
  fellowshipStatus?: string | null;
  country?: string | null;
  stateTerritory?: string | null;
};

export type ActionResult = { ok: boolean; error?: string };

export async function updateProfileInfo(input: ProfileUpdate): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You're not signed in." };

  const dbUser = await ensureDbUser();
  if (!dbUser) return { ok: false, error: "Could not load your account. Please refresh." };

  const norm = (v: string | null | undefined) => {
    if (v === undefined) return undefined;
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };

  const columns: Record<string, string | number | null> = {};
  const stringMapping: [keyof ProfileUpdate, string][] = [
    ["location", "location"],
    ["roleTitle", "role_title"],
    ["examTarget", "exam_target"],
    ["examTargetCode", "exam_target_code"],
    ["primaryMedicalDegree", "primary_medical_degree"],
    ["fellowshipStatus", "fellowship_status"],
    ["country", "country"],
    ["stateTerritory", "state_territory"],
  ];
  for (const [key, column] of stringMapping) {
    const value = norm(input[key] as string | null | undefined);
    if (value !== undefined) columns[column] = value;
  }

  if (input.postgraduateYear !== undefined) {
    columns["postgraduate_year"] = input.postgraduateYear;
  }

  if (Object.keys(columns).length === 0) return { ok: true };

  try {
    await prisma.users.update({ where: { clerk_user_id: userId }, data: columns });
  } catch {
    return { ok: false, error: "Something went wrong saving your changes." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteOwnAccountData(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "You're not signed in." };

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { accountDeleted: true },
  });

  let fileIds: string[] = [];
  try {
    fileIds = await prisma.$transaction(async (tx) => {
      const u = await tx.users.findUnique({
        where: { clerk_user_id: userId },
        select: { id: true, avatar_file_id: true },
      });
      if (!u) return [];

      const owned = await tx.files.findMany({
        where: { uploaded_by: u.id },
        select: { id: true },
      });
      const ids = owned.map((f) => f.id);
      if (u.avatar_file_id) ids.push(u.avatar_file_id);

      await tx.autofill_usages.deleteMany({ where: { user_id: u.id } });
      await tx.users.delete({ where: { id: u.id } });

      return ids;
    });
  } catch {
    try {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { accountDeleted: null },
      });
    } catch {
      // Best effort
    }
    return { ok: false, error: "Could not delete your account data." };
  }

  for (const id of fileIds) {
    try {
      await prisma.files.delete({ where: { id } });
    } catch {
      // Referenced elsewhere — leave it
    }
  }

  return { ok: true };
}
