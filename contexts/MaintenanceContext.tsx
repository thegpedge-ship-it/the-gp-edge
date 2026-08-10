"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { MaintenanceSettings, DEFAULT_MAINTENANCE_SETTINGS } from "@/lib/maintenance";

interface MaintenanceContextType {
  settings: MaintenanceSettings;
  loading: boolean;
  isGlobalMaintenance: boolean;
  isModuleInMaintenance: (moduleId: string) => boolean;
  getModuleMessage: (moduleId: string) => string;
  refreshMaintenance: () => Promise<void>;
  updateSettingsLocally: (newSettings: MaintenanceSettings) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  settings: DEFAULT_MAINTENANCE_SETTINGS,
  loading: true,
  isGlobalMaintenance: false,
  isModuleInMaintenance: () => false,
  getModuleMessage: () => "",
  refreshMaintenance: async () => {},
  updateSettingsLocally: () => {},
});

function sanitizeSettings(data: any): MaintenanceSettings {
  if (!data || typeof data !== "object") {
    return DEFAULT_MAINTENANCE_SETTINGS;
  }
  return {
    globalEnabled: Boolean(data.globalEnabled),
    globalMessage: data.globalMessage || DEFAULT_MAINTENANCE_SETTINGS.globalMessage,
    allowAdminBypass: data.allowAdminBypass !== undefined ? Boolean(data.allowAdminBypass) : true,
    updatedAt: data.updatedAt,
    modules: {
      ...DEFAULT_MAINTENANCE_SETTINGS.modules,
      ...(data.modules || {}),
    },
  };
}

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshMaintenance = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/maintenance", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.settings) {
          setSettings(sanitizeSettings(json.settings));
        }
      }
    } catch (err) {
      console.error("Failed to load maintenance settings in context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMaintenance();
  }, [refreshMaintenance]);

  const updateSettingsLocally = useCallback((newSettings: MaintenanceSettings) => {
    setSettings(sanitizeSettings(newSettings));
  }, []);

  const activeSettings = settings || DEFAULT_MAINTENANCE_SETTINGS;
  const isGlobalMaintenance = Boolean(activeSettings.globalEnabled);

  const isModuleInMaintenance = useCallback((moduleId: string): boolean => {
    if (activeSettings.globalEnabled) return true;
    const mod = activeSettings.modules?.[moduleId];
    return Boolean(mod?.enabled);
  }, [activeSettings]);

  const getModuleMessage = useCallback((moduleId: string): string => {
    const mod = activeSettings.modules?.[moduleId];
    if (mod?.customMessage && mod.customMessage.trim() !== "") {
      return mod.customMessage;
    }
    return activeSettings.globalMessage || DEFAULT_MAINTENANCE_SETTINGS.globalMessage;
  }, [activeSettings]);

  return (
    <MaintenanceContext.Provider
      value={{
        settings: activeSettings,
        loading,
        isGlobalMaintenance,
        isModuleInMaintenance,
        getModuleMessage,
        refreshMaintenance,
        updateSettingsLocally,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}
