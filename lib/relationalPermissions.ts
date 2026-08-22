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
  | "edit_audit_log"
  | "create_item"
  | "create_bulk_items"
  | "edit_draft"
  | "edit_post_review"
  | "attach_references"
  | "view_unpublished"
  | "view_pipeline_metadata"
  | "archive_item"
  | "restore_item"
  | "bulk_flag_superseded"
  | "assign_review_task"
  | "complete_rubric"
  | "record_review_outcome"
  | "save_draft_rubric"
  | "edit_unsubmitted_rubric"
  | "edit_submitted_rubric"
  | "submit_correcting_review"
  | "reopen_review"
  | "configure_audit_params"
  | "view_audit_findings"
  | "raise_audit_finding"
  | "close_audit_finding"
  | "export_provenance"
  | "run_audit"
  | "assign_review_task_check"
  | "close_audit_finding_check"
  | "classify_republication"
  | "invite_contributor"
  | "invite_any_account"
  | "assign_revoke_role"
  | "edit_role_bundle"
  | "deactivate_contributor"
  | "deactivate_any_account"
  | "reset_own_password"
  | "view_access_log"
  | "read_audit_log"
  | "export_audit_log"
  | "assign_drafting_task"
  | "assign_bulk_tasks"
  | "take_up_offered_task"
  | "decline_offered_task"
  | "reassign_withdraw_task"
  | "set_due_dates"
  | "send_chase_notifications"
  | "mark_task_accepted"
  | "mark_task_rejected"
  | "view_open_task_counts"
  | "view_overdue_report"
  | "view_throughput_reporting"
  | "view_rate_card"
  | "create_amend_rate_card"
  | "view_own_earnings"
  | "view_other_earnings"
  | "view_programme_cost"
  | "generate_payment_statement"
  | "flag_rework_payable"
  | "view_contributor_abn"
  | "access_published_content"
  | "view_own_progress_data"
  | "submit_error_report"
  | "triage_error_report"
  | "view_item_performance_analytics"
  | "configure_analytics_thresholds"
  | "view_item_provenance";

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

export type AccountState = "active" | "deactivated" | "suspended" | "trial" | "lapsed" | "pending_invite";

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
    | "SUBMITTED_RUBRIC_IMMUTABLE_DENIED"
    | "ASSIGNMENT_SELF_REVIEW_BREACH_DENIED"
    | "SAME_USER_CLOSURE_DENIED"
    | "R9_SELF_AUDIT_PROHIBITION_DENIED"
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
 * 1. Rule R8 & Account states check (Deactivated, Suspended, Lapsed, Trial).
 * 2. Absolute Database Append-Only Audit Log Immutability (SA cannot edit/delete).
 * 3. Rule R13 Absolute Submitted Rubric Immutability.
 * 4. Rule R1 Assignment-Point Check & Self-Review Prohibition.
 * 5. Rule R9 Auditor Independence (Self-auditing prohibition & different user closure).
 * 6. Multi-role assignment with Conflict Resolution ("Where roles conflict, the most restrictive rule governs").
 * 7. Load-bearing Controls:
 *    - OM cannot mark work accepted (R5 liability creation sits with SA and CE only).
 *    - OM cannot amend the rate card (Rates set by SA alone).
 *    - OM can generate statements and mark them paid.
 *    - CE has no financial or user admin privilege.
 *    - DR / PR scope restricted to own assigned items / reviews.
 */
