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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import {
  listMbsItemsAction,
  searchMbsAction,
  toggleMbsFavouriteAction,
  fetchMbsItemPageAction,
  type MbsSearchHit,
  type MbsItemPage,
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
   * Pagination works differently for the two modes.
   *
   * Browse pages server-side — 6,000 items cannot sit in client state. Search
   * fetches its whole ranked pool in one request and pages through it locally,
   * so clicking "next" on results costs no further embedding call.
   */
  const [page, setPage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  /** Detail view. Non-null replaces the grid with the government page. */
  const [detail, setDetail] = useState<MbsItemPage | null>(null);
  const [detailFor, setDetailFor] = useState<number | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const openItem = useCallback(async (itemNum: number) => {
    setDetailFor(itemNum);
    setDetail(null);
    setDetailError(null);
    window.scrollTo({ top: 0 });
    try {
      setDetail(await fetchMbsItemPageAction(itemNum));
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

  const loadPage = useCallback((p: number) => {
    const seq = ++seqRef.current;
    return listMbsItemsAction(p)
      .then((res) => {
        if (seq !== seqRef.current) return;
        setItems(res.items);
        setTotal(res.total);
        setBrowseTotalPages(res.totalPages);
        setPage(res.page);
        setError(null);
      })
      .catch(() => setError("Could not load billing items."));
  }, []);

  /**
   * Browse listing. Depends on `isSearching` rather than the raw query so
   * typing "c" then "ca" — both below the search threshold — does not refetch
   * the browse page on each keystroke.
   */
  useEffect(() => {
    if (isSearching) return;
    void loadPage(page).finally(() => setLoading(false));
  }, [page, isSearching, loadPage]);

  /**
   * Debounced search.
   *
   * Deliberately does NOT depend on `page`. Search results are paged on the
   * client, so including it would re-run the whole search — and spend another
   * embedding API call — every time someone clicked "next".
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
          // A new query invalidates the old position — landing on page 4 of a
          // fresh result set would hide the best matches.
          setPage(1);
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
    } catch {
      flip(); // revert
    }
  }, []);

  // Browse already holds exactly one page; search holds the whole pool and is
  // sliced here.
  const visibleItems = isSearching
    ? items.slice((page - 1) * MBS_RESULT_LIMIT, page * MBS_RESULT_LIMIT)
    : items;

  const totalPages = isSearching
    ? Math.max(1, Math.ceil(items.length / MBS_RESULT_LIMIT))
    : browseTotalPages;

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
          /* Markup comes from MBS Online with scripts, forms, inline handlers
             and javascript: URLs already stripped server-side (stripUnsafe).
             overflow-x-auto contains the government page's wide tables rather
             than letting them scroll the whole dashboard sideways. */
          <div
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 overflow-x-auto text-sm text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: detail.html }}
          />
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
              ? `${items.length} match${items.length === 1 ? "" : "es"} · page ${page} of ${totalPages}`
              : `${total.toLocaleString()} items · page ${page.toLocaleString()} of ${totalPages.toLocaleString()}`}
      </div>

      {error && (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* ── Grid: 3 columns x 4 rows ───────────────────────────────────── */}
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
          No items matched that search.
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

      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────────────────── */

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const go = (p: number) => {
    onChange(Math.min(totalPages, Math.max(1, p)));
    // Paging without this leaves the viewport at the bottom of the old grid,
    // so the new page appears to load already scrolled past its first rows.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * A five-page window around the current page.
   *
   * 6,000 items is ~500 pages, so rendering every number is not an option —
   * the window keeps the control a fixed width at any position in the range.
   */
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  const arrow =
    "p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button onClick={() => go(1)} disabled={page === 1} aria-label="First page" className={arrow}>
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={arrow}>
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          aria-current={p === page ? "page" : undefined}
          className={`min-w-[36px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            p === page
              ? "bg-emerald-600 text-white"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {p.toLocaleString()}
        </button>
      ))}

      <button onClick={() => go(page + 1)} disabled={page === totalPages} aria-label="Next page" className={arrow}>
        <ChevronRight className="w-4 h-4" />
      </button>
      <button onClick={() => go(totalPages)} disabled={page === totalPages} aria-label="Last page" className={arrow}>
        <ChevronsRight className="w-4 h-4" />
      </button>
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
