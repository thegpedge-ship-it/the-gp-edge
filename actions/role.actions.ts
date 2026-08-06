"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureDbUser } from "@/lib/user";
import { clearAccessCookie } from "@/lib/access-cookie";

export async function updateCareerStageAction(
  stage: "REGISTRAR" | "FELLOW"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const dbUser = await ensureDbUser();
    if (!dbUser) return { success: false, error: "User profile not found" };

    const user_role = stage === "FELLOW" ? "FELLOW" : "REGISTRAR";

    try {
      await prisma.users.update({
        where: { clerk_user_id: userId },
        data: {
          training_stage: stage,
          user_role: user_role,
          role_reevaluated: true,
        },
      });
    } catch (dbErr) {
      console.warn("[updateCareerStageAction] Fallback update triggered:", dbErr);
      await prisma.users.update({
        where: { clerk_user_id: userId },
        data: {
          user_role: user_role,
        },
      });
    }

    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          trainingStage: stage,
          roleReevaluated: true,
        },
      });
    } catch (clerkErr) {
      console.warn("[updateCareerStageAction] Clerk metadata update warning:", clerkErr);
    }

    // Career stage changes which plans/access the user gets — bust the cached
    // access cookie so the next read reflects it immediately (rather than after
    // the cookie's TTL).
    await clearAccessCookie();

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/pricing");
    revalidatePath("/dashboard/exam-prep");
    return { success: true };
  } catch (err) {
    console.error("[updateCareerStageAction] Error updating career stage:", err);
    return { success: false, error: "Failed to update career stage. Please try again." };
  }
}
