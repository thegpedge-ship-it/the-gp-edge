"use server";

import { query, queryOne, execute } from "@/lib/db";
import { recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";
import { CUSTOM_ROLE_RESOURCES, CustomRoleResource, PermissionMatrix, CustomRole, emptyCustomRoleMatrix } from "@/lib/customRoleTypes";

const emptyMatrix = emptyCustomRoleMatrix;

/** Idempotently ensures the columns/rows a custom role needs actually exist. */
async function ensureCustomRoleSchema(): Promise<void> {
  await execute(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;`);
  await execute(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS can_view_pii BOOLEAN DEFAULT false;`);
  // The roles table originally shipped with CHECK constraints locking code/name to exactly the 3
  // legacy seed rows (super_admin/admin/user) — that table is otherwise unused anywhere in the
  // app, so drop those constraints to allow arbitrary custom role codes/names.
  await execute(`ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_code_check;`);
  await execute(`ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;`);

  for (const resource of CUSTOM_ROLE_RESOURCES) {
    await execute(
      `INSERT INTO permissions (key, label) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [`${resource}.read`, `${resource} (read)`]
    );
    await execute(
      `INSERT INTO permissions (key, label) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [`${resource}.edit`, `${resource} (edit)`]
    );
  }
}

function slugifyRoleCode(name: string, existingCodes: Set<string>): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "ROLE";

  const reserved = new Set(["SA", "CE", "OM", "DR", "PR", "SUB"]);
  let candidate = base;
  let suffix = 1;
  while (reserved.has(candidate) || existingCodes.has(candidate)) {
    candidate = `${base}_${++suffix}`;
  }
  return candidate;
}

export async function getCustomRolesAction(): Promise<{ success: boolean; roles: CustomRole[]; error?: string }> {
  try {
    await ensureCustomRoleSchema();

    const roleRows = await query<{ id: number; code: string; name: string; description: string | null; can_view_pii: boolean }>(
      `SELECT id, code, name, description, can_view_pii FROM roles WHERE is_custom = true ORDER BY name ASC`
    );

    const grantRows = await query<{ role_id: number; permission_key: string }>(
      `SELECT rp.role_id, rp.permission_key
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       WHERE r.is_custom = true`
    );

    const countRows = await query<{ role_code: string; count: string }>(
      `SELECT role_code, COUNT(*)::text as count FROM admin_users WHERE role_code IS NOT NULL AND deleted_at IS NULL GROUP BY role_code`
    );
    const countByCode = new Map(countRows.map((r) => [r.role_code, parseInt(r.count, 10)]));

    const roles: CustomRole[] = roleRows.map((row) => {
      const matrix = emptyMatrix();
      const grants = grantRows.filter((g) => g.role_id === row.id).map((g) => g.permission_key);
      for (const key of grants) {
        const [resource, action] = key.split(".");
        if (matrix[resource as CustomRoleResource] && (action === "read" || action === "edit")) {
          matrix[resource as CustomRoleResource][action] = true;
        }
      }
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description || "",
        canViewPii: row.can_view_pii,
        matrix,
        assignedCount: countByCode.get(row.code) || 0,
      };
    });

    return { success: true, roles };
  } catch (err: any) {
    console.error("getCustomRolesAction error:", err);
    return { success: false, roles: [], error: err.message };
  }
}

export async function getCustomRoleByCodeAction(
  code: string
): Promise<{ success: boolean; role?: CustomRole; error?: string }> {
  try {
    await ensureCustomRoleSchema();

    const row = await queryOne<{ id: number; code: string; name: string; description: string | null; can_view_pii: boolean }>(
      `SELECT id, code, name, description, can_view_pii FROM roles WHERE is_custom = true AND code = $1 LIMIT 1`,
      [code]
    );
    if (!row) return { success: true, role: undefined };

    const grants = await query<{ permission_key: string }>(
      `SELECT permission_key FROM role_permissions WHERE role_id = $1`,
      [row.id]
    );

    const matrix = emptyMatrix();
    for (const g of grants) {
      const [resource, action] = g.permission_key.split(".");
      if (matrix[resource as CustomRoleResource] && (action === "read" || action === "edit")) {
        matrix[resource as CustomRoleResource][action] = true;
      }
    }

    return {
      success: true,
      role: {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description || "",
        canViewPii: row.can_view_pii,
        matrix,
        assignedCount: 0,
      },
    };
  } catch (err: any) {
    console.error("getCustomRoleByCodeAction error:", err);
    return { success: false, error: err.message };
  }
}

