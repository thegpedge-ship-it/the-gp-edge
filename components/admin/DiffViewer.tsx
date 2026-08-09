"use client";

import React, { useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Word-level Myers diff — no external dependencies
// ─────────────────────────────────────────────────────────────────────────────

type DiffOp = { type: "equal" | "insert" | "delete"; value: string };

function tokenize(text: string): string[] {
  // Fine-grained tokenization: split into words/letters, individual punctuation symbols (e.g. '.', ',', '-'), and whitespace
  return text.match(/[\w']+|[^\w\s]|\s+/g) ?? [];
}

function decodeEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function htmlToDiffText(html: string): string {
  if (!html) return "";
  let processed = html;

  // 1. Convert <img> tags to [Image: filename/alt]
  processed = processed.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']+)["'][^>]*\/?>/gi, " [Image: $2] ");
  processed = processed.replace(/<img[^>]*alt=["']([^"']+)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi, " [Image: $1] ");
  processed = processed.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (_, src) => {
    const filename = src.split("/").pop() || src;
    return ` [Image: ${filename}] `;
  });
  processed = processed.replace(/<img[^>]*\/?>/gi, " [Image] ");

  // 2. Convert Callout blocks (<div class="callout-block" ...>)
  processed = processed.replace(/<div[^>]*class=["'][^"']*callout-block[^"']*["'][^>]*>/gi, "\n[Callout Box]\n");

  // 3. Convert Table elements to clean readable table rows (• Cell 1 │ Cell 2)
  processed = processed.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, rowContent) => {
    const cells: string[] = [];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let match;
    while ((match = cellRegex.exec(rowContent)) !== null) {
      const cellText = decodeEntities(match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
      if (cellText) cells.push(cellText);
    }
    return cells.length > 0 ? `\n• ${cells.join(" │ ")}\n` : "";
  });
  processed = processed.replace(/<\/?(table|thead|tbody|tfoot)[^>]*>/gi, "\n");

  // 4. Convert headers and block elements to line breaks
  processed = processed.replace(/<br\s*\/?>/gi, "\n");
  processed = processed.replace(/<\/p>/gi, "\n");
  processed = processed.replace(/<\/h[1-6]>/gi, "\n");
  processed = processed.replace(/<\/li>/gi, "\n");

  // 5. Strip any remaining HTML tags and decode HTML entities
  processed = decodeEntities(processed.replace(/<[^>]*>/g, " "));

  // 6. Clean up extra spaces while preserving line breaks
  return processed
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function stripHtmlTags(html: string): string {
  return htmlToDiffText(html);
}

function computeDiff(oldText: string, newText: string): DiffOp[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const m = a.length;
  const n = b.length;

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Traceback
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: "equal", value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "insert", value: b[j - 1] });
      j--;
    } else {
      ops.unshift({ type: "delete", value: a[i - 1] });
      i--;
    }
  }
  return ops;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hunk extraction — only changed chunks + surrounding context
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXT_WORDS = 18; // words of context around each change

type Hunk = DiffOp[];

function extractHunks(ops: DiffOp[]): Hunk[] {
  // Find indices of all non-equal ops
  const changeIdxs: number[] = [];
  ops.forEach((op, i) => {
    if (op.type !== "equal") changeIdxs.push(i);
  });

  if (changeIdxs.length === 0) return [];

  // Build ranges [start, end] in token index space with context
  const ranges: [number, number][] = [];
  let start = Math.max(0, changeIdxs[0] - CONTEXT_WORDS);
  let end = Math.min(ops.length - 1, changeIdxs[0] + CONTEXT_WORDS);

  for (let k = 1; k < changeIdxs.length; k++) {
    const nextStart = Math.max(0, changeIdxs[k] - CONTEXT_WORDS);
    if (nextStart <= end + 1) {
      // Merge with previous range
      end = Math.min(ops.length - 1, changeIdxs[k] + CONTEXT_WORDS);
    } else {
      ranges.push([start, end]);
      start = nextStart;
      end = Math.min(ops.length - 1, changeIdxs[k] + CONTEXT_WORDS);
    }
  }
  ranges.push([start, end]);

  return ranges.map(([s, e]) => ops.slice(s, e + 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────────────────────────────────────

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  stripHtml?: boolean;
  mode?: "inline" | "sidebyside" | "hunks";
  maxChars?: number;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function DiffViewer({
  oldContent,
  newContent,
  stripHtml = true,
  mode = "hunks",
  maxChars = 12000,
  className = "",
}: DiffViewerProps) {
  const { ops, hunks, stats } = useMemo(() => {
    let a = oldContent || "";
    let b = newContent || "";
    if (stripHtml) {
      const strippedA = stripHtmlTags(a);
      const strippedB = stripHtmlTags(b);
      // Fallback to raw HTML diffing if text content is identical but HTML markup/formatting changed
      if (strippedA === strippedB && a.trim() !== b.trim()) {
        a = a.trim();
        b = b.trim();
      } else {
        a = strippedA;
        b = strippedB;
      }
    }
    if (a.length > maxChars) a = a.slice(0, maxChars) + "… [truncated]";
    if (b.length > maxChars) b = b.slice(0, maxChars) + "… [truncated]";

    const ops = computeDiff(a, b);
    const hunks = extractHunks(ops);
    const added = ops.filter((o) => o.type === "insert").reduce((s, o) => s + o.value.trim().length, 0);
    const removed = ops.filter((o) => o.type === "delete").reduce((s, o) => s + o.value.trim().length, 0);
    return { ops, hunks, stats: { added, removed } };
  }, [oldContent, newContent, stripHtml, maxChars]);

  const hasChanges = ops.some((op) => op.type !== "equal");

  if (!hasChanges) {
    return (
      <div className={`flex flex-col items-center justify-center py-10 gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No differences found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">This version is identical to the current content.</p>
      </div>
    );
  }

  // Summary bar
  const summaryBar = (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold mb-4">
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        +{stats.added} chars added
      </div>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
      <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        −{stats.removed} chars removed
      </div>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
      <div className="text-slate-400 dark:text-slate-500">
        {hunks.length} changed {hunks.length === 1 ? "section" : "sections"}
      </div>
    </div>
  );

  if (mode === "sidebyside") {
    return (
      <div className={className}>
        {summaryBar}
        <HunksSideBySide hunks={hunks} />
      </div>
    );
  }

  if (mode === "hunks" || mode === "inline") {
    return (
      <div className={className}>
        {summaryBar}
        <HunksInline hunks={hunks} />
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hunks inline view — shows only changed regions with context
// ─────────────────────────────────────────────────────────────────────────────

function HunksInline({ hunks }: { hunks: Hunk[] }) {
  return (
    <div className="space-y-3">
      {hunks.map((hunk, hi) => (
        <div
          key={hi}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* Hunk label */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Change {hi + 1}
            </span>
          </div>
          <div className="p-3 text-[13px] leading-relaxed break-words font-sans text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
            {hunk.map((op, i) => {
              if (op.type === "equal") {
                return (
                  <span key={i} className="text-slate-500 dark:text-slate-500">
                    {op.value}
                  </span>
                );
              }
              if (op.type === "insert") {
                return (
                  <ins
                    key={i}
                    className="no-underline bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-sm px-0.5 mx-px"
                    title="Added"
                  >
                    {op.value}
                  </ins>
                );
              }
              return (
                <del
                  key={i}
                  className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-sm px-0.5 mx-px"
                  title="Removed"
                >
                  {op.value}
                </del>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hunks side-by-side view
// ─────────────────────────────────────────────────────────────────────────────

function HunksSideBySide({ hunks }: { hunks: Hunk[] }) {
  return (
    <div className="space-y-3">
      {hunks.map((hunk, hi) => {
        const oldParts = hunk
          .filter((op) => op.type !== "insert")
          .map((op, i) => {
            if (op.type === "equal") {
              return (
                <span key={i} className="text-slate-500 dark:text-slate-500">
                  {op.value}
                </span>
              );
            }
            return (
              <del
                key={i}
                className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-sm px-0.5"
              >
                {op.value}
              </del>
            );
          });

        const newParts = hunk
          .filter((op) => op.type !== "delete")
          .map((op, i) => {
            if (op.type === "equal") {
              return (
                <span key={i} className="text-slate-500 dark:text-slate-500">
                  {op.value}
                </span>
              );
            }
            return (
              <ins
                key={i}
                className="no-underline bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-sm px-0.5"
              >
                {op.value}
              </ins>
            );
          });

        return (
          <div
            key={hi}
            className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Change {hi + 1}
              </span>
            </div>
            <div className="grid grid-cols-2">
              {/* Before */}
              <div className="border-r border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-[9px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Before</span>
                </div>
                <div className="p-3.5 text-[12.5px] leading-relaxed font-sans break-words whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-red-50/20 dark:bg-red-950/5">
                  {oldParts}
                </div>
              </div>

              {/* After */}
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">After</span>
                </div>
                <div className="p-3.5 text-[12.5px] leading-relaxed font-sans break-words whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-emerald-50/20 dark:bg-emerald-950/5">
                  {newParts}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats helper — exported for use in sidebar
// ─────────────────────────────────────────────────────────────────────────────

export function diffStats(
  oldContent: string,
  newContent: string
): { added: number; removed: number; unchanged: number } {
  const a = stripHtmlTags(oldContent || "");
  const b = stripHtmlTags(newContent || "");
  const ops = computeDiff(a, b);
  return {
    added: ops
      .filter((op) => op.type === "insert")
      .reduce((s, op) => s + op.value.length, 0),
    removed: ops
      .filter((op) => op.type === "delete")
      .reduce((s, op) => s + op.value.length, 0),
    unchanged: ops
      .filter((op) => op.type === "equal")
      .reduce((s, op) => s + op.value.length, 0),
  };
}
