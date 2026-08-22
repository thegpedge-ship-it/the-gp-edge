"use client";

import { useState, useEffect } from "react";
import { RoleCode, AccountState } from "@/lib/relationalPermissions";

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
    name: "GPEDGE Admin",
    email: "admin@gpedge.com",
    role: "Super Admin",
    initials: "SU",
    roles: ["SA"],
    status: "active",
    permissions: [
      "dashboard",
      "questions",
      "quizzes",
      "content",
      "approaches",
      "autofill",
      "feedbacks",
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
      const updateProfile = () => {
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

        if (!credsList || credsList.length === 0 || !credsList.find((u) => u.username === "siddhant_super")) {
          const defaultCreds = [
            {
              id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
              name: "GPEDGE Founder (SA / CE / OM)",
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
              "feedbacks",
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
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role || userRoles[0] || "Super Admin",
            roles: userRoles,
            status: (foundUser.status as AccountState) || "active",
            permissions,
          });
        }
      };

      updateProfile();

      window.addEventListener("gpedge_admin_changed", updateProfile);
      return () => {
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

  // 7. Visibility & Pipeline Status (Matrix 3A: Content)
  // View unpublished item content: SA C(R12), CE C(R12), OM ✖, DR C(R12), PR C(R12), SUB ✖
  const canViewUnpublished = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer);
  // View pipeline status metadata: SA ✔, CE ✔, OM ✔, DR S, PR S, SUB ✖
  const canViewPipeline = isAccessAllowed && (isSuperAdmin || isClinicalEditor || isOperationsManager || isDrafter || isPeerReviewer);
  const canToggleBilling = isAccessAllowed && (isSuperAdmin || isOperationsManager);

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
    canViewUnpublished,
    canViewPipeline,
    canToggleBilling,
  };
}
