"use client";

/**
 * Admin → Update MBS
 *
 * Loads a government MBS XML dump into mbs_items and builds the search vectors.
 *
 * The 8MB file is parsed in the BROWSER and posted to the server in small
 * batches. Sending the whole file to a server action instead would mean one
 * request holding a multi-minute upsert-plus-embed job — long past any
 * serverless timeout, with no progress to show and nothing to resume from.
 * Batching keeps every request short and lets the run recover where it stopped.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseMbsXml, type MbsXmlItem } from "@/lib/mbs/parseMbsXml";
import {
  syncMbsBatchAction,
  embedPendingBatchAction,
  getMbsStatsAction,
  retireMissingMbsItemsAction,
  generateTitlesBatchAction,
  embedTitlesBatchAction,
  type RetireResult,
  type MbsStats,
} from "@/actions/mbs.actions";

/** Upserts are cheap, so a larger batch means fewer round trips. */
const SYNC_BATCH = 300;

/**
 * Gap between embedding requests.
 *
 * The Gemini free tier allows 100 embed requests per minute. Firing batches as
 * fast as the network allows trips that within seconds, and the whole run dies
 * on a 429. ~700ms paces us to roughly 85/min — comfortably under, and it costs
 * well under a minute across a full 6,000-item ingest.
 */
const EMBED_PAUSE_MS = 700;

/**
 * Gap between title-generation requests.
 *
 * Text generation is far more restricted than embedding on the free tier — a
 * low per-minute cap and a hard per-DAY request cap. Pacing at 6s keeps well
 * inside the per-minute limit; the large batch size is what keeps the daily
 * request count viable.
 */
const TITLE_PAUSE_MS = 6000;

/**
 * Raw provider errors are long JSON blobs that mean nothing to an admin. The
 * full text still goes to the log; this is what gets shown on screen.
 */
function friendlyError(err: unknown): string {
  const raw = String(err);
  if (/\b429\b|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(raw)) {
    return "Gemini rate limit reached — the free tier allows 100 embedding requests per minute. Wait a minute and run again; everything already embedded is kept.";
  }
  if (/\b40[13]\b|API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(raw)) {
    return "Gemini rejected the API key. Check GEMINI_API_KEY in your environment.";
  }
  if (/fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|network/i.test(raw)) {
    return "Could not reach the Gemini API. Check the connection and run again.";
  }
  if (/GEMINI_API_KEY is not set/i.test(raw)) {
    return "GEMINI_API_KEY is not set. Add it to your environment and restart the server.";
  }
  return raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
}

type Phase = "idle" | "parsing" | "syncing" | "embedding" | "verifying" | "done" | "error";

interface Totals {
  inserted: number;
  updated: number;
  unchanged: number;
}

type LogLevel = "info" | "ok" | "warn" | "err";

interface LogEntry {
  time: string;
  level: LogLevel;
  msg: string;
}

const LOG_COLOURS: Record<LogLevel, string> = {
  info: "text-slate-300",
  ok: "text-teal-300",
  warn: "text-amber-300",
  err: "text-red-300",
};

