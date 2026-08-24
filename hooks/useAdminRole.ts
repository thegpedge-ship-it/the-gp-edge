"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { RoleCode, AccountState } from "@/lib/relationalPermissions";
import { getCustomRoleByCodeAction } from "@/actions/customRoles.actions";
import { getAdminsFromDbAction } from "@/actions/admin.actions";
import { CustomRoleResource, PermissionMatrix } from "@/lib/customRoleTypes";

const FIXED_ROLE_CODES = new Set(["SA", "CE", "OM", "DR", "PR", "SUB"]);

/** Maps an admin page pathname to the custom-role matrix resource it corresponds to. */
function resourceForPathname(pathname: string | null): CustomRoleResource | undefined {
  if (!pathname) return undefined;
  const segments = pathname.replace(/^\/admin\/?/, "").split("/");
  const first = segments[0];
  const known: CustomRoleResource[] = [
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
  return known.includes(first as CustomRoleResource) ? (first as CustomRoleResource) : undefined;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  status?: AccountState | string;
  permissions: string[];
  initials?: string;
}

export function useAdminRole() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile>({
    id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
    name: "Super Admin",
    email: "admin@gpedge.com",
    role: "Super Admin",
    initials: "SA",
    roles: ["SA"],
    status: "active",
    permissions: [
      "dashboard",
      "questions",
      "quizzes",
      "content",
      "approaches",
      "autofill",
      "feedbacksQuestions",
      "feedbacksNoteTemplates",
      "feedbacksLibrary",
      "users",
      "mbs",
      "notifications",
      "billing",
      "audit",
      "settings",
      "search",
    ],
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateProfile = (): string => {
        let storedId =
          localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
        if (storedId === "1") {
          storedId = "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        } else if (storedId === "2") {
          storedId = "b5a452ef-09c3-4d2b-aa58-bf8827f8a101";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        } else if (storedId === "3") {
          storedId = "d7c92b23-1c32-4f8a-9a99-8cb142646202";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        }

        let storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
        let credsList: any[] = [];
        try {
          credsList = storedCreds ? JSON.parse(storedCreds) : [];
        } catch (e) {
          credsList = [];
        }

        if (!credsList || credsList.length === 0) {
          const defaultCreds = [
            {
              id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
              name: "Super Admin",
              username: "siddhant_super",
              role: "Super Admin",
              roles: ["SA", "CE", "OM"],
              email: "admin@gpedge.com",
              lastChanged: "12 days ago",
              status: "active",
              forgotPasswordEnabled: true,
              oauthEnabled: true,
              mfaEnabled: true,
              password: "super123",
            },
            {
              id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101",
              name: "Arun Mehta (Clinical Editor)",
              username: "arun_editor",
              role: "Clinical Editor",
              roles: ["CE"],
              email: "content@gpedge.com",
              status: "active",
              forgotPasswordEnabled: true,
              oauthEnabled: false,
              mfaEnabled: false,
              password: "admin123",
            },
            {
              id: "d7c92b23-1c32-4f8a-9a99-8cb142646202",
              name: "Operations Lead (OM)",
              username: "ops_lead",
              role: "Operations Manager",
              roles: ["OM"],
              email: "ops@gpedge.com",
              status: "active",
              forgotPasswordEnabled: true,
              oauthEnabled: false,
              mfaEnabled: false,
              password: "ops123",
            },
          ];
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(defaultCreds));
          credsList = defaultCreds;
        }

        const foundUser = credsList.find((u: any) => u.id === storedId);
        if (foundUser) {
          let permissions: string[] = foundUser.permissions || [];
          const userRoles = foundUser.roles || [foundUser.role || "SA"];
          if (userRoles.includes("SA") || userRoles.includes("Super Admin") || permissions.length === 0) {
            permissions = [
              "dashboard",
              "questions",
              "quizzes",
              "content",
              "approaches",
              "autofill",
              "feedbacksQuestions",
              "feedbacksNoteTemplates",
              "feedbacksLibrary",
              "users",
              "mbs",
              "notifications",
              "billing",
              "audit",
              "settings",
              "search",
            ];
          }

          setCurrentAdmin({
            id: foundUser.id,
            name: foundUser.name || "Super Admin",
            email: foundUser.email,
            role: foundUser.role || userRoles[0] || "Super Admin",
            roles: userRoles,
            status: (foundUser.status as AccountState) || "active",
            permissions,
          });
        }

        return storedId;
      };

      const activeId = updateProfile();

      window.addEventListener("gpedge_admin_changed", updateProfile);

      // Self-heal: the localStorage cache (name/username/email/role) can go stale relative to the
      // DB — e.g. a profile edit saved from another tab, or a sync that ran before this admin
      // existed. Reconcile against the DB once per mount and re-render if anything differs.
      let cancelled = false;
      getAdminsFromDbAction()
        .then((dbAdmins) => {
          if (cancelled || dbAdmins.length === 0) return;
          const dbMatch = dbAdmins.find((a) => a.id === activeId);
          if (!dbMatch) return;

          let credsList: any[] = [];
          try {
            const stored = localStorage.getItem("gpedge_admin_credentials_list");
            credsList = stored ? JSON.parse(stored) : [];
          } catch {
            credsList = [];
          }
          const cached = credsList.find((u) => u.id === activeId);

          const stale =
            !cached ||
            cached.name !== dbMatch.name ||
            cached.email !== dbMatch.email ||
            cached.username !== dbMatch.username ||
            cached.role !== dbMatch.role;

          if (stale) {
            localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(dbAdmins));
            updateProfile();
          }
        })
        .catch((err) => {
          console.warn("Failed to reconcile admin profile with DB:", err);
        });

      return () => {
        cancelled = true;
        window.removeEventListener("gpedge_admin_changed", updateProfile);
      };
    }
  }, []);

  const userRoles = (currentAdmin.roles || [currentAdmin.role || "SA"]).map((r) => r.toUpperCase());
  const accountStatus = ((currentAdmin.status || "active") as AccountState).toLowerCase();

  // Account State Checks
  const isActive = accountStatus === "active";
  const isDeactivated = accountStatus === "deactivated";
  const isSuspended = accountStatus === "suspended";
  const isTrial = accountStatus === "trial";
  const isLapsed = accountStatus === "lapsed";
  const isAccessAllowed = (isActive || isTrial) && !isDeactivated && !isSuspended;

  // Role Checks
  const isSuperAdmin =
    userRoles.includes("SA") ||
    userRoles.includes("SUPER ADMIN") ||
    currentAdmin.role === "Super Admin" ||
    currentAdmin.email === "admin@gpedge.com" ||
    currentAdmin.id === "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";

  const isClinicalEditor =
    userRoles.includes("CE") ||
    userRoles.includes("CLINICAL EDITOR") ||
    currentAdmin.role === "Clinical Editor";

  const isOperationsManager =
    userRoles.includes("OM") ||
    userRoles.includes("OPERATIONS MANAGER") ||
    currentAdmin.role === "Operations Manager";

  const isDrafter =
    userRoles.includes("DR") ||
    userRoles.includes("DRAFTER") ||
    currentAdmin.role === "Drafter";

  const isPeerReviewer =
    userRoles.includes("PR") ||
    userRoles.includes("PEER REVIEWER") ||
    currentAdmin.role === "Peer Reviewer";

  const isSubscriber =
    userRoles.includes("SUB") ||
    userRoles.includes("SUBSCRIBER") ||
    currentAdmin.role === "Subscriber";

  // ReadOnly state (e.g. Viewer or suspended/deactivated account)
  const isReadOnly = !isAccessAllowed;

  // Load-bearing & Governance Capabilities
  // 1. Work acceptance creates financial liability (Rule R5): strictly SA & CE (OM is forbidden)
  const canAcceptWork = isAccessAllowed && (isSuperAdmin || isClinicalEditor);

  // 2. Rate card setting: SA alone determines rates (OM applies them, OM does not determine them)
  const canAmendRateCard = isAccessAllowed && isSuperAdmin;

  // 3. Statements: OM & SA can generate statements and mark them paid
  const canGenerateStatements = isAccessAllowed && (isSuperAdmin || isOperationsManager);
  const canMarkStatementsPaid = isAccessAllowed && (isSuperAdmin || isOperationsManager);

  // 4. Clinical Creation & Editing (Matrix 3A: Content)
  // Create item record: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  const canCreateItem = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  // Create item records in bulk (CSV import): SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  const canBulkImport = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  // Write / edit draft content: SA ✔, CE ✔, OM ✖, DR S (own assigned items), PR ✖, SUB ✖
  const canEditDraft = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter);
  // Edit content post-review: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  const canEditPostReview = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  // Attach source references: SA ✔, CE ✔, OM ✖, DR S, PR S, SUB ✖
  const canAttachRefs = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer);
  // Archive an item: SA ✔, CE ✔, OM ✖, DR ✖, PR ✖, SUB ✖
  const canArchiveItem = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  // Restore an archived item: SA ✔, CE ✖, OM ✖, DR ✖, PR ✖, SUB ✖
  const canRestoreItem = isAccessAllowed && isSuperAdmin;

  // 5. Review & Audit
  const canReviewItem = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isPeerReviewer);
  const canAudit = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  const canEditAuditLog = false; // Strictly immutable for all roles including SA

  // 6. User Administration
  const canManageUsers = isAccessAllowed && isSuperAdmin;
  const canInviteContributors = isAccessAllowed && (isSuperAdmin || isOperationsManager); // OM can invite DR & PR only

  // 7. Tasks & Pipeline (Matrix 3E: Tasks and pipeline)
  const canAssignDraftingTask = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canAssignReviewTask = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canAssignBulkTasks = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canTakeUpOfferedTask = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer);
  const canDeclineOfferedTask = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer);
  const canReassignWithdrawTask = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canSetDueDates = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canSendChaseNotifications = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canMarkTaskAccepted = isAccessAllowed && (isSuperAdmin || isClinicalEditor); // Rule R5 load-bearing: SA & CE alone
  const canMarkTaskRejected = isAccessAllowed && (isSuperAdmin || isClinicalEditor);
  const canViewOpenTaskCounts = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canViewOverdueReport = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canViewThroughputReporting = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);

  // 8. Finance & Subscribers (Matrix 3F: Finance and subscribers)
  const canViewRateCard = isAccessAllowed && (isSuperAdmin || isOperationsManager || isDrafter || isPeerReviewer); // CE is ✖
  const canViewOwnEarnings = isAccessAllowed && !isSubscriber;
  const canViewOtherEarnings = isAccessAllowed && (isSuperAdmin || isOperationsManager);
  const canViewProgrammeCost = isAccessAllowed && (isSuperAdmin || isOperationsManager);
  const canFlagReworkPayable = isAccessAllowed && (isSuperAdmin || isClinicalEditor); // OM is ✖
  const canViewContributorAbn = isAccessAllowed && (isSuperAdmin || isOperationsManager || isDrafter || isPeerReviewer); // CE is ✖
  const canTriageErrorReport = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager);
  const canViewItemPerformanceAnalytics = isAccessAllowed && (isSuperAdmin || isClinicalEditor); // OM is ✖
  const canConfigureAnalyticsThresholds = isAccessAllowed && isSuperAdmin;
  const canViewItemProvenance = isAccessAllowed;

  // 9. Visibility & Pipeline Status (Matrix 3A: Content)
  // View unpublished item content: SA C(R12), CE C(R12), OM ✖, DR C(R12), PR C(R12), SUB ✖
  const canViewUnpublished = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer);
  // View pipeline status metadata: SA ✔, CE ✔, OM ✔, DR S, PR S, SUB ✖
  const canViewPipeline = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager || isDrafter || isPeerReviewer);
  const canToggleBilling = isAccessAllowed && (isSuperAdmin || isOperationsManager);

  // ── Custom (configurable) role support ──────────────────────────────────
  // A custom role's code is neither SA/CE/OM/DR/PR/SUB, so all the role-flag booleans above are
  // false for it. Resolve its permissions matrix here and override the handful of flags that
  // pages actually gate on, scoped to whichever admin page is currently rendering.
  const pathname = usePathname();
  const isFixedRole = isSuperAdmin || isClinicalEditor || isOperationsManager || isDrafter || isPeerReviewer || isSubscriber;
  const customRoleCode = !isFixedRole ? userRoles[0] : undefined;

  const [customMatrix, setCustomMatrix] = useState<{ matrix: PermissionMatrix; canViewPii: boolean } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!customRoleCode || FIXED_ROLE_CODES.has(customRoleCode)) {
      setCustomMatrix(null);
      return;
    }
    getCustomRoleByCodeAction(customRoleCode).then((res) => {
      if (isMounted && res.success && res.role) {
        setCustomMatrix({ matrix: res.role.matrix, canViewPii: res.role.canViewPii });
      } else if (isMounted) {
        setCustomMatrix(null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [customRoleCode]);

  const currentResource = resourceForPathname(pathname);
  const currentResourceGrant = customMatrix && currentResource ? customMatrix.matrix[currentResource] : undefined;
  const hasCustomRole = !!customMatrix;

  const canViewLearnerPii = hasCustomRole ? customMatrix!.canViewPii : true;

  // Overrides applied only for a custom-role admin, scoped to the resource of the page they're
  // currently on. Spread last into the return object below so a fixed-role admin's flags (computed
  // above) are completely unaffected.
  const customRoleOverrides = hasCustomRole
    ? (() => {
        const canEditResource = isAccessAllowed && !!currentResourceGrant?.edit;
        const canReadResource = isAccessAllowed && !!(currentResourceGrant?.read || currentResourceGrant?.edit);
        const canReadAuditResource = isAccessAllowed && !!(customMatrix!.matrix.audit?.read || customMatrix!.matrix.audit?.edit);
        const canEditBillingResource = isAccessAllowed && !!customMatrix!.matrix.billing?.edit;
        const canEditUsersResource = isAccessAllowed && !!customMatrix!.matrix.users?.edit;

        return {
          isReadOnly: isAccessAllowed ? !canEditResource : isReadOnly,
          canCreateItem: canEditResource,
          canBulkImport: canEditResource,
          canEditDraft: canEditResource,
          canEditPostReview: canEditResource,
          canAttachRefs: canEditResource,
          canArchiveItem: canEditResource,
          canRestoreItem: false, // restore stays SA-only, matching the server-side rule
          canReviewItem: false,
          canAudit: canReadAuditResource,
          canManageUsers: canEditUsersResource,
          canToggleBilling: canEditBillingResource,
          canViewUnpublished: canReadResource,
          canViewPipeline: canReadResource,
        };
      })()
    : {};

  return {
    currentAdmin,
    accountStatus,
    isReadOnly,
    isAccessAllowed,
    isActive,
    isDeactivated,
    isSuspended,
    isTrial,
    isLapsed,
    // Role flags
    isSuperAdmin,
    isClinicalEditor,
    isOperationsManager,
    isDrafter,
    isPeerReviewer,
    isSubscriber,
    userRoles,
    // Load-bearing & Governance Capabilities
    canAcceptWork,
    canAmendRateCard,
    canGenerateStatements,
    canMarkStatementsPaid,
    canCreateItem,
    canBulkImport,
    canEditDraft,
    canEditPostReview,
    canAttachRefs,
    canArchiveItem,
    canRestoreItem,
    canReviewItem,
    canAudit,
    canEditAuditLog,
    canManageUsers,
    canInviteContributors,
    canAssignDraftingTask,
    canAssignReviewTask,
    canAssignBulkTasks,
    canTakeUpOfferedTask,
    canDeclineOfferedTask,
    canReassignWithdrawTask,
    canSetDueDates,
    canSendChaseNotifications,
    canMarkTaskAccepted,
    canMarkTaskRejected,
    canViewOpenTaskCounts,
    canViewOverdueReport,
    canViewThroughputReporting,
    canViewRateCard,
    canViewOwnEarnings,
    canViewOtherEarnings,
    canViewProgrammeCost,
    canFlagReworkPayable,
    canViewContributorAbn,
    canTriageErrorReport,
    canViewItemPerformanceAnalytics,
    canConfigureAnalyticsThresholds,
    canViewItemProvenance,
    canViewUnpublished,
    canViewPipeline,
    canToggleBilling,
    // Custom (configurable) role support
    canViewLearnerPii,
    ...customRoleOverrides,
  };
}
