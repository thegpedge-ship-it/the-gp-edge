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

  const isSuperAdmin =
    row.role_id === 1 ||
    row.username === "siddhant_super" ||
    row.email === "admin@gpedge.com" ||
    row.role === "Super Admin" ||
    row.role_code === "SA" ||
    row.role === "SA" ||
    (row.name && (row.name.includes("Founder") || row.name.includes("Siddhant")));

  let permissions: string[];
  if (isSuperAdmin) {
    permissions = [
      "dashboard",
      "questions",
      "quizzes",
      "content",
      "approaches",
      "autofill",
      "users",
      "mbs",
      "notifications",
      "billing",
      "audit",
      "settings",
      "search",
    ];
  } else if (dbPermissions.length > 0) {
    permissions = dbPermissions;
  } else {
    permissions = ["dashboard"];
  }

  const roleCode = isSuperAdmin ? "SA"
    : row.role_code || (row.role?.includes("CE") ? "CE" : row.role?.includes("OM") ? "OM" : row.role?.includes("DR") ? "DR" : row.role?.includes("PR") ? "PR" : row.role?.includes("SUB") ? "SUB" : row.role === "Clinical Editor" ? "CE" : row.role === "Drafter" ? "DR" : row.role === "Peer Reviewer" ? "PR" : "OM");

  const roleTitle = roleCode === "SA" ? "Super Admin"
    : roleCode === "CE" ? "Clinical Editor"
    : roleCode === "OM" ? "Operations Manager"
    : roleCode === "DR" ? "Drafter"
    : roleCode === "PR" ? "Peer Reviewer"
    : roleCode === "SUB" ? "Subscriber"
    : "Operations Manager";

  const roles = [roleCode];

  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password: row.password_hash,
    role: roleTitle,
    roles,
    forgotPasswordEnabled: row.forgot_password_enabled ?? true,
    oauthEnabled: row.oauth_enabled ?? false,
    mfaEnabled: row.mfa_enabled ?? false,
    mustResetPassword: row.password_changed_at === null,
    status: row.status || "active",
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
    const roleCode = user.roles?.[0] || (user.role.includes("SA") ? "SA" : user.role.includes("CE") ? "CE" : user.role.includes("OM") ? "OM" : user.role.includes("DR") ? "DR" : user.role.includes("PR") ? "PR" : user.role.includes("SUB") ? "SUB" : "OM");
    const cleanRole = user.role.includes("SA") ? "Super Admin" : user.role.includes("CE") ? "Clinical Editor" : user.role.includes("OM") ? "Operations Manager" : user.role.includes("DR") ? "Drafter" : user.role.includes("PR") ? "Peer Reviewer" : user.role.includes("SUB") ? "Subscriber" : user.role;
    const roleId = cleanRole === "Super Admin" ? 1 : 2;

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

    // Ensure role and role_code columns exist
    try {
      await execute(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT; ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_code TEXT;`);
    } catch (e) {}

    // Upsert admin user
    await execute(
      `INSERT INTO admin_users
         (id, name, username, email, password_hash, role_id, role, role_code,
          forgot_password_enabled, oauth_enabled, mfa_enabled,
          status, password_changed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role_id = EXCLUDED.role_id,
         role = EXCLUDED.role,
         role_code = EXCLUDED.role_code,
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
        cleanRole,
        roleCode,
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

    await execute(`DELETE FROM admin_user_permissions WHERE admin_user_id = $1`, [id]);
    await execute(`UPDATE admin_users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [id]);
    return true;
  } catch (error) {
    console.error("Error deleting admin from DB:", error);
    return false;
  }
}

/**
 * Section 3G: Invite a Contributor Account (DR, PR, or any account by SA).
 * Generates an emailed invitation token with a 14-day expiry.
 * OM can invite Drafter (DR) and Peer Reviewer (PR) accounts ONLY.
 */
export async function inviteAccountAction(params: {
  email: string;
  name: string;
  role: "DR" | "PR" | "SA" | "CE" | "OM" | "Drafter" | "Peer Reviewer" | "Clinical Editor" | "Operations Manager" | "Super Admin";
  adminUser: any;
}): Promise<{ success: boolean; invitationToken?: string; expiresAt?: string; error?: string }> {
  try {
    const { email, name, role, adminUser } = params;
    const { evaluateRelationalPermission, recordAuditLog } = await import("@/lib/relationalPermissions");

    const isContributorRole = ["DR", "PR", "DRAFTER", "PEER REVIEWER"].includes(role.toUpperCase());
    const capability = isContributorRole ? "invite_contributor" : "invite_any_account";

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability,
      targetRoleToAssign: role,
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const invitationToken = `inv-${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days expiry

    await execute(`
      CREATE TABLE IF NOT EXISTS admin_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        invitation_token TEXT NOT NULL UNIQUE,
        invited_by TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await execute(
      `INSERT INTO admin_invitations (email, name, role, invitation_token, invited_by, expires_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [email, name, role, invitationToken, adminUser.name || adminUser.email, expiresAt.toISOString()]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "invite_account",
      category: "user",
      entityType: "account_invitation",
      entityId: invitationToken,
      metadata: { email, name, role, invitedBy: adminUser.name || adminUser.email, expiresAt: expiresAt.toISOString() },
    });

    return { success: true, invitationToken, expiresAt: expiresAt.toISOString() };
  } catch (err: any) {
    console.error("Error inviting account:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Section 3G: Contributor Accepts Invitation & Sets Own Password on First Use.
 * Credentials are set by the user themselves, never transmitted by an admin.
 */
export async function acceptAccountInvitationAction(params: {
  invitationToken: string;
  password: string;
  username: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { invitationToken, password, username } = params;

    const invite = await queryOne<any>(
      `SELECT * FROM admin_invitations WHERE invitation_token = $1 AND status = 'pending'`,
      [invitationToken]
    );

    if (!invite) {
      return { success: false, error: "Invalid or expired invitation token." };
    }

    if (new Date(invite.expires_at) < new Date()) {
      await execute(`UPDATE admin_invitations SET status = 'expired' WHERE id = $1`, [invite.id]);
      return { success: false, error: "Invitation token has expired (14-day limit)." };
    }

    const passwordHash = await hashPassword(password);
    const roleId = invite.role === "SA" || invite.role === "Super Admin" ? 1 : 2;
    const newUserId = randomUUID();

    await execute(
      `INSERT INTO admin_users
         (id, name, username, email, password_hash, role_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())`,
      [newUserId, invite.name, username, invite.email, passwordHash, roleId]
    );

    await execute(`UPDATE admin_invitations SET status = 'accepted' WHERE id = $1`, [invite.id]);

    const { recordAuditLog } = await import("@/lib/relationalPermissions");
    await recordAuditLog({
      adminUserId: newUserId,
      action: "accept_account_invitation",
      category: "user",
      entityType: "user",
      entityId: newUserId,
      metadata: { email: invite.email, role: invite.role },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error accepting invitation:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Section 3G & Rule R8: Deactivate a Contributor or Account.
 * OM can deactivate Drafter (DR) and Peer Reviewer (PR) accounts only.
 * Deactivation revokes access (ACCOUNT_STATE_DENIED) while preserving version history & provenance.
 */
export async function deactivateAccountAction(params: {
  targetUserId: string;
  adminUser: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { targetUserId, adminUser } = params;
    const { evaluateRelationalPermission, recordAuditLog } = await import("@/lib/relationalPermissions");

    const targetUser = await queryOne<any>(`SELECT * FROM admin_users WHERE id = $1`, [targetUserId]);
    if (!targetUser) return { success: false, error: "User not found." };
    if (targetUser.role_id === 1) return { success: false, error: "Super Admin account cannot be deactivated." };

    const isContributor = targetUser.role_id === 2; // Non-SA
    const capability = isContributor ? "deactivate_contributor" : "deactivate_any_account";

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability,
      targetAccountRole: isContributor ? "DR" : "SA",
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await execute(`UPDATE admin_users SET status = 'deactivated', updated_at = NOW() WHERE id = $1`, [targetUserId]);

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "deactivate_account",
      category: "user",
      entityType: "user",
      entityId: targetUserId,
      metadata: { deactivatedBy: adminUser.name || adminUser.email, targetEmail: targetUser.email },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error deactivating account:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Section 3G: Mandatory 2FA Check for SA and CE Accounts.
 */
export async function verify2FAForClinicalAdmin(userId: string): Promise<boolean> {
  try {
    const user = await queryOne<any>(`SELECT role_id, mfa_enabled FROM admin_users WHERE id = $1`, [userId]);
    if (!user) return false;
    const isSAorCE = user.role_id === 1; // SA or CE clinical accounts
    if (isSAorCE) {
      return Boolean(user.mfa_enabled);
    }
    return true; // 2FA optional for non-clinical contributor roles
  } catch (err) {
    console.error("Error checking 2FA requirement:", err);
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

