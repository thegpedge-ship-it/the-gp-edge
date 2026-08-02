"use client";

import { useState, useTransition } from "react";
import { GraduationCap, Stethoscope, Loader2, Award, ArrowRight } from "lucide-react";
import { updateCareerStageAction } from "@/actions/role.actions";

interface Props {
  open: boolean;
}

export default function RoleReevaluationModal({ open }: Props) {
  const [pending, startTransition] = useTransition();
  const [selectedStage, setSelectedStage] = useState<"REGISTRAR" | "FELLOW">("FELLOW");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await updateCareerStageAction(selectedStage);
      if (res.success) {
        // Full navigation forces the layout Server Component to re-execute with
        // fresh DB data. router.refresh() alone does not re-run the layout.
        window.location.href = "/dashboard";
      } else if (res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl pointer-events-auto">
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
        
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-[1px] shadow-lg shadow-teal-900/20 mb-5">
            <div className="w-full h-full rounded-[15px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <Award className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">Access Term Completed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your Registrar exam access term has finished. Please select your current career stage to update your dashboard options.
          </p>
        </div>

        {/* Body Options */}
        <div className="px-8 pb-8 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Option A: Post-Registrar / Fellow */}
            <button
              type="button"
              onClick={() => setSelectedStage("FELLOW")}
              className={`group w-full p-5 rounded-[2rem] border text-left transition-all duration-300 flex items-center gap-5 ${
                selectedStage === "FELLOW"
                  ? "border-teal-500/50 bg-teal-50/50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/5"
                  : "border-slate-200 dark:border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 bg-white/50 dark:bg-slate-900/50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  selectedStage === "FELLOW"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-900/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/30"
                }`}
              >
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-base font-bold truncate transition-colors duration-300 ${
                    selectedStage === "FELLOW" ? "text-teal-900 dark:text-teal-100" : "text-slate-900 dark:text-slate-100"
                  }`}>
                    Post-Registrar / Fellow
                  </h3>
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-300">
                    Discount
                  </span>
                </div>
                <p className={`text-xs transition-colors duration-300 ${
                  selectedStage === "FELLOW" ? "text-teal-700/80 dark:text-teal-300/70" : "text-slate-500 dark:text-slate-400"
                }`}>
                  Unlock the $15/month alumni loyalty rate.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                selectedStage === "FELLOW" ? "border-teal-500" : "border-slate-300 dark:border-slate-700"
              }`}>
                {selectedStage === "FELLOW" && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
              </div>
            </button>

            {/* Option B: Still a Registrar */}
            <button
              type="button"
              onClick={() => setSelectedStage("REGISTRAR")}
              className={`group w-full p-5 rounded-[2rem] border text-left transition-all duration-300 flex items-center gap-5 ${
                selectedStage === "REGISTRAR"
                  ? "border-teal-500/50 bg-teal-50/50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/5"
                  : "border-slate-200 dark:border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 bg-white/50 dark:bg-slate-900/50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  selectedStage === "REGISTRAR"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-900/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/30"
                }`}
              >
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold mb-1 truncate transition-colors duration-300 ${
                  selectedStage === "REGISTRAR" ? "text-teal-900 dark:text-teal-100" : "text-slate-900 dark:text-slate-100"
                }`}>
                  Still a Registrar
                </h3>
                <p className={`text-xs transition-colors duration-300 ${
                  selectedStage === "REGISTRAR" ? "text-teal-700/80 dark:text-teal-300/70" : "text-slate-500 dark:text-slate-400"
                }`}>
                  Renew your Exam Package to continue prep.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                selectedStage === "REGISTRAR" ? "border-teal-500" : "border-slate-300 dark:border-slate-700"
              }`}>
                {selectedStage === "REGISTRAR" && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
              </div>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="w-full relative overflow-hidden group inline-flex items-center justify-center gap-2 py-4 px-6 rounded-[2rem] font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-900/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              {pending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating Profile…
                </>
              ) : (
                <>
                  Confirm Career Stage
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
