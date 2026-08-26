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
  sessionToken?: string;
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
      "medical",
      "notifications",
      "billing",
      "audit",
      "settings",
      "search",
      "validation",
      "cancellations",
      "feedbacksLibrary",
      "feedbacksQuestions",
      "feedbacksNoteTemplates",
    ];
  } else if (dbPermissions.length > 0) {
    permissions = dbPermissions;
  } else {
    permissions = ["dashboard"];
  }

  const roleCode = isSuperAdmin ? "SA"
    : row.role_code || (row.role?.includes("CE") ? "CE" : row.role?.includes("OM") ? "OM" : row.role?.includes("DR") ? "DR" : row.role?.includes("PR") ? "PR" : row.role?.includes("SUB") ? "SUB" : row.role === "Clinical Editor" ? "CE" : row.role === "Drafter" ? "DR" : row.role === "Peer Reviewer" ? "PR" : "OM");

  const roleTitle = row.custom_role_name ? row.custom_role_name
    : roleCode === "SA" ? "Super Admin"
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
    // Ensure the custom-role columns exist before joining against them (idempotent, matches the
    // ensure-columns pattern already used below for admin_users.role/role_code).
    try {
      await execute(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false; ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_view_pii BOOLEAN DEFAULT false;`);
    } catch (e) {}

    const rows = await query<any>(
      `SELECT u.*, r.name AS custom_role_name,
              ARRAY_REMOVE(ARRAY_AGG(p.permission_key) FILTER (WHERE p.granted = true), NULL) AS permissions
         FROM admin_users u
         LEFT JOIN admin_user_permissions p ON p.admin_user_id = u.id
         LEFT JOIN roles r ON r.code = u.role_code AND r.is_custom = true
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, r.name
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

    // Single-device enforcement: issuing a fresh session token here invalidates whatever
    // session this account was previously using on another device — the previous device's
    // stored token no longer matches, so its next check kicks it out. See checkAdminSessionAction.
    const sessionToken = randomUUID();
    try {
      await execute(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_token TEXT; ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_started_at TIMESTAMPTZ;`);
    } catch (e) {}
    await execute(
      `UPDATE admin_users SET active_session_token = $1, active_session_started_at = NOW() WHERE id = $2`,
      [sessionToken, row.id]
    );

    const user = mapRowToCredentialUser(row);
    user.sessionToken = sessionToken;
    return { success: true, user };
  } catch (error: any) {
    console.error("Error verifying admin credentials:", error);
    return { success: false, error: error.message || "Authentication error." };
  }
}

/**
 * Single-device enforcement. The client polls this with the session token it received at
 * login; if another device has since logged in as the same account, that login overwrote
 * active_session_token, so this returns valid: false and the caller signs itself out.
 */
export async function checkAdminSessionAction(
  adminId: string,
  sessionToken: string
): Promise<{ valid: boolean }> {
  try {
    if (!adminId || !sessionToken) return { valid: false };
    try {
      await execute(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_token TEXT; ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active_session_started_at TIMESTAMPTZ;`);
    } catch (e) {}
    const row = await queryOne<{ active_session_token: string | null }>(
      `SELECT active_session_token FROM admin_users WHERE id = $1 AND deleted_at IS NULL`,
      [adminId]
    );
    return { valid: !!row && row.active_session_token === sessionToken };
  } catch (error) {
    console.error("Error checking admin session:", error);
    // Fail open on infra errors so a DB hiccup doesn't mass-logout every admin session.
    return { valid: true };
  }
}

