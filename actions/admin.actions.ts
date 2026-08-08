"use server";

import { query, queryOne, execute } from "@/lib/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface CredentialUser {
  id: string;
  name: string;
  username: string;
  role: string;
  roles?: string[];
  email: string;
  password?: string;
  forgotPasswordEnabled: boolean;
  oauthEnabled?: boolean;
  mfaEnabled?: boolean;
  mustResetPassword?: boolean;
  status?: "active" | "deactivated" | "suspended" | "trial" | "lapsed" | string;
  permissions?: string[];
  lastChanged?: string;
}

export async function isBcryptHash(str?: string): Promise<boolean> {
  if (!str) return false;
  return str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$");
}

export async function hashPassword(password: string): Promise<string> {
  if (await isBcryptHash(password)) {
    return password;
  }
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(plainText: string, storedHashOrPlain: string): Promise<boolean> {
  if (!storedHashOrPlain) return false;
  if (await isBcryptHash(storedHashOrPlain)) {
    return await bcrypt.compare(plainText, storedHashOrPlain);
  }
  return plainText === storedHashOrPlain;
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
    permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "mbs", "notifications", "billing", "audit", "settings", "search"];
  } else if (dbPermissions.length > 0) {
    permissions = dbPermissions;
  } else {
    permissions = ["dashboard"];
  }

  let role: "Super Admin" | "Admin" = "Admin";
  if (row.role_id === 1) {
    role = "Super Admin";
  } else if (permissions.includes("billing")) {
    role = "Admin";
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

export async function saveAdminToDbAction(user: CredentialUser): Promise<{ success: boolean; error?: string }> {
  try {
    const roleId = user.role === "Super Admin" ? 1 : 2;
    const isNew = !user.id || user.id.length < 20;
    const dbId = isNew ? randomUUID() : user.id;
    const permissions = user.permissions || [];
    
    let passwordHash: string;
    if (user.password) {
      passwordHash = await hashPassword(user.password);
    } else if (!isNew) {
      const existing = await queryOne<any>(`SELECT password_hash FROM admin_users WHERE id = $1`, [dbId]);
      passwordHash = existing?.password_hash || (await hashPassword("password123"));
    } else {
      passwordHash = await hashPassword("password123");
    }

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

    return { success: true };
  } catch (error: any) {
    console.error("Error saving admin to DB:", error);
    if (error.code === "23505") {
      if (error.constraint === "admin_users_email_key") {
        return { success: false, error: "An administrator with this email already exists." };
      }
      if (error.constraint === "admin_users_username_key") {
        return { success: false, error: "An administrator with this username already exists." };
      }
      if (error.constraint === "one_super_admin") {
        return { success: false, error: "Only one Super Admin account can exist." };
      }
      return { success: false, error: `Unique key violation: ${error.detail || error.message}` };
    }
    return { success: false, error: error.message || "Failed to save admin to database." };
  }
}

export async function deleteAdminFromDbAction(id: string): Promise<boolean> {
  try {
    const target = await queryOne<any>(`SELECT role_id FROM admin_users WHERE id = $1`, [id]);
    if (!target) {
      return true;
    }
    if (target.role_id === 1) {
      console.error("Super Admin account cannot be deleted.");
      return false;
    }

    // Delete permissions assigned to this admin user
    await execute(`DELETE FROM admin_user_permissions WHERE admin_user_id = $1`, [id]);

    // Completely delete admin record from admin_users table in Neon DB
    await execute(`DELETE FROM admin_users WHERE id = $1 AND role_id != 1`, [id]);

    return true;
  } catch (error) {
    console.error("Error completely deleting admin from Neon DB:", error);
    return false;
  }
}

export async function resetAdminPasswordAction(
  id: string,
  newPassword: string
): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    await execute(
      `UPDATE admin_users
          SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
      [hashedPassword, id]
    );
    return true;
  } catch (error) {
    console.error("Error resetting admin password in DB:", error);
    return false;
  }
}

export async function verifyAdminCredentialsAction(
  username: string,
  plainPassword: string
): Promise<{ success: boolean; user?: CredentialUser; error?: string }> {
  try {
    const rows = await query<any>(
      `SELECT u.*,
              ARRAY_REMOVE(ARRAY_AGG(p.permission_key) FILTER (WHERE p.granted = true), NULL) AS permissions
         FROM admin_users u
         LEFT JOIN admin_user_permissions p ON p.admin_user_id = u.id
        WHERE LOWER(u.username) = LOWER($1) AND u.deleted_at IS NULL
        GROUP BY u.id
        LIMIT 1`,
      [username.trim()]
    );

    if (!rows || rows.length === 0) {
      return { success: false, error: "Username not found. Please contact your Super Administrator." };
    }

    const row = rows[0];
    const storedHash = row.password_hash;
    const isValid = await verifyPassword(plainPassword, storedHash);

    if (!isValid) {
      return { success: false, error: "Invalid password. Please check your credentials and try again." };
    }

    // Automatically migrate legacy plain-text passwords in DB to bcrypt hashes
    if (!(await isBcryptHash(storedHash))) {
      const newHash = await hashPassword(plainPassword);
      await execute(`UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, row.id]);
      row.password_hash = newHash;
    }

    const user = mapRowToCredentialUser(row);
    return { success: true, user };
  } catch (error: any) {
    console.error("Error verifying admin credentials:", error);
    return { success: false, error: error.message || "Authentication error." };
  }
}

