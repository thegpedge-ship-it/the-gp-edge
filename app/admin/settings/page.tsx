"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  getMaintenanceSettingsAction,
  saveMaintenanceSettingsAction,
} from "@/actions/settings.actions";
import { MaintenanceSettings, DEFAULT_MAINTENANCE_SETTINGS } from "@/lib/maintenance";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calculator,
  BookOpen,
  HelpCircle,
  FileText,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const featureFlags = [
  { name: "Dark Mode", desc: "System-wide dark mode support across all pages", enabled: true, tag: "Stable" },
  { name: "PDF Export", desc: "Export clinical templates and content as print-ready PDFs", enabled: true, tag: "Stable" },
  { name: "Document Import (AI Extract)", desc: "Extract question and template data from uploaded PDF/DOCX files", enabled: true, tag: "Beta" },
  { name: "New Quiz Interface", desc: "Redesigned quiz-taking experience with improved navigation", enabled: false, tag: "Alpha" },
  { name: "Flowchart Builder", desc: "Visual flowchart editor inside the template content editor", enabled: true, tag: "Beta" },
  { name: "Offline Mode", desc: "Allow content downloads for offline access on supported devices", enabled: false, tag: "Planned" },
];

const scheduledJobs: { name: string; schedule: string; lastRun: string; nextRun: string; status: "active" | "suspended" }[] = [
  { name: "Daily Analytics Aggregation", schedule: "Every day at 2:00 AM", lastRun: "28 May 2026, 2:00 AM", nextRun: "29 May 2026, 2:00 AM", status: "active" as const },
  { name: "Weekly Billing Summary Email", schedule: "Every Monday at 9:00 AM", lastRun: "26 May 2026, 9:00 AM", nextRun: "2 Jun 2026, 9:00 AM", status: "active" as const },
  { name: "Subscription Expiry Checker", schedule: "Every 6 hours", lastRun: "28 May 2026, 6:00 PM", nextRun: "29 May 2026, 12:00 AM", status: "active" as const },
  { name: "Content Expiry & Review Check", schedule: "Every day at 8:00 AM", lastRun: "28 May 2026, 8:00 AM", nextRun: "29 May 2026, 8:00 AM", status: "active" as const },
  { name: "Search Index Rebuild", schedule: "Every 12 hours", lastRun: "28 May 2026, 10:00 PM", nextRun: "29 May 2026, 10:00 AM", status: "active" as const },
  { name: "Database Backup", schedule: "Every day at 3:00 AM", lastRun: "28 May 2026, 3:00 AM", nextRun: "29 May 2026, 3:00 AM", status: "active" as const },
  { name: "Failed Payment Retry", schedule: "Every day at 7:00 AM", lastRun: "28 May 2026, 7:00 AM", nextRun: "29 May 2026, 7:00 AM", status: "active" as const },
];

const tagColors: Record<string, string> = {
  Beta: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50",
  Alpha: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50",
  Stable: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  Experimental: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Planned: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  routeBadges: string[];
  gradient: string;
  defaultMsg: string;
}