export default function UpdateMbsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [items, setItems] = useState<MbsXmlItem[] | null>(null);
  const [parseInfo, setParseInfo] = useState<{ duplicates: number; skipped: number } | null>(null);

  const [syncDone, setSyncDone] = useState(0);
  const [embedDone, setEmbedDone] = useState(0);
  const [embedTotal, setEmbedTotal] = useState(0);
  const [totals, setTotals] = useState<Totals>({ inserted: 0, updated: 0, unchanged: 0 });

  const [reconciled, setReconciled] = useState(false);
  const [retireResult, setRetireResult] = useState<RetireResult | null>(null);
  const [finalStats, setFinalStats] = useState<MbsStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  /**
   * Live table state, independent of any upload.
   *
   * An ingest writes rows first and embeds second, so closing the tab midway
   * leaves items in the table with no vector — invisible to search, with nothing
   * on screen to say so. Showing the counts on load makes that state obvious and
   * gives somewhere to fix it from.
   */
  const [dbStats, setDbStats] = useState<MbsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /** Which flow produced the current progress/result panels. */
  const [mode, setMode] = useState<"upload" | "embed" | "titles" | "titleVectors">("upload");

  const logEndRef = useRef<HTMLDivElement>(null);

  /**
   * A full run is minutes of work behind two progress bars. The log is what
   * makes it inspectable — which batch is in flight, what the counts were, and
   * where it stopped if something fails.
   */
  const addLog = useCallback((msg: string, level: LogLevel = "info") => {
    const time = new Date().toLocaleTimeString("en-AU", { hour12: false });
    setLogs((prev) => [...prev, { time, level, msg }]);
  }, []);

  // Follow the tail as new lines arrive.
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [logs]);

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setDbStats(await getMbsStatsAction());
    } catch {
      setDbStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const busy = phase === "parsing" || phase === "syncing" || phase === "embedding" || phase === "verifying";

  const syncPct = useMemo(
    () => (items?.length ? Math.round((syncDone / items.length) * 100) : 0),
    [syncDone, items],
  );
  const embedPct = useMemo(
    () => (embedTotal ? Math.round((embedDone / embedTotal) * 100) : 0),
    [embedDone, embedTotal],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setFileName(null);
    setItems(null);
    setParseInfo(null);
    setSyncDone(0);
    setEmbedDone(0);
    setEmbedTotal(0);
    setTotals({ inserted: 0, updated: 0, unchanged: 0 });
    setReconciled(false);
    setRetireResult(null);
    setFinalStats(null);
    setError(null);
    setLogs([]);
    setCelebrating(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    reset();
    setFileName(file.name);
    setPhase("parsing");

    setMode("upload");
    try {
      addLog(`Reading ${file.name} (${(file.size / 1_048_576).toFixed(1)} MB)`);
      const text = await file.text();
      const result = parseMbsXml(text);
      if (result.items.length === 0) {
        throw new Error("No usable <Data> items found in this file.");
      }
      addLog(
        `Parsed ${result.items.length} items ` +
          `(${result.duplicates} duplicate, ${result.skipped} skipped)`,
        "ok",
      );
      if (result.duplicates > 0) {
        addLog(`Duplicate item numbers collapsed to their last occurrence.`, "warn");
      }
      setItems(result.items);
      setParseInfo({ duplicates: result.duplicates, skipped: result.skipped });
      setPhase("idle");
      addLog(`Ready. Press "Update database" to apply.`);
    } catch (err) {
      addLog(String(err), "err");
      const message = friendlyError(err);
      setError(message);
      setPhase("error");
    }
  }, [reset, addLog]);

  /** One full pass of the XML through the upsert. Returns the batch tallies. */
  const runSyncPass = useCallback(
    async (list: MbsXmlItem[], track: boolean): Promise<Totals> => {
      const acc: Totals = { inserted: 0, updated: 0, unchanged: 0 };
      for (let i = 0; i < list.length; i += SYNC_BATCH) {
        const batch = list.slice(i, i + SYNC_BATCH);
        const r = await syncMbsBatchAction(batch);
        acc.inserted += r.inserted;
        acc.updated += r.updated;
        acc.unchanged += r.unchanged;
        const done = Math.min(i + batch.length, list.length);
        if (track) setSyncDone(done);
        addLog(
          `synced ${done}/${list.length}  ` +
            `(+${r.inserted} new, ~${r.updated} changed, =${r.unchanged} same)`,
        );
      }
      return acc;
    },
    [addLog],
  );

  /**
   * Drain every row still missing a vector.
   *
   * Each iteration re-queries `WHERE embedding IS NULL` rather than working from
   * a list captured up front, so the loop is inherently resumable: whatever was
   * already embedded is simply not selected again.
   */
  const runEmbedLoop = useCallback(
    async (pendingCount: number) => {
      setEmbedTotal(pendingCount);
      setEmbedDone(0);

      if (pendingCount === 0) {
        addLog(`Every live item already has a vector — nothing to embed.`, "ok");
        return;
      }
      addLog(
        `${pendingCount} item(s) to embed via gemini-embedding-001 @ 768d — ` +
          `${Math.ceil(pendingCount / 100)} batched request(s).`,
      );

      let done = 0;
      for (;;) {
        const r = await embedPendingBatchAction();
        if (r.embedded === 0) break;
        done += r.embedded;
        setEmbedDone(done);
        addLog(`embedded ${done}/${pendingCount}  (${r.remaining} remaining)`);
        if (r.remaining === 0) break;
        await new Promise((resolve) => setTimeout(resolve, EMBED_PAUSE_MS));
      }
    },
    [addLog],
  );

  /**
   * Generate the short clinical titles the government XML does not provide.
   *
   * Resumable in the same way as embedding — driven by `title IS NULL` — which
   * matters more here than anywhere else in the pipeline: generation has a hard
   * per-day request cap, so a full run may legitimately need to be finished on
   * another day.
   */
  const handleGenerateTitles = useCallback(async () => {
    setMode("titles");
    setError(null);
    setLogs([]);
    setCelebrating(false);
    setReconciled(false);
    setRetireResult(null);
    setTotals({ inserted: 0, updated: 0, unchanged: 0 });

    try {
      setPhase("verifying");
      addLog(`Scanning for items without a title…`);
      const stats = await getMbsStatsAction();
      addLog(
        `${stats.titlePending} of ${stats.titled + stats.titlePending} live item(s) have no title.`,
        stats.titlePending > 0 ? "warn" : "ok",
      );

      setPhase("embedding");
      setEmbedTotal(stats.titlePending);
      setEmbedDone(0);

      if (stats.titlePending === 0) {
        addLog(`Every live item already has a title.`, "ok");
      } else {
        addLog(`Generating titles with gemini-2.5-flash in batches of 40…`);
        let done = 0;
        for (;;) {
          const r = await generateTitlesBatchAction();
          if (r.generated === 0) break;
          done += r.generated;
          setEmbedDone(done);
          addLog(`titled ${done}/${stats.titlePending}  (${r.remaining} remaining)`);
          // Surface a couple of real titles so quality is visible immediately,
          // rather than only after the whole run finishes.
          for (const s of r.sample) addLog(`  ${s.itemNum} → ${s.title}`, "ok");
          if (r.remaining === 0) break;
          await new Promise((resolve) => setTimeout(resolve, TITLE_PAUSE_MS));
        }
      }

      const final = await getMbsStatsAction();
      setFinalStats(final);
      setDbStats(final);
      addLog(`Done. ${final.titled} item(s) have titles.`, "ok");
      setPhase("done");
      if (stats.titlePending > 0) setCelebrating(true);
    } catch (err) {
      addLog(String(err), "err");
      const message = friendlyError(err);
      addLog(message, "warn");
      setError(message);
      setPhase("error");
      void refreshStats();
    }
  }, [addLog, refreshStats]);

  /** Embed the generated titles into their own vector column. */
  const handleEmbedTitles = useCallback(async () => {
    setMode("titleVectors");
    setError(null);
    setLogs([]);
    setCelebrating(false);
    setReconciled(false);
    setRetireResult(null);
    setTotals({ inserted: 0, updated: 0, unchanged: 0 });

    try {
      setPhase("verifying");
      addLog(`Scanning for titles without a vector…`);
      const stats = await getMbsStatsAction();
      addLog(
        `${stats.titleEmbedPending} title(s) need a vector.`,
        stats.titleEmbedPending > 0 ? "warn" : "ok",
      );

      setPhase("embedding");
      setEmbedTotal(stats.titleEmbedPending);
      setEmbedDone(0);

      if (stats.titleEmbedPending === 0) {
        addLog(`Every title already has a vector.`, "ok");
      } else {
        addLog(
          `${stats.titleEmbedPending} title(s) to embed via gemini-embedding-001 @ 768d — ` +
            `${Math.ceil(stats.titleEmbedPending / 100)} batched request(s).`,
        );
        let done = 0;
        for (;;) {
          const r = await embedTitlesBatchAction();
          if (r.embedded === 0) break;
          done += r.embedded;
          setEmbedDone(done);
          addLog(`embedded ${done}/${stats.titleEmbedPending}  (${r.remaining} remaining)`);
          if (r.remaining === 0) break;
          await new Promise((resolve) => setTimeout(resolve, EMBED_PAUSE_MS));
        }
      }

      const final = await getMbsStatsAction();
      setFinalStats(final);
      setDbStats(final);
      addLog(`Done. ${final.titleEmbedded} title vector(s) stored.`, "ok");
      setPhase("done");
      if (stats.titleEmbedPending > 0) setCelebrating(true);
    } catch (err) {
      addLog(String(err), "err");
      const message = friendlyError(err);
      addLog(message, "warn");
      setError(message);
      setPhase("error");
      void refreshStats();
    }
  }, [addLog, refreshStats]);

  /**
   * Recovery path for an ingest whose embedding half never finished — the tab
   * was closed, the quota ran out, the network dropped. Needs no file: the rows
   * are already in the table, only their vectors are missing.
   */
  const handleGenerateMissing = useCallback(async () => {
    setMode("embed");
    setError(null);
    setLogs([]);
    setCelebrating(false);
    setReconciled(false);
    setRetireResult(null);
    setTotals({ inserted: 0, updated: 0, unchanged: 0 });

    try {
      setPhase("verifying");
      addLog(`Scanning for items without a search vector…`);
      const stats = await getMbsStatsAction();
      addLog(
        `${stats.pending} of ${stats.total} live item(s) are missing a vector.`,
        stats.pending > 0 ? "warn" : "ok",
      );

      setPhase("embedding");
      await runEmbedLoop(stats.pending);

      const final = await getMbsStatsAction();
      setFinalStats(final);
      setDbStats(final);
      addLog(`Done. ${final.embedded}/${final.total} items have vectors.`, "ok");
      setPhase("done");
      if (stats.pending > 0) setCelebrating(true);
    } catch (err) {
      // Full provider payload to the log for diagnosis; a readable one-liner on
      // screen. Showing the raw 429 JSON told the admin nothing actionable.
      addLog(String(err), "err");
      const message = friendlyError(err);
      addLog(message, "warn");
      setError(message);
      setPhase("error");
      void refreshStats();
    }
  }, [addLog, runEmbedLoop, refreshStats]);

  const handleRun = useCallback(async () => {
    if (!items) return;
    setMode("upload");
    setError(null);

    try {
      // ── 1. Upsert every item ────────────────────────────────────────────────
      setPhase("syncing");
      setSyncDone(0);
      addLog(`Syncing ${items.length} items in batches of ${SYNC_BATCH}…`);
      const pass = await runSyncPass(items, true);
      setTotals(pass);
      addLog(
        `Added ${pass.inserted} · Updated ${pass.updated} · Unchanged ${pass.unchanged}`,
        "ok",
      );

      // ── 2. Verify the table matches the file, and reconcile once if not ─────
      // A dropped batch would otherwise leave a silently incomplete index, so
      // the row count is compared against the file before embedding starts.
      setPhase("verifying");
      addLog(`Verifying row count against the file…`);
      let stats = await getMbsStatsAction();
      let missing = items.filter((i) => i.itemNum).length - stats.total;
      addLog(`Table holds ${stats.total} items; file listed ${items.length}.`);

      if (missing > 0) {
        addLog(`${missing} item(s) missing — running a reconciliation pass.`, "warn");
        setReconciled(true);
        setPhase("syncing");
        setSyncDone(0);
        const second = await runSyncPass(items, true);
        setTotals({
          inserted: pass.inserted + second.inserted,
          updated: pass.updated + second.updated,
          unchanged: second.unchanged,
        });
        setPhase("verifying");
        stats = await getMbsStatsAction();
        addLog(`After reconciliation: ${stats.total} items in table.`, "ok");
      }

      // Items the file no longer lists are retired (and any that reappeared are
      // un-retired). Runs BEFORE embedding so quota is never spent on vectors
      // for items that are about to drop out of the search index anyway.
      addLog(`Checking for items withdrawn from the schedule…`);
      const retire = await retireMissingMbsItemsAction(items.map((i) => i.itemNum));
      setRetireResult(retire);
      if (retire.retired > 0) {
        addLog(
          `Retired ${retire.retired} item(s) absent from this file ` +
            `(kept in the database, hidden from search).`,
          "warn",
        );
      } else {
        addLog(`No items withdrawn.`, "ok");
      }
      if (retire.restored > 0) {
        addLog(`Restored ${retire.restored} previously retired item(s).`, "ok");
      }
      stats = await getMbsStatsAction();

      // ── 3. Embed everything still missing a vector ──────────────────────────
      setPhase("embedding");
      setEmbedTotal(stats.pending);
      setEmbedDone(0);

      await runEmbedLoop(stats.pending);

      const final = await getMbsStatsAction();
      setFinalStats(final);
      setDbStats(final);
      addLog(
        `Done. ${final.embedded}/${final.total} items have vectors` +
          (final.retired ? `, ${final.retired} retired.` : `.`),
        "ok",
      );
      setPhase("done");
      setCelebrating(true);
    } catch (err) {
      addLog(String(err), "err");
      const message = friendlyError(err);
      addLog(message, "warn");
      setError(message);
      setPhase("error");
      void refreshStats();
    }
  }, [items, runSyncPass, addLog, runEmbedLoop, refreshStats]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Celebration ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {celebrating && finalStats && (
          <Celebration
            mode={mode}
            fileName={fileName}
            stats={finalStats}
            totals={totals}
            onDismiss={() => setCelebrating(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Update MBS
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Upload the monthly MBS XML from{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">mbsonline.gov.au</span>.
          New items are added, changed descriptions are updated, and search vectors are rebuilt for
          anything that changed.
        </p>
      </div>

      {/* ── Database status ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Database status
          </span>
          <button
            onClick={() => void refreshStats()}
            disabled={busy || statsLoading}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            {statsLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {statsLoading && !dbStats ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : dbStats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Tile label="Items" value={dbStats.total} />
              <Tile label="Retired" value={dbStats.retired} />
              <Tile label="Description vectors" value={dbStats.embedded} accent />
              <Tile label="Titles" value={dbStats.titled} accent />
              <Tile label="Title vectors" value={dbStats.titleEmbedded} accent />
              <Tile label="Missing description vectors" value={dbStats.pending} />
            </div>

            {/* Each stage reports only when it has outstanding work, so a fully
                built index shows a single confirmation instead of three. */}
            <div className="mt-5 space-y-5">
              <Stage
                pending={dbStats.pending}
                noun="search vector"
                explanation="These items exist in the database but cannot be found by search. This usually means an earlier run was interrupted before embedding finished. No re-upload needed — the descriptions are already stored."
                buttonLabel={`Generate ${dbStats.pending.toLocaleString()} missing embedding(s)`}
                busyLabel="Generating…"
                busy={busy}
                active={mode === "embed"}
                onRun={handleGenerateMissing}
              />

              <Stage
                pending={dbStats.titlePending}
                noun="title"
                explanation="The government XML contains no title — only a long legal descriptor. Short titles are generated from each description so result cards are readable and short queries match well."
                buttonLabel={`Generate ${dbStats.titlePending.toLocaleString()} title(s)`}
                busyLabel="Generating titles…"
                busy={busy}
                active={mode === "titles"}
                onRun={handleGenerateTitles}
              />

              <Stage
                pending={dbStats.titleEmbedPending}
                noun="title vector"
                explanation="Titles are embedded into their own vector so search can match a short query against the title and a detailed one against the descriptor, taking whichever scores better."
                buttonLabel={`Generate ${dbStats.titleEmbedPending.toLocaleString()} title vector(s)`}
                busyLabel="Embedding titles…"
                busy={busy}
                active={mode === "titleVectors"}
                onRun={handleEmbedTitles}
              />

              {dbStats.total > 0 &&
                dbStats.pending === 0 &&
                dbStats.titlePending === 0 &&
                dbStats.titleEmbedPending === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Every live item has a title, a description vector and a title vector.
                  </p>
                )}
            </div>
          </>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">Could not read database status.</p>
        )}
      </div>

      {/* ── File picker ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center ${
            busy
              ? "border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
              : "border-slate-200 dark:border-slate-700 hover:border-teal-500 bg-slate-50 dark:bg-slate-800/40 cursor-pointer"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xml"
            disabled={busy}
            className="hidden"
          />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {fileName ?? "Select the MBS XML file"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            e.g. MBS-XML-20260701.XML — parsed in your browser, never uploaded whole
          </p>
        </div>

        {phase === "parsing" && (
          <p className="mt-4 text-sm text-slate-500">Parsing XML…</p>
        )}

        {items && phase !== "parsing" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Stat label="Items in file" value={items.length.toLocaleString()} />
            {!!parseInfo?.duplicates && (
              <Stat label="Duplicate item numbers" value={parseInfo.duplicates} />
            )}
            {!!parseInfo?.skipped && <Stat label="Skipped blocks" value={parseInfo.skipped} />}
          </div>
        )}

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleRun}
            disabled={!items || busy}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {busy ? "Working…" : "Update database"}
          </button>
          {(items || error) && !busy && (
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      {(phase === "syncing" || phase === "verifying" || phase === "embedding" || phase === "done") && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          {/* Embed-only runs never touch the table, so no sync bar for them. */}
          {mode === "upload" && (
            <Progress
              title={reconciled ? "Syncing items (reconciliation pass)" : "Syncing items"}
              pct={phase === "syncing" ? syncPct : 100}
              detail={`${syncDone.toLocaleString()} / ${(items?.length ?? 0).toLocaleString()}`}
              active={phase === "syncing"}
            />
          )}
          <Progress
            title={
              mode === "titles"
                ? "Generating titles"
                : mode === "titleVectors"
                  ? "Embedding titles"
                  : "Building search vectors"
            }
            pct={phase === "embedding" || phase === "done" ? embedPct : 0}
            detail={
              embedTotal === 0 && phase === "done"
                ? "nothing to do"
                : `${embedDone.toLocaleString()} / ${embedTotal.toLocaleString()}`
            }
            active={phase === "embedding"}
          />

          {mode === "upload" && (
            <div className="flex flex-wrap gap-3 pt-1">
              <Stat label="Added" value={totals.inserted.toLocaleString()} />
              <Stat label="Updated" value={totals.updated.toLocaleString()} />
              <Stat label="Unchanged" value={totals.unchanged.toLocaleString()} />
            </div>
          )}
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────────────── */}
      {phase === "done" && finalStats && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 rounded-2xl p-6"
        >
          <p className="text-teal-800 dark:text-teal-300 font-bold">Update complete</p>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <p>
              <strong>{finalStats.total.toLocaleString()}</strong> items in the database
              {items && (
                <>
                  {" "}
                  · file contained <strong>{items.length.toLocaleString()}</strong>
                </>
              )}
            </p>
            <p>
              <strong>{finalStats.embedded.toLocaleString()}</strong> have search vectors
              {finalStats.total !== finalStats.embedded && (
                <span className="text-red-600 dark:text-red-400">
                  {" "}
                  · {(finalStats.total - finalStats.embedded).toLocaleString()} still pending — run again to finish
                </span>
              )}
            </p>
            {finalStats.retired > 0 && (
              <p>
                <strong>{finalStats.retired.toLocaleString()}</strong> retired (hidden from search,
                still viewable)
              </p>
            )}
            {reconciled && (
              <p className="text-red-600 dark:text-red-400">
                A reconciliation pass was needed — the first pass left rows missing.
              </p>
            )}
            {!!retireResult?.restored && (
              <p className="text-teal-700 dark:text-teal-400">
                <strong>{retireResult.restored.toLocaleString()}</strong> previously retired item(s)
                reappeared in this file and were restored.
              </p>
            )}
          </div>

          {!!retireResult?.retired && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {retireResult.retired.toLocaleString()} item(s) retired — absent from this file
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Kept in the database, not deleted: saved favourites and past claims still resolve to
                them. They no longer appear in search. If this file was incomplete, re-upload the
                correct one and they will be restored automatically.
              </p>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-500 mt-2 break-all">
                {retireResult.retiredSample.join(", ")}
                {retireResult.retired > retireResult.retiredSample.length &&
                  ` … +${(retireResult.retired - retireResult.retiredSample.length).toLocaleString()} more`}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Logs ───────────────────────────────────────────────────────────── */}
      {logs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              Logs
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {logs.length} line{logs.length === 1 ? "" : "s"}
              </span>
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  logs.map((l) => `[${l.time}] ${l.msg}`).join("\n"),
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="bg-slate-950 max-h-80 overflow-y-auto px-5 py-4 font-mono text-xs leading-relaxed">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-slate-600 shrink-0 tabular-nums">{l.time}</span>
                <span className={`${LOG_COLOURS[l.level]} break-all`}>{l.msg}</span>
              </div>
            ))}
            {busy && (
              <div className="flex gap-3 text-slate-500">
                <span className="shrink-0 tabular-nums">{"        "}</span>
                <span className="animate-pulse">▍</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {phase === "error" && error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">Update failed</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{error}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Nothing is lost — rows already written are kept and vectors are only built for rows
            missing one. Fix the cause and run the same file again.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Celebration overlay ────────────────────────────────────────────────── */

const CONFETTI_COLOURS = [
  "#0d9488", // teal-600
  "#14b8a6", // teal-500
  "#5eead4", // teal-300
  "#f59e0b", // amber-500
  "#fbbf24", // amber-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
];

/**
 * Full-screen confirmation that the run finished.
 *
 * A full ingest is a few minutes behind two progress bars, long enough that an
 * admin will have switched tabs. This makes the finish unmissable and puts the
 * headline numbers in front of them without reading the log.
 *
 * Confetti geometry is randomised once on mount rather than per render — this
 * component only mounts after the run completes, so there is no SSR pass to
 * mismatch against.
 */
function Celebration({
  mode,
  fileName,
  stats,
  totals,
  onDismiss,
}: {
  mode: "upload" | "embed" | "titles" | "titleVectors";
  fileName: string | null;
  stats: MbsStats;
  totals: Totals;
  onDismiss: () => void;
}) {
  // Honour the OS "reduce motion" setting: show the card, skip the confetti.
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const pieces = useMemo(
    () =>
      reduceMotion
        ? []
        : Array.from({ length: 90 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.8,
            duration: 2.4 + Math.random() * 2.2,
            drift: (Math.random() - 0.5) * 160,
            spin: (Math.random() - 0.5) * 900,
            size: 6 + Math.random() * 8,
            colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
            round: i % 3 === 0,
          })),
    [reduceMotion],
  );

  // Escape closes it, matching every other dismissible overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      {/* Confetti — pointer-events-none so it never blocks the dismiss click */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: "110vh", x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9, 0] }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              backgroundColor: p.colour,
              borderRadius: p.round ? "9999px" : "2px",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center"
      >
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-4 text-lg leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {mode === "embed"
            ? "Embeddings complete"
            : mode === "titles"
              ? "Titles generated"
              : mode === "titleVectors"
                ? "Title vectors complete"
                : "MBS database updated"}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {mode === "embed" ? (
            "Every live item now has a search vector."
          ) : mode === "titles" ? (
            "Every live item now has a short clinical title."
          ) : mode === "titleVectors" ? (
            "Every title is now searchable by meaning."
          ) : fileName ? (
            <>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{fileName}</span>{" "}
              is loaded and searchable.
            </>
          ) : (
            "All items are loaded and searchable."
          )}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <Tile label="Items in database" value={stats.total} accent />
          {mode === "titles" ? (
            <Tile label="Titles" value={stats.titled} accent />
          ) : mode === "titleVectors" ? (
            <Tile label="Title vectors" value={stats.titleEmbedded} accent />
          ) : (
            <Tile label="Search vectors built" value={stats.embedded} accent />
          )}
          {mode === "upload" && (
            <>
              <Tile label="Added" value={totals.inserted} />
              <Tile label="Updated" value={totals.updated} />
              <Tile label="Unchanged" value={totals.unchanged} />
            </>
          )}
          {stats.retired > 0 && <Tile label="Retired" value={stats.retired} />}
        </div>

        <button
          onClick={onDismiss}
          className="mt-7 w-full px-4 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors"
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

function Tile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent
          ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/40"
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div
        className={`mt-0.5 text-xl font-bold tabular-nums ${
          accent
            ? "text-teal-700 dark:text-teal-300"
            : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

/* ── Small presentational helpers ───────────────────────────────────────── */

/** One outstanding pipeline stage: what is missing, why it matters, how to fix. */
function Stage({
  pending,
  noun,
  explanation,
  buttonLabel,
  busyLabel,
  busy,
  active,
  onRun,
}: {
  pending: number;
  noun: string;
  explanation: string;
  buttonLabel: string;
  busyLabel: string;
  busy: boolean;
  active: boolean;
  onRun: () => void;
}) {
  if (pending === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
        {pending.toLocaleString()} item(s) have no {noun}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
        {explanation}
      </p>
      <button
        onClick={onRun}
        disabled={busy}
        className="mt-3 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        {busy && active ? busyLabel : buttonLabel}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
      <span className="text-slate-400 dark:text-slate-500 font-medium">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Progress({
  title,
  pct,
  detail,
  active,
}: {
  title: string;
  pct: number;
  detail: string;
  active: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-semibold ${
            active ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-200"
          }`}
        >
          {title}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{detail}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-teal-600 rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
