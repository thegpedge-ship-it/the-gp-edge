/**
 * Shared types/constants for the custom (configurable) admin roles feature. Kept out of
 * actions/customRoles.actions.ts because a "use server" file may only export async functions —
 * plain constants and types have to live in a regular module.
 */

/**
 * Resources a custom role's permissions matrix can grant Read / Edit access to.
 * Mirrors ALL_FEATURES in app/admin/audit/page.tsx so both the flat per-admin
 * feature-access list and the new matrix speak the same resource vocabulary.
 */
export const CUSTOM_ROLE_RESOURCES = [
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
] as const;

export type CustomRoleResource = (typeof CUSTOM_ROLE_RESOURCES)[number];

export type PermissionMatrix = Record<CustomRoleResource, { read: boolean; edit: boolean }>;

export interface CustomRole {
  id: number;
  code: string;
  name: string;
  description: string;
  canViewPii: boolean;
  matrix: PermissionMatrix;
  assignedCount: number;
}

export function emptyCustomRoleMatrix(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const r of CUSTOM_ROLE_RESOURCES) matrix[r] = { read: false, edit: false };
  return matrix;
}
