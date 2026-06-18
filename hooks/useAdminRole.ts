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
    id: "1",
    name: "Siddhant Udavant",
    email: "admin@gpedge.com",
    role: "Super Admin",
    permissions: ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing", "audit", "settings", "search", "validation"]
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateProfile = () => {
        const storedId = localStorage.getItem("gpedge_active_admin_id") || "1";
        let storedCreds = localStorage.getItem("gpedge_admin_credentials_list");
        let credsList: any[] = [];
        try {
          credsList = storedCreds ? JSON.parse(storedCreds) : [];
        } catch (e) {
          credsList = [];
        }
        if (!credsList || credsList.length === 0 || !credsList.find(u => u.username === "siddhant_super")) {
          const defaultCreds = [
            { id: "1", name: "Siddhant Udavant", username: "siddhant_super", role: "Super Admin", email: "admin@gpedge.com", lastChanged: "12 days ago", forgotPasswordEnabled: true, oauthEnabled: true, mfaEnabled: true, password: "super123" },
            { id: "2", name: "Arun Mehta", username: "arun_admin", role: "Admin", email: "content@gpedge.com", lastChanged: "3 days ago", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "admin123" },
            { id: "3", name: "Jessica Park", username: "jessica_mod", role: "Moderator", email: "moderator@gpedge.com", lastChanged: "Yesterday", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "moderator123" },
            { id: "4", name: "Sarah Connor", username: "sarah_view", role: "Viewer", email: "viewer@gpedge.com", lastChanged: "Never", forgotPasswordEnabled: true, oauthEnabled: false, mfaEnabled: false, password: "viewer123" }
          ];
          localStorage.setItem("gpedge_admin_credentials_list", JSON.stringify(defaultCreds));
          credsList = defaultCreds;
        }
        const foundUser = credsList.find((u: any) => u.id === storedId);
        if (foundUser) {
          let permissions: string[] = [];
          if (foundUser.role === "Super Admin" || foundUser.role === "Viewer") {
            permissions = ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing", "audit", "settings", "search", "validation"];
          } else if (foundUser.role === "Admin") {
            permissions = ["dashboard", "questions", "quizzes", "content", "autofill", "users", "notifications", "billing"];
          } else if (foundUser.role === "Moderator") {
            permissions = ["dashboard", "questions", "content"];
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
