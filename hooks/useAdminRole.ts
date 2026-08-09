"use client";

import { useState, useEffect } from "react";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  status?: string;
  permissions: string[];
}

export function useAdminRole() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile>({
    id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
    name: "Siddhant Udavant",
    email: "admin@gpedge.com",
    role: "Super Admin",
    roles: ["SA", "CE", "OM"],
    status: "active",
    permissions: [
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
              name: "Siddhant Udavant (Founder)",
              username: "siddhant_super",
              role: "Super Admin",
              roles: ["SA", "CE", "OM"],
              email: "admin@gpedge.com",
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
            status: foundUser.status || "active",
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

  const isReadOnly = false;
  const userRoles = currentAdmin.roles || [currentAdmin.role || "SA"];
  const isSuperAdmin =
    userRoles.includes("SA") ||
    userRoles.includes("Super Admin") ||
    currentAdmin.role === "Super Admin" ||
    currentAdmin.role === "SA (Super Admin)";

  const isClinicalEditor =
    userRoles.includes("CE") ||
    userRoles.includes("Clinical Editor") ||
    currentAdmin.role === "Clinical Editor" ||
    currentAdmin.role === "CE (Clinical Editor)";

  const isOperationsManager =
    userRoles.includes("OM") ||
    userRoles.includes("Operations Manager") ||
    currentAdmin.role === "Operations Manager" ||
    currentAdmin.role === "OM (Operations Manager)";

  const isDrafter =
    userRoles.includes("DR") ||
    userRoles.includes("Drafter") ||
    currentAdmin.role === "Drafter" ||
    currentAdmin.role === "DR (Drafter)";

  const isPeerReviewer =
    userRoles.includes("PR") ||
    userRoles.includes("Peer Reviewer") ||
    currentAdmin.role === "Peer Reviewer" ||
    currentAdmin.role === "PR (Peer Reviewer)";

  const isSubscriber =
    userRoles.includes("SUB") ||
    userRoles.includes("Subscriber") ||
    currentAdmin.role === "Subscriber" ||
    currentAdmin.role === "SUB (Subscriber)";

  // 3A Content Permission Matrix derived capabilities
  const canCreateItem = isSuperAdmin || isClinicalEditor;
  const canBulkImport = isSuperAdmin || isClinicalEditor;
  const canEditDraft = isSuperAdmin || isClinicalEditor || isDrafter;
  const canEditPostReview = isSuperAdmin || isClinicalEditor;
  const canAttachRefs = isSuperAdmin || isClinicalEditor || isDrafter || isPeerReviewer;
  const canViewUnpublished = !isSubscriber;
  const canViewPipeline = !isSubscriber;
  const canArchiveItem = isSuperAdmin || isClinicalEditor;
  const canRestoreItem = isSuperAdmin;
  const canToggleBilling = isSuperAdmin || isOperationsManager;

  return {
    currentAdmin,
    isReadOnly,
    isSuperAdmin,
    isClinicalEditor,
    isOperationsManager,
    isDrafter,
    isPeerReviewer,
    isSubscriber,
    userRoles,
    // 3A capability flags
    canCreateItem,
    canBulkImport,
    canEditDraft,
    canEditPostReview,
    canAttachRefs,
    canViewUnpublished,
    canViewPipeline,
    canArchiveItem,
    canRestoreItem,
    canToggleBilling,
  };
}
