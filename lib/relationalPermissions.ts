import { query, queryOne, execute } from "@/lib/db";

export type Capability =
  | "read"
  | "create"
  | "edit"
  | "review"
  | "approve"
  | "delete"
  | "publish"
  | "archive"
  | "accept_work"
  | "amend_rate_card"
  | "generate_statement"
  | "mark_statement_paid"
  | "edit_audit_log";

export type ItemType =
  | "question"
  | "medical_condition"
  | "approach"
  | "autofill_template"
  | "quiz"
  | "mock_test"
  | "user"
  | "statement"
  | "rate_card"
  | "audit_log";

export type RoleCode = "SA" | "CE" | "OM" | "DR" | "PR" | "SUB" | "Super Admin" | "Admin" | "Reviewer" | "Editor" | "Author" | "Moderator" | "Viewer";

export type AccountState = "active" | "deactivated" | "suspended" | "trial" | "lapsed";

export interface PermissionUser {
  id: string; // admin_user_id or user UUID
  role?: string; // Legacy or primary role name/code
  roles?: string[]; // Array of assigned role codes/names e.g. ["SA", "CE", "OM"]
  status?: AccountState | string;
  name?: string;
  email?: string;
  username?: string;
  permissions?: string[];
}

export interface PermissionTargetItem {
  id?: string;
  type: ItemType;
  author?: string;
  created_by?: string;
  assigned_to?: string;
  category?: string;
}

export interface RelationalPermissionResult {
  allowed: boolean;
  reason?: string;
  code:
    | "ALLOWED"
    | "ROLE_DENIED"
    | "RESTRICTION_GOVERNS_DENIED"
    | "ACCOUNT_STATE_DENIED"
    | "AUDIT_LOG_IMMUTABLE_DENIED"
    | "HISTORY_CONFLICT_DENIED"
    | "ITEM_NOT_FOUND"
    | "INVALID_INPUT";
}

export class RelationalPermissionError extends Error {
  public code: string;

  constructor(message: string, code: string = "HISTORY_CONFLICT_DENIED") {
    super(message);
    this.name = "RelationalPermissionError";
    this.code = code;
  }
}

/**
 * Standardized Audit Log Logger
 * Inserts immutable record into audit_logs table.
 */