export async function evaluateRelationalPermission(params: {
  user: PermissionUser;
  capability: Capability;
  item?: PermissionTargetItem;
  targetAssignee?: PermissionUser;
  targetRoleToAssign?: string;
  targetAccountRole?: string;
  findingRaiserId?: string;
}): Promise<RelationalPermissionResult> {
  const { user, capability, item, targetAssignee, targetRoleToAssign, targetAccountRole, findingRaiserId } = params;

  if (!user || (!user.id && !user.email && !user.name)) {
    return {
      allowed: false,
      code: "INVALID_INPUT",
      reason: "Permission check failed: User context is required.",
    };
  }

  // 1. RULE R8 & ACCOUNT STATES CHECK
  const status = (user.status || "active").toLowerCase();
  if (status === "deactivated") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Account is Deactivated. Access is revoked. Attribution, version history, and sign-offs remain permanently intact under Rule R8.",
    };
  }
  if (status === "suspended") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Account is Suspended. All access is frozen while records remain intact.",
    };
  }
  if (status === "pending_invite") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Account invitation is pending activation. Access is not yet enabled.",
    };
  }
  if (status === "lapsed" && capability !== "read" && capability !== "reset_own_password") {
    return {
      allowed: false,
      code: "ACCOUNT_STATE_DENIED",
      reason: "Subscriber account entitlement has Lapsed. Access is restricted under the subscription entitlement policy.",
    };
  }

  // 2. ABSOLUTE DATABASE APPEND-ONLY AUDIT LOG IMMUTABILITY CHECK
  if ((item && item.type === "audit_log") || capability === "edit_audit_log") {
    if (capability !== "read") {
      return {
        allowed: false,
        code: "AUDIT_LOG_IMMUTABLE_DENIED",
        reason: "Section 3G Rule Violation: Audit logs are strictly append-only. No role, including Super Admin, can edit or delete an audit log entry.",
      };
    }
  }

  // 3. RULE R13: SUBMITTED RUBRIC IMMUTABILITY CHECK
  if (capability === "edit_submitted_rubric") {
    return {
      allowed: false,
      code: "SUBMITTED_RUBRIC_IMMUTABLE_DENIED",
      reason: "Rule R13 Violation: A submitted review rubric is strictly immutable. No user or role (including Super Admin) can edit a submitted rubric.",
    };
  }

  // 4. MATRIX 3B & RULE R1: ASSIGNMENT-POINT ENFORCEMENT CHECK
  if (capability === "assign_review_task" || capability === "assign_review_task_check") {
    const assignee = targetAssignee || user;
    const assigneeRoles = getUserRoles(assignee);
    const isAssigneeEligible =
      assigneeRoles.includes("SA") ||
      assigneeRoles.includes("CE") ||
      assigneeRoles.includes("PR") ||
      assigneeRoles.includes("Super Admin") ||
      assigneeRoles.includes("Clinical Editor") ||
      assigneeRoles.includes("Peer Reviewer");

    if (!isAssigneeEligible) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3B Violation: Only Super Admin (SA), Clinical Editor (CE), and Peer Reviewer (PR) roles can be assigned review tasks. Drafter (DR), Operations Manager (OM), and Subscriber (SUB) cannot be assigned review tasks.",
      };
    }

    if (item && item.id) {
      const isAssigneeInvolved = await checkUserInvolvementHistory({
        userId: assignee.id,
        userName: assignee.name,
        userEmail: assignee.email,
        userUsername: assignee.username,
        itemId: item.id,
        itemType: item.type,
        itemAuthor: item.author,
      });

      if (isAssigneeInvolved) {
        return {
          allowed: false,
          code: "ASSIGNMENT_SELF_REVIEW_BREACH_DENIED",
          reason: `Rule R1 Violation: Assigned reviewer '${assignee.name || assignee.email || assignee.id}' appears in version/task history as author or editor, and cannot be assigned a review task on ${item.type} '${item.id}'. Assignment rejected at point of assignment.`,
        };
      }
    }
  }

  // 5. RULE R9: DIFFERENT USER CLOSURE REQUIREMENT CHECK
  if (capability === "close_audit_finding") {
    if (findingRaiserId && findingRaiserId === user.id) {
      return {
        allowed: false,
        code: "SAME_USER_CLOSURE_DENIED",
        reason: "Rule R9 Violation: The user who raised an audit finding may not close it. Closure requires a different eligible user.",
      };
    }
  }

  const assignedRoles = getUserRoles(user);
  const isSuperAdmin = assignedRoles.includes("SA") || assignedRoles.includes("Super Admin");
  const isClinicalEditor = assignedRoles.includes("CE") || assignedRoles.includes("Clinical Editor");
  const isOMRole = assignedRoles.includes("OM") || assignedRoles.includes("Operations Manager");
  const isDrafter = assignedRoles.includes("DR") || assignedRoles.includes("Drafter");
  const isPeerReviewer = assignedRoles.includes("PR") || assignedRoles.includes("Peer Reviewer");
  const isSubscriber = assignedRoles.includes("SUB") || assignedRoles.includes("Subscriber");

  // 6. RESTORE IS SA-ONLY
  if (capability === "restore_item") {
    if (!isSuperAdmin) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Restoration of an archived item is strictly SA-only (Super Admin). Clinical Editors, Operations Managers, Drafters, and Reviewers cannot restore archived items.",
      };
    }
    return { allowed: true, code: "ALLOWED" };
  }

  // 7. SECTION 3G ADMINISTRATION CAPABILITIES
  // SA-Only Privilege Management Capabilities
  const saOnlyAdminCapabilities: Capability[] = [
    "invite_any_account",
    "assign_revoke_role",
    "edit_role_bundle",
    "deactivate_any_account",
    "view_access_log",
    "read_audit_log",
    "export_audit_log",
    "configure_audit_params",
  ];

  if (saOnlyAdminCapabilities.includes(capability)) {
    if (!isSuperAdmin) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: `Section 3G Rule Violation: '${capability}' is privilege management and is strictly restricted to Super Admin (SA) alone.`,
      };
    }
    return { allowed: true, code: "ALLOWED" };
  }

  // Delegated Contributor Invitations & Deactivation (OM & SA Allowed for DR and PR only)
  if (capability === "invite_contributor" || capability === "deactivate_contributor") {
    if (!isSuperAdmin && !isOMRole) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Inviting or deactivating contributors is restricted to Super Admin (SA) and Operations Manager (OM).",
      };
    }
    if (isOMRole && !isSuperAdmin) {
      const roleToCheck = (targetRoleToAssign || targetAccountRole || "").toUpperCase();
      const isAllowedContributorRole =
        roleToCheck === "DR" || roleToCheck === "PR" || roleToCheck === "DRAFTER" || roleToCheck === "PEER REVIEWER";

      if (targetRoleToAssign || targetAccountRole) {
        if (!isAllowedContributorRole) {
          return {
            allowed: false,
            code: "RESTRICTION_GOVERNS_DENIED",
            reason: "Section 3G Rule Violation: Operations Manager (OM) can invite and deactivate Drafter (DR) and Peer Reviewer (PR) accounts ONLY. OM cannot create or deactivate SA, CE, or OM accounts.",
          };
        }
      }
    }
    return { allowed: true, code: "ALLOWED" };
  }

  // Password Reset Self-Service for All Roles
  if (capability === "reset_own_password") {
    return { allowed: true, code: "ALLOWED" };
  }

  // 8. PROVENANCE EXPORT IS SA & CE ONLY
  if (capability === "export_provenance") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Exporting item provenance records is strictly restricted to SA and CE.",
      };
    }
    return { allowed: true, code: "ALLOWED" };
  }

  // 9. REOPEN REVIEW IS SA & CE ONLY
  if (capability === "reopen_review") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Reopening a completed review is strictly restricted to Super Admin (SA) and Clinical Editor (CE).",
      };
    }
  }

  // 10. MULTI-ROLE CONFLICT RESOLUTION: "Where roles conflict, the most restrictive applicable rule governs."
  // Check if ANY assigned role contains a specific prohibition for the requested capability:

  // Prohibition A: Operations Manager (OM) load-bearing & content restrictions
  if (isOMRole) {
    if (capability === "accept_work") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Rule R5 Load-bearing Control Violation: Operations Manager (OM) role cannot mark work accepted. Acceptance creates payment liability and sits strictly with SA and CE.",
      };
    }
    if (capability === "amend_rate_card") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Load-bearing Control Violation: Operations Manager (OM) role cannot amend rate cards. Rates are set by Super Admin (SA) alone.",
      };
    }
    if (capability === "create_item" || capability === "create_bulk_items" || capability === "create") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Item creation is a clinical act, not an administrative one. Operations Manager (OM) cannot create item records.",
      };
    }
    if (capability === "edit_draft" || capability === "edit_post_review" || capability === "edit") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "OM moves items; OM does not judge them. Operations Manager (OM) cannot alter item content.",
      };
    }
    if (capability === "attach_references") {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Attaching source references is a clinical attestation. Operations Manager (OM) cannot attach source references.",
      };
    }
    if (
      capability === "complete_rubric" ||
      capability === "record_review_outcome" ||
      capability === "save_draft_rubric" ||
      capability === "submit_correcting_review" ||
      capability === "raise_audit_finding" ||
      capability === "close_audit_finding"
    ) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "OM does not exercise clinical judgment and cannot participate in clinical peer review rubrics or raise/close audit findings.",
      };
    }
  }

  // Prohibition B: Drafter (DR) scope restriction (own assigned items only)
  const isOnlyDrafter = assignedRoles.length === 1 && isDrafter;
  if (isOnlyDrafter && item && item.id) {
    if (capability !== "read" && capability !== "view_pipeline_metadata" && capability !== "create") {
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
  const isOnlyPeerReviewer = assignedRoles.length === 1 && isPeerReviewer;
  if (
    isOnlyPeerReviewer &&
    capability !== "read" &&
    capability !== "review" &&
    capability !== "attach_references" &&
    capability !== "view_pipeline_metadata" &&
    capability !== "assign_review_task" &&
    capability !== "complete_rubric" &&
    capability !== "record_review_outcome" &&
    capability !== "save_draft_rubric" &&
    capability !== "edit_unsubmitted_rubric" &&
    capability !== "submit_correcting_review"
  ) {
    return {
      allowed: false,
      code: "RESTRICTION_GOVERNS_DENIED",
      reason: "Role 'Peer Reviewer' (PR) scope is strictly restricted to assigned review tasks.",
    };
  }

  // Prohibition D: Clinician-only Creation (SA & CE Only)
  if (capability === "create_item" || capability === "create_bulk_items") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Item creation (and bulk creation) is a clinical act resting strictly with SA (Super Admin) and CE (Clinical Editor) only.",
      };
    }
  }

  // Prohibition E: Edit Post-Review and Archiving (SA & CE Only)
  if (capability === "edit_post_review" || capability === "archive_item" || capability === "archive") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Editing post-review content and archiving items is restricted to SA and CE.",
      };
    }
  }

  // Capability: View Audit Findings (SA: ✓, CE: ✓, OM: S, DR: ✗, PR: ✗, SUB: ✗)
  if (capability === "view_audit_findings") {
    if (isSubscriber || isDrafter || isPeerReviewer) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Drafters, Peer Reviewers, and Subscribers cannot view audit findings.",
      };
    }
    if (isOMRole && !(isSuperAdmin || isClinicalEditor)) {
      if (item && item.id) {
        const isAssigned = item.assigned_to === user.id || (item.author && item.author.includes(user.name || ""));
        if (!isAssigned) {
          return {
            allowed: false,
            code: "RESTRICTION_GOVERNS_DENIED",
            reason: "Operations Manager (OM) can only view audit findings for assigned items (Scope S).",
          };
        }
      }
    }
  }

  // Matrix 3A: View Unpublished Content & Rule R12 Historical Read Access
  // SA: C(R12), CE: C(R12), OM: ✖, DR: C(R12), PR: C(R12), SUB: ✖
  if (capability === "view_unpublished") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3A Violation: Subscribers cannot view unpublished item content.",
      };
    }
    if (isOMRole && !(isSuperAdmin || isClinicalEditor)) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Matrix 3A Violation: Operations Manager (OM) cannot view unpublished clinical item content. OM has access to pipeline status metadata only.",
      };
    }
    if ((isDrafter || isPeerReviewer) && !(isSuperAdmin || isClinicalEditor)) {
      if (item && item.id) {
        const isAssigned = item.assigned_to === user.id || (item.author && item.author.includes(user.name || ""));
        const hasHistory = await checkUserInvolvementHistory({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userUsername: user.username,
          itemId: item.id,
          itemType: item.type,
          itemAuthor: item.author,
        });

        if (!isAssigned && !hasHistory) {
          return {
            allowed: false,
            code: "RESTRICTION_GOVERNS_DENIED",
            reason: "Rule R12 Violation: Contributors have full access to active tasks and historical read access to completed tasks on their payment statements. Access to unassigned items with no task history is denied.",
          };
        }
      }
    }
    return { allowed: true, code: "ALLOWED" };
  }

  // Matrix 3A: View Pipeline Status Metadata
  // SA: ✔, CE: ✔, OM: ✔, DR: S, PR: S, SUB: ✖
  if (capability === "view_pipeline_metadata") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3A Violation: Subscribers cannot view pipeline status metadata.",
      };
    }
    if ((isDrafter || isPeerReviewer) && !(isSuperAdmin || isClinicalEditor || isOMRole)) {
      if (item && item.id) {
        const isAssigned = item.assigned_to === user.id || (item.author && item.author.includes(user.name || ""));
        if (!isAssigned) {
          return {
            allowed: false,
            code: "RESTRICTION_GOVERNS_DENIED",
            reason: "Matrix 3A Violation: Drafters and Peer Reviewers can only view pipeline status metadata for assigned items (Scope S).",
          };
        }
      }
    }
    return { allowed: true, code: "ALLOWED" };
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

  // 11. ITEM-SCOPED HISTORY & RELATIONAL EVALUATION (Rule R1 & Rule R9)
  if (item && item.id) {
    const isReviewOrApprove =
      capability === "review" ||
      capability === "approve" ||
      capability === "publish" ||
      capability === "accept_work" ||
      capability === "complete_rubric" ||
      capability === "record_review_outcome" ||
      capability === "save_draft_rubric" ||
      capability === "submit_correcting_review";

    const isAuditAction = capability === "raise_audit_finding" || capability === "close_audit_finding";

    if (isReviewOrApprove || isAuditAction) {
      const isUserInvolvedInHistory = await checkUserInvolvementHistory({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userUsername: user.username,
        itemId: item.id,
        itemType: item.type,
        itemAuthor: item.author,
      });

      if (isUserInvolvedInHistory) {
        if (isAuditAction) {
          return {
            allowed: false,
            code: "R9_SELF_AUDIT_PROHIBITION_DENIED",
            reason: `Rule R9 Violation: User '${user.name || user.email || user.id}' appears in version or task history as author/editor of ${item.type} '${item.id}', and is strictly forbidden from assessing or closing audit findings on their own work.`,
          };
        }

        return {
          allowed: false,
          code: "HISTORY_CONFLICT_DENIED",
          reason: `Rule R1 Violation: User '${user.name || user.email || user.id}' appears in version or task history of ${item.type} '${item.id}' as author or editor, and has no review permission on this item.`,
        };
      }
    }
  }

  // 12. MATRIX 3E: TASKS AND PIPELINE CAPABILITY CHECKS
  // 1. Mark task accepted (Rule R5 load-bearing: acceptance creates payment liability): SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "mark_task_accepted" || capability === "accept_work") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Rule R5 Violation: Marking a task accepted creates payment liability and sits strictly with Super Admin (SA) and Clinical Editor (CE). Operations Manager (OM) and contributors cannot mark tasks accepted.",
      };
    }
  }

  // 2. Mark task rejected: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "mark_task_rejected") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3E Violation: Marking a task rejected is strictly restricted to Super Admin (SA) and Clinical Editor (CE).",
      };
    }
  }

  // 3. Take up offered task & Decline offered task: SA ✔, CE ✔, OM ✖, DR S, PR S, SUB ✖
  if (capability === "take_up_offered_task" || capability === "decline_offered_task") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3E Violation: Subscribers cannot take up or decline tasks.",
      };
    }
    if (isOMRole && !(isSuperAdmin || isClinicalEditor)) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Matrix 3E Violation: Operations Manager (OM) assigns tasks; OM does not take up or decline contributor tasks.",
      };
    }
    if ((isDrafter || isPeerReviewer) && !(isSuperAdmin || isClinicalEditor)) {
      if (item && item.id) {
        const isAssigned = item.assigned_to === user.id || (item.author && item.author.includes(user.name || ""));
        if (!isAssigned) {
          return {
            allowed: false,
            code: "RESTRICTION_GOVERNS_DENIED",
            reason: "Scope S Violation: Contributors can only take up or decline tasks specifically offered to them.",
          };
        }
      }
    }
  }

  // 4. Task Assignment & Coordination (SA ✔, CE ✔, OM ✔, DR ✖, PR ✖, SUB ✖)
  const taskCoordinationCapabilities: Capability[] = [
    "assign_drafting_task",
    "assign_bulk_tasks",
    "reassign_withdraw_task",
    "set_due_dates",
    "send_chase_notifications",
    "view_open_task_counts",
    "view_overdue_report",
    "view_throughput_reporting",
  ];

  if (taskCoordinationCapabilities.includes(capability)) {
    if (!isSuperAdmin && !isClinicalEditor && !isOMRole) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: `Matrix 3E Violation: '${capability}' is a task coordination capability restricted to SA, CE, and OM.`,
      };
    }
  }

  // 13. MATRIX 3F: FINANCE AND SUBSCRIBERS CAPABILITY CHECKS
  // View rate card: SA ✔, CE ✖, OM ✔, DR S, PR S, SUB ✖
  if (capability === "view_rate_card") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Subscribers cannot view rate cards.",
      };
    }
    if (isClinicalEditor && !isSuperAdmin && !isOMRole) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Matrix 3F Violation: Clinical Editor (CE) does not manage financial rate cards.",
      };
    }
  }

  // Create / amend rate card: SA ✔, CE ✖, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "create_amend_rate_card" || capability === "amend_rate_card") {
    if (!isSuperAdmin) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Rate cards are determined and amended by Super Admin (SA) alone.",
      };
    }
  }

  // View own accepted-item count and earnings: SA ✔, CE ✔, OM S, DR S, PR S, SUB ✖
  if (capability === "view_own_earnings") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Subscribers cannot view contributor earnings data.",
      };
    }
  }

  // View another contributor's earnings, total programme cost, generate payment statement, mark statement paid: SA ✔, CE ✖, OM ✔, DR ✖, PR ✖, SUB ✖
  const financeOpsCapabilities: Capability[] = [
    "view_other_earnings",
    "view_programme_cost",
    "generate_payment_statement",
    "generate_statement",
    "mark_statement_paid",
  ];
  if (financeOpsCapabilities.includes(capability)) {
    if (!isSuperAdmin && !isOMRole) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: `Matrix 3F Violation: '${capability}' is financial administration restricted to SA and OM. Clinical Editors and contributors have no access.`,
      };
    }
  }

  // Flag rework as payable / non-payable: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "flag_rework_payable") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Judging whether rework is payable or non-payable is a clinical assessment resting strictly with SA and CE. Operations Manager (OM) and contributors cannot flag rework payable.",
      };
    }
  }

  // View contributor ABN / entity type: SA ✔, CE ✖, OM ✔, DR S, PR S, SUB ✖
  if (capability === "view_contributor_abn") {
    if (isSubscriber) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Subscribers cannot view contributor financial metadata.",
      };
    }
    if (isClinicalEditor && !isSuperAdmin && !isOMRole) {
      return {
        allowed: false,
        code: "RESTRICTION_GOVERNS_DENIED",
        reason: "Matrix 3F Violation: Clinical Editors cannot view contributor ABN/entity types.",
      };
    }
  }

  // View item performance analytics: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "view_item_performance_analytics") {
    if (!isSuperAdmin && !isClinicalEditor) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Item performance analytics are clinical metrics restricted to SA and CE.",
      };
    }
  }

  // Configure analytics thresholds: SA ✔, CE ✖, OM ✖, DR ✖, PR ✖, SUB ✖
  if (capability === "configure_analytics_thresholds") {
    if (!isSuperAdmin) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Configuring analytics thresholds is restricted to Super Admin (SA) alone.",
      };
    }
  }

  // Triage an error report: SA ✔, CE ✔, OM ✔, DR ✖, PR ✖, SUB ✖
  if (capability === "triage_error_report") {
    if (!isSuperAdmin && !isClinicalEditor && !isOMRole) {
      return {
        allowed: false,
        code: "ROLE_DENIED",
        reason: "Matrix 3F Violation: Error report triage is restricted to SA, CE, and OM.",
      };
    }
  }

  // Submit error report & View item provenance: Permitted for ALL active roles
  if (capability === "submit_error_report" || capability === "view_item_provenance") {
    return { allowed: true, code: "ALLOWED" };
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
  itemAuthor?: string;
}): Promise<boolean> {
  const { userId, userName, userEmail, userUsername, itemId, itemType, itemAuthor } = params;

  if (itemAuthor) {
    const authorLower = itemAuthor.toLowerCase();
    if (
      (userName && authorLower.includes(userName.toLowerCase())) ||
      (userEmail && authorLower.includes(userEmail.toLowerCase())) ||
      (userUsername && authorLower.includes(userUsername.toLowerCase())) ||
      (userId && authorLower.includes(userId.toLowerCase()))
    ) {
      return true;
    }
  }

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
  targetAssignee?: PermissionUser;
  targetRoleToAssign?: string;
  targetAccountRole?: string;
  findingRaiserId?: string;
}): Promise<void> {
  const result = await evaluateRelationalPermission(params);
  if (!result.allowed) {
    throw new RelationalPermissionError(
      result.reason || "Relational permission check failed.",
      result.code
    );
  }
}
