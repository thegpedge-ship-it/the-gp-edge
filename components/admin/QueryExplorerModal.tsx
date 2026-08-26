"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, PlayCircle } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import { previewBulkQuestionEditAction, BulkQuestionFilters } from "@/actions/question.actions";
import {
  findNeverReviewedLiveItemsAction,
  findOverdueForReviewAction,
  findAnswerChangedAfterSignoffAction,
  getCoverageVsQuotaAction,
  getProofingQueueStatsAction,
  findPerformanceOutlierQuestionsAction,
  findWeakDistractorsAction,
  findSimilarTestablePointsAction,
  getMostFlaggedQuestionsAction,
  searchAllItemsAction,
  findStalledInPipelineAction,
  findSelfReviewedItemsAction,
  findReviewedNotSignedOffAction,
  getTopicGrowthTrendAction,
  findStaleSourcedItemsAction,
} from "@/actions/queryExplorer.actions";
import { PermissionUser } from "@/lib/relationalPermissions";

interface ResultRow {
  id?: string;
  uqid?: string | null;
  title: string;
  subtitle?: string;
  chips?: string[];
}

type Preset =
  | "filter" | "neverReviewed" | "overdueReview" | "answerChangedAfterSignoff"
  | "coverage" | "proofing" | "lowPerformers" | "highPerformers"
  | "weakDistractors" | "similarTestablePoints" | "mostFlagged" | "keywordAll"
  | "stalledInPipeline" | "selfReviewed" | "reviewedNotSignedOff" | "topicGrowth" | "staleSourced";

const PRESETS: { key: Preset; label: string; hint: string }[] = [
  { key: "filter", label: "Custom Filter / Recall", hint: "By batchId, writtenBy, dates, topic, bank, etc." },
  { key: "neverReviewed", label: "Never Reviewed (Live)", hint: "Published items with zero reviews" },
  { key: "overdueReview", label: "Overdue for Review", hint: "Sorted Volatile first" },
  { key: "answerChangedAfterSignoff", label: "Answer Changed After Sign-off", hint: "Integrity check" },
  { key: "coverage", label: "Coverage vs Quota", hint: "Under/over-served topics by depth tier" },
  { key: "proofing", label: "Proofing Queue & Throughput", hint: "Queue length + per-reviewer weekly pace" },
  { key: "lowPerformers", label: "Nobody Gets This Right", hint: "AKT/KFP — low actualCorrectRate" },
  { key: "highPerformers", label: "Everybody Gets This Right", hint: "AKT/KFP — high actualCorrectRate" },
  { key: "weakDistractors", label: "Weak / Unpicked Distractor", hint: "Main KFP quality signal" },
  { key: "similarTestablePoints", label: "Possible Duplicates", hint: "testablePoint overlap within a topic" },
  { key: "mostFlagged", label: "Most Flagged Items", hint: "From live quiz \"Report an Issue\" — repeat vs. distinct reporters" },
  { key: "keywordAll", label: "Keyword — All Item Types", hint: "Questions + Library + Note Templates" },
  { key: "stalledInPipeline", label: "Stalled in Draft/Review", hint: "Untouched longer than N days" },
  { key: "selfReviewed", label: "Self-Reviewed Items", hint: "Same admin authored & reviewed/signed off" },
  { key: "reviewedNotSignedOff", label: "Reviewed, Not Signed Off", hint: "Blocking publish" },
  { key: "topicGrowth", label: "Topic Growth Trend", hint: "Last 30 days vs. prior 30 days, per topic" },
  { key: "staleSourced", label: "Stale Sourced Items", hint: "Cites a source and is overdue for review" },
];

