"use server";

import { query } from "@/lib/db";
import { ensureDbUser } from "@/lib/user";

export async function saveLibraryFeedback(input: {
  conditionId: string;
  conditionName: string;
  feedback: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const dbUser = await ensureDbUser();
    if (!dbUser) return { ok: false, error: "You must be signed in." };

    const text = input.feedback.trim();
    if (!text || text.length > 500) {
      return { ok: false, error: "Feedback must be between 1 and 500 characters." };
    }

    await query(
      `INSERT INTO medical_library_feedback (condition_id, condition_name, user_id, feedback)
       VALUES ($1, $2, $3, $4)`,
      [input.conditionId, input.conditionName, dbUser.id, text]
    );

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save feedback. Please try again." };
  }
}
