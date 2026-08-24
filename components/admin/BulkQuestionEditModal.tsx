"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import { applyBulkQuestionEditAction, BulkQuestionChanges } from "@/actions/question.actions";
import { PermissionUser } from "@/lib/relationalPermissions";

export default function BulkQuestionEditModal({ ids, adminUser, onClose, onApplied }: {
  ids: string[];
  adminUser?: PermissionUser;
  onClose: () => void;
  onApplied: (count: number) => void;
}) {
  const [applyStatus, setApplyStatus] = useState(false);
  const [status, setStatus] = useState("draft");
  const [applyDepthTier, setApplyDepthTier] = useState(false);
  const [depthTier, setDepthTier] = useState("Core");
  const [applyTaskType, setApplyTaskType] = useState(false);
  const [taskType, setTaskType] = useState("");
  const [applyVolatilityTier, setApplyVolatilityTier] = useState(false);
  const [volatilityTier, setVolatilityTier] = useState("Standard");
  const [applyKnowledgeBank, setApplyKnowledgeBank] = useState(false);
  const [knowledgeBank, setKnowledgeBank] = useState("");
  const [applyPearl, setApplyPearl] = useState(false);
  const [pearl, setPearl] = useState("");
  const [addConcepts, setAddConcepts] = useState("");
  const [removeConcepts, setRemoveConcepts] = useState("");

  // Remaining Zone 4 metadata fields
  const [applyPatientContext, setApplyPatientContext] = useState(false);
  const [ageBand, setAgeBand] = useState("");
  const [sex, setSex] = useState("");
  const [pregnancyStatus, setPregnancyStatus] = useState("");
  const [setting, setSetting] = useState("");
  const [atsiStatus, setAtsiStatus] = useState("");
  const [applyKeyDrugs, setApplyKeyDrugs] = useState(false);
  const [keyDrugs, setKeyDrugs] = useState("");
  const [applyWikiPageId, setApplyWikiPageId] = useState(false);
  const [wikiPageId, setWikiPageId] = useState("");
  const [applyWikiVersion, setApplyWikiVersion] = useState(false);
  const [wikiVersion, setWikiVersion] = useState("");
  const [applySupplementalSources, setApplySupplementalSources] = useState(false);
  const [supplementalSources, setSupplementalSources] = useState("");
  const [applyKeyRestsOnSupplemental, setApplyKeyRestsOnSupplemental] = useState(false);
  const [keyRestsOnSupplemental, setKeyRestsOnSupplemental] = useState(false);
  const [applyTestablePoint, setApplyTestablePoint] = useState(false);
  const [testablePoint, setTestablePoint] = useState("");
  const [applyExpectedPassRate, setApplyExpectedPassRate] = useState(false);
  const [expectedPassRate, setExpectedPassRate] = useState("");
  const [applySourceRef, setApplySourceRef] = useState(false);
  const [sourceDocId, setSourceDocId] = useState("");
  const [sourceEdition, setSourceEdition] = useState("");
  const [sourceLocator, setSourceLocator] = useState("");
  const [sourceTier, setSourceTier] = useState("");
  const [sourceClaimType, setSourceClaimType] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const changeCount = [
    applyStatus, applyDepthTier, applyTaskType, applyVolatilityTier, applyKnowledgeBank, applyPearl,
    !!addConcepts.trim(), !!removeConcepts.trim(), applyPatientContext, applyKeyDrugs, applyWikiPageId,
    applyWikiVersion, applySupplementalSources, applyKeyRestsOnSupplemental, applyTestablePoint,
    applyExpectedPassRate, applySourceRef,
  ].filter(Boolean).length;

  const handleApply = async () => {
    if (changeCount === 0) return;
    if (!confirm(`Apply ${changeCount} change(s) to ${ids.length} question(s)? This writes directly to the database and is logged per-item.`)) return;

    setSubmitting(true);
    const changes: BulkQuestionChanges = {};
    if (applyStatus) changes.status = status;
    if (applyDepthTier) changes.depthTier = depthTier;
    if (applyTaskType) changes.taskType = taskType;
    if (applyVolatilityTier) changes.volatilityTier = volatilityTier;
    if (applyKnowledgeBank) changes.knowledgeBank = knowledgeBank;
    if (applyPearl) changes.pearl = pearl;
    if (addConcepts.trim()) changes.addClinicalConcepts = addConcepts.split(",").map((s) => s.trim()).filter(Boolean);
    if (removeConcepts.trim()) changes.removeClinicalConcepts = removeConcepts.split(",").map((s) => s.trim()).filter(Boolean);
    if (applyPatientContext) changes.patientContext = { ageBand: ageBand || undefined, sex: sex || undefined, pregnancyStatus: pregnancyStatus || undefined, setting: setting || undefined, atsiStatus: atsiStatus || undefined };
    if (applyKeyDrugs) changes.keyDrugsMentioned = keyDrugs.split(",").map((s) => s.trim()).filter(Boolean);
    if (applyWikiPageId) changes.wikiPageId = wikiPageId;
    if (applyWikiVersion) changes.wikiVersion = wikiVersion;
    if (applySupplementalSources) changes.supplementalSourcesUsed = supplementalSources.split(",").map((s) => s.trim()).filter(Boolean);
    if (applyKeyRestsOnSupplemental) changes.keyRestsOnSupplemental = keyRestsOnSupplemental;
    if (applyTestablePoint) changes.testablePoint = testablePoint;
    if (applyExpectedPassRate) changes.expectedPassRate = Number(expectedPassRate) || 0;
    if (applySourceRef && sourceDocId.trim()) changes.addSourceRef = { docId: sourceDocId.trim(), edition: sourceEdition || undefined, locator: sourceLocator || undefined, tier: sourceTier || undefined, claimType: sourceClaimType || undefined };

    const res = await applyBulkQuestionEditAction(ids, changes, adminUser);
    setSubmitting(false);
    if (res.success) {
      onApplied(res.count || ids.length);
    } else {
      alert(res.error || "Bulk edit failed.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[90]" onClick={onClose} />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="fixed inset-x-4 top-[5%] mx-auto max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[95] shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bulk Edit — {ids.length} Question(s)</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
            Only checked fields are changed. Content fields (stem, options, keyed answer) are deliberately not bulk-editable — those stay single-item only.
          </p>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">Classification & Publishing</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyStatus} onChange={(e) => setApplyStatus(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Status</span>
              <CustomSelect value={status} onChange={setStatus} options={[{ value: "draft", label: "Draft" }, { value: "review", label: "Review" }, { value: "published", label: "Published" }]} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyDepthTier} onChange={(e) => setApplyDepthTier(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Depth Tier</span>
              <CustomSelect value={depthTier} onChange={setDepthTier} options={[{ value: "Core", label: "Core" }, { value: "Working", label: "Working" }, { value: "Awareness", label: "Awareness" }]} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyTaskType} onChange={(e) => setApplyTaskType(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Task Type</span>
              <input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="e.g. management" className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyVolatilityTier} onChange={(e) => setApplyVolatilityTier(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Volatility</span>
              <CustomSelect value={volatilityTier} onChange={setVolatilityTier} options={[{ value: "Volatile", label: "Volatile" }, { value: "Standard", label: "Standard" }, { value: "Stable", label: "Stable" }]} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyExpectedPassRate} onChange={(e) => setApplyExpectedPassRate(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Expected Pass Rate %</span>
              <input type="number" min={0} max={100} value={expectedPassRate} onChange={(e) => setExpectedPassRate(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2">Explanation</p>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={applyKnowledgeBank} onChange={(e) => setApplyKnowledgeBank(e.target.checked)} className="mt-1.5" />
              <span className="text-xs font-semibold w-32 mt-1.5">Knowledge Bank</span>
              <textarea value={knowledgeBank} onChange={(e) => setKnowledgeBank(e.target.value)} rows={2} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={applyPearl} onChange={(e) => setApplyPearl(e.target.checked)} className="mt-1.5" />
              <span className="text-xs font-semibold w-32 mt-1.5">Pearl</span>
              <textarea value={pearl} onChange={(e) => setPearl(e.target.value)} rows={2} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold w-32">+ Clinical Concepts</span>
              <input value={addConcepts} onChange={(e) => setAddConcepts(e.target.value)} placeholder="comma-separated" className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold w-32">− Clinical Concepts</span>
              <input value={removeConcepts} onChange={(e) => setRemoveConcepts(e.target.value)} placeholder="comma-separated" className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2">Patient Context</p>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={applyPatientContext} onChange={(e) => setApplyPatientContext(e.target.checked)} className="mt-2" />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <input value={ageBand} onChange={(e) => setAgeBand(e.target.value)} placeholder="Age band" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={sex} onChange={(e) => setSex(e.target.value)} placeholder="Sex" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={pregnancyStatus} onChange={(e) => setPregnancyStatus(e.target.value)} placeholder="Pregnancy" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="Setting" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={atsiStatus} onChange={(e) => setAtsiStatus(e.target.value)} placeholder="ATSI status" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyKeyDrugs} onChange={(e) => setApplyKeyDrugs(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Key Drugs Mentioned</span>
              <input value={keyDrugs} onChange={(e) => setKeyDrugs(e.target.value)} placeholder="comma-separated, generic names" className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2">Provenance & Currency</p>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={applySourceRef} onChange={(e) => setApplySourceRef(e.target.checked)} className="mt-2" />
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a source reference (appended, existing sources kept)</p>
                <div className="grid grid-cols-5 gap-1.5">
                  <input value={sourceDocId} onChange={(e) => setSourceDocId(e.target.value)} placeholder="Document" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <input value={sourceEdition} onChange={(e) => setSourceEdition(e.target.value)} placeholder="Edition" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <input value={sourceLocator} onChange={(e) => setSourceLocator(e.target.value)} placeholder="Locator" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <input value={sourceTier} onChange={(e) => setSourceTier(e.target.value)} placeholder="Tier" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <input value={sourceClaimType} onChange={(e) => setSourceClaimType(e.target.value)} placeholder="Backs up" className="px-2.5 py-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyWikiPageId} onChange={(e) => setApplyWikiPageId(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Wiki Page ID</span>
              <input value={wikiPageId} onChange={(e) => setWikiPageId(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyWikiVersion} onChange={(e) => setApplyWikiVersion(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Wiki Version</span>
              <input value={wikiVersion} onChange={(e) => setWikiVersion(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applySupplementalSources} onChange={(e) => setApplySupplementalSources(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Supplemental Sources</span>
              <input value={supplementalSources} onChange={(e) => setSupplementalSources(e.target.value)} placeholder="comma-separated" className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={applyKeyRestsOnSupplemental} onChange={(e) => setApplyKeyRestsOnSupplemental(e.target.checked)} />
              <span className="text-xs font-semibold w-32">Rests on Supplemental</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={keyRestsOnSupplemental} onChange={(e) => setKeyRestsOnSupplemental(e.target.checked)} disabled={!applyKeyRestsOnSupplemental} />
                Yes
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={applyTestablePoint} onChange={(e) => setApplyTestablePoint(e.target.checked)} className="mt-1.5" />
              <span className="text-xs font-semibold w-32 mt-1.5">Testable Point</span>
              <textarea value={testablePoint} onChange={(e) => setTestablePoint(e.target.value)} rows={2} className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-900 pt-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
            <button
              onClick={handleApply}
              disabled={changeCount === 0 || submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
            >
              {submitting ? "Applying…" : `Apply ${changeCount} change(s) to ${ids.length} question(s)`}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
