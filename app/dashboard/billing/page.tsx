"use client";

/**
 * MBS Billing — semantic item search.
 *
 * Replaces the previous hard-coded 5-item keyword filter with the real
 * ~6,000-item table and vector search.
 *
 * Search is deliberately NOT run per keystroke. Every query has to be embedded
 * by the Gemini API to be comparable with the stored vectors, so typing
 * "cardiac" would cost seven API calls, burn rate-limit quota, and produce
 * results for half-typed words that carry no meaning. Instead it fires once
 * typing settles, and only from three characters — one word, one call.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import {
  listSavedMbsItemsAction,
  searchMbsAction,
  toggleMbsFavouriteAction,
  getMbsItemDetailAction,
  type MbsSearchHit,
  type MbsItemDetail,
} from "@/actions/mbs.actions";
import { MBS_RESULT_LIMIT } from "@/lib/mbs/constants";

/** Wait after the last keystroke before spending an API call. */
const DEBOUNCE_MS = 350;

/** Below this an embedding is noise — the vector for "ca" means nothing. */
const MIN_QUERY_LENGTH = 3;

export default function MbsBillingPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MbsSearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * With no query the grid shows every item the user has saved; a query replaces
   * it with the top MBS_RESULT_LIMIT ranked matches. Neither view paginates.
   */

  /** Detail view. Non-null replaces the grid with the structured item detail. */
  const [detail, setDetail] = useState<MbsItemDetail | null>(null);
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const openItem = useCallback(async (itemNum: number) => {
    setDetailFor(itemNum);
    setDetail(null);
    setDetailError(null);
    window.scrollTo({ top: 0 });
    try {
      setDetail(await getMbsItemDetailAction(itemNum));
    } catch {
      setDetailError(`Could not load item ${itemNum} from MBS Online.`);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailFor(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  /**
   * Guards against out-of-order responses.
   *
   * Typing "cardiac" quickly can leave the request for "card" in flight when
   * "cardiac" returns. Without a sequence check the older, less relevant result
   * lands last and overwrites the correct one — which looks like the search is
   * randomly wrong and is very hard to reproduce deliberately.
   */
  const seqRef = useRef(0);

  const trimmed = query.trim();
  const isSearching = trimmed.length >= MIN_QUERY_LENGTH;

  const loadSavedItems = useCallback(() => {
    const seq = ++seqRef.current;
    return listSavedMbsItemsAction()
      .then((rows) => {
        if (seq !== seqRef.current) return;
        setItems(rows);
        setError(null);
      })
      .catch(() => setError("Could not load your saved items."));
  }, []);

  /**
   * Default listing — the user's saved items. Depends on `isSearching` rather
   * than the raw query so typing "c" then "ca" — both below the search
   * threshold — does not refetch the saved list on each keystroke.
   */
  useEffect(() => {
    if (isSearching) return;
    void loadSavedItems().finally(() => setLoading(false));
  }, [isSearching, loadSavedItems]);

  /**
   * Debounced search. Returns only the top MBS_SEARCH_POOL (15) ranked matches,
   * which the grid shows in full — no pagination.
   */
  useEffect(() => {
    const text = query.trim();

    // Below the threshold the browse effect above takes over.
    if (text.length < MIN_QUERY_LENGTH) {
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      const seq = ++seqRef.current;
      searchMbsAction(text)
        .then((rows) => {
          if (seq !== seqRef.current) return;
          setItems(rows);
          setError(null);
        })
        .catch(() => {
          if (seq === seqRef.current) setError("Search is unavailable right now.");
        })
        .finally(() => {
          if (seq === seqRef.current) setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  /**
   * Optimistic toggle — the icon flips immediately and reconciles with whatever
   * the server reports. Waiting for the round trip makes saving feel broken.
   */
  const toggleSave = useCallback(async (itemNum: number) => {
    const flip = (saved?: boolean) =>
      setItems((prev) =>
        prev.map((i) =>
          i.itemNum === itemNum ? { ...i, saved: saved ?? !i.saved } : i,
        ),
      );

    flip();
    try {
      const { saved } = await toggleMbsFavouriteAction(itemNum);
      flip(saved);
      // In the saved-items listing an unsaved item no longer belongs, so drop
      // it once the server confirms. In search results it stays put — only the
      // bookmark icon changes.
      if (!isSearching && !saved) {
        setItems((prev) => prev.filter((i) => i.itemNum !== itemNum));
      }
    } catch {
      flip(); // revert
    }
  }, [isSearching]);

  // Saved listing shows every saved item; search is capped to the top
  // MBS_RESULT_LIMIT (the slice is a safety net — search already returns at
  // most that many).
  const visibleItems = isSearching ? items.slice(0, MBS_RESULT_LIMIT) : items;

  /* ── Detail view — replaces the grid entirely ─────────────────────────── */
  if (detailFor !== null) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={closeDetail}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to items
          </button>

          {detail && (
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Open on MBS Online
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Item {detailFor}
        </h1>

        {detailError ? (
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{detailError}</p>
        ) : !detail ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse"
                style={{ width: `${90 - i * 6}%` }}
              />
            ))}
          </div>
        ) : (
          <ItemDetail detail={detail} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        MBS Billing
      </h1>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search MBS items…"
          className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-600 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status line. The "type at least 3 characters" case matters — without it
          a one or two letter query looks like a search that silently failed. */}
      <div className="min-h-[18px] text-xs text-slate-400 dark:text-slate-500">
        {searching
          ? "Searching…"
          : trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH
            ? `Type at least ${MIN_QUERY_LENGTH} characters to search`
            : isSearching
              ? `Top ${visibleItems.length} match${visibleItems.length === 1 ? "" : "es"}`
              : visibleItems.length > 0
                ? `${visibleItems.length} saved item${visibleItems.length === 1 ? "" : "s"}`
                : ""}
      </div>

      {error && (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* ── Grid: saved items, or top 15 search matches (3 columns) ──────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: MBS_RESULT_LIMIT }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSearching
            ? "No items matched that search."
            : "You haven't saved any items yet. Search above, then tap the bookmark on an item to keep it here."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => (
            <ItemCard
              key={item.itemNum}
              item={item}
              onToggleSave={toggleSave}
              onOpen={openItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail ───────────────────────────────────────────────────────────── */

/**
 * Item detail: the structured data as titled fields. Each section the agent
 * produced renders as a title (its label) with the field's text as the
 * description underneath — every item shares the same structure.
 */
function ItemDetail({ detail }: { detail: MbsItemDetail }) {
  return (
    <div className="space-y-6">
      {/* Structured data — one titled field per section. */}
      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Structured data
        </h2>
        {detail.sections.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No structured fields were extracted for this item.
          </p>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {detail.sections.map((section, i) => (
              <div key={`${section.label}-${i}`} className="p-5">
                {/* title */}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {section.label}
                </h3>
                {/* description — preserve the line breaks the agent kept in the
                    value (fee tables, condition lists) rather than collapsing them. */}
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {section.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {detail.cached ? "Cached" : "Fetched"} from MBS Online on{" "}
        {new Date(detail.fetchedAt).toLocaleDateString()}.
      </p>
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */

function ItemCard({
  item,
  onToggleSave,
  onOpen,
}: {
  item: MbsSearchHit;
  onToggleSave: (itemNum: number) => void;
  onOpen: (itemNum: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
    >
      {/* The clickable region deliberately excludes the save button, which sits
          outside it — nesting a button inside a button is invalid HTML and the
          save click would also open the item. */}
      <button
        onClick={() => onOpen(item.itemNum)}
        className="absolute inset-0 z-0 rounded-2xl cursor-pointer"
        aria-label={`Open item ${item.itemNum}`}
      />

      {/* pr-9 reserves space so a long title never runs under the save icon. */}
      <div className="pr-9 relative z-0 pointer-events-none">
        <span className="inline-block text-[11px] font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
          ITEM {item.itemNum}
        </span>

        <h3 className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {item.title ?? `Item ${item.itemNum}`}
        </h3>

        {/* Descriptors run to several hundred words, so the card shows an
            excerpt — the full text belongs on the detail view. */}
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-4">
          {item.description}
        </p>
      </div>

      {/* z-10 keeps this above the full-card open overlay. */}
      <button
        onClick={() => onToggleSave(item.itemNum)}
        aria-label={item.saved ? "Remove from saved" : "Save item"}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {item.saved ? (
          <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    </motion.div>
  );
}
