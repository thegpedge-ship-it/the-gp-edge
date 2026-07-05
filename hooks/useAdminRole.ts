"use client";

import { useState, useEffect } from "react";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export function useAdminRole() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile>({
    id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00",
    name: "Siddhant Udavant",
    email: "admin@gpedge.com",
    role: "Super Admin",
    permissions: ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "notifications", "billing", "audit", "settings", "search", "validation"]
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateProfile = () => {
        let storedId = localStorage.getItem("gpedge_active_admin_id") || "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
        if (storedId === "1") {
          storedId = "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        } else if (storedId === "2") {
          storedId = "b5a452ef-09c3-4d2b-aa58-bf8827f8a101";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        } else if (storedId === "3") {
          storedId = "d7c92b23-1c32-4f8a-9a99-8cb142646202";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        } else if (storedId === "4") {
          storedId = "fa0c92d5-89db-4848-8df0-7d72dfa64303";
          localStorage.setItem("gpedge_active_admin_id", storedId);
        }
        let storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
        let credsList: any[] = [];
        try {
          credsList = storedCreds ? JSON.parse(storedCreds) : [];
        } catch (e) {
          credsList = [];
        }
        if (!credsList || credsList.length === 0 || !credsList.find(u => u.username === "siddhant_super")) {
          const defaultCreds = [
            { id: "e8e3d09a-41e7-4f65-8bda-6bc2b77c5c00", name: "Siddhant Udavant", username: "siddhant_super", role: "Super Admin", email: "admin@gpedge.com", lastChanged: "12 days ago", forgotPasswordEnabled: true, oauthEnabled: true, mfaEnabled: true, password: "super123" },
            { id: "b5a452ef-09c3-4d2b-aa58-bf8827f8a101", name: "Arun Mehta", username: "arun_admin", role: "Admin", email: "content@gpedge.com", lastChanged: "3 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "admin123" },
            { id: "d7c92b23-1c32-4f8a-9a99-8cb142646202", name: "Jessica Park", username: "jessica_mod", role: "Moderator", email: "moderator@gpedge.com", lastChanged: "Yesterday", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "moderator123" },
            { id: "fa0c92d5-89db-4848-8df0-7d72dfa64303", name: "Sarah Connor", username: "sarah_view", role: "Viewer", email: "viewer@gpedge.com", lastChanged: "Never", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "viewer123" }
          ];
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(defaultCreds));
          credsList = defaultCreds;
        }
        const foundUser = credsList.find((u: any) => u.id === storedId);
        if (foundUser) {
          let permissions: string[] = [];
          if (foundUser.role === "Super Admin" || foundUser.role === "Viewer") {
            permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "notifications", "billing", "audit", "settings", "search", "validation"];
          } else if (foundUser.role === "Admin") {
            permissions = ["dashboard", "questions", "quizzes", "content", "approaches", "autofill", "users", "notifications", "billing"];
          } else if (foundUser.role === "Moderator") {
            permissions = ["dashboard", "questions", "content", "approaches"];
          }

          setCurrentAdmin({
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            permissions
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

  const isReadOnly = currentAdmin.role === "Viewer";
  const isSuperAdmin = currentAdmin.role === "Super Admin";

  return {
    currentAdmin,
    isReadOnly,
    isSuperAdmin,
  };
}
