"use server";

import { query, queryOne, execute } from "@/lib/db";
import { recordAuditLog } from "@/lib/relationalPermissions";

/**
 * 1. 18-Month Subscriber Performance Data Retention Auto-Purge
 * Subscriber performance data is retained for a maximum of 18 months from the attempt date.
 * Attempts older than 18 months are permanently deleted.
 * Item performance analytics are unaffected (aggregates do not depend on identifiable records).
 */
export async function purgeExpiredSubscriberPerformanceDataAction(): Promise<{
  success: boolean;
  purgedAttemptsCount: number;
  error?: string;
}> {
  try {
    const deletedRows = await query<any>(
      `DELETE FROM test_attempts
        WHERE created_at < (NOW() - INTERVAL '18 months')
        RETURNING id`
    );

    const count = deletedRows.length;

    await recordAuditLog({
      adminUserId: null,
      action: "purge_expired_performance_data",
      category: "privacy_retention",
      entityType: "test_attempt",
      entityId: "18_month_retention_policy",
      metadata: {
        purgedAttemptsCount: count,
        retentionLimitMonths: 18,
        purgedAt: new Date().toISOString(),
      },
    });

    return { success: true, purgedAttemptsCount: count };
  } catch (err: any) {
    console.error("Error purging expired performance data:", err);
    return { success: false, purgedAttemptsCount: 0, error: err.message };
  }
}

/**
 * 2. Subscriber Performance Data Deletion on Request
 * A subscriber may request deletion of their performance data at any time.
 * Deletes all personal attempt records and progress history.
 */
export async function deleteSubscriberPerformanceDataOnRequestAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) return { success: false, error: "User ID is required." };

    await execute(
      `DELETE FROM test_attempts WHERE user_id = $1::uuid`,
      [userId]
    );

    await execute(
      `DELETE FROM user_progress WHERE user_id = $1::uuid`,
      [userId]
    ).catch(() => {});

    await recordAuditLog({
      adminUserId: userId,
      action: "delete_user_performance_data_on_request",
      category: "privacy_retention",
      entityType: "user_performance",
      entityId: userId,
      metadata: {
        userId,
        reason: "Subscriber right-to-be-forgotten deletion request",
        deletedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error deleting user performance data on request:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Export All User Data (Privacy / Australian Privacy Act / GDPR Compliance)
 * Exports every table touched by the user / account-deletion cascade.
 */
import { ensureDbUser } from "@/lib/user";
import { fetchUserDataForExport, UserDataExportPayload } from "@/lib/privacyData";

export async function exportAllUserDataAction(): Promise<{
  success: boolean;
  data?: UserDataExportPayload;
  error?: string;
}> {
  try {
    const dbUser = await ensureDbUser();
    if (!dbUser) {
      return { success: false, error: "Unauthorized or user profile not found." };
    }

    const payload = await fetchUserDataForExport(dbUser.id);
    if (!payload) {
      return { success: false, error: "Failed to extract user data." };
    }

    await recordAuditLog({
      adminUserId: dbUser.id,
      action: "download_my_data_export",
      category: "privacy_export",
      entityType: "user_privacy_export",
      entityId: dbUser.id,
      metadata: {
        userId: dbUser.id,
        email: dbUser.email,
        exportedAt: new Date().toISOString(),
      },
    });

    return { success: true, data: payload };
  } catch (err: any) {
    console.error("Error exporting user data:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