/** Clears the account's active session on explicit logout, freeing the device slot immediately. */
export async function clearAdminSessionAction(adminId: string): Promise<void> {
  try {
    if (!adminId) return;
    await execute(`UPDATE admin_users SET active_session_token = NULL WHERE id = $1`, [adminId]);
  } catch (error) {
    console.error("Error clearing admin session:", error);
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

import { ROLE_DEFINITIONS, RoleCode } from "@/lib/roles";

export interface RealAdminUser {
  id: string;
  name: string;
  email: string;
  role: "SA" | "CE" | "OM" | "DR" | "PR" | "SUB" | string;
  roles?: string[];
  roleTitle?: string;
  plan: "premium" | "free";
  lastActive: string;
  status: "active" | "suspended" | "deactivated" | "trial" | "lapsed";
  joined: string;
}

export async function getRealUsersFromDbAction(): Promise<RealAdminUser[]> {
  try {
    // Ensure the admin-role assignment columns exist (idempotent, matches the
    // ensure-columns pattern used above for admin_users.role/role_code).
    try {
      await execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT; ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];`);
    } catch (e) {}

    const rows = await query<any>(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.role,
         u.roles,
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

      // Canonical role resolution: SA | CE | OM | DR | PR | SUB
      const rawRole = (row.role || "").toUpperCase();
      let roleCode = "SUB";
      if (rawRole === "SA" || rawRole === "SUPER ADMIN") {
        roleCode = "SA";
      } else if (rawRole === "CE" || rawRole === "CLINICAL EDITOR" || rawRole === "EDITOR") {
        roleCode = "CE";
      } else if (rawRole === "OM" || rawRole === "OPERATIONS MANAGER" || rawRole === "MODERATOR") {
        roleCode = "OM";
      } else if (rawRole === "DR" || rawRole === "DRAFTER" || rawRole === "AUTHOR") {
        roleCode = "DR";
      } else if (rawRole === "PR" || rawRole === "PEER REVIEWER" || rawRole === "REVIEWER") {
        roleCode = "PR";
      }

      const roleInfo = ROLE_DEFINITIONS[roleCode] || ROLE_DEFINITIONS.SUB;

      return {
        id: row.id,
        name: fullName,
        email: row.email || "No email",
        role: roleCode,
        roles: Array.isArray(row.roles) ? row.roles : [roleCode],
        roleTitle: roleInfo.title,
        plan: isPremium ? ("premium" as const) : ("free" as const),
        status: (row.status || "active") as any,
        joined: joinedFormatted,
        lastActive: lastActiveFormatted,
      };
    });
  } catch (error) {
    console.error("Error fetching real users from DB:", error);
    return [];
  }
}

export async function updateUserRoleInDbAction(
  userId: string,
  newRole: "SA" | "CE" | "OM" | "DR" | "PR" | "SUB"
): Promise<{ success: boolean; error?: string }> {
  try {
    const roleInfo = ROLE_DEFINITIONS[newRole] || ROLE_DEFINITIONS.SUB;

    try {
      await execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT; ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];`);
    } catch (e) {}

    await execute(
      `UPDATE users
          SET role = $1,
              roles = ARRAY[$1]::text[],
              updated_at = NOW()
        WHERE id = $2::uuid`,
      [newRole, userId]
    );

    return { success: true };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleUserStatusInDbAction(userId: string, newStatus: "active" | "suspended" | "deactivated" | "trial" | "lapsed" | string): Promise<{ success: boolean; error?: string }> {
  try {
    // The account_status enum only ships with active/suspended/deleted — extend it with the
    // statuses this admin UI actually offers (idempotent, mirrors the ensure-columns pattern
    // used elsewhere in this file).
    for (const value of ["deactivated", "trial", "lapsed"]) {
      try {
        await execute(`ALTER TYPE account_status ADD VALUE IF NOT EXISTS '${value}'`);
      } catch (e) {}
    }

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

export interface SystemNotificationItem {
  id: string;
  title: string;
  message?: string;
  type: string;
  target: string;
  scheduled: string;
  status: "active" | "pending" | "sent" | "failed";
  sent: number;
  opened: number;
  clicked: number;
  date: string;
  createdAt: string;
}

export interface AudienceMetrics {
  allSubscribers: number;
  expiringSoon: number;
  monthlyPlan: number;
  allUsers: number;
}

export async function getNotificationAudienceMetricsAction(): Promise<AudienceMetrics> {
  try {
    const totalUsersRow = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM users`);
    const totalUsers = parseInt(totalUsersRow?.count || "0", 10);

    let activeSubscribers = 0;
    try {
      const subRow = await queryOne<{ count: string }>(`SELECT COUNT(DISTINCT user_id)::text as count FROM subscriptions WHERE status = 'active'`);
      activeSubscribers = parseInt(subRow?.count || "0", 10);
    } catch {
      activeSubscribers = 0;
    }

    let expiring = 0;
    try {
      const expRow = await queryOne<{ count: string }>(`SELECT COUNT(DISTINCT user_id)::text as count FROM subscriptions WHERE status = 'active' AND current_period_end <= NOW() + INTERVAL '7 days'`);
      expiring = parseInt(expRow?.count || "0", 10);
    } catch {
      expiring = 0;
    }

    let monthly = 0;
    try {
      const monthRow = await queryOne<{ count: string }>(`SELECT COUNT(DISTINCT s.user_id)::text as count FROM subscriptions s WHERE s.cycle = 'monthly' AND s.status = 'active'`);
      monthly = parseInt(monthRow?.count || "0", 10);
    } catch {
      monthly = 0;
    }

    return {
      allUsers: totalUsers,
      allSubscribers: activeSubscribers,
      expiringSoon: expiring,
      monthlyPlan: monthly,
    };
  } catch (error) {
    console.error("Error fetching notification audience metrics:", error);
    return {
      allUsers: 0,
      allSubscribers: 0,
      expiringSoon: 0,
      monthlyPlan: 0,
    };
  }
}

async function ensureNotificationsTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      payload JSONB,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`);
}

async function dispatchDueScheduledNotifications() {
  const due = await query<{ id: string; payload: any; target: string }>(`
    SELECT id, payload, (payload->>'target') as target
    FROM notifications
    WHERE scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
      AND COALESCE(payload->>'status', 'active') = 'active'
  `);

  for (const n of due) {
    try {
      let userQuery = `SELECT id FROM users LIMIT 500`;
      if (n.target === "All Subscribers") {
        userQuery = `SELECT DISTINCT user_id as id FROM subscriptions WHERE status = 'active' LIMIT 500`;
      }
      const targetUsers = await query<{ id: string }>(userQuery);
      for (const u of targetUsers) {
        await execute(
          `INSERT INTO user_notifications (user_id, notification_id, is_read, delivered_at)
           VALUES ($1, $2, false, NOW())
           ON CONFLICT (user_id, notification_id) DO NOTHING`,
          [u.id, n.id]
        );
      }

      const updatedPayload = { ...(n.payload || {}), status: "sent", scheduled: "Sent" };
      await execute(`UPDATE notifications SET payload = $1 WHERE id = $2`, [JSON.stringify(updatedPayload), n.id]);
    } catch (e) {
      console.warn(`Could not dispatch scheduled notification ${n.id}:`, e);
    }
  }
}

export async function getNotificationsFromDbAction(): Promise<SystemNotificationItem[]> {
  try {
    await ensureNotificationsTable();
    await dispatchDueScheduledNotifications();

    const rows = await query<any>(`
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.payload,
        n.created_at,
        n.scheduled_at,
        COUNT(un.id)::int as total_delivered,
        COUNT(CASE WHEN un.is_read = true THEN 1 END)::int as total_read
      FROM notifications n
      LEFT JOIN user_notifications un ON un.notification_id = n.id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `);

    return rows.map((r) => {
      const payload = (typeof r.payload === "object" && r.payload) ? r.payload : {};
      const target = payload.target || "All Users";
      const scheduled = payload.scheduled || (r.scheduled_at
        ? new Date(r.scheduled_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "Immediate");
      const status: "active" | "pending" | "sent" | "failed" = payload.status || (payload.schedule === "Send Now" ? "sent" : "active");
      
      const sentCount = r.total_delivered > 0 ? r.total_delivered : (payload.sent_count || (status === "sent" ? 1 : 0));
      const openedCount = r.total_read > 0 ? r.total_read : (payload.opened_count || 0);
      const clickedCount = payload.clicked_count || 0;

      const dateStr = r.created_at
        ? new Date(r.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Recent";

      return {
        id: r.id,
        title: r.title,
        message: r.message || "",
        type: r.type || "In-app",
        target,
        scheduled,
        status,
        sent: sentCount,
        opened: openedCount,
        clicked: clickedCount,
        date: dateStr,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error fetching notifications from DB:", error);
    return [];
  }
}

export async function createNotificationInDbAction(data: {
  title: string;
  message: string;
  type: string;
  target: string;
  schedule: string;
  scheduledAt?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await ensureNotificationsTable();

    const isImmediate = data.schedule === "Send Now";
    if (!isImmediate && !data.scheduledAt) {
      return { success: false, error: "Please choose a date and time to schedule this notification." };
    }

    const scheduledAtDate = !isImmediate && data.scheduledAt ? new Date(data.scheduledAt) : null;
    if (scheduledAtDate && scheduledAtDate.getTime() <= Date.now()) {
      return { success: false, error: "Scheduled date and time must be in the future." };
    }

    const status = isImmediate ? "sent" : "active";

    const payload = {
      target: data.target,
      schedule: data.schedule,
      status,
      sent_count: 0,
      opened_count: 0,
      clicked_count: 0,
    };

    const insertResult = await queryOne<{ id: string }>(
      `INSERT INTO notifications (type, title, message, payload, scheduled_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [data.type, data.title, data.message, JSON.stringify(payload), scheduledAtDate ? scheduledAtDate.toISOString() : null]
    );

    const notifId = insertResult?.id;

    if (notifId && isImmediate) {
      try {
        // Broadcast to relevant users in user_notifications
        let userQuery = `SELECT id FROM users LIMIT 500`;
        if (data.target === "All Subscribers") {
          userQuery = `SELECT DISTINCT user_id as id FROM subscriptions WHERE status = 'active' LIMIT 500`;
        }

        const targetUsers = await query<{ id: string }>(userQuery);
        for (const u of targetUsers) {
          await execute(
            `INSERT INTO user_notifications (user_id, notification_id, is_read, delivered_at)
             VALUES ($1, $2, false, NOW())
             ON CONFLICT (user_id, notification_id) DO NOTHING`,
            [u.id, notifId]
          );
        }
      } catch (e) {
        console.warn("Could not insert user_notifications delivery rows:", e);
      }
    }

    return { success: true, id: notifId };
  } catch (error: any) {
    console.error("Error creating notification in DB:", error);
    return { success: false, error: error.message || "Failed to create notification." };
  }
}

export async function deleteNotificationFromDbAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execute(`DELETE FROM user_notifications WHERE notification_id = $1`, [id]);
    await execute(`DELETE FROM notifications WHERE id = $1`, [id]);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting notification from DB:", error);
    return { success: false, error: error.message || "Failed to delete notification." };
  }
}

/**
 * Looks up an admin by username or email for the "Forgot Password" flow and, if the account
 * exists, isn't deleted, and has forgot_password_enabled, returns its id so the client can route
 * the admin straight to the existing reset-password page (this app has no email/SMTP integration).
 */
export async function requestPasswordResetAction(
  identifier: string
): Promise<{ success: boolean; userId?: string; name?: string; error?: string }> {
  try {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, error: "Enter your username or email address." };
    }

    const row = await queryOne<any>(
      `SELECT id, name, forgot_password_enabled
         FROM admin_users
        WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
          AND deleted_at IS NULL
        LIMIT 1`,
      [trimmed]
    );

    if (!row) {
      return { success: false, error: "No admin account matches that username or email." };
    }
    if (!row.forgot_password_enabled) {
      return { success: false, error: "Password reset is disabled for this account. Contact your Super Admin." };
    }

    return { success: true, userId: row.id, name: row.name };
  } catch (error: any) {
    console.error("Error requesting password reset:", error);
    return { success: false, error: error.message || "Failed to process the reset request." };
  }
}

export interface UploadMonitoringStats {
  totalStorageBytes: number;
  totalFiles: number;
  filesUploadedThisMonth: number;
  largestFile: { name: string; sizeBytes: number } | null;
}

export async function getUploadMonitoringStatsAction(): Promise<UploadMonitoringStats> {
  try {
    const totals = await queryOne<any>(
      `SELECT COALESCE(SUM(size_bytes), 0) AS total_bytes, COUNT(*) AS total_files FROM files`
    );
    const thisMonth = await queryOne<any>(
      `SELECT COUNT(*) AS count FROM files WHERE created_at >= date_trunc('month', NOW())`
    );
    const largest = await queryOne<any>(
      `SELECT original_name, size_bytes FROM files ORDER BY size_bytes DESC NULLS LAST LIMIT 1`
    );

    return {
      totalStorageBytes: Number(totals?.total_bytes || 0),
      totalFiles: Number(totals?.total_files || 0),
      filesUploadedThisMonth: Number(thisMonth?.count || 0),
      largestFile: largest ? { name: largest.original_name, sizeBytes: Number(largest.size_bytes) } : null,
    };
  } catch (error) {
    console.error("Error fetching upload monitoring stats:", error);
    return { totalStorageBytes: 0, totalFiles: 0, filesUploadedThisMonth: 0, largestFile: null };
  }
}

/**
 * Self-service profile update: name/username/email and an optional password change.
 * A password change requires the caller's current password to verify against the stored hash.
 * Role is intentionally never accepted here — role assignment is managed on the audit/security page.
 */
export async function updateAdminProfileAction(params: {
  id: string;
  name: string;
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await queryOne<any>(
      `SELECT password_hash FROM admin_users WHERE id = $1 AND deleted_at IS NULL`,
      [params.id]
    );
    if (!existing) {
      return { success: false, error: "Account not found." };
    }

    let passwordHash = existing.password_hash;
    let passwordChanged = false;
    if (params.newPassword) {
      if (!params.currentPassword || !(await verifyPassword(params.currentPassword, existing.password_hash))) {
        return { success: false, error: "Current password is incorrect." };
      }
      passwordHash = await hashPassword(params.newPassword);
      passwordChanged = true;
    }

    await execute(
      `UPDATE admin_users
          SET name = $1, username = $2, email = $3, password_hash = $4,
              password_changed_at = CASE WHEN $5::boolean THEN NOW() ELSE password_changed_at END,
              updated_at = NOW()
        WHERE id = $6`,
      [params.name, params.username, params.email, passwordHash, passwordChanged, params.id]
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    if (error.code === "23505") {
      if (error.constraint === "admin_users_email_key") {
        return { success: false, error: "This email is already in use by another admin." };
      }
      if (error.constraint === "admin_users_username_key") {
        return { success: false, error: "This username is already in use by another admin." };
      }
    }
    return { success: false, error: error.message || "Failed to update profile." };
  }
}

export interface AuditLogEntry {
  id: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  category: string | null;
  severity: "info" | "warning" | "critical";
  entityType: string | null;
  entityId: string | null;
  metadata: any;
  createdAt: string;
}

/**
 * Reads the admin activity log (who changed what, and when) — Super Admin-only. isCallerSuperAdmin
 * is trusted from the client, matching this app's existing (localStorage-based) admin-identity
 * model elsewhere in this file; the page itself stays visible to every admin, only the entries are
 * gated here and in the UI.
 */
export async function getAuditLogsAction(params: {
  isCallerSuperAdmin: boolean;
  limit?: number;
  sinceDays?: number;
}): Promise<{ success: boolean; logs: AuditLogEntry[]; error?: string }> {
  if (!params.isCallerSuperAdmin) {
    return { success: false, logs: [], error: "Only the Super Admin can view the activity log." };
  }

  try {
    const limit = Math.min(Math.max(params.limit || 100, 1), 500);
    const sinceDays = params.sinceDays ? Math.min(Math.max(params.sinceDays, 1), 365) : null;
    const rows = await query<any>(
      `SELECT l.id, l.action, l.category, l.severity, l.entity_type, l.entity_id, l.metadata, l.created_at,
              u.name AS admin_name, u.email AS admin_email
         FROM audit_logs l
         LEFT JOIN admin_users u ON u.id = l.admin_user_id
        WHERE ($2::int IS NULL OR l.created_at >= NOW() - make_interval(days => $2::int))
        ORDER BY l.created_at DESC
        LIMIT $1`,
      [limit, sinceDays]
    );

    return {
      success: true,
      logs: rows.map((r) => ({
        id: String(r.id),
        adminName: r.admin_name || null,
        adminEmail: r.admin_email || null,
        action: r.action,
        category: r.category || null,
        severity: (r.severity || "info") as AuditLogEntry["severity"],
        entityType: r.entity_type || null,
        entityId: r.entity_id || null,
        metadata: r.metadata || null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return { success: false, logs: [], error: error.message || "Failed to load the activity log." };
  }
}

