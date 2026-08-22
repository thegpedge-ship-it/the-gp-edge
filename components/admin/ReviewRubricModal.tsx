"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, ShieldAlert, FileCheck, Save, Send } from "lucide-react";
import {
  ReviewRubric,
  ReviewOutcome,
  REVIEW_OUTCOME_DEFINITIONS,
  validateRubricSubmission,
  submitRubricAction,
  saveDraftRubricAction,
} from "@/actions/review.actions";
import { useAdminRole } from "@/hooks/useAdminRole";

interface ReviewRubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  itemTitle: string;
  initialRubric?: Partial<ReviewRubric>;
  reviewId?: string;
  onSuccess?: () => void;
}

export default function ReviewRubricModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
  initialRubric,
  reviewId,
  onSuccess,
}: ReviewRubricModalProps) {
  const { currentAdmin, isReadOnly, canReviewItem } = useAdminRole();

  const [guidelineName, setGuidelineName] = useState(initialRubric?.guidelineConsulted?.name || "");
  const [guidelineVersion, setGuidelineVersion] = useState(initialRubric?.guidelineConsulted?.version || "");
  const [guidelineDate, setGuidelineDate] = useState(initialRubric?.guidelineConsulted?.date || "");
  const [doseSource, setDoseSource] = useState(initialRubric?.doseVerificationSource || "");
  const [outcome, setOutcome] = useState<ReviewOutcome | "">(initialRubric?.reviewOutcome || "");
  const [redFlagCheck, setRedFlagCheck] = useState(initialRubric?.redFlagCheck || false);
  const [signOffDeclaration, setSignOffDeclaration] = useState(initialRubric?.signOffDeclaration || false);
  const [comments, setComments] = useState(initialRubric?.comments || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRubric: ReviewRubric = {
    guidelineConsulted: {
      name: guidelineName.trim(),
      version: guidelineVersion.trim(),
      date: guidelineDate.trim(),
    },
    doseVerificationSource: doseSource.trim() || undefined,
    reviewOutcome: (outcome as ReviewOutcome) || "no_changes_required",
    redFlagCheck,
    signOffDeclaration,
    comments: comments.trim(),
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) return;
    setIsSavingDraft(true);
    setErrorMessage(null);

    const res = await saveDraftRubricAction({
      reviewId,
      itemId,
      itemType,
      rubric: currentRubric,
      adminUser: {
        id: currentAdmin.id,
        name: currentAdmin.name,
        email: currentAdmin.email,
        role: currentAdmin.role,
        roles: currentAdmin.roles,
        status: currentAdmin.status,
      },
    });

    setIsSavingDraft(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || "Failed to save draft rubric.");
    }
  };

  const handleSubmitFinal = async () => {
    if (isReadOnly) return;
    setErrorMessage(null);

    // Strict validation
    const validation = validateRubricSubmission(currentRubric);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Please complete all required fields before submitting.");
      return;
    }

    if (
      !confirm(
        "Submit final review rubric? Under Rule R13, submitted rubrics are strictly immutable and cannot be edited after submission."
      )
    ) {
      return;
    }

    setIsSubmitting(true);

    const res = await submitRubricAction({
      reviewId,
      itemId,
      itemType,
      rubric: currentRubric,
      adminUser: {
        id: currentAdmin.id,
        name: currentAdmin.name,
        email: currentAdmin.email,
        role: currentAdmin.role,
        roles: currentAdmin.roles,
        status: currentAdmin.status,
      },
    });

    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(res.error || "Failed to submit review rubric.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Peer Review Rubric
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 rounded-full">
                  Matrix 3B Specification
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                Item: <span className="font-semibold text-slate-700 dark:text-slate-300">{itemTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="font-bold">Submission Blocked</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 1. Guideline Consulted */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                1. Guideline Consulted <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={guidelineName}
                    onChange={(e) => setGuidelineName(e.target.value)}
                    placeholder="e.g. eTG / Therapeutic Guidelines"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Guideline Name</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={guidelineVersion}
                    onChange={(e) => setGuidelineVersion(e.target.value)}
                    placeholder="e.g. v16.2 / 2026 Edition"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Version</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={guidelineDate}
                    onChange={(e) => setGuidelineDate(e.target.value)}
                    placeholder="e.g. March 2026"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Date</span>
                </div>
              </div>
            </div>

            {/* 2. Dose Verification Source */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                2. Dose Verification Source <span className="text-slate-400 font-normal">(Where Applicable)</span>
              </label>
              <input
                type="text"
                value={doseSource}
                onChange={(e) => setDoseSource(e.target.value)}
                placeholder="e.g. AMH (Australian Medicines Handbook) 2026 / PBS Online"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>

            {/* 3. Review Outcome (4 Standard Outcomes) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                3. Review Outcome <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {(Object.entries(REVIEW_OUTCOME_DEFINITIONS) as [ReviewOutcome, { label: string; meaning: string; badgeColor: string }][]).map(
                  ([key, def]) => {
                    const isSelected = outcome === key;
                    return (
                      <label
                        key={key}
                        onClick={() => setOutcome(key)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20"
                            : "bg-white/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reviewOutcome"
                          checked={isSelected}
                          onChange={() => setOutcome(key)}
                          className="mt-0.5 text-teal-600 focus:ring-teal-500/30"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {def.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {def.meaning}
                          </p>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>
            </div>

            {/* 4. Verification Checkboxes */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redFlagCheck}
                  onChange={(e) => setRedFlagCheck(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <span className="font-bold">Red-Flag Check:</span> I verify that all critical red flags, contraindications, and emergency referral pathways are clinically accurate. <span className="text-rose-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signOffDeclaration}
                  onChange={(e) => setSignOffDeclaration(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <span className="font-bold">Sign-Off Declaration:</span> I confirm that I have reviewed this content independently in accordance with clinical guidelines and have no conflict of interest (Rule R1). <span className="text-rose-500">*</span>
                </span>
              </label>
            </div>

            {/* 5. Clinical Commentary */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                4. Clinical Review Comments <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide detailed clinical comments or revision notes..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              <span>Rule R13: Submitted rubrics are strictly immutable.</span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSubmitting || isReadOnly}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDraft ? "Saving..." : "Save Draft Rubric"}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={isSavingDraft || isSubmitting || isReadOnly}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Review Rubric"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
