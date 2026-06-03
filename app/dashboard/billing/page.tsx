"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Check,
  ArrowLeft,
  ExternalLink,
  Calculator,
  DollarSign,
  Coins,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { mbsItems, complexityConfig, MBSItem } from "@/components/mbs-billing/data";

// ─── Animation configs ────────────────────────────────────────────────────────
// Note: page-level entry handled by DashboardShell PageTransition.
// Only within-page transitions are defined here.
const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const detailVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.18 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MBSItem | null>(null);
  const [customFee, setCustomFee] = useState<string>("");
  const [feeBuilderOpen, setFeeBuilderOpen] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Memoize filtered items — avoid re-filtering on every render
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return mbsItems;
    return mbsItems.filter(
      (item) =>
        item.id.includes(query) ||
        item.humanTitle.toLowerCase().includes(query) ||
        item.officialTitle.toLowerCase().includes(query) ||
        item.plainEnglish.toLowerCase().includes(query) ||
        item.searchTags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleSelectCard = (item: MBSItem) => {
    setSelectedItem(item);
    setCustomFee(item.scheduleFee.toFixed(2));
    setFeeBuilderOpen(false);
    setNotesExpanded(false);
  };

  const parsedCustomFee = parseFloat(customFee) || 0;

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal-50 border border-teal-100 rounded-lg mb-2">
          <span className="text-xs font-semibold text-teal-700">MBS Learning System</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MBS Decision & Billing Guide</h1>
        <p className="text-sm text-slate-500 mt-1">
          Learn to bill correctly with plain-English guidance and interactive scenarios.
        </p>
      </div>

      {/* ── Main workspace ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!selectedItem ? (

          /* ─── GRID VIEW ─────────────────────────────────────────────────── */
          <motion.div
            key="grid-view"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            {/* Search */}
            <div className="relative glass dark:glass-strong rounded-2xl p-2 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by item, condition, or keyword..."
                  className="w-full pl-12 pr-10 py-3.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Empty state */}
            {filteredItems.length === 0 && (
              <div className="glass rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-12 text-center max-w-lg mx-auto">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Billing Items Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  No results match &quot;{searchQuery}&quot;. Try other keywords or item numbers.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-500 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Item Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectCard(item)}
                  className="glass dark:glass-strong rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">
                        Item {item.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                      {item.humanTitle}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      Timeframe: {item.timeRange}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schedule Fee</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">${item.scheduleFee.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rebate (85%)</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">${item.medicareRebate.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        ) : (

          /* ─── DETAIL VIEW ────────────────────────────────────────────────── */
          <motion.div
            key="detail-view"
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900 border border-slate-200/40 dark:border-slate-800/50 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search Grid
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

              {/* LEFT: Documentation */}
              <div className="lg:col-span-7">
                <div className="glass dark:glass-strong rounded-3xl p-6 lg:p-8 border border-slate-200/50 dark:border-slate-800/60 shadow-lg space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400 mb-1">
                        Item {selectedItem.id}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 leading-snug">
                        {selectedItem.humanTitle}
                      </h2>
                    </div>
                  </div>

                  {/* Metadata chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Consult Time</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedItem.timeRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Schedule Fee</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">${selectedItem.scheduleFee.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Govt Rebate</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">${selectedItem.medicareRebate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Bulk Billable</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedItem.bulkBillable ? "Eligible" : "No"}</span>
                    </div>
                  </div>

                  {/* Plain English */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">What This Item Means</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/20 dark:border-slate-800/20">
                      {selectedItem.plainEnglish}
                    </p>
                  </div>

                  {/* Common uses */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">What This Item Is Used For</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedItem.commonUses.map((use, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/10 dark:border-slate-800/15">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comparison */}
                  {selectedItem.comparisonItem && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">When should you use this item?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-teal-500/20 shadow-sm">
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">This Item ({selectedItem.id})</span>
                          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Duration:</span> {selectedItem.timeRange}</p>
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Complexity:</span> {complexityConfig[selectedItem.complexity].label}</p>
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Intent:</span> {selectedItem.plainEnglish.split(".")[0]}.</p>
                          </div>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase">Step-Up: Item {selectedItem.comparisonItem.id}</span>
                          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Duration:</span> {selectedItem.comparisonItem.duration}</p>
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Complexity:</span> {selectedItem.comparisonItem.complexity}</p>
                            <p><span className="font-bold text-slate-700 dark:text-slate-300">Intent:</span> {selectedItem.comparisonItem.intent}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Billing restrictions */}
                  {selectedItem.billingRestrictions && selectedItem.billingRestrictions.length > 0 && (
                    <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-200/20 dark:border-red-900/30 rounded-2xl p-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Billing Restrictions & Rules
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {selectedItem.billingRestrictions.map((restriction, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Official notes accordion */}
                  {selectedItem.officialNotes && selectedItem.officialNotes.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      <button
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-100/50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-2xl border border-slate-200/35 dark:border-slate-800/40 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          View Official Medicare Notes
                        </span>
                        {notesExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <AnimatePresence>
                        {notesExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2.5 p-4 bg-white/40 dark:bg-slate-950/40 rounded-2xl border border-slate-200/25 dark:border-slate-800/20">
                              <ul className="space-y-2">
                                {selectedItem.officialNotes.map((note, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span>{note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Scenarios + Fee summary */}
              <div className="lg:col-span-5 space-y-5">

                {/* Scenarios */}
                <div className="glass dark:glass-strong rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-lg space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Patient Case Scenarios
                    </h3>
                  </div>
                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto">
                    {selectedItem.scenarios && selectedItem.scenarios.length > 0 ? (
                      selectedItem.scenarios.map((scenario, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40 space-y-2.5">
                          <span className="text-[10px] font-bold tracking-widest text-teal-600 dark:text-teal-400 uppercase block">
                            Clinical Case #{index + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{scenario.presentation}</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-100 dark:bg-slate-900 p-2 rounded-xl">
                            <div>
                              <span className="text-slate-400 font-bold block uppercase">Duration</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{scenario.time}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase">Correct billing</span>
                              <span className="font-semibold text-teal-600 dark:text-teal-400">Item {scenario.correctItem}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/20 leading-relaxed">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Reasoning:</span> {scenario.reasoning}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">No case scenarios linked to this item.</div>
                    )}
                  </div>
                </div>

                {/* Out-of-pocket summary */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    <div>
                      <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest block mb-1">Fee Obligation Summary</span>
                      <h4 className="text-base font-bold text-slate-100 leading-snug">
                        Expected Patient Out-Of-Pocket Expenses:
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tight text-white">
                        ${Math.max(0, parsedCustomFee - selectedItem.medicareRebate).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">/ Patient Gap</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Calculated based on your private fee setting of ${parsedCustomFee.toFixed(2)} minus the Medicare rebate of ${selectedItem.medicareRebate.toFixed(2)}.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setFeeBuilderOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>Fee Calculator</span>
                  </button>
                  <a
                    href={`https://www9.health.gov.au/mbs/search.cfm?q=${selectedItem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    <span>MBS Online Handbook</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fee Calculator Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {feeBuilderOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeeBuilderOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden space-y-6 text-slate-800 dark:text-slate-100 z-10"
            >
              <button
                onClick={() => setFeeBuilderOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider leading-none">MBS Fee Calculator</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1">
                    Item {selectedItem.id} · {selectedItem.humanTitle}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Practice Private Fee Charged ($)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      value={customFee}
                      onChange={(e) => setCustomFee(e.target.value)}
                      placeholder={selectedItem.scheduleFee.toFixed(2)}
                      className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Base Schedule Fee: ${selectedItem.scheduleFee.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Practice Gross Margin:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">${parsedCustomFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Medicare Rebate (85%):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-${selectedItem.medicareRebate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Expected Patient Out-Of-Pocket Gap:</span>
                    <span className="font-mono font-black text-teal-600 dark:text-teal-400 text-lg">
                      ${Math.max(0, parsedCustomFee - selectedItem.medicareRebate).toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedItem.bulkBillable && parsedCustomFee <= selectedItem.medicareRebate && (
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200/20 dark:border-emerald-900/30 p-3.5 rounded-2xl text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
                    <Coins className="w-4 h-4 shrink-0" />
                    <span>This billing setup qualifies for bulk billing with zero out-of-pocket patient gap.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => setFeeBuilderOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Done Calculating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