export async function syncLocalAdminsWithDbAction(
  localAdmins: CredentialUser[]
): Promise<CredentialUser[]> {
  try {
    let dbAdmins = await getAdminsFromDbAction();

    // Migrate any legacy unhashed passwords in DB to bcrypt hashes
    for (const admin of dbAdmins) {
      if (admin.password && !(await isBcryptHash(admin.password))) {
        if (admin.password.startsWith("dummy_")) {
          const localMatch = localAdmins.find((l) => l.username === admin.username);
          if (localMatch?.password) {
            const hashedPassword = await hashPassword(localMatch.password);
            await execute(
              `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
              [hashedPassword, admin.id]
            );
            admin.password = hashedPassword;
          }
        } else {
          const hashedPassword = await hashPassword(admin.password);
          await execute(
            `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [hashedPassword, admin.id]
          );
          admin.password = hashedPassword;
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

export interface RealAdminUser {
  id: string;
  name: string;
  email: string;
  plan: "premium" | "free";
  lastActive: string;
  status: "active" | "suspended";
  joined: string;
}

export async function getRealUsersFromDbAction(): Promise<RealAdminUser[]> {
  try {
    const rows = await query<any>(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.status,
         u.created_at,
         u.joined_at,
         u.last_active_at,
         u.has_purchased_registrar,
         s.access_level,
         s.status AS sub_status
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    return rows.map((row) => {
      const firstName = (row.first_name || "").trim();
      const lastName = (row.last_name || "").trim();
      let fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) {
        fullName = row.email ? row.email.split("@")[0] : `User #${row.id.slice(0, 8)}`;
      }

      const isPremium =
        (row.access_level && row.access_level !== "FREE") ||
        row.has_purchased_registrar ||
        row.sub_status === "active";

      const joinedDate = row.joined_at || row.created_at;
      const joinedFormatted = joinedDate
        ? new Date(joinedDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Unknown";

      let lastActiveFormatted = "Recently";
      if (row.last_active_at) {
        const diffMs = Date.now() - new Date(row.last_active_at).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 5) lastActiveFormatted = "Just now";
        else if (diffMins < 60) lastActiveFormatted = `${diffMins} mins ago`;
        else if (diffHours < 24) lastActiveFormatted = `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
        else if (diffDays < 30) lastActiveFormatted = `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
        else lastActiveFormatted = new Date(row.last_active_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      }

      return {
        id: row.id,
        name: fullName,
        email: row.email || "No email",
        plan: isPremium ? ("premium" as const) : ("free" as const),
        status: row.status === "suspended" ? ("suspended" as const) : ("active" as const),
        joined: joinedFormatted,
        lastActive: lastActiveFormatted,
      };
    });
  } catch (error) {
    console.error("Error fetching real users from DB:", error);
    return [];
  }
}

export async function toggleUserStatusInDbAction(userId: string, newStatus: "active" | "suspended"): Promise<{ success: boolean; error?: string }> {
  try {
    await execute(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, userId]
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user status in DB:", error);
    return { success: false, error: error.message || "Failed to update user status." };
  }
}

