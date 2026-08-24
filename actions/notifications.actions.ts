"use server";

import { query, execute } from "@/lib/db";
import { ensureDbUser } from "@/lib/user";

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  deliveredAt: string;
}

export async function getUserNotificationsAction(): Promise<UserNotification[]> {
  const dbUser = await ensureDbUser();
  if (!dbUser) return [];

  const rows = await query<any>(
    `SELECT un.id, n.title, n.message, n.type, un.is_read, un.delivered_at
     FROM user_notifications un
     JOIN notifications n ON n.id = un.notification_id
     WHERE un.user_id = $1 AND un.is_dismissed = false
     ORDER BY un.delivered_at DESC
     LIMIT 20`,
    [dbUser.id]
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    message: r.message || "",
    type: r.type || "In-app",
    isRead: r.is_read,
    deliveredAt: r.delivered_at ? new Date(r.delivered_at).toISOString() : new Date().toISOString(),
  }));
}

export async function markNotificationReadAction(userNotificationId: string): Promise<{ success: boolean }> {
  const dbUser = await ensureDbUser();
  if (!dbUser) return { success: false };

  await execute(
    `UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2`,
    [userNotificationId, dbUser.id]
  );
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<{ success: boolean }> {
  const dbUser = await ensureDbUser();
  if (!dbUser) return { success: false };

  await execute(
    `UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
    [dbUser.id]
  );
  return { success: true };
}

export async function dismissNotificationAction(userNotificationId: string): Promise<{ success: boolean }> {
  const dbUser = await ensureDbUser();
  if (!dbUser) return { success: false };

  await execute(
    `UPDATE user_notifications SET is_dismissed = true WHERE id = $1 AND user_id = $2`,
    [userNotificationId, dbUser.id]
  );
  return { success: true };
}
