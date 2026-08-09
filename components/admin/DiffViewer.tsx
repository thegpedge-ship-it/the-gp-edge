"use client";

import React, { useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Word-level Myers diff — no external dependencies
// ─────────────────────────────────────────────────────────────────────────────

type DiffOp = { type: "equal" | "insert" | "delete"; value: string };

function tokenize(text: string): string[] {
  // Split on whitespace boundaries, keeping delimiters
  return text.split(/(\s+)/);
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function computeDiff(oldText: string, newText: string): DiffOp[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);

  // Simple LCS-based diff (O(n*m) — acceptable for typical edit sizes)
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
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
// Component props
// ─────────────────────────────────────────────────────────────────────────────

interface DiffViewerProps {
  /** Old (before) content — HTML or plain text */
  oldContent: string;
  /** New (after) content — HTML or plain text */
  newContent: string;
  /** If true, strip HTML tags before diffing */
  stripHtml?: boolean;
  /** Display mode */
  mode?: "inline" | "sidebyside";
  /** Max chars to show (truncates very long diffs for performance) */
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
  mode = "inline",
  maxChars = 8000,
  className = "",
}: DiffViewerProps) {
  const { ops, oldText, newText } = useMemo(() => {
    let a = oldContent || "";
    let b = newContent || "";
    if (stripHtml) {
      a = stripHtmlTags(a);
      b = stripHtmlTags(b);
    }
    // Truncate for very large documents
    if (a.length > maxChars) a = a.slice(0, maxChars) + "… [truncated]";
    if (b.length > maxChars) b = b.slice(0, maxChars) + "… [truncated]";

    const ops = computeDiff(a, b);
    return { ops, oldText: a, newText: b };
  }, [oldContent, newContent, stripHtml, maxChars]);

  const hasChanges = ops.some((op) => op.type !== "equal");

  if (!hasChanges) {
    return (
      <div className={`text-xs text-slate-400 italic py-2 ${className}`}>
        No text differences detected.
      </div>
    );
  }

  if (mode === "sidebyside") {
    return <SideBySide ops={ops} oldText={oldText} newText={newText} className={className} />;
  }

  return <InlineDiff ops={ops} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline diff view
// ─────────────────────────────────────────────────────────────────────────────

function InlineDiff({ ops, className }: { ops: DiffOp[]; className: string }) {
  return (
    <div className={`text-[13px] leading-relaxed font-mono break-words ${className}`}>
      {ops.map((op, i) => {
        if (op.type === "equal") {
          return (
            <span key={i} className="text-slate-600 dark:text-slate-400">
              {op.value}
            </span>
          );
        }
        if (op.type === "insert") {
          return (
            <ins
              key={i}
              className="no-underline bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded px-0.5 mx-px"
              title="Added"
            >
              {op.value}
            </ins>
          );
        }
        // delete
        return (
          <del
            key={i}
            className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded px-0.5 mx-px"
            title="Removed"
          >
            {op.value}
          </del>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Side-by-side diff view
// ─────────────────────────────────────────────────────────────────────────────

function SideBySide({
  ops,
  oldText,
  newText,
  className,
}: {
  ops: DiffOp[];
  oldText: string;
  newText: string;
  className: string;
}) {
  // Build old and new annotated strings
  const oldParts = ops
    .filter((op) => op.type !== "insert")
    .map((op, i) => {
      if (op.type === "equal") {
        return (
          <span key={i} className="text-slate-600 dark:text-slate-400">
            {op.value}
          </span>
        );
      }
      return (
        <del
          key={i}
          className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded px-0.5"
        >
          {op.value}
        </del>
      );
    });

  const newParts = ops
    .filter((op) => op.type !== "delete")
    .map((op, i) => {
      if (op.type === "equal") {
        return (
          <span key={i} className="text-slate-600 dark:text-slate-400">
            {op.value}
          </span>
        );
      }
      return (
        <ins
          key={i}
          className="no-underline bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded px-0.5"
        >
          {op.value}
        </ins>
      );
    });

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {/* Before */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            Before
          </span>
        </div>
        <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 text-[12px] leading-relaxed font-mono break-words max-h-48 overflow-y-auto">
          {oldParts}
        </div>
      </div>

      {/* After */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            After
          </span>
        </div>
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 text-[12px] leading-relaxed font-mono break-words max-h-48 overflow-y-auto">
          {newParts}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats helper — exported for use in sidebar
// ─────────────────────────────────────────────────────────────────────────────

export function diffStats(oldContent: string, newContent: string): {
  added: number;
  removed: number;
  unchanged: number;
} {
  const a = stripHtmlTags(oldContent || "");
  const b = stripHtmlTags(newContent || "");
  const ops = computeDiff(a, b);
  return {
    added: ops.filter((op) => op.type === "insert").reduce((s, op) => s + op.value.length, 0),
    removed: ops.filter((op) => op.type === "delete").reduce((s, op) => s + op.value.length, 0),
    unchanged: ops.filter((op) => op.type === "equal").reduce((s, op) => s + op.value.length, 0),
  };
}