const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    id: "mbs_billing",
    name: "MBS Billing",
    description: "MBS item code lookup, fee calculator, billing guidelines and claim rules",
    icon: Calculator,
    routeBadges: ["/admin/mbs", "/dashboard/billing"],
    gradient: "from-emerald-500 to-teal-600",
    defaultMsg: "MBS Billing & Fee Search tools are currently undergoing scheduled maintenance.",
  },
  {
    id: "medical_directory",
    name: "Medical Directory",
    description: "Clinical guidelines library, condition reference index, and evidence database",
    icon: BookOpen,
    routeBadges: ["/dashboard/medical-library"],
    gradient: "from-teal-500 to-cyan-600",
    defaultMsg: "Medical Reference Library is undergoing database updates and will return shortly.",
  },
  {
    id: "exam_prep",
    name: "Exam Prep & Quizzes",
    description: "Practice exam engine, mock test simulator, and question bank tools",
    icon: HelpCircle,
    routeBadges: ["/exam-prep", "/admin/quizzes"],
    gradient: "from-indigo-500 to-blue-600",
    defaultMsg: "Exam Prep & Practice Quizzes are temporarily offline for system upgrades.",
  },
  {
    id: "clinical_content",
    name: "Clinical Templates",
    description: "Autofill template versions, SOAP notes editor, and clinical approach algorithms",
    icon: FileText,
    routeBadges: ["/admin/content", "/admin/approaches", "/admin/autofill"],
    gradient: "from-violet-500 to-purple-600",
    defaultMsg: "Clinical Template Editor & Autofills are undergoing routine updates.",
  },
  {
    id: "user_dashboard",
    name: "User Dashboard",
    description: "Student & doctor main dashboard portal, analytics stats, and study plans",
    icon: LayoutDashboard,
    routeBadges: ["/dashboard"],
    gradient: "from-sky-500 to-blue-600",
    defaultMsg: "User Portal & Dashboard stats are temporarily undergoing maintenance.",
  },
  {
    id: "subscriptions",
    name: "Subscriptions & Billing",
    description: "Stripe payment processing, tier upgrades, invoice generator, and checkout",
    icon: CreditCard,
    routeBadges: ["/pricing", "/billing"],
    gradient: "from-rose-500 to-pink-600",
    defaultMsg: "Billing & Payment processing is temporarily paused for maintenance.",
  },
];

