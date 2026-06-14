"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
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
  Bookmark,
  BookmarkCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { mbsItems, complexityConfig, MBSItem } from "@/components/mbs-billing/data";

// ─── Animation configs ────────────────────────────────────────────────────────
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

const SEARCH_SUGGESTIONS = [
  "Standard consult",
  "Skin excision",
  "Mental health",
  "Chronic disease",
  "Health assessment",
];

function SearchCarousel() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  useEffect(() => {
    const idleTimer = setTimeout(() => {
      setPhase("exit");
      const exitTimer = setTimeout(() => {
        setIdx(i => (i + 1) % SEARCH_SUGGESTIONS.length);
        setPhase("enter");
        const enterTimer = setTimeout(() => setPhase("idle"), 350);
        return () => clearTimeout(enterTimer);
      }, 350);
      return () => clearTimeout(exitTimer);
    }, 3000);
    return () => clearTimeout(idleTimer);
  }, [idx]);

  const style: React.CSSProperties = {
    display: "inline-block",
    transition: "transform 350ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease",
    transform: phase === "exit" ? "translateY(-14px)" : phase === "enter" ? "translateY(14px)" : "translateY(0)",
    opacity: phase === "idle" ? 1 : 0,
    willChange: "transform, opacity",
  };

  return (
    <span className="flex items-center gap-0 text-slate-400 text-base pointer-events-none select-none">
      <span className="text-slate-400">Search - &nbsp;</span>
      <span className="overflow-hidden" style={{ height: "1.5em", display: "inline-flex", alignItems: "center" }}>
        <span style={style}>{SEARCH_SUGGESTIONS[idx]}</span>
      </span>
    </span>
  );
}