export async function recordAuditLog(params: {
  adminUserId?: string | null;
  action: string;
  category?: string;
  entityType: string;
  entityId: string;
  metadata?: any;
}): Promise<void> {
  try {
    const { adminUserId, action, category = "permission", entityType, entityId, metadata = {} } = params;
    const metadataJson = JSON.stringify(metadata);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validAdminUserId = adminUserId && uuidRegex.test(adminUserId) ? adminUserId : null;

    await execute(
      `INSERT INTO audit_logs (admin_user_id, action, category, entity_type, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
      [validAdminUserId, action, category, entityType, entityId, metadataJson]
    );
  } catch (err) {
    console.error("[recordAuditLog] Error recording audit log:", err);
  }
}

/**
 * Helper to normalize user roles into a clean list of role codes/names.
 */
function getUserRoles(user: PermissionUser): string[] {
  const rolesSet = new Set<string>();
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach((r) => r && rolesSet.add(r.trim()));
  }
  if (user.role) {
    rolesSet.add(user.role.trim());
  }
  if (rolesSet.size === 0) {
    rolesSet.add("Admin");
  }
  return Array.from(rolesSet);
}

/**
 * Core Relational Permission Evaluator.
 * Single place in the codebase where permission is decided.
 *
 * Enforces:
 * 1. Account state check (Deactivated / Suspended access freeze).
 * 2. Absolute Audit Log Immutability.
 * 3. Multi-role assignment with Conflict Resolution ("Where roles conflict, the most restrictive rule governs").
 * 4. Load-bearing OM controls (Cannot accept work; Cannot amend rate cards).
 * 5. History-scoped prior involvement check (Self-review prohibition).
 */
export async function evaluateRelationalPermission(params: {
  user: PermissionUser;
  capability: Capability;
  item?: PermissionTargetItem;
}): Promise<RelationalPermissionResult> {
  const { user, capability, item } = params;

  if (!user || (!user.id && !user.email && !user.name)) {
    return {
      allowed: false,
      code: "INVALID_INPUT",
      reason: "Permission check failed: User context is required.",
    };
  }

  // 1. NON-ROLE STATES CHECK
  const status = (user.status || "active").toLowerCase();
  if (status === "deactivated") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Account is Deactivated. Access is revoked. Attribution, version history, and sign-offs remain permanently intact.",
    };
  }
  if (status === "suspended") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Account is Suspended. All access is frozen while records remain intact.",
    };
  }

  // 2. AUDIT LOG IMMUTABILITY CHECK
  if ((item && item.type === "audit_log") || capability === "edit_audit_log") {
    if (capability !== "read") {
      return {
        allowed: false,
        code: "AUDIT_LOG_IMMUTABLE_DENIED",
        reason: "Audit log records are strictly immutable. No user or role (including Super Admin) can edit or delete audit logs.",
      };
    }
  }

  const assignedRoles = getUserRoles(user);

  // 3. MULTI-ROLE CONFLICT RESOLUTION: "Where roles conflict, the most restrictive applicable rule governs."
  // Check if ANY assigned role contains a specific prohibition for the requested capability:

  // Prohibition A: Operations Manager (OM) load-bearing controls
  const hasOMRole = assignedRoles.includes("OM") || assignedRoles.includes("Operations Manager");
  if (hasOMRole) {
    if (capability === "accept_work") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Load-bearing Control Violation: Operations Manager (OM) role cannot mark work accepted. Acceptance creates payment liability and sits strictly with SA and CE.",
      };
    }
    if (capability === "amend_rate_card") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Load-bearing Control Violation: Operations Manager (OM) role cannot amend rate cards. Rates are set by Super Admin (SA) alone.",
      };
    }
  }

  // Prohibition B: Drafter (DR) scope restriction (own assigned items only)
  const isOnlyDrafter = assignedRoles.length === 1 && (assignedRoles.includes("DR") || assignedRoles.includes("Drafter"));
  if (isOnlyDrafter && item && item.id) {
    if (capability !== "read" && capability !== "create") {
      const isOwner =
        (item.author && (item.author.includes(user.name || "") || item.author.includes(user.email || ""))) ||
        (item.created_by && item.created_by === user.id) ||
        (item.assigned_to && item.assigned_to === user.id);
      if (!isOwner) {
        return {
          allowed: false,
          code: "RESTRICTION_GOVERNS_DENIED",
          reason: "Role 'Drafter' (DR) scope is strictly restricted to own assigned items.",
        };
      }
    }
  }

  // Prohibition C: Peer Reviewer (PR) scope restriction
  const isOnlyPeerReviewer = assignedRoles.length === 1 && (assignedRoles.includes("PR") || assignedRoles.includes("Peer Reviewer"));
  if (isOnlyPeerReviewer && capability !== "read" && capability !== "review") {
    return {
      allowed: false,
      code: "RESTRICTION_GOVERNS_DENIED",
      reason: "Role 'Peer Reviewer' (PR) scope is strictly restricted to assigned review tasks.",
    };
  }

  // Viewer role restriction
  const isOnlyViewer = assignedRoles.length === 1 && assignedRoles.includes("Viewer");
  if (isOnlyViewer && capability !== "read") {
    return {
      allowed: false,
      code: "ROLE_DENIED",
      reason: "Role 'Viewer' has read-only access and cannot perform modifications.",
    };
  }

  // 4. ITEM-SCOPED HISTORY & RELATIONAL EVALUATION
  if (item && item.id) {
    const isReviewOrApprove =
      capability === "review" || capability === "approve" || capability === "publish" || capability === "accept_work";

    // HISTORY IS THE SOURCE OF TRUTH:
    // User cannot review or approve an item where they appear in version/task history as author or editor.
    if (isReviewOrApprove) {
      const isUserInvolvedInHistory = await checkUserInvolvementHistory({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userUsername: user.username,
        itemId: item.id,
        itemType: item.type,
      });

      if (isUserInvolvedInHistory) {
        return {
          allowed: false,
          code: "HISTORY_CONFLICT_DENIED",
          reason: `Relational permission denied: User '${user.name || user.email || user.id}' appears in the version or task history of ${item.type} '${item.id}' as author or editor, and is forbidden from reviewing or approving their own work.`,
        };
      }
    }
  }

  // 5. BASE ROLE PERMISSION GRANT CHECK
  // Check if at least one assigned role grants the base permission
  const isSuperAdmin = assignedRoles.includes("SA") || assignedRoles.includes("Super Admin");
  const isClinicalEditor = assignedRoles.includes("CE") || assignedRoles.includes("Clinical Editor");
  const isAdmin = assignedRoles.includes("Admin");

  if (capability === "accept_work" && !(isSuperAdmin || isClinicalEditor)) {
    return {
      allowed: false,
      code: "ROLE_DENIED",
      reason: "Acceptance of work is strictly restricted to Super Admin (SA) and Clinical Editor (CE).",
    };
  }

  if (capability === "amend_rate_card" && !isSuperAdmin) {
    return {
      allowed: false,
      code: "ROLE_DENIED",
      reason: "Rate card amendments are strictly restricted to Super Admin (SA).",
    };
  }

  return { allowed: true, code: "ALLOWED" };
}

/**
 * Queries the database version history and audit log task history
 * to check if the specified user has authored, edited, or modified the item.
 */
async function checkUserInvolvementHistory(params: {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userUsername?: string;
  itemId: string;
  itemType: ItemType;
}): Promise<boolean> {
  const { userId, userName, userEmail, userUsername, itemId, itemType } = params;

  try {
    // 1. Query audit_logs for any previous authoring/editing actions by this user on this item
    const auditRows = await query<any>(
      `SELECT admin_user_id, metadata
         FROM audit_logs
        WHERE entity_id = $1
          AND (
            LOWER(entity_type) = LOWER($2)
            OR (LOWER($2) = 'medical_condition' AND LOWER(entity_type) = 'medical_content')
            OR (LOWER($2) = 'approach' AND LOWER(entity_type) = 'medical_condition')
          )
          AND action IN ('create', 'update', 'edit', 'import', 'save', 'version_create', 'author', 'editor')`,
      [itemId, itemType]
    );

    for (const row of auditRows) {
      if (userId && row.admin_user_id === userId) {
        return true;
      }
      if (row.metadata) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        const authorStr = (meta.author || meta.user || meta.created_by || meta.email || "").toLowerCase();
        if (
          (userName && authorStr.includes(userName.toLowerCase())) ||
          (userEmail && authorStr.includes(userEmail.toLowerCase())) ||
          (userUsername && authorStr.includes(userUsername.toLowerCase()))
        ) {
          return true;
        }
      }
    }

    // 2. Query item-specific version tables and item author fields
    if (itemType === "autofill_template") {
      const versions = await query<any>(
        `SELECT created_by FROM autofill_template_versions WHERE template_id = $1`,
        [itemId]
      );
      if (versions.some((v) => userId && v.created_by === userId)) {
        return true;
      }
    } else if (itemType === "medical_condition" || itemType === "approach") {
      const cond = await queryOne<any>(
        `SELECT author FROM medical_conditions WHERE id = $1`,
        [itemId]
      );
      if (cond && cond.author) {
        const authorLower = cond.author.toLowerCase();
        if (
          (userName && authorLower.includes(userName.toLowerCase())) ||
          (userEmail && authorLower.includes(userEmail.toLowerCase())) ||
          (userUsername && authorLower.includes(userUsername.toLowerCase())) ||
          (userId && authorLower.includes(userId.toLowerCase()))
        ) {
          return true;
        }
      }
    } else if (itemType === "question") {
      const qRow = await queryOne<any>(
        `SELECT stem FROM questions WHERE id = $1`,
        [itemId]
      );
      if (!qRow) return false;
    }

    return false;
  } catch (err) {
    console.error("[checkUserInvolvementHistory] Error checking history:", err);
    return false;
  }
}

/**
 * Server-side Assertion helper. Throws RelationalPermissionError if permission is denied.
 */
export async function assertRelationalPermission(params: {
  user: PermissionUser;
  capability: Capability;
  item?: PermissionTargetItem;
}): Promise<void> {
  const result = await evaluateRelationalPermission(params);
  if (!result.allowed) {
    throw new RelationalPermissionError(
      result.reason || "Relational permission check failed.",
      result.code
    );
  }
}
