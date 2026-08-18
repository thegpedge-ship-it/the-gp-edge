"use server";

import { queryOne, execute } from "@/lib/db";
import { MaintenanceSettings, DEFAULT_MAINTENANCE_SETTINGS } from "@/lib/maintenance";

export type { MaintenanceSettings, ModuleMaintenanceConfig } from "@/lib/maintenance";

/**
 * Fetch maintenance settings from app_settings PostgreSQL table.
 */
export async function getMaintenanceSettingsAction(): Promise<MaintenanceSettings> {
  try {
    const row = await queryOne<{ value: any }>(
      "SELECT value FROM app_settings WHERE key = $1",
      ["maintenance_settings"]
    );

    if (!row || !row.value) {
      return DEFAULT_MAINTENANCE_SETTINGS;
    }

    const value = typeof row.value === "string" ? JSON.parse(row.value) : row.value;

    return {
      globalEnabled: Boolean(value.globalEnabled),
      globalMessage: value.globalMessage || DEFAULT_MAINTENANCE_SETTINGS.globalMessage,
      allowAdminBypass: value.allowAdminBypass !== undefined ? Boolean(value.allowAdminBypass) : true,
      updatedAt: value.updatedAt,
      modules: {
        ...DEFAULT_MAINTENANCE_SETTINGS.modules,
        ...(value.modules || {}),
      },
    };
  } catch (error) {
    console.error("Failed to load maintenance settings from DB:", error);
    return DEFAULT_MAINTENANCE_SETTINGS;
  }
}

/**
 * Save maintenance settings into app_settings PostgreSQL table.
 */
export async function saveMaintenanceSettingsAction(
  settings: MaintenanceSettings,
  adminUserId?: string
): Promise<{ success: boolean; message?: string; settings?: MaintenanceSettings }> {
  try {
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    const payloadJson = JSON.stringify(payload);

    await execute(
      `INSERT INTO app_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      ["maintenance_settings", payloadJson, adminUserId || null]
    );

    return {
      success: true,
      message: "Maintenance settings updated successfully",
      settings: payload,
    };
  } catch (error: any) {
    console.error("Failed to save maintenance settings:", error);
    return {
      success: false,
      message: error?.message || "Failed to save maintenance settings",
    };
  }
}
