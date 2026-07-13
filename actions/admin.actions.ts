"use server";

import { query, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";

export interface CredentialUser {
  id: string;
  name: string;
  username: string;
  role: "Super Admin" | "Admin" | "Moderator" | "Viewer";
  email: string;
  password?: string;
  forgotPasswordEnabled: boolean;
  oauthEnabled?: boolean;
  mfaEnabled?: boolean;
  mustResetPassword?: boolean;
  status?: string;
  permissions?: string[];
  lastChanged?: string;
}

function mapRowToCredentialUser(row: any): CredentialUser {
  const dbPermissions: string[] = row.permissions
    ? row.permissions.filter(Boolean)
    : [];

  // Always derive full permission set from role — Super Admins may have no rows
  // in admin_user_permissions, so fall back to role-based grants.
  let permissions: string[];
  if (row.role_id === 1) {
    // Super Admin gets everything regardless of the permissions table
    permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "notifications", "billing", "audit", "settings", "search"];
  } else if (dbPermissions.length > 0) {
    permissions = dbPermissions;
  } else {
    permissions = ["dashboard"];
  }

  let role: "Super Admin" | "Admin" | "Moderator" | "Viewer" = "Admin";
  if (row.role_id === 1) {
    role = "Super Admin";
  } else if (permissions.includes("billing")) {
    role = "Admin";
  } else if (permissions.includes("content") || permissions.includes("approaches")) {
    role = "Moderator";
  } else {
    role = "Viewer";
  }

  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password: row.password_hash,
    role,
    forgotPasswordEnabled: row.forgot_password_enabled,
    oauthEnabled: row.oauth_enabled,
    mfaEnabled: row.mfa_enabled,
    mustResetPassword: row.password_changed_at === null,
    status: row.status,
    permissions,
  };
}

export async function getAdminsFromDbAction(): Promise<CredentialUser[]> {
  try {
    const rows = await query<any>(
      `SELECT u.*,
              ARRAY_REMOVE(ARRAY_AGG(p.permission_key) FILTER (WHERE p.granted = true), NULL) AS permissions
         FROM admin_users u
         LEFT JOIN admin_user_permissions p ON p.admin_user_id = u.id
        WHERE u.deleted_at IS NULL
        GROUP BY u.id
        ORDER BY u.created_at ASC`
    );
    return rows.map(mapRowToCredentialUser);
  } catch (error) {
    console.error("Error fetching admins from DB:", error);
    return [];
  }
}

export async function saveAdminToDbAction(user: CredentialUser): Promise<boolean> {
  try {
    const roleId = user.role === "Super Admin" ? 1 : 2;
    const isNew = !user.id || user.id.length < 20;
    const dbId = isNew ? randomUUID() : user.id;
    const permissions = user.permissions || [];
    const passwordHash = user.password || "password123";
    const passwordChangedAt = user.mustResetPassword ? null : new Date();

    // Ensure permission keys exist
    for (const key of permissions) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      await execute(
        `INSERT INTO permissions (key, label) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, label]
      );
    }

    // Upsert admin user
    await execute(
      `INSERT INTO admin_users
         (id, name, username, email, password_hash, role_id,
          forgot_password_enabled, oauth_enabled, mfa_enabled,
          status, password_changed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role_id = EXCLUDED.role_id,
         forgot_password_enabled = EXCLUDED.forgot_password_enabled,
         oauth_enabled = EXCLUDED.oauth_enabled,
         mfa_enabled = EXCLUDED.mfa_enabled,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        dbId,
        user.name,
        user.username,
        user.email,
        passwordHash,
        roleId,
        user.forgotPasswordEnabled,
        user.oauthEnabled ?? false,
        user.mfaEnabled ?? false,
        user.status || "active",
        passwordChangedAt,
      ]
    );

    // Sync permissions
    await execute(`DELETE FROM admin_user_permissions WHERE admin_user_id = $1`, [dbId]);
    for (const key of permissions) {
      await execute(
        `INSERT INTO admin_user_permissions (admin_user_id, permission_key, granted)
         VALUES ($1, $2, true)
         ON CONFLICT (admin_user_id, permission_key) DO NOTHING`,
        [dbId, key]
      );
    }

    return true;
  } catch (error) {
    console.error("Error saving admin to DB:", error);
    return false;
  }
}

export async function deleteAdminFromDbAction(id: string): Promise<boolean> {
  try {
    await execute(
      `UPDATE admin_users SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );
    return true;
  } catch (error) {
    console.error("Error deleting admin from DB:", error);
    return false;
  }
}

export async function resetAdminPasswordAction(
  id: string,
  newPassword: string
): Promise<boolean> {
  try {
    await execute(
      `UPDATE admin_users
          SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
      [newPassword, id]
    );
    return true;
  } catch (error) {
    console.error("Error resetting admin password in DB:", error);
    return false;
  }
}

export async function syncLocalAdminsWithDbAction(
  localAdmins: CredentialUser[]
): Promise<CredentialUser[]> {
  try {
    let dbAdmins = await getAdminsFromDbAction();

    // Replace dummy placeholder passwords with real ones from local storage
    for (const admin of dbAdmins) {
      if (admin.password?.startsWith("dummy_")) {
        const localMatch = localAdmins.find((l) => l.username === admin.username);
        if (localMatch?.password) {
          await execute(
            `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [localMatch.password, admin.id]
          );
          admin.password = localMatch.password;
        }
      }
    }

    if (dbAdmins.length === 0 && localAdmins.length > 0) {
      for (const admin of localAdmins) {
        await saveAdminToDbAction(admin);
      }
      return getAdminsFromDbAction();
    }
    return dbAdmins;
  } catch (error) {
    console.error("Error syncing admin list:", error);
    return localAdmins;
  }
}