function BookmarkTooltip({ onDismiss, show }: { onDismiss: () => void; show: boolean }) {
  return (
    <div
      className="pointer-events-auto"
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 380ms ease, transform 380ms ease",
        zIndex: 100,
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -5,
          right: 20,
          width: 10,
          height: 10,
          background: "#1e293b",
          borderRadius: 2,
          transform: "rotate(45deg)",
        }}
      />
      <div className="bg-slate-800 text-white rounded-xl px-3.5 py-2.5 shadow-2xl flex items-start gap-2.5 max-w-[220px]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-teal-400 mb-0.5 uppercase tracking-wide">New Feature</p>
          <p className="text-[12px] leading-snug text-slate-200">
            Tip: Access your saved billing items here.
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss tip"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Billing Guide...</div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [customFee, setCustomFee] = useState<string>("");
  const [feeBuilderOpen, setFeeBuilderOpen] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Search and Bookmarks State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>(["23", "36", "721"]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show tooltip after 1s
    const t1 = setTimeout(() => setShowTooltip(true), 1000);
    // Hide tooltip after 4s (visible for 3s)
    const t2 = setTimeout(() => setShowTooltip(false), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const dismissTooltip = useCallback(() => setShowTooltip(false), []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleSaved = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [id, ...prev]);
  }, []);

  const selectedItemId = searchParams.get("item");
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return mbsItems.find((item) => item.id === selectedItemId) ?? null;
  }, [selectedItemId]);

  // Sync customFee when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setCustomFee(selectedItem.scheduleFee.toFixed(2));
      setFeeBuilderOpen(false);
      setNotesExpanded(false);
    }
  }, [selectedItem]);

  // Memoize filtered items — avoid re-filtering on every render
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const itemsToFilter = showBookmarks ? mbsItems.filter(i => savedItems.includes(i.id)) : mbsItems;
    if (!query) return itemsToFilter;
    return itemsToFilter.filter(
      (item) =>
        item.id.includes(query) ||
        item.humanTitle.toLowerCase().includes(query) ||
        item.officialTitle.toLowerCase().includes(query) ||
        item.plainEnglish.toLowerCase().includes(query) ||
        item.searchTags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, showBookmarks, savedItems]);

  const suggestions = searchQuery.trim().length > 0
    ? mbsItems.filter(t => t.id.includes(searchQuery) || t.humanTitle.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : mbsItems.slice(0, 5);

  const handleSelectCard = useCallback((item: MBSItem) => {
    const params = new URLSearchParams(window.location.search);
    params.set("item", item.id);
    router.push(`/dashboard/billing?${params.toString()}`);
  }, [router]);

  const parsedCustomFee = parseFloat(customFee) || 0;

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 rounded-lg mb-2">
          <span className="font-sans text-xs font-semibold text-teal-700 dark:text-teal-400">MBS Learning System</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          MBS Decision & Billing Guide
        </h1>
        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-1">
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
            {/* Smart Search Bar */}
            <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto mb-2">
              <div
                className={`w-full h-12 bg-white border transition-all duration-200 rounded-2xl shadow-sm flex items-center px-4 gap-3 overflow-hidden ${showSuggestions
                  ? "border-teal-500 ring-2 ring-teal-500/20"
                  : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />

                {!searchQuery && (
                  <span className="absolute left-[52px] flex items-center pointer-events-none select-none overflow-hidden">
                    <SearchCarousel />
                  </span>
                )}

                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder=""
                  className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-slate-800 text-base z-10 relative"
                />

                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestion dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {searchQuery ? "Matching Items" : "Suggested Items"}
                    </p>
                  </div>
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">No billing items found.</div>
                  ) : (
                    <ul className="pb-2">
                      {suggestions.map(t => (
                        <li key={t.id}>
                          <button
                            onMouseDown={e => {
                              e.preventDefault();
                              handleSelectCard(t);
                              setShowSuggestions(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                Item {t.id} - {t.humanTitle}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{t.timeRange}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Grid Header & Bookmarks Toggle */}
            <div className="flex items-center justify-between mb-4 mt-8">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                {showBookmarks ? "Saved Billing Items" : "All Billing Items"}
                {searchQuery && (
                  <span className="ml-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}

                <div className="relative">
                  <button
                    id="billing-bookmarks-btn"
                    onClick={() => {
                      setShowBookmarks(v => !v);
                      dismissTooltip();
                    }}
                    className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 ${showBookmarks
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400 hover:text-teal-600"
                      }`}
                  >
                    {showBookmarks ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    Saved Items
                    {savedItems.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showBookmarks
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                        {savedItems.length}
                      </span>
                    )}
                  </button>
                  <BookmarkTooltip onDismiss={dismissTooltip} show={showTooltip} />
                </div>
              </div>
            </div>

            {/* Empty state */}
            {filteredItems.length === 0 && (
              <div className="glass rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-12 text-center max-w-lg mx-auto">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {showBookmarks ? "No bookmarks yet" : "No Billing Items Found"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {showBookmarks 
                    ? "Bookmark billing items from the grid to save them here." 
                    : `No results match "${searchQuery}". Try other keywords.`}
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setShowBookmarks(false); }}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-500 transition-colors"
                >
                  {showBookmarks ? "Browse All Items" : "Clear Filter"}
                </button>
              </div>
            )}

            {/* Item Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const isBookmarked = savedItems.includes(item.id);
                return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectCard(item)}
                  className="glass dark:glass-strong rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
                >
                  <button
                    onClick={e => toggleSaved(item.id, e)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark item"}
                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-xl transition-all duration-150 ${isBookmarked
                      ? "text-teal-600 bg-teal-50 dark:bg-teal-500/10"
                      : "text-slate-300 dark:text-slate-600 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                      }`}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <div className="pr-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-sans text-sm font-bold text-teal-600 dark:text-teal-400">
                        Item {item.id}
                      </span>
                    </div>
                    <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                      {item.humanTitle}
                    </h3>
                    <p className="font-sans text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-slate-700" />
                      Timeframe: {item.timeRange}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Schedule Fee</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-white">${item.scheduleFee.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Rebate (85%)</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-emerald-600 dark:text-emerald-400">${item.medicareRebate.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
                );
              })}
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
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete("item");
                router.push(`/dashboard/billing?${params.toString()}`);
              }}
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
                      <div className="font-sans text-sm font-bold text-teal-600 dark:text-teal-400 mb-1">
                        Item {selectedItem.id}
                      </div>
                      <h2 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-white tracking-tight mt-1">
                        {selectedItem.humanTitle}
                      </h2>
                    </div>
                  </div>

                  {/* Metadata chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                    <div>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">Consult Time</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedItem.timeRange}</span>
                    </div>
                    <div>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">Schedule Fee</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">${selectedItem.scheduleFee.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">Govt Rebate</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">${selectedItem.medicareRebate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">Bulk Billable</span>
                      <span className="font-sans text-base md:text-lg font-semibold text-emerald-600 dark:text-emerald-400">{selectedItem.bulkBillable ? "Eligible" : "No"}</span>
                    </div>
                  </div>

                  {/* Plain English */}
                  <div className="space-y-2">
                    <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-550 dark:text-slate-400">What This Item Means</h4>
                    <p className="font-sans text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/20 dark:border-slate-800/20">
                      {selectedItem.plainEnglish}
                    </p>
                  </div>

                  {/* Common uses */}
                  <div className="space-y-3">
                    <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-550 dark:text-slate-400">What This Item Is Used For</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedItem.commonUses.map((use, i) => (
                        <li key={i} className="flex items-start gap-2 font-sans text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/10 dark:border-slate-800/15">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comparison */}
                  {selectedItem.comparisonItem && (
                    <div className="space-y-3">
                      <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-555 dark:text-slate-400">When should you use this item?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-teal-500/20 shadow-sm">
                          <span className="font-sans text-xs font-semibold tracking-wider uppercase text-teal-600 dark:text-teal-400">This Item ({selectedItem.id})</span>
                          <div className="mt-2.5 space-y-1.5 font-sans text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300">
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Duration:</span> {selectedItem.timeRange}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Complexity:</span> {complexityConfig[selectedItem.complexity].label}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Intent:</span> {selectedItem.plainEnglish.split(".")[0]}.</p>
                          </div>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                          <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500">Step-Up: Item {selectedItem.comparisonItem.id}</span>
                          <div className="mt-2.5 space-y-1.5 font-sans text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300">
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Duration:</span> {selectedItem.comparisonItem.duration}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Complexity:</span> {selectedItem.comparisonItem.complexity}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100">Intent:</span> {selectedItem.comparisonItem.intent}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Billing restrictions */}
                  {selectedItem.billingRestrictions && selectedItem.billingRestrictions.length > 0 && (
                    <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-200/20 dark:border-red-900/30 rounded-2xl p-4 space-y-2">
                      <h4 className="font-sans text-xs font-semibold tracking-wider uppercase text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Billing Restrictions & Rules
                      </h4>
                      <ul className="space-y-1 font-sans text-base font-normal leading-relaxed text-red-700 dark:text-red-400">
                        {selectedItem.billingRestrictions.map((restriction, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-400 dark:text-red-500/80">•</span>
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
                        <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-350">
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
                                  <li key={i} className="flex gap-2 font-sans text-xs text-slate-500 dark:text-slate-405 leading-relaxed">
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
                    <h3 className="font-sans text-base md:text-lg font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                      Patient Case Scenarios
                    </h3>
                  </div>
                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto">
                    {selectedItem.scenarios && selectedItem.scenarios.length > 0 ? (
                      selectedItem.scenarios.map((scenario, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/30 dark:border-slate-800/40 space-y-2.5">
                          <span className="font-sans text-xs font-semibold tracking-wider text-teal-600 dark:text-teal-400 uppercase block">
                            Clinical Case #{index + 1}
                          </span>
                          <p className="font-sans text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300">{scenario.presentation}</p>
                          <div className="grid grid-cols-2 gap-2 font-sans text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded-xl">
                            <div>
                              <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-550 block">Duration</span>
                              <span className="font-sans text-base font-semibold text-slate-700 dark:text-slate-350">{scenario.time}</span>
                            </div>
                            <div>
                              <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-550 block">Correct billing</span>
                              <span className="font-sans text-base font-semibold text-teal-600 dark:text-teal-400">Item {scenario.correctItem}</span>
                            </div>
                          </div>
                          <div className="font-sans text-xs text-slate-550 dark:text-slate-450 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/20 leading-relaxed">
                            <span className="font-bold text-slate-750 dark:text-slate-300">Reasoning:</span> {scenario.reasoning}
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
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-teal-400 block mb-1">Fee Obligation Summary</span>
                      <h4 className="font-sans text-lg md:text-xl font-semibold text-slate-100 leading-snug">
                        Expected Patient Out-Of-Pocket Expenses:
                      </h4>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-3xl font-bold tracking-tight text-white">
                        ${Math.max(0, parsedCustomFee - selectedItem.medicareRebate).toFixed(2)}
                      </span>
                      <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400">/ Patient Gap</span>
                    </div>
                    <p className="font-sans text-xs text-slate-400 leading-relaxed">
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
                  <h3 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100 uppercase">MBS Fee Calculator</h3>
                  <span className="font-sans text-xs text-slate-400 dark:text-slate-500 block mt-1">
                    Item {selectedItem.id} · {selectedItem.humanTitle}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
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
                      className="w-full pl-9 pr-4 py-3 font-sans text-base font-semibold bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-850 dark:text-slate-100"
                    />
                  </div>
                  <span className="font-sans text-[10px] text-slate-400 dark:text-slate-500 block">
                    Base Schedule Fee: ${selectedItem.scheduleFee.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center font-sans text-xs">
                    <span className="text-slate-500 font-medium">Practice Gross Margin:</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">${parsedCustomFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-sans text-xs">
                    <span className="text-slate-500 font-medium">Medicare Rebate (85%):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">-${selectedItem.medicareRebate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-800/50 font-sans text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Expected Patient Out-Of-Pocket Gap:</span>
                    <span className="font-black text-teal-600 dark:text-teal-400 text-lg">
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