export default function QueryExplorerModal({ adminUser, onClose, onOpenBulkEdit }: {
  adminUser?: PermissionUser;
  onClose: () => void;
  onOpenBulkEdit: (ids: string[]) => void;
}) {
  const [preset, setPreset] = useState<Preset>("filter");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extraNote, setExtraNote] = useState<string>("");

  // Filter form state
  const [examType, setExamType] = useState("");
  const [batchId, setBatchId] = useState("");
  const [topicCode, setTopicCode] = useState("");
  const [taskType, setTaskType] = useState("");
  const [depthTier, setDepthTier] = useState("");
  const [volatilityTier, setVolatilityTier] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState("30");
  const [minAttempts, setMinAttempts] = useState("20");
  const [stalledStatus, setStalledStatus] = useState<"draft" | "review">("draft");
  const [stalledMaxDays, setStalledMaxDays] = useState("14");

  const runPreset = async () => {
    setLoading(true);
    setError(null);
    setRows([]);
    setMatchedIds([]);
    setMatchedCount(null);
    setExtraNote("");
    try {
      const filters: BulkQuestionFilters = {
        examType: examType || undefined,
        batchId: batchId || undefined,
        topicCode: topicCode || undefined,
        taskType: taskType || undefined,
        depthTier: depthTier || undefined,
        volatilityTier: volatilityTier || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        keyword: keyword || undefined,
      };

      if (preset === "filter") {
        const res = await previewBulkQuestionEditAction(filters);
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.ids);
        setMatchedCount(res.count);
        setRows(res.sample.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem })));
        if (res.count > res.sample.length) setExtraNote(`Showing first ${res.sample.length} of ${res.count} matches.`);
      } else if (preset === "neverReviewed") {
        const res = await findNeverReviewedLiveItemsAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, chips: [r.examType] })));
      } else if (preset === "overdueReview") {
        const res = await findOverdueForReviewAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({
          id: r.id, uqid: r.uqid, title: r.stem,
          subtitle: `Due ${new Date(r.reviewDueBy).toLocaleDateString()}`,
          chips: [r.volatilityTier || "Standard"],
        })));
      } else if (preset === "answerChangedAfterSignoff") {
        const res = await findAnswerChangedAfterSignoffAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem })));
      } else if (preset === "coverage") {
        const res = await getCoverageVsQuotaAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        const combined = [
          ...res.underServed.map((r: any) => ({ title: `${r.topicCode} (${r.homeUnit || "—"})`, subtitle: `Under-served — ${r.itemCount}/${r.quota} min (${r.depthTier}, ${r.examType})`, chips: ["under"] })),
          ...res.overServed.map((r: any) => ({ title: `${r.topicCode} (${r.homeUnit || "—"})`, subtitle: `Over quota — ${r.itemCount}/${r.quota} max (${r.depthTier}, ${r.examType})`, chips: ["over"] })),
        ];
        setRows(combined);
        setMatchedCount(combined.length);
      } else if (preset === "proofing") {
        const res = await getProofingQueueStatsAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setExtraNote(`Queue length: ${res.queueLength} item(s) awaiting review.`);
        setRows(res.throughputByActorWeek.map((r) => ({ title: r.actorName || "Unknown", subtitle: `Week of ${r.week}`, chips: [`${r.proofed} proofed`] })));
        setMatchedCount(res.throughputByActorWeek.length);
      } else if (preset === "lowPerformers" || preset === "highPerformers") {
        const res = await findPerformanceOutlierQuestionsAction({
          examType: (examType || "AKT") as "AKT" | "KFP",
          direction: preset === "lowPerformers" ? "low" : "high",
          thresholdPercent: Number(thresholdPercent) || 30,
          minAttempts: Number(minAttempts) || 20,
        });
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, chips: [`${r.correctRatePercent}% correct`, `${r.attempts} attempts`] })));
      } else if (preset === "weakDistractors") {
        const res = await findWeakDistractorsAction({
          examType: (examType || "AKT") as "AKT" | "KFP",
          maxPickPercent: Number(thresholdPercent) || 5,
          minAttempts: Number(minAttempts) || 20,
        });
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(Array.from(new Set(res.rows.map((r) => r.questionId))));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.questionId, uqid: r.uqid, title: r.stem, subtitle: `Option: ${r.optionLabel}`, chips: [`${r.pickPercent}% picked`, `${r.attempts} attempts`] })));
      } else if (preset === "similarTestablePoints") {
        const res = await findSimilarTestablePointsAction({ topicCode: topicCode || undefined, minSimilarity: 0.5 });
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setRows(res.pairs.map((p) => ({ title: `${p.aUqid || p.aId} ↔ ${p.bUqid || p.bId}`, subtitle: `${p.topicCode} — ${Math.round(p.similarity * 100)}% overlap`, chips: [p.aPoint.slice(0, 60), p.bPoint.slice(0, 60)] })));
        setMatchedCount(res.pairs.length);
      } else if (preset === "mostFlagged") {
        const res = await getMostFlaggedQuestionsAction(1);
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.questionId));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.questionId, uqid: r.uqid, title: r.stem, chips: [`${r.flagCount} reports`, `${r.distinctReporters} distinct reporters`, `${r.openCount} open`] })));
      } else if (preset === "keywordAll") {
        const res = await searchAllItemsAction({ keyword, examType: examType || undefined, volatilityTier: volatilityTier || undefined, createdFrom: createdFrom || undefined, createdTo: createdTo || undefined });
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setRows(res.results.map((r) => ({ id: r.itemType === "question" ? r.id : undefined, uqid: r.uqid, title: r.title, subtitle: r.snippet, chips: [r.itemType, r.status || ""] })));
        setMatchedCount(res.results.length);
      } else if (preset === "stalledInPipeline") {
        const res = await findStalledInPipelineAction({ status: stalledStatus, maxDays: Number(stalledMaxDays) || 14 });
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, chips: [`${r.daysStalled} days`, r.examType] })));
      } else if (preset === "selfReviewed") {
        const res = await findSelfReviewedItemsAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, subtitle: r.authorName ? `Author: ${r.authorName}` : undefined })));
      } else if (preset === "reviewedNotSignedOff") {
        const res = await findReviewedNotSignedOffAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, subtitle: `Reviewed ${new Date(r.dateLastReviewed).toLocaleDateString()}` })));
      } else if (preset === "topicGrowth") {
        const res = await getTopicGrowthTrendAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ title: `${r.topicCode} (${r.homeUnit || "—"})`, subtitle: `${r.last30} last 30d vs ${r.prior30} prior 30d`, chips: [r.trend] })));
      } else if (preset === "staleSourced") {
        const res = await findStaleSourcedItemsAction();
        if (!res.success) { setError(res.error || "Query failed."); return; }
        setMatchedIds(res.rows.map((r) => r.id));
        setMatchedCount(res.rows.length);
        setRows(res.rows.map((r) => ({ id: r.id, uqid: r.uqid, title: r.stem, subtitle: `Due ${new Date(r.reviewDueBy).toLocaleDateString()}`, chips: [r.volatilityTier || "Standard", `${r.sourceRefs.length} source(s)`] })));
      }
    } finally {
      setLoading(false);
    }
  };

  const editableIds = matchedIds.length > 0 ? matchedIds : rows.filter((r) => r.id).map((r) => r.id!);

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[80]" onClick={onClose} />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="fixed inset-x-3 top-[3%] mx-auto max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[85] shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Question Bank Query Explorer</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 min-h-0 p-5 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 overflow-y-auto lg:overflow-hidden">
          {/* Preset list — scrolls independently from the filter/results column on desktop */}
          <div className="space-y-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPreset(p.key);
                  setRows([]);
                  setMatchedIds([]);
                  setMatchedCount(null);
                  setError(null);
                  setExtraNote("");
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                  preset === p.key ? "bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-800 dark:text-teal-300" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                }`}
              >
                <p className="font-semibold">{p.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{p.hint}</p>
              </button>
            ))}
          </div>

          {/* Filter form + results — scrolls independently from the preset list on desktop */}
          <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <CustomSelect value={examType} onChange={setExamType} placeholder="Bank" options={[{ value: "", label: "Any bank" }, { value: "AKT", label: "AKT" }, { value: "KFP", label: "KFP" }]} />
                <input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Batch ID" className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={topicCode} onChange={(e) => setTopicCode(e.target.value)} placeholder="Topic code (t0142)" className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="Task type" className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <CustomSelect value={depthTier} onChange={setDepthTier} placeholder="Depth tier" options={[{ value: "", label: "Any depth" }, { value: "Core", label: "Core" }, { value: "Working", label: "Working" }, { value: "Awareness", label: "Awareness" }]} />
                <CustomSelect value={volatilityTier} onChange={setVolatilityTier} placeholder="Volatility" options={[{ value: "", label: "Any volatility" }, { value: "Volatile", label: "Volatile" }, { value: "Standard", label: "Standard" }, { value: "Stable", label: "Stable" }]} />
                <input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                <input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
              {(preset === "filter" || preset === "keywordAll") && (
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
              )}
              {(preset === "lowPerformers" || preset === "highPerformers" || preset === "weakDistractors") && (
                <div className="flex gap-2">
                  <input value={thresholdPercent} onChange={(e) => setThresholdPercent(e.target.value)} placeholder="Threshold %" type="number" className="w-32 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <input value={minAttempts} onChange={(e) => setMinAttempts(e.target.value)} placeholder="Min attempts" type="number" className="w-32 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
              )}
              {preset === "stalledInPipeline" && (
                <div className="flex gap-2">
                  <CustomSelect value={stalledStatus} onChange={(v) => setStalledStatus(v as "draft" | "review")} options={[{ value: "draft", label: "Draft" }, { value: "review", label: "Review" }]} className="w-40" />
                  <input value={stalledMaxDays} onChange={(e) => setStalledMaxDays(e.target.value)} placeholder="Max days" type="number" className="w-32 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </div>
              )}
              <button
                onClick={runPreset}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50"
              >
                <PlayCircle className="w-3.5 h-3.5" /> {loading ? "Running…" : "Run Query"}
              </button>
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}
            {extraNote && <p className="text-xs text-slate-500 dark:text-slate-400">{extraNote}</p>}
            {matchedCount != null && !error && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{matchedCount} match(es)</p>}

            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {rows.map((r, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{r.uqid ? `${r.uqid} — ` : ""}{r.title}</p>
                  </div>
                  {r.subtitle && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{r.subtitle}</p>}
                  {r.chips && r.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.chips.filter(Boolean).map((c, ci) => (
                        <span key={ci} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editableIds.length > 0 && (
              <button
                onClick={() => onOpenBulkEdit(editableIds)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-950/50"
              >
                <Search className="w-3.5 h-3.5" /> Bulk-edit these {editableIds.length} question(s)
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
