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

let cachedSettings: MaintenanceSettings | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds in-memory client cache

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MaintenanceSettings>(
    cachedSettings || DEFAULT_MAINTENANCE_SETTINGS
  );
  const [loading, setLoading] = useState(cachedSettings == null);

  const refreshMaintenance = useCallback(async (force = false) => {
    // If not forced and cache is younger than 60s, reuse cached settings without network request
    if (!force && cachedSettings && Date.now() - lastFetchTimestamp < CACHE_TTL_MS) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/settings/maintenance", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.settings) {
          const sanitized = sanitizeSettings(json.settings);
          cachedSettings = sanitized;
          lastFetchTimestamp = Date.now();
          setSettings(sanitized);
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
    const sanitized = sanitizeSettings(newSettings);
    cachedSettings = sanitized;
    lastFetchTimestamp = Date.now();
    setSettings(sanitized);
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

  const contextValue = React.useMemo<MaintenanceContextType>(
    () => ({
      settings: activeSettings,
      loading,
      isGlobalMaintenance,
      isModuleInMaintenance,
      getModuleMessage,
      refreshMaintenance: () => refreshMaintenance(true),
      updateSettingsLocally,
    }),
    [
      activeSettings,
      loading,
      isGlobalMaintenance,
      isModuleInMaintenance,
      getModuleMessage,
      refreshMaintenance,
      updateSettingsLocally,
    ]
  );

  return (
    <MaintenanceContext.Provider value={contextValue}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}
