"use server";

import prisma from "@/lib/prisma";
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

/**
 * Maps a database admin user to the frontend CredentialUser format.
 */
function mapDbToCredentialUser(dbAdmin: any): CredentialUser {
  let permissions = dbAdmin.admin_user_permissions
    ?.filter((p: any) => p.granted)
    .map((p: any) => p.permission_key) || [];

  let role: "Super Admin" | "Admin" | "Moderator" | "Viewer" = "Admin";
  if (dbAdmin.role_id === 1) {
    role = "Super Admin";
    permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "notifications", "billing", "audit", "settings", "search"];
  } else if (dbAdmin.role_id === 2) {
    if (permissions.includes("billing")) {
      role = "Admin";
    } else if (permissions.includes("content") || permissions.includes("approaches")) {
      role = "Moderator";
    } else {
      role = "Viewer";
    }
  }

  return {
    id: dbAdmin.id,
    name: dbAdmin.name,
    username: dbAdmin.username,
    email: dbAdmin.email,
    password: dbAdmin.password_hash,
    role,
    forgotPasswordEnabled: dbAdmin.forgot_password_enabled,
    oauthEnabled: dbAdmin.oauth_enabled,
    mfaEnabled: dbAdmin.mfa_enabled,
    mustResetPassword: dbAdmin.password_changed_at === null, // If null, must reset password on first login
    status: dbAdmin.status,
    permissions,
  };
}

/**
 * Fetch all admin users from the database.
 */
export async function getAdminsFromDbAction(): Promise<CredentialUser[]> {
  try {
    const dbAdmins = await prisma.admin_users.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        admin_user_permissions: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
    const mapped = dbAdmins.map(mapDbToCredentialUser);
    return mapped;
  } catch (error) {
    console.error("Error fetching admins from DB:", error);
    return [];
  }
}

/**
 * Saves or updates an admin user in the Neon database.
 */
export async function saveAdminToDbAction(user: CredentialUser): Promise<boolean> {
  try {
    const roleId = user.role === "Super Admin" ? 1 : 2;
    const isNew = !user.id || user.id.length < 20; // local random IDs are short/timestamps, UUIDs are longer
    const dbId = isNew ? randomUUID() : user.id;

    // First ensure permission keys exist in the permissions table (to avoid FK constraints)
    const permissions = user.permissions || [];
    for (const key of permissions) {
      const slugged = key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await prisma.permissions.upsert({
        where: { key },
        update: {},
        create: {
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
        },
      });
    }

    const passwordHash = user.password || "password123";

    // Set password_changed_at to null if they must reset password, else keep current date
    const passwordChangedAt = user.mustResetPassword ? null : new Date();

    // Upsert the admin user
    await prisma.admin_users.upsert({
      where: { id: dbId },
      update: {
        name: user.name,
        username: user.username,
        email: user.email,
        password_hash: passwordHash,
        role_id: roleId,
        forgot_password_enabled: user.forgotPasswordEnabled,
        oauth_enabled: user.oauthEnabled ?? false,
        mfa_enabled: user.mfaEnabled ?? false,
        status: (user.status || "active") as any,
        updated_at: new Date(),
        ...(user.password ? { password_changed_at: passwordChangedAt } : {}),
      },
      create: {
        id: dbId,
        name: user.name,
        username: user.username,
        email: user.email,
        password_hash: passwordHash,
        role_id: roleId,
        forgot_password_enabled: user.forgotPasswordEnabled,
        oauth_enabled: user.oauthEnabled ?? false,
        mfa_enabled: user.mfaEnabled ?? false,
        status: (user.status || "active") as any,
        password_changed_at: null, // Force reset password on first login
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Delete existing permissions and sync new ones
    await prisma.admin_user_permissions.deleteMany({
      where: { admin_user_id: dbId },
    });

    if (permissions.length > 0) {
      await prisma.admin_user_permissions.createMany({
        data: permissions.map((key) => ({
          admin_user_id: dbId,
          permission_key: key,
          granted: true,
        })),
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving admin to DB:", error);
    return false;
  }
}

/**
 * Soft deletes or deletes an admin user from the database.
 */
export async function deleteAdminFromDbAction(id: string): Promise<boolean> {
  try {
    await prisma.admin_users.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error deleting admin from DB:", error);
    return false;
  }
}

/**
 * Resets password in the database and updates password_changed_at date to mark password as set.
 */
export async function resetAdminPasswordAction(id: string, newPassword: string): Promise<boolean> {
  try {
    await prisma.admin_users.update({
      where: { id },
      data: {
        password_hash: newPassword,
        password_changed_at: new Date(),
        updated_at: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error resetting admin password in DB:", error);
    return false;
  }
}

/**
 * Synchronize localStorage credentials list with database admin list.
 * Can be called during page initialization to populate missing admins.
 */
export async function syncLocalAdminsWithDbAction(localAdmins: CredentialUser[]): Promise<CredentialUser[]> {
  try {
    const dbAdmins = await getAdminsFromDbAction();
    
    // Check if any database admin has a "dummy_" placeholder password hash, and if so, update it to the default password
    for (const admin of dbAdmins) {
      if (admin.password && admin.password.startsWith("dummy_")) {
        const localMatch = localAdmins.find(l => l.username === admin.username);
        if (localMatch && localMatch.password) {
          await prisma.admin_users.update({
            where: { id: admin.id },
            data: {
              password_hash: localMatch.password,
              updated_at: new Date(),
            }
          });
          admin.password = localMatch.password;
        }
      }
    }

    if (dbAdmins.length === 0 && localAdmins.length > 0) {
      // Seed database with local storage admins if DB is completely empty
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