export default function SettingsPage() {
  const { isReadOnly } = useAdminRole();
  const { refreshMaintenance, updateSettingsLocally } = useMaintenanceMode();

  const [flags, setFlags] = useState(featureFlags);
  const [jobs, setJobs] = useState(scheduledJobs);

  // Maintenance state
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [expandedMessageModule, setExpandedMessageModule] = useState<string | null>(null);

  // Fetch initial settings from DB
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getMaintenanceSettingsAction();
        setMaintenance(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  // Auto-save helper — called after every toggle or preset change
  const autoSave = async (updated: MaintenanceSettings) => {
    if (isReadOnly) return;
    setAutoSaveState("saving");
    const res = await saveMaintenanceSettingsAction(updated);
    if (res.success && res.settings) {
      setMaintenance(res.settings);
      updateSettingsLocally(res.settings);
      refreshMaintenance();
      setAutoSaveState("saved");
      setTimeout(() => setAutoSaveState("idle"), 2000);
    } else {
      setAutoSaveState("idle");
    }
  };

  const toggleGlobalMaintenance = () => {
    if (isReadOnly) return;
    const updated = { ...maintenance, globalEnabled: !maintenance.globalEnabled };
    setMaintenance(updated);
    autoSave(updated);
  };

  const toggleModuleMaintenance = (moduleId: string) => {
    if (isReadOnly) return;
    const currentMod = maintenance.modules?.[moduleId] || { enabled: false, customMessage: "" };
    const updated = {
      ...maintenance,
      modules: {
        ...maintenance.modules,
        [moduleId]: { ...currentMod, enabled: !currentMod.enabled },
      },
    };
    setMaintenance(updated);
    autoSave(updated);
  };

  const updateModuleMessage = (moduleId: string, msg: string) => {
    if (isReadOnly) return;
    const currentMod = maintenance.modules?.[moduleId] || { enabled: false, customMessage: "" };
    const updated = {
      ...maintenance,
      modules: {
        ...maintenance.modules,
        [moduleId]: { ...currentMod, customMessage: msg },
      },
    };
    setMaintenance(updated);
    // Don't auto-save on every keystroke — only on blur
  };

  const saveModuleMessage = (moduleId: string) => {
    autoSave(maintenance);
  };

  // Preset Shortcuts
  const applyPreset = (preset: "all" | "none") => {
    if (isReadOnly) return;
    const updatedModules = { ...maintenance.modules };
    SYSTEM_MODULES.forEach((mod) => {
      updatedModules[mod.id] = {
        ...(updatedModules[mod.id] || { customMessage: mod.defaultMsg }),
        enabled: preset === "all",
      };
    });
    const updated = { ...maintenance, modules: updatedModules };
    setMaintenance(updated);
    autoSave(updated);
  };

  const toggleFlag = (index: number) => {
    if (isReadOnly) return;
    setFlags((prev) => prev.map((f, i) => (i === index ? { ...f, enabled: !f.enabled } : f)));
  };

  const toggleJob = (index: number) => {
    if (isReadOnly) return;
    setJobs((prev) => prev.map((j, i) => (i === index ? { ...j, status: j.status === "active" ? ("suspended" as const) : ("active" as const) } : j)));
  };

  const activeModuleCount = Object.values(maintenance.modules || {}).filter((m) => m?.enabled).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="System"
        highlightedText="Settings"
        subtitle="Custom selective maintenance mode, feature flags, and platform operations"
        variants={itemVariants}
      />

      {isReadOnly && (
        <motion.div
          variants={itemVariants}
          className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs text-blue-850 dark:text-blue-300 leading-relaxed items-center shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">View-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              You are signed in under the <strong>Viewer</strong> role. You have full read-only access to all sections and data, but toggling maintenance mode, feature flags, or scheduled jobs is restricted.
            </p>
          </div>
        </motion.div>
      )}

      {/* --- MAINTENANCE MODE CONTROLLER CARD --- */}
      <motion.div
        variants={itemVariants}
        className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border p-6 sm:p-8 shadow-xl transition-all relative overflow-hidden ${
          maintenance.globalEnabled || activeModuleCount > 0
            ? "border-amber-300/80 dark:border-amber-900/70 shadow-amber-500/5"
            : "border-slate-100/80 dark:border-slate-800/80 shadow-slate-200/20 dark:shadow-slate-950/40"
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/5 via-teal-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                  maintenance.globalEnabled
                    ? "bg-amber-500 text-white shadow-amber-500/20"
                    : activeModuleCount > 0
                    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Maintenance Mode Controller</h3>
                  {maintenance.globalEnabled ? (
                    <StatusBadge variant="warning" label="Global Maintenance Active" />
                  ) : activeModuleCount > 0 ? (
                    <StatusBadge variant="warning" label={`${activeModuleCount} Modules Offline`} />
                  ) : (
                    <StatusBadge variant="success" label="All Systems Operational" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage master system availability or apply selective maintenance to specific features like MBS Billing and Medical Directory.
                </p>
              </div>
            </div>

            {/* Auto-save indicator */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {autoSaveState === "saving" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {autoSaveState === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              {autoSaveState === "idle" && maintenance.updatedAt && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline">
                  Last updated: {new Date(maintenance.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {/* Master Global Switch */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Global Platform Maintenance</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                When enabled, the entire user-facing application is placed offline. Admin users retain access via warning banners.
              </p>
            </div>

            <button
              onClick={toggleGlobalMaintenance}
              disabled={isReadOnly}
              className={`relative w-[54px] h-[32px] rounded-full transition-colors duration-200 shrink-0 ${
                maintenance.globalEnabled ? "bg-amber-500" : "bg-[#e9e9eb] dark:bg-slate-800"
              } ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <motion.div
                animate={{ x: maintenance.globalEnabled ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-[2px] w-[28px] h-[28px] rounded-full bg-white dark:bg-slate-900 shadow-md"
              />
            </button>
          </div>

          {/* Global Message Textarea */}
          <AnimatePresence>
            {maintenance.globalEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Global Maintenance Message
                </label>
                <textarea
                  value={maintenance.globalMessage}
                  disabled={isReadOnly}
                  onChange={(e) => !isReadOnly && setMaintenance((p) => ({ ...p, globalMessage: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 text-xs bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:text-slate-100 resize-none"
                  placeholder="Enter custom global maintenance message shown to users..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- FEATURE SELECTION --- */}
          <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Feature Selection
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selectively place individual services under maintenance while keeping the rest of the application active.
                </p>
              </div>

              {/* Select All / Clear All */}
              <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  disabled={isReadOnly}
                  className="text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors px-1"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600 text-sm">·</span>
                <button
                  type="button"
                  onClick={() => applyPreset("none")}
                  disabled={isReadOnly}
                  className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-1"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkbox Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SYSTEM_MODULES.map((mod) => {
                const modConfig = maintenance.modules?.[mod.id] || { enabled: false, customMessage: "" };
                const isModEnabled = Boolean(modConfig.enabled);
                const isExpanded = expandedMessageModule === mod.id;

                return (
                  <div key={mod.id} className="space-y-0">
                    <button
                      type="button"
                      onClick={() => !isReadOnly && toggleModuleMaintenance(mod.id)}
                      disabled={isReadOnly}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 group ${
                        isModEnabled
                          ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-400 dark:border-teal-700 shadow-sm"
                          : "bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      } ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {/* Checkbox */}
                      <span
                        className={`w-5 h-5 mt-0.5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${
                          isModEnabled
                            ? "bg-teal-500 border-teal-500"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-teal-400"
                        }`}
                      >
                        {isModEnabled && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${isModEnabled ? "text-teal-800 dark:text-teal-200" : "text-slate-800 dark:text-slate-200"}`}>
                          {mod.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {mod.description}
                        </p>
                      </div>
                    </button>

                    {/* Custom message — shown when module is enabled */}
                    <AnimatePresence>
                      {isModEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1.5 px-1">
                            <button
                              type="button"
                              onClick={() => setExpandedMessageModule(isExpanded ? null : mod.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {modConfig.customMessage ? "Edit maintenance message" : "Set maintenance message"}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <textarea
                                    value={modConfig.customMessage || ""}
                                    onChange={(e) => updateModuleMessage(mod.id, e.target.value)}
                                    onBlur={() => saveModuleMessage(mod.id)}
                                    disabled={isReadOnly}
                                    rows={2}
                                    placeholder={`Default: "${mod.defaultMsg}"`}
                                    className="w-full px-3 py-2 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none dark:text-slate-100"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- FEATURE FLAGS TABLE --- */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Feature Flags</h3></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {flags.map((flag, i) => (
              <div key={flag.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{flag.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColors[flag.tag]}`}>{flag.tag}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{flag.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => !isReadOnly && toggleFlag(i)} 
                  disabled={isReadOnly}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${flag.enabled ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-950/60"} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <motion.div
                    animate={{ x: flag.enabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
                      flag.enabled ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* --- UPLOAD MONITORING --- */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 p-6 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Upload Monitoring</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Storage Used</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">2.4 GB</p>
              <p className="text-xs text-slate-400">of 10 GB</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Files Uploaded</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">847</p>
              <p className="text-xs text-slate-400">this month</p>
            </div>
            <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Largest File</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">45 MB</p>
              <p className="text-xs text-slate-400">medical_library.pdf</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: "24%" }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">24% of storage used</p>
        </div>
      </motion.div>

      {/* --- SCHEDULED JOBS --- */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-md shadow-slate-200/30 dark:shadow-slate-950/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-transparent via-transparent to-teal-50/5 dark:to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="px-6 py-4 border-b border-slate-200/40 dark:border-slate-800/60"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Scheduled Jobs</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-200/40 dark:border-slate-800/60">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Job</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Schedule</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Last Run</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Next Run</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Toggle</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {jobs.map((job, i) => (
                  <tr key={job.name} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{job.name}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.schedule}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.lastRun}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{job.nextRun}</td>
                    <td className="px-4 py-4"><StatusBadge variant={job.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => !isReadOnly && toggleJob(i)} 
                        disabled={isReadOnly}
                        className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${job.status === "active" ? "bg-[#34C759]" : "bg-[#e9e9eb] dark:bg-slate-955/60"} ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <motion.div
                          animate={{ x: job.status === "active" ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] transition-colors duration-200 ${
                            job.status === "active" ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-800"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