async function replaceRolePermissions(roleId: number, matrix: PermissionMatrix): Promise<void> {
  await execute(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
  for (const resource of CUSTOM_ROLE_RESOURCES) {
    const grant = matrix[resource];
    if (!grant) continue;
    // Edit implies read: never grant edit without also granting read.
    if (grant.edit) {
      await execute(
        `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roleId, `${resource}.edit`]
      );
      await execute(
        `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roleId, `${resource}.read`]
      );
    } else if (grant.read) {
      await execute(
        `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roleId, `${resource}.read`]
      );
    }
  }
}

export async function createCustomRoleAction(
  params: { name: string; description?: string; matrix: PermissionMatrix; canViewPii: boolean },
  adminUser?: PermissionUser
): Promise<{ success: boolean; role?: CustomRole; error?: string }> {
  try {
    await ensureCustomRoleSchema();

    const cleanName = params.name.trim();
    if (!cleanName) return { success: false, error: "Role name is required" };

    const existing = await query<{ code: string }>(`SELECT code FROM roles`);
    const code = slugifyRoleCode(cleanName, new Set(existing.map((r) => r.code)));

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO roles (code, name, description, is_custom, can_view_pii)
       VALUES ($1, $2, $3, true, $4)
       RETURNING id`,
      [code, cleanName, params.description?.trim() || null, params.canViewPii]
    );
    if (!inserted) return { success: false, error: "Failed to create role" };

    await replaceRolePermissions(inserted.id, params.matrix);

    if (adminUser?.id) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "CREATE_CUSTOM_ROLE",
        category: "AUDIT_SECURITY",
        entityType: "role",
        entityId: String(inserted.id),
        metadata: { name: cleanName, code, canViewPii: params.canViewPii },
      });
    }

    const result = await getCustomRoleByCodeAction(code);
    return { success: true, role: result.role };
  } catch (err: any) {
    console.error("createCustomRoleAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateCustomRoleAction(
  roleId: number,
  params: { name: string; description?: string; matrix: PermissionMatrix; canViewPii: boolean },
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureCustomRoleSchema();

    const existing = await queryOne<{ id: number; code: string; is_custom: boolean }>(
      `SELECT id, code, is_custom FROM roles WHERE id = $1`,
      [roleId]
    );
    if (!existing || !existing.is_custom) {
      return { success: false, error: "Custom role not found" };
    }

    const cleanName = params.name.trim();
    if (!cleanName) return { success: false, error: "Role name is required" };

    await execute(
      `UPDATE roles SET name = $1, description = $2, can_view_pii = $3 WHERE id = $4`,
      [cleanName, params.description?.trim() || null, params.canViewPii, roleId]
    );
    await replaceRolePermissions(roleId, params.matrix);

    if (adminUser?.id) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "UPDATE_CUSTOM_ROLE",
        category: "AUDIT_SECURITY",
        entityType: "role",
        entityId: String(roleId),
        metadata: { name: cleanName, code: existing.code, canViewPii: params.canViewPii },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("updateCustomRoleAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteCustomRoleAction(
  roleId: number,
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await queryOne<{ id: number; code: string; name: string; is_custom: boolean }>(
      `SELECT id, code, name, is_custom FROM roles WHERE id = $1`,
      [roleId]
    );
    if (!existing || !existing.is_custom) {
      return { success: false, error: "Custom role not found" };
    }

    const inUse = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM admin_users WHERE role_code = $1 AND deleted_at IS NULL`,
      [existing.code]
    );
    if (inUse && parseInt(inUse.count, 10) > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing.name}" — ${inUse.count} admin(s) are currently assigned this role. Reassign them first.`,
      };
    }

    await execute(`DELETE FROM roles WHERE id = $1`, [roleId]);

    if (adminUser?.id) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "DELETE_CUSTOM_ROLE",
        category: "AUDIT_SECURITY",
        entityType: "role",
        entityId: String(roleId),
        metadata: { name: existing.name, code: existing.code },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteCustomRoleAction error:", err);
    return { success: false, error: err.message };
  }
}
