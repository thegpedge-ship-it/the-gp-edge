export interface ModuleMaintenanceConfig {
  enabled: boolean;
  customMessage?: string;
}

export interface MaintenanceSettings {
  globalEnabled: boolean;
  globalMessage: string;
  allowAdminBypass: boolean;
  updatedAt?: string;
  modules: {
    mbs_billing?: ModuleMaintenanceConfig;
    medical_directory?: ModuleMaintenanceConfig;
    exam_prep?: ModuleMaintenanceConfig;
    clinical_content?: ModuleMaintenanceConfig;
    user_dashboard?: ModuleMaintenanceConfig;
    subscriptions?: ModuleMaintenanceConfig;
    [key: string]: ModuleMaintenanceConfig | undefined;
  };
}

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  globalEnabled: false,
  globalMessage: "We are performing scheduled platform maintenance. We will be back online shortly!",
  allowAdminBypass: true,
  modules: {
    mbs_billing: { enabled: false, customMessage: "MBS Billing & Fee Search tools are currently undergoing scheduled maintenance." },
    medical_directory: { enabled: false, customMessage: "Medical Reference Library is undergoing database updates and will return shortly." },
    exam_prep: { enabled: false, customMessage: "Exam Prep & Practice Quizzes are temporarily offline for system upgrades." },
    clinical_content: { enabled: false, customMessage: "Clinical Template Editor & Autofills are undergoing routine updates." },
    user_dashboard: { enabled: false, customMessage: "User Portal & Dashboard stats are temporarily undergoing maintenance." },
    subscriptions: { enabled: false, customMessage: "Billing & Payment processing is temporarily paused for maintenance." },
  },
};
