"use client";

import { useState, Suspense, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import FlowchartBuilder from "@/components/admin/FlowchartBuilder";
import { 
  fetchMedicalContent, 
  getMedicalContent,
  saveMedicalContent, 
  saveMedicalContentItem,
  updateMedicalContentItem,
  MedicalContent, 
  fetchQuestions,
  getQuestions, 
  Question
} from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";
import { uploadToR2 } from "@/lib/r2Client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { syncQuizToDbAction } from "@/actions/quiz.actions";
import EditHistorySidebar, { EditHistoryEntry } from "@/components/admin/EditHistorySidebar";
import { VersionInfo } from "@/components/admin/VersionPreviewModal";

// ─────────────────────────────────────────────────────────────
// Ribbon button helpers
// ─────────────────────────────────────────────────────────────
function RibbonBtn({
  title, onClick, active = false, disabled = false, children,
}: {
  title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded
        text-[9px] font-semibold min-w-[40px] h-[54px] transition-all border
        ${active
          ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-300"
          : disabled
            ? "opacity-30 cursor-not-allowed border-transparent text-slate-400 dark:text-slate-600"
            : "bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
        }
      `}
    >
      {children}
    </button>
  );
}

function ToolbarBtn({
  title, onClick, active = false, disabled = false, children, className = "",
}: {
  title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${
        active
          ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
          : disabled
            ? "text-slate-300 bg-slate-100 dark:bg-slate-950/20 cursor-not-allowed"
            : "text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function RibbonSep() {
  return <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />;
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />;
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-0.5 flex-wrap">{children}</div>
      <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

function decodeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

interface ContentBlock {
  id: string;
  type: "heading" | "paragraph" | "list" | "callout" | "code" | "table" | "divider" | "image";
  content: string;
  meta?: Record<string, string>;
}

const initialBlocks: ContentBlock[] = [
  { id: "b1", type: "heading", content: "[Enter Title Here]" },
  { id: "b2", type: "heading", content: "1. Overview" },
  { id: "b3", type: "paragraph", content: "[Enter Overview Here]" },
  { id: "b4", type: "heading", content: "2. Pathophysiology" },
  { id: "b5", type: "paragraph", content: "[Enter Pathophysiology Here]" },
  { id: "b6", type: "heading", content: "3. Clinical Features" },
  { id: "b7", type: "list", content: "[Enter Clinical Feature 1]\n[Enter Clinical Feature 2]" },
  { id: "b8", type: "heading", content: "4. Diagnosis & Investigations" },
  { id: "b9", type: "paragraph", content: "[Enter Diagnosis & Investigations Here]" },
  { id: "b10", type: "callout", content: "Diagnostic Reference & Key Points:\n• [Enter Key Point 1]\n• [Enter Key Point 2]", meta: { variant: "info" } },
  { id: "b11", type: "heading", content: "5. Management" },
  { id: "b12", type: "paragraph", content: "[Enter Management Here]" },
  { id: "b13", type: "heading", content: "5a. Non-Pharmacological Management" },
  { id: "b14", type: "list", content: "[Enter Non-Pharmacological Management Item 1]\n[Enter Non-Pharmacological Management Item 2]" },
  { id: "b15", type: "heading", content: "5b. Pharmacological Management" },
  { id: "b16", type: "table", content: "Drug Class / Example|Starting Dose|Maximum Dose|Titration & Key Side Effects\n[Enter Drug]|[Enter Starting Dose]|[Enter Max Dose]|[Enter Titration Notes]" },
  { id: "b17", type: "heading", content: "6. Complications" },
  { id: "b18", type: "table", content: "Complication / Risk|Clinical Notes / Prevention\n[Enter Complication]|[Enter Notes]" },
  { id: "b19", type: "heading", content: "7. When to Refer" },
  { id: "b20", type: "list", content: "[Enter Referral Criteria 1]\n[Enter Referral Criteria 2]" },
  { id: "b21", type: "heading", content: "8. Prognosis" },
  { id: "b22", type: "list", content: "[Enter Prognosis Item 1]\n[Enter Prognosis Item 2]" },
  { id: "b23", type: "heading", content: "9. Resources" },
  { id: "b24", type: "list", content: "[Enter Resource 1]\n[Enter Resource 2]" }
];

const initialReferences = [
  { id: 1, text: "[Enter Reference 1 Here]", url: "#" },
  { id: 2, text: "[Enter Reference 2 Here]", url: "#" }
];


function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case "heading":
        return `<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">${block.content}</h2>`;
      case "paragraph":
        return `<p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">${block.content}</p>`;
      case "list":
        const items = block.content.split("\n").map(item => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${item}</li>`).join("");
        return `<ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">${items}</ul>`;
      case "callout": {
        const variant = block.meta?.variant || "info";
        let bg = "#e6f7f4";
        let border = "#e6f7f4";
        let color = "#1a5c51";
        let titleColor = "#2bb09c";
        let label = "Guideline";
        let icon = "";
        if (variant === "billing") {
          bg = "#f8fafc";
          border = "#f8fafc";
          color = "#334155";
          titleColor = "#475569";
          label = "Billing";
          icon = "";
        } else if (variant === "pearl") {
          bg = "#e6f7f4";
          border = "#e6f7f4";
          color = "#1a5c51";
          titleColor = "#2bb09c";
          label = "Key Points";
          icon = "";
        } else if (variant === "warning") {
          bg = "#fff9e6";
          border = "#fff9e6";
          color = "#7b341e";
          titleColor = "#dd6b20";
          label = "Warning / Caution";
          icon = "";
        } else if (variant === "danger") {
          bg = "#fff5f5";
          border = "#fff5f5";
          color = "#9b2c2c";
          titleColor = "#c53030";
          label = "Red Flags / Important";
          icon = "";
        }
        return `
          <div class="callout-block" data-variant="${variant}" style="background-color: ${bg}; border: 1px solid ${border}; border-left: 5px solid ${titleColor}; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: ${color};">
            <div style="font-weight: bold; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: ${titleColor};">${icon} ${label}</div>
            <div style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; line-height: 1.6;">${block.content}</div>
          </div>
        `;
      }
      case "table": {
        const rows = block.content.split("\n").map(r => r.split("|"));
        const ths = rows[0]?.map(cell => `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #16a34a; border: 1px solid #cbd5e1; color: #ffffff;">${cell}</th>`).join("");
        const tds = rows.slice(1).map((row, ri) => {
          const bg = "#ffffff";
          const cells = row.map((cell, ci) => `<td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; background-color: ${bg}; color: ${ci === 0 ? "#0f172a" : "#475569"};">${cell}</td>`).join("");
          return `<tr>${cells}</tr>`;
        }).join("");
        return `
          <div style="overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 0.75rem; margin-bottom: 1.25rem; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead><tr>${ths}</tr></thead>
              <tbody>${tds}</tbody>
            </table>
          </div>
        `;
      }
      case "divider":
        return `<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 1.75rem 0;" />`;
      case "code":
        return `<pre style="font-family: monospace; font-size: 0.825rem; background-color: #0f172a; color: #f1f5f9; padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; white-space: pre-wrap; margin-bottom: 1.25rem;">${block.content}</pre>`;
      case "image":
        return `<img src="${block.content}" alt="Image" style="border-radius: 0.75rem; max-width: 100%; height: auto; display: block; margin: 1.25rem auto;" />`;
      default:
        return "";
    }
  }).join("");
}

import { splitHtmlIntoPages } from "@/utils/pdfPagination";

function cleanTableHtmlStyles(html: string): string {
  return html;
}

function ContentEditorContent() {
  const { currentAdmin } = useAdminRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const id = idStr || "";

  const [medicalContents, setMedicalContents] = useState<MedicalContent[]>([]);
  const [contentItem, setContentItem] = useState<MedicalContent | null>(null);

  const [docTitle, setDocTitle] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("Endocrine");
  const [selectedCategory, setSelectedCategory] = useState("Chronic Disease");
  const [contentStatus, setContentStatus] = useState<"draft" | "review" | "published" | "archived">("published");
  const [isFree, setIsFree] = useState(false);
  const [editTriggerCount, setEditTriggerCount] = useState(0);
  const [author, setAuthor] = useState("GP Edge Content Team");
  const [tags, setTags] = useState<string[]>(["Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS"]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"meta" | "refs" | "pages" | "history">("meta");

  // Edit History & Version History state
  const [historyLog, setHistoryLog] = useState<EditHistoryEntry[]>([]);
  const [versionList, setVersionList] = useState<VersionInfo[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const previousHtmlRef = useRef<string>("");

  // Multi-page support
  const [pages, setPages] = useState<string[]>([""]);  // Array of page HTML
  const [activePage, setActivePage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Zoom & scaling support
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Word & character counts
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Linked questions state
  const [linkedQuestionIds, setLinkedQuestionIds] = useState<number[]>([]);
  const [showLinkQuestionModal, setShowLinkQuestionModal] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // References states
  interface Reference {
    id: number;
    text: string;
    url: string;
  }
  const [docReferences, setDocReferences] = useState<Reference[]>([]);
  const [newRefText, setNewRefText] = useState("");
  const [newRefUrl, setNewRefUrl] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  // Save the last valid selection range inside the editor
  const savedEditorRangeRef = useRef<Range | null>(null);

  // Ribbon layout states
  const [ribbonTab, setRibbonTab] = useState<"home" | "insert" | "layout">("home");
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [editingFlowchartEl, setEditingFlowchartEl] = useState<HTMLElement | null>(null);
  const [editingFlowchartData, setEditingFlowchartData] = useState<{ nodes: unknown[]; edges: unknown[] } | null>(null);

  // Dropdown / Popover anchors (coord positioning to escape overflow clipping)
  const [tableAnchor, setTableAnchor] = useState<{ top: number; left: number } | null>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<{ top: number; left: number } | null>(null);
  const [imageAnchor, setImageAnchor] = useState<{ top: number; left: number } | null>(null);
  const [linkAnchorPos, setLinkAnchorPos] = useState<{ top: number; left: number } | null>(null);

  // Popover menu states
  const [statusOpen, setStatusOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [calloutMenuOpen, setCalloutMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Link modal variables
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Popover inputs
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("4");
  const [imageUrl, setImageUrl] = useState("");

  const fontOptions = [
    { value: "'DM Sans', sans-serif", label: "DM Sans" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Verdana, sans-serif", label: "Verdana" },
    { value: "'Courier New', monospace", label: "Courier New" }
  ];
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);

  const fontSizeOptions = [
    { value: "1", label: "8pt" },
    { value: "2", label: "10pt" },
    { value: "3", label: "12pt" },
    { value: "4", label: "14pt" },
    { value: "5", label: "18pt" },
    { value: "6", label: "24pt" },
    { value: "7", label: "36pt" }
  ];
  const [selectedSize, setSelectedSize] = useState(fontSizeOptions[2]);

  // Table tools states
  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null);
  const [activeRow, setActiveRow] = useState<HTMLTableRowElement | null>(null);
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);

  // Refs
  const linkBtnRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null); // For document template upload if any

  // Dropdown Refs
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Popover Refs
  const calloutMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);

  // Trigger Button Refs to prevent popover ref sharing issues
  const calloutBtnRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLDivElement>(null);
  const templateBtnRef = useRef<HTMLDivElement>(null);

  const getActiveTableCellAndRow = () => {
    if (typeof window === "undefined") return { cell: null, row: null, table: null };
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { cell: null, row: null, table: null };
    
    let node = selection.getRangeAt(0).startContainer;
    let cell: HTMLTableCellElement | null = null;
    let row: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;
    
    while (node && editorRef.current && editorRef.current.contains(node)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as HTMLElement).tagName.toLowerCase();
        if (tagName === "td" || tagName === "th") {
          cell = node as HTMLTableCellElement;
        } else if (tagName === "tr") {
          row = node as HTMLTableRowElement;
        } else if (tagName === "table") {
          table = node as HTMLTableElement;
          break;
        }
      }
      node = node.parentNode as Node;
    }
    return { cell, row, table };
  };

  const handleSelectionOrClick = () => {
    // Small delay to let DOM settle after click/selection
    setTimeout(() => {
      const { cell, row, table } = getActiveTableCellAndRow();
      setActiveCell(cell);
      setActiveRow(row);
      setActiveTable(table);
    }, 30);
  };

  // Calculate dropdown menu anchor coordinates
  const calcAnchor = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    const r = ref.current.getBoundingClientRect();
    return { top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX };
  };

  // Dropdown click outside listeners & table selection listeners
  useEffect(() => {
    function handleClickOutsideDropdowns(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setSizeOpen(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) {
        setTextColorOpen(false);
      }
      if (highlightColorRef.current && !highlightColorRef.current.contains(e.target as Node)) {
        setHighlightColorOpen(false);
      }
      if (linkBtnRef.current && !linkBtnRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-insert-dropdown="link"]')) {
        setLinkOpen(false);
      }

      // Close fixed dropdowns if clicked outside the insert tabs
      const tgt = e.target as HTMLElement;
      if (!tgt.closest("[data-insert-dropdown]")) {
        if (!calloutMenuRef.current?.contains(tgt) && !calloutBtnRef.current?.contains(tgt)) { setCalloutMenuOpen(false); setCalloutAnchor(null); }
        if (!imageMenuRef.current?.contains(tgt) && !imageBtnRef.current?.contains(tgt)) { setImageMenuOpen(false); setImageAnchor(null); }
        if (!tableMenuRef.current?.contains(tgt) && !tableBtnRef.current?.contains(tgt)) { setTableMenuOpen(false); setTableAnchor(null); }
        if (!templateMenuRef.current?.contains(tgt) && !templateBtnRef.current?.contains(tgt)) { setTemplateMenuOpen(false); }
      }
    }

    const handleMouseUpInEditor = (e: MouseEvent) => {
      if (editorRef.current && editorRef.current.contains(e.target as Node)) {
        handleSelectionOrClick();
      } else {
        const target = e.target as Node;
        if (!target || !(target as HTMLElement).closest?.('[data-toolbar]')) {
          setTimeout(() => {
            if (document.activeElement !== editorRef.current) {
              const { cell, row, table } = getActiveTableCellAndRow();
              setActiveCell(cell);
              setActiveRow(row);
              setActiveTable(table);
            }
          }, 50);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutsideDropdowns);
    document.addEventListener("mouseup", handleMouseUpInEditor);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideDropdowns);
      document.removeEventListener("mouseup", handleMouseUpInEditor);
    };
  }, []);

  // ── Interactive element interactivity: flowcharts, images, tables, callouts (drag, resize, select) ──
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    let selectedEl: HTMLElement | null = null;

    const highlight = (el: HTMLElement, on: boolean) => {
      el.style.borderColor = on ? "#0ea5e9" : "transparent";
      el.style.boxShadow = on ? "0 0 0 3px rgba(14,165,233,0.2)" : "none";
      el.style.outline = "none";
    };

    const deselectAll = () => {
      editor.querySelectorAll<HTMLElement>(".fc-wrapper,.img-wrapper,.tbl-wrapper,.callout-block").forEach(el => {
        highlight(el, false);
        el.querySelectorAll<HTMLElement>("[data-action]").forEach(btn => {
          const tb = btn.parentNode as HTMLElement;
          if (tb && el !== document.querySelector(":hover")) tb.style.display = "none";
        });
      });
      selectedEl = null;
    };

    const attachFc = (wrapper: HTMLElement) => {
      if (wrapper.dataset.fcAttached) return;
      wrapper.dataset.fcAttached = "1";
      wrapper.setAttribute("contenteditable", "false");
      wrapper.setAttribute("draggable", "true");
      wrapper.style.cursor = "move";

      const toolbar = document.createElement("div");
      toolbar.setAttribute("contenteditable", "false");
      Object.assign(toolbar.style, {
        position: "absolute", top: "-34px", right: "0",
        display: "none", alignItems: "center", gap: "4px",
        background: "#1e293b", borderRadius: "8px", padding: "3px 6px",
        zIndex: "20", pointerEvents: "all", userSelect: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      });
      toolbar.innerHTML = `
        <button data-action="edit" title="Edit Flowchart" style="background:none;border:none;cursor:pointer;color:#94d1f5;padding:2px 6px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:3px;white-space:nowrap">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit
        </button>
        <div style="width:1px;height:14px;background:#334155"></div>
        <button data-action="delete" title="Delete" style="background:none;border:none;cursor:pointer;color:#f87171;padding:2px 6px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:3px;white-space:nowrap">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>Delete
        </button>`;
      wrapper.style.position = "relative";
      wrapper.appendChild(toolbar);

      wrapper.addEventListener("mouseenter", () => { toolbar.style.display = "flex"; });
      wrapper.addEventListener("mouseleave", () => { if (selectedEl !== wrapper) toolbar.style.display = "none"; });

      toolbar.querySelector<HTMLElement>("[data-action='edit']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          const raw = wrapper.getAttribute("data-fc") || "";
          const decoded = decodeURIComponent(escape(atob(raw)));
          const data = JSON.parse(decoded);
          setEditingFlowchartEl(wrapper);
          setEditingFlowchartData(data);
          setShowFlowchart(true);
        } catch {
          setEditingFlowchartEl(wrapper);
          setEditingFlowchartData(null);
          setShowFlowchart(true);
        }
      });
      
      toolbar.querySelector<HTMLElement>("[data-action='delete']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.remove();
        selectedEl = null;
        saveToHistory();
      });

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        deselectAll();
        selectedEl = wrapper;
        highlight(wrapper, true);
        toolbar.style.display = "flex";
      });

      wrapper.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          const raw = wrapper.getAttribute("data-fc") || "";
          const decoded = decodeURIComponent(escape(atob(raw)));
          const data = JSON.parse(decoded);
          setEditingFlowchartEl(wrapper);
          setEditingFlowchartData(data);
          setShowFlowchart(true);
        } catch {
          setEditingFlowchartEl(wrapper);
          setEditingFlowchartData(null);
          setShowFlowchart(true);
        }
      });
    };

    const attachImg = (wrapper: HTMLElement) => {
      if (wrapper.dataset.imgAttached) return;
      wrapper.dataset.imgAttached = "1";
      wrapper.setAttribute("contenteditable", "false");
      wrapper.setAttribute("draggable", "true");
      wrapper.style.cursor = "move";

      const toolbar = document.createElement("div");
      toolbar.setAttribute("contenteditable", "false");
      Object.assign(toolbar.style, {
        position: "absolute", top: "-34px", right: "0",
        display: "none", alignItems: "center", gap: "4px",
        background: "#1e293b", borderRadius: "8px", padding: "3px 6px",
        zIndex: "20", pointerEvents: "all", userSelect: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      });
      toolbar.innerHTML = `
        <button data-action="delete" title="Delete Image" style="background:none;border:none;cursor:pointer;color:#f87171;padding:2px 6px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:3px;white-space:nowrap">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>Delete Image
        </button>`;
      wrapper.style.position = "relative";
      wrapper.appendChild(toolbar);

      wrapper.addEventListener("mouseenter", () => { toolbar.style.display = "flex"; });
      wrapper.addEventListener("mouseleave", () => { if (selectedEl !== wrapper) toolbar.style.display = "none"; });

      toolbar.querySelector<HTMLElement>("[data-action='delete']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.remove();
        selectedEl = null;
        saveToHistory();
      });

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        deselectAll();
        selectedEl = wrapper;
        highlight(wrapper, true);
        toolbar.style.display = "flex";
      });
    };

    const attachTbl = (wrapper: HTMLElement) => {
      if (wrapper.dataset.tblAttached) return;
      wrapper.dataset.tblAttached = "1";
      wrapper.setAttribute("draggable", "true");
      wrapper.style.cursor = "move";

      const toolbar = document.createElement("div");
      toolbar.className = "tbl-drag-handle";
      toolbar.setAttribute("contenteditable", "false");
      Object.assign(toolbar.style, {
        position: "absolute", top: "-34px", left: "50%", transform: "translateX(-50%)",
        display: "none", alignItems: "center", gap: "4px",
        background: "#1e293b", borderRadius: "8px", padding: "3px 6px",
        zIndex: "20", pointerEvents: "all", userSelect: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)", whiteSpace: "nowrap",
      });
      toolbar.innerHTML = `
        <button data-action="drag" title="Drag to move" style="background:none;border:none;cursor:move;color:#94a3b8;padding:2px 5px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:3px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>Move
        </button>
        <div style="width:1px;height:14px;background:#334155"></div>
        <button data-action="delete" title="Delete Table" style="background:none;border:none;cursor:pointer;color:#f87171;padding:2px 6px;border-radius:5px;font-size:10px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:3px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>Delete
        </button>`;
      wrapper.style.position = "relative";
      wrapper.appendChild(toolbar);

      wrapper.addEventListener("mouseenter", () => { toolbar.style.display = "flex"; });
      wrapper.addEventListener("mouseleave", () => { if (selectedEl !== wrapper) toolbar.style.display = "none"; });

      toolbar.querySelector<HTMLElement>("[data-action='delete']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.remove();
        selectedEl = null;
        setActiveCell(null); setActiveRow(null); setActiveTable(null);
        saveToHistory();
      });

      wrapper.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (t.tagName !== "TD" && t.tagName !== "TH") {
          deselectAll();
          selectedEl = wrapper; highlight(wrapper, true);
          toolbar.style.display = "flex";
        }
      });
    };

    const attachCallout = (wrapper: HTMLElement) => {
      if (wrapper.dataset.calloutAttached) return;
      wrapper.dataset.calloutAttached = "1";
      wrapper.setAttribute("draggable", "true");
      wrapper.style.cursor = "move";

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        deselectAll();
        selectedEl = wrapper;
        highlight(wrapper, true);
      });
    };

    editor.querySelectorAll<HTMLElement>(".fc-wrapper").forEach(attachFc);
    editor.querySelectorAll<HTMLElement>(".img-wrapper").forEach(attachImg);
    editor.querySelectorAll<HTMLElement>(".tbl-wrapper").forEach(attachTbl);
    editor.querySelectorAll<HTMLElement>(".callout-block").forEach(attachCallout);

    const observer = new MutationObserver(() => {
      editor.querySelectorAll<HTMLElement>(".fc-wrapper").forEach(attachFc);
      editor.querySelectorAll<HTMLElement>(".img-wrapper").forEach(attachImg);
      editor.querySelectorAll<HTMLElement>(".tbl-wrapper").forEach(attachTbl);
      editor.querySelectorAll<HTMLElement>(".callout-block").forEach(attachCallout);
    });
    observer.observe(editor, { childList: true, subtree: true });

    // Drag-and-drop block reordering
    let dragSourceEl: HTMLElement | null = null;

    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const block = target.closest(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block");
      if (block) {
        dragSourceEl = block as HTMLElement;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "");
        }
        dragSourceEl.style.opacity = "0.5";
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (!dragSourceEl) return;
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      const block = target.closest(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block") as HTMLElement | null;
      
      if (block && block !== dragSourceEl && editor.contains(block)) {
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "move";
        }
        
        editor.querySelectorAll(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block").forEach(el => {
          (el as HTMLElement).style.borderTop = "";
          (el as HTMLElement).style.borderBottom = "";
        });

        const rect = block.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
          block.style.borderTop = "2px solid #0f766e";
        } else {
          block.style.borderBottom = "2px solid #0f766e";
        }
      }
    };

    const onDrop = (e: DragEvent) => {
      if (!dragSourceEl) return;
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      const block = target.closest(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block") as HTMLElement | null;
      
      if (block && block !== dragSourceEl && editor.contains(block)) {
        const rect = block.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (e.clientY < midpoint) {
          block.parentNode?.insertBefore(dragSourceEl, block);
        } else {
          block.parentNode?.insertBefore(dragSourceEl, block.nextSibling);
        }
        saveToHistory();
      }
      
      dragSourceEl.style.opacity = "";
      dragSourceEl = null;
      
      editor.querySelectorAll(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block").forEach(el => {
        (el as HTMLElement).style.borderTop = "";
        (el as HTMLElement).style.borderBottom = "";
      });
    };

    const onDragEnd = () => {
      if (dragSourceEl) {
        dragSourceEl.style.opacity = "";
        dragSourceEl = null;
      }
      editor.querySelectorAll(".fc-wrapper, .img-wrapper, .tbl-wrapper, .callout-block").forEach(el => {
        (el as HTMLElement).style.borderTop = "";
        (el as HTMLElement).style.borderBottom = "";
      });
    };

    editor.addEventListener("dragstart", onDragStart);
    editor.addEventListener("dragover", onDragOver);
    editor.addEventListener("drop", onDrop);
    editor.addEventListener("dragend", onDragEnd);

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".fc-wrapper") && !t.closest(".img-wrapper") && !t.closest(".tbl-wrapper") && !t.closest(".callout-block")) {
        deselectAll();
      }
    };
    document.addEventListener("click", onDocClick);

    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEl) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) return;
        selectedEl.remove();
        selectedEl = null;
        saveToHistory();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      observer.disconnect();
      editor.removeEventListener("dragstart", onDragStart);
      editor.removeEventListener("dragover", onDragOver);
      editor.removeEventListener("drop", onDrop);
      editor.removeEventListener("dragend", onDragEnd);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pages, activePage]);

  // Load content metadata & body from Neon API
  useEffect(() => {
    const loadContent = async () => {
      let item: MedicalContent | null = null;
      let savedHtml = "";
      let hasLoadedDirectly = false;

      // 1. Try to load directly from the single item endpoint first to prevent list cache issues
      if (id && !String(id).startsWith("local")) {
        try {
          const res = await fetch(`/api/medical-content/${id}`);
          const json = await res.json();
          if (json.success && json.data) {
            const data = json.data;
            item = {
              id: data.id,
              name: data.name,
              system: data.system,
              category: data.category,
              type: data.type || "Document",
              status: data.status,
              author: data.author,
              lastUpdated: data.lastUpdated,
              tags: data.tags || [],
              references: data.references?.length ?? 0,
              pdfUrl: data.pdfUrl,
            };

            // Use fullHtml directly; if empty, assemble from sections
            savedHtml = (data.fullHtml || "").trim();

            if (!savedHtml && data.sections) {
              const s = data.sections as Record<string, string>;
              const sectionOrder = [
                { label: "1. Overview",                   key: "overview" },
                { label: "2. Pathophysiology",            key: "pathophysiology" },
                { label: "3. Clinical Features",          key: "clinical_features" },
                { label: "4. Diagnosis & Investigations", key: "diagnosis" },
                { label: "5. Management",                 key: "management" },
                { label: "6. Complications",              key: "complications" },
                { label: "7. When to Refer",              key: "when_to_refer" },
                { label: "8. Prognosis",                  key: "prognosis" },
                { label: "9. Resources",                  key: "resources" },
              ];
              savedHtml = sectionOrder
                .filter(({ key }) => s[key]?.trim())
                .map(({ label, key }) =>
                  `<h2 style="font-family:Georgia,serif;font-size:1.35rem;font-weight:bold;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-top:1.75rem;margin-bottom:0.75rem;line-height:1.25;">${label}</h2>${s[key]}`
                )
                .join("\n");
            }

            // Load references from API
            if (data.references?.length) {
              setDocReferences(data.references.map((r: any, i: number) => ({ id: i + 1, text: r.text, url: r.url ?? "#" })));
            } else {
              setDocReferences(initialReferences);
            }

            hasLoadedDirectly = true;
          }
        } catch (err) {
          console.error("Direct fetch in editor failed:", err);
        }
      }

      // 2. If direct load failed or it is a local template, use list lookup
      if (!hasLoadedDirectly) {
        const localList = getMedicalContent();
        let foundItem = localList.find((c) => String(c.id) === String(id));
        if (!foundItem) {
          const list = await fetchMedicalContent().catch(() => getMedicalContent());
          setMedicalContents(list);
          foundItem = list.find((c) => String(c.id) === String(id)) || list[0] || {
            id: "local",
            name: "New Document",
            category: "Clinical Reference",
            system: "General",
            type: "Document" as const,
            status: "draft" as const,
            lastUpdated: new Date().toISOString().split("T")[0],
            author: "GP Edge Admin",
            references: 0,
          };
        } else {
          setMedicalContents(localList);
        }
        item = foundItem;
        setDocReferences(initialReferences);

        const localBody = typeof window !== "undefined" ? localStorage.getItem(`gpedge_content_body_${id}`) : null;
        if (localBody) {
          savedHtml = localBody;
        }
      }

      // 3. Set metadata states
      if (item) {
        setContentItem(item);
        setDocTitle(decodeHtml(item.name));
        setSelectedSystem(item.system);
        setSelectedCategory(item.category);
        setContentStatus(item.status);
        setIsFree(item.isFree ?? false);
        setAuthor(item.author);
        setTags(item.tags?.length ? item.tags : [item.system, item.category]);
      }

      if (id && !String(id).startsWith("local")) {
        loadHistoryAndVersions(String(id), item?.type === "Approach" ? "approach" : "medical_condition");
      }

      if (!savedHtml && item) {
        if (item.type === "Approach") {
          const lowerName = item.name.toLowerCase();
          if (lowerName.includes("headache")) {
            savedHtml = `
<div style="background-color: #0f766e; color: #ffffff; padding: 1.5rem; border-radius: 0.75rem 0.75rem 0 0; margin-bottom: 1.5rem; text-align: center;">
  <h1 style="font-family: Georgia, serif; font-size: 2.25rem; font-weight: bold; margin: 0; color: #ffffff;">Approach to Headache</h1>
  <div style="background-color: #2bb09c; color: #ffffff; display: inline-block; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; margin-top: 0.5rem; margin-bottom: 0.5rem;">Approach to a Presentation</div>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-style: italic; color: #e6f7f4; margin: 0; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5;">A structured GP framework for the assessment, classification, and initial management of headache — with a focus on identifying red flags, differentiating primary from secondary headache, and guiding appropriate investigation and referral.</p>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">1. OVERVIEW</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Headache is one of the most common presentations in general practice and a leading cause of disability worldwide. The GP's primary role in the assessment of a new or changed headache is to distinguish primary headache disorders (migraine, tension-type, cluster, others) from secondary headaches caused by an underlying structural, vascular, infectious, or metabolic condition. A systematic approach to history, examination, and targeted investigation is essential.</p>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">The International Classification of Headache Disorders, 3rd edition (ICHD-3) classifies headaches into three broad groups: primary headaches, secondary headaches, and painful cranial neuropathies. Most headaches seen in general practice are primary — but secondary causes must be actively excluded, particularly in any new or changed headache pattern.</p>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">A headache diary is an invaluable tool — it establishes frequency, identifies triggers, quantifies analgesic use, and is essential before specialist referral. Recommend completing it from the first consultation.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">2. KEY QUESTIONS TO ASK</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">A structured headache history should cover the following domains. The history alone will establish the diagnosis in the majority of primary headache presentations.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Headache Characteristics</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Onset:</strong> Sudden/thunderclap (peak intensity within seconds → subarachnoid haemorrhage until proven otherwise) vs gradual onset</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Location:</strong> Unilateral or bilateral? Side-locked (always same side = cluster headache feature) or shifting? Periorbital? Occipital?</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Severity:</strong> Mild/moderate/severe; impact on ADLs (work, social, family, exercise, sleep)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Character:</strong> Pulsating/throbbing (migraine), pressure/tightness (TTH), stabbing/shock-like (neuralgia, TAC), excruciating (cluster)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Duration:</strong> Seconds (neuralgia, SUNCT), minutes (TAC subtypes), hours (migraine, cluster), days (TTH, migraine)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Frequency and pattern:</strong> Same time each day/month? Episodic with remission (cluster)? Daily/near-daily (MOH, chronic migraine)?</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Associated and Exacerbating Features</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Nausea, vomiting, photophobia, phonophobia, osmophobia → migraine</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Aura — focal neurological symptoms preceding headache: visual (flashing lights, zigzags, visual loss), sensory, speech → migraine with aura</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Ipsilateral autonomic features: tearing, conjunctival injection, nasal stuffiness, ptosis, miosis, periorbital oedema → TAC</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Agitation and restlessness during attack (cannot lie still) → cluster headache; contrast with migraine (wants to lie still in dark)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Neck stiffness, fever, rash → meningitis / subarachnoid haemorrhage</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worse lying down, improved upright → raised ICP / posterior fossa lesion / IIH</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worse upright, improved lying flat → low CSF pressure / intracranial hypotension</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worsened by movement, neck palpation, limited neck range of motion → cervicogenic headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Triggered by exertion, sexual activity, Valsalva → primary exertional/sexual headache or secondary cause</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Medication and Analgesic History</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">All current and recent medications — particularly analgesics, triptans, opioids, OCP/HRT, antihypertensives</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Frequency of analgesic use: &gt;10–15 days/month = medication overuse headache risk — ask specifically</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Previously trialled headache treatments: drug, dose, response, frequency of use</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Review medications that can cause or worsen headache: nitrates, PDE5 inhibitors, vasodilators, oral contraceptives</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Additional History</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Family history of headache — migraine and cluster headache can be familial</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Head or neck trauma — even mild; may precede cervicogenic headache, subdural haematoma, or arterial dissection</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Relevant comorbidities: HIV, cancer (active or previous), pregnancy/postpartum, immunosuppression</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Psychosocial history: stress, anxiety, depression — major contributors to headache frequency and disability</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Cognitive change, visual disturbance, or other neurological symptoms — may indicate secondary cause</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">3. RED FLAGS</h2>
<div class="callout-block" style="background-color: #fff1f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #7f1d1d;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b91c1c;">Red Flags — Require Urgent Investigation and/or Emergency Referral</div>
  <div style="font-size: 0.875rem; line-height: 1.6; margin-bottom: 0.75rem;">The following red flags require urgent neuroimaging (CT/MRI), lumbar puncture, and/or emergency department review:</div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; border: 1px solid #fec2c2; background-color: #ffffff; border-radius: 0.5rem; overflow: hidden;">
    <thead>
      <tr style="background-color: #fee2e2; color: #991b1b;">
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Red Flag</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Possible Diagnoses</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Action</th>
      </tr>
    </thead>
    <tbody style="color: #374151;">
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Thunderclap headache — severe explosive headache reaching peak intensity within seconds</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Subarachnoid haemorrhage, pituitary apoplexy, haemorrhage into mass lesion, arterial dissection, RCVS</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department — urgent CT head; if CT negative, lumbar puncture</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache with focal neurological signs, confusion, or drowsiness</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Stroke, venous sinus thrombosis, RCVS, meningitis, encephalitis, arterial dissection</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department urgently</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache type or first headache in patient ≥50 years</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Giant cell arteritis, space-occupying lesion, stroke</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent investigation — ESR/CRP, neuroimaging; same-day if GCA suspected</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache onset after head trauma</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Subdural/epidural haemorrhage, arterial dissection</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent CT head</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache frequency/severity progressively worsens weeks to months + focal neurology</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, cerebral venous sinus thrombosis, subdural haematoma, MOH, subacute meningitis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache in HIV, cancer, or immunosuppression</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Meningitis (incl. TB), abscess, metastasis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent specialist review and neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Signs of systemic illness or meningism (fever, rash, neck stiffness)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Systemic infection/meningitis, TB meningitis, encephalitis, vasculitis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Papilloedema</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, malignant hypertension, IIH, cerebral venous sinus thrombosis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent ophthalmology/neurology; emergency if vision threatened</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Positional headache (worse lying down, cough, valsalva; especially if prolonged)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, posterior fossa lesion, Chiari malformation, IIH</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Positional headache (worse upright, better lying flat)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Intracranial hypotension (low CSF pressure headache)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Neuroimaging (brain MRI with gadolinium)</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache during pregnancy or postpartum</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Pre-eclampsia, CVST, pituitary apoplexy, RCVS, PRES/RCVS</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department or urgent obstetric review</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="callout-block" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #d97706; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #78350f;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b45309;">Important</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;"><strong>Thunderclap headache = subarachnoid haemorrhage until proven otherwise</strong> — a normal CT does NOT exclude SAH; lumbar puncture is required if CT is negative.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;"><strong>New headache or changed headache pattern in a patient &gt;50 years</strong> warrants urgent investigation — always consider giant cell arteritis (ESR/CRP same day) and space-occupying lesion.</li>
  </ul>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">4. EXAMINATION FINDINGS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Physical examination is guided by the history. A focused neurological examination is essential for all patients with new or changed headache. The key aim is to detect signs that would indicate a secondary cause.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">General and Vital Signs</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Blood pressure:</strong> hypertensive emergency can cause headache; malignant hypertension may cause papilloedema</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Temperature:</strong> fever with headache raises concern for meningitis or encephalitis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>BMI:</strong> obesity is associated with IIH</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Neurological Examination</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Level of consciousness and cognition:</strong> confusion or drowsiness warrants urgent assessment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Cranial nerve examination:</strong> focal deficits suggest structural or vascular cause</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Fundoscopy:</strong> assess for papilloedema — if unable to perform adequately, refer for urgent ophthalmological assessment (optical coherence tomography)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Motor and sensory examination:</strong> focal neurological signs require urgent neuroimaging</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Meningism:</strong> neck stiffness, Kernig's and Brudzinski's signs — assess in all patients with fever and headache</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Headache-Specific Examination</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Pericranial tenderness:</strong> tender muscle palpation of the head and neck — present in tension-type headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Neck range of movement and cervical palpation:</strong> limited ROM and tenderness at specific cervical levels → cervicogenic headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Temporal artery tenderness or thickening:</strong> pulselessness in &gt;50 years → giant cell arteritis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Periorbital/ocular examination:</strong> red eye, reduced vision, pupil abnormality → acute angle-closure glaucoma, uveitis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Ipsilateral autonomic features:</strong> tearing, ptosis, miosis, nasal stuffiness → TAC</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Triggerpoint examination:</strong> touching specific facial/scalp areas triggers pain → trigeminal neuralgia, greater occipital neuralgia</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">5. INVESTIGATIONS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Neuroimaging is generally NOT indicated for new-onset headache unless a neurological abnormality is detected on examination or a red flag is present. Over-investigation with CT scanning exposes patients to unnecessary radiation and false positives. Investigations should be targeted.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">First-Line Blood Tests (Guided by History)</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>ESR and CRP:</strong> mandatory in any new headache in a patient &gt;50 years — to exclude giant cell arteritis; if GCA suspected, start steroids before imaging results</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Full blood count, EUC, LFTs, glucose:</strong> systemic illness, metabolic cause, or baseline before starting prophylaxis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Thyroid function:</strong> hypothyroidism and hyperthyroidism can cause headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Blood pressure measurement:</strong> at every headache consultation</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Urinalysis and urine protein/creatinine ratio:</strong> if pre-eclampsia considered in pregnancy</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Neuroimaging</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>CT head (non-contrast):</strong> first-line for suspected SAH, acute stroke, trauma, haemorrhage — fast and widely available</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>MRI brain:</strong> superior for posterior fossa lesions, white matter, venous sinus thrombosis, low CSF pressure, Chiari malformation, structural causes of TACs, trigeminal neuralgia neurovascular compression</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>CT or MR angiography:</strong> if vascular cause suspected (dissection, aneurysm, RCVS, vasculitis)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>MRI with gadolinium:</strong> preferred for low CSF pressure headache (pachymeningeal enhancement)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Imaging NOT routinely indicated for: classic migraine, tension-type headache, medication overuse headache, or established cluster headache with no change in pattern</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Lumbar Puncture</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Indicated after negative CT in suspected SAH — xanthochromia or elevated red cells at &gt;12 hours from headache onset</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Also indicated for suspected meningitis/encephalitis, IIH (opening pressure measurement), and low CSF pressure syndromes</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">6. DIFFERENTIAL DIAGNOSIS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">The following table summarises the key distinguishing features of the most common headache types encountered in general practice. Refer to individual Synapse notes for detailed management of each condition.</p>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; overflow: hidden;">
  <thead>
    <tr style="background-color: #0d9488; color: #ffffff;">
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Diagnosis</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Duration</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Location &amp; Character</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Key Features</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Distinguishing Pearls</th>
    </tr>
  </thead>
  <tbody style="color: #475569; font-size: 0.75rem;">
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Migraine</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">4–72 hours</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral (not side-locked), pulsating; moderate-severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Nausea, vomit, photophob, phonophob; aggravated by activity; ± aura</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">3 screening questions: nausea? lightsensitivity? impact on ADLs?</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Tension-type headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">30 min – 7 days</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Bilateral, pressure/tightness; mild-moderate</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">No nausea; not aggravated by activity; ± photo or phonophobia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Most common headache type; diagnosis of exclusion from migraine</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cluster headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">15–180 min</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, periorbital, side-locked, excruciating; severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Ipsilateral autonomic features, restlessness, agitation</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Patient cannot lie still — opposite of migraine; urgent specialist referral required</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Paroxysmal hemicrania</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">2–30 min per attack</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, side-locked, severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Multiple attacks/day; ipsilateral autonomic features</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Absolute indomethacin response is diagnostic</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Hemicrania continua</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Continuous</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, continuous, variable severity</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Exacerbations with autonomic features; may have migraine features</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Absolute indomethacin response is diagnostic</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">SUNCT</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">5 sec – 4 min</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, brief, severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Up to 200+ attacks/day; prominent tearing/conjunctival injection; cutaneous triggers</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Very rare; no indomethacin response; expert management required</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Medication overuse headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">≥15 days/month</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Variable</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Headache on ≥15 days/month with escalating analgesic use</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Always ask analgesic frequency; daily essential; migraine/TTH more susceptible than cluster</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cervicogenic headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Variable</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, from neck to head</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Reduced neck ROM; worsened by neck movement/palpation; onset with cervical lesion</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Physiotherapy first-line; imaging usually not helpful initially</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Primary exertional / sexual</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">&lt;48 hours (exertional); variable (sexual)</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Bilateral (exertional); severe at orgasm</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Thunderclap at orgasm = exclude SAH; exclude structural causes first</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Perform imaging for all new presentations; propranolol or indomethacin prophylaxis</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Trigeminal neuralgia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Seconds–minutes</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, shock-like, V2/V3</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Triggered by touch, eating, speaking; brief refractory period after attack</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Always image to exclude structural causes; carbamazepine first-line</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Giant cell arteritis</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Persistent/progressive</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral or bilateral temporal</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Age &gt;50; temporal artery tenderness; jaw claudication, visual changes; elevated ESR/CRP</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Medical emergency; if visual symptoms start, prednisone immediately</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">SAH</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Sudden onset, persistent</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Diffuse 'worst headache of life'</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Thunderclap onset; meningism; loss of consciousness possible</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Emergency! If CT negative, lumbar puncture; emergency department immediately</td>
    </tr>
  </tbody>
</table>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">7. MANAGEMENT PRINCIPLES</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Management depends on the headache diagnosis. For all primary headaches, the GP approach includes: confirming diagnosis, excluding secondary causes, initiating appropriate acute treatment, considering prophylaxis where indicated, managing lifestyle factors, and monitoring for medication overuse.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">General Principles — All Headache Types</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Provide the diagnosis clearly</strong> — many patients fear their headache represents a sinister cause. Address concerns explicitly.</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Recommend a headache diary</strong> — establishes frequency, triggers, analgesic use, and response to treatment. Essential before specialist referral.</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Identify and address medication overuse:</strong> limit nonopioid analgesics to &lt;15 days/month and triptans/opioids to &lt;10 days/month (eTG)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Lifestyle optimisation for all primary headaches:</strong> regular sleep, adequate hydration (1.5–2 L water/day), regular meals, limit caffeine (&lt;200 mg/day), regular aerobic exercise, stress management</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Address psychological comorbidities</strong> — anxiety and depression are common in patients with frequent headache and worsen outcomes if untreated</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Acute Treatment — By Diagnosis (Summary)</h3>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Refer to individual Synapse notes for complete dosing tables. The following summarises first-line acute approaches:</p>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; overflow: hidden;">
  <thead>
    <tr style="background-color: #0d9488; color: #ffffff;">
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Header Type</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">First-Line Acute Treatment</th>
    </tr>
  </thead>
  <tbody style="color: #475569; font-size: 0.75rem;">
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Migraine</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">NSAIDs (ibuprofen 400–600 mg, naproxen, aspirin 900–1000 mg, diclofenac) ± antiemetic (metoclopramide, prochlorperazine). Triptan if NSAIDs insufficient. Start at symptom onset.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Tension-type headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">NSAIDs (aspirin 600–900 mg, ibuprofen 400 mg, naproxen, diclofenac 50 mg) or paracetamol 1 g. Avoid regular use (&gt;15 days/month).</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cluster headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">SC sumatriptan 6 mg + high-flow Oxygen 100% at 15 L/min via non-rebreathing mask for 15–20 min. Refer urgently to specialist.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Paroxysmal hemicrania / Hemicrania continua</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Indomethacin titration trial: 25 → 50 → 75 mg TDS, 3 days each step. Absolute response is diagnostic.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Primary exertional / sexual headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Indomethacin 25–50 mg orally 2 hours before activity (prophylactic). Propranolol 40–80 mg BD for 1 month if regular prophylaxis needed.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cervicogenic headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Physiotherapy and exercises (first-line despite initial worsening), NSAIDs or paracetamol for symptom relief.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Medication overuse headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Analgesic withdrawal (graded or abrupt with bridging therapy). bridging: naproxen MRI 750–1000 mg daily reducing over 3 weeks. OR prednisolone 50 mg daily for 5 days then taper. Start prophylaxis before withdrawal.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Trigeminal neuralgia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Carbamazepine MR 100 mg BD titrated to 400 mg BD. Oxcarbazepine or pregabalin if intolerant.</td>
    </tr>
  </tbody>
</table>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">When to Consider Prophylaxis</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Migraine:</strong> ≥4 migraine days/month, or fewer if severe or significantly impacting quality of life, or acute treatment ineffective/poorly tolerated</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Tension-type headache:</strong> frequent TTH not adequately controlled by acute treatment — amitriptyline or nortriptyline first-line</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Cluster headache:</strong> all patients with episodic or chronic cluster headache — verapamil first-line (specialist-initiated with ECG monitoring)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Primary exertional/sexual headache:</strong> if frequent — propranolol 10–40 mg BD for 1 month, then review</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">8. WHEN TO REFER / ESCALATE</h2>

<div class="callout-block" style="background-color: #fff1f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #7f1d1d;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b91c1c;">Emergency Referral — Send to ED Immediately</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Thunderclap headache — any sudden severe headache reaching peak intensity within seconds</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Headache with focal neurological signs, confusion, or drowsiness</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Signs of meningism with fever and headache</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">New headache with visual obscuration or visual loss — possible IIH or raised ICP emergency</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Headache in pregnancy with hypertension or proteinuria — possible pre-eclampsia</li>
  </ul>
</div>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Urgent (Same-Day or Within Days)</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>New headache in patient &gt;50 years</strong> — giant cell arteritis must be excluded urgently (ESR/CRP; if suspected, start prednisolone before waiting for results)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Suspected cluster headache</strong> — requires urgent specialist review to confirm diagnosis, arrange MRI brain, and optimise treatment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Papilloedema found on examination</strong> — urgent ophthalmology and neurology referral</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Non-Urgent Neurology Referral</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Migraine:</strong> inadequate control after several trials of acute and prophylactic therapy; consideration of CGRP-targeted therapies or botulinum toxin A</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Diagnostic uncertainty</strong> — headache not clearly fitting a primary headache type after thorough GP workup</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Trigeminal neuralgia:</strong> loss of drug efficacy, intolerance, or consideration of surgical/interventional therapy</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>TACs:</strong> all paroxysmal hemicrania and hemicrania continua cases for specialist confirmation; SUNCT always requires expert management</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Children with frequent or disabling headache</strong> — paediatric neurology referral for prophylaxis decisions</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">9. SAFETY NETTING &amp; FOLLOW-UP</h2>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Advise all patients to return promptly if:</strong> headache becomes thunderclap, character changes significantly, new neurological symptoms develop, or any red flag emerges</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Document baseline headache frequency and character</strong> — this is the reference point for monitoring and detecting deterioration</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Review headache diary at 4–6 weeks</strong> — assess frequency, triggers, analgesic use, and response to initial treatment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>If prophylaxis started: review at 8–12 weeks</strong> for response and tolerability; titrate dose; effective prophylaxis = 30–50% reduction in headache days</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Screen for medication overuse at every review</strong> — ask specifically about analgesic frequency</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Screen for depression and anxiety</strong> — common comorbidities that worsen headache outcomes</li>
</ul>

<div class="callout-block" style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-left: 5px solid #0d9488; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #115e59;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #0f766e;">Key Points</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Neuroimaging is NOT routinely needed for primary headaches — investigate only if red flags are present or examination is abnormal.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Thunderclap headache = SAH until proven otherwise — CT then LP; send to ED immediately.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Always ask about analgesic frequency — medication overuse headache is common, underrecognised, and worsens prognosis of the primary headache disorder.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">A headache diary is essential for establishing diagnosis, monitoring treatment, and preparing for specialist referral.</li>
  </ul>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">10. RESOURCES</h2>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">For Health Professionals</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Therapeutic Guidelines — Neurology (eTG, December 2025)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">UpToDate — Headache (uptodate.com)</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">For Patients</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Headache diary — Children (RCH)</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Headache diary — Adults</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine &amp; Headache Australia</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">healthdirect — Headache</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine Monitor (app)</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine Buddy (app)</a></li>
</ul>
<div style="font-size: 0.75rem; color: #94a3b8; text-align: right; margin-top: 2rem;">End of document ■</div>
`;
          } else {
            savedHtml = `
<div style="background-color: #0f766e; color: #ffffff; padding: 1.5rem; border-radius: 0.75rem 0.75rem 0 0; margin-bottom: 1.5rem; text-align: center;">
  <h1 style="font-family: Georgia, serif; font-size: 2.25rem; font-weight: bold; margin: 0; color: #ffffff;">${decodeHtml(item.name)}</h1>
  <div style="background-color: #2bb09c; color: #ffffff; display: inline-block; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; margin-top: 0.5rem; margin-bottom: 0.5rem;">Approach to a Presentation</div>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-style: italic; color: #e6f7f4; margin: 0; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5;">A structured GP framework for the assessment, classification, and initial management of this presentation — with a focus on identifying red flags, differentiating primary from secondary causes, and guiding appropriate investigation and referral.</p>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">1. OVERVIEW</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Provide a brief clinical overview of this approach, including when it should be used and the key clinical context.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">2. KEY QUESTIONS TO ASK</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Describe key history-taking points and questions relevant to this presentation.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Characteristics</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Onset:</strong> [Describe onset characteristics]</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Location:</strong> [Describe location details]</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">3. RED FLAGS</h2>
<div class="callout-block" style="background-color: #fff1f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #7f1d1d;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b91c1c;">Red Flags — Require Urgent Investigation and/or Emergency Referral</div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; border: 1px solid #fec2c2; background-color: #ffffff; border-radius: 0.5rem; overflow: hidden;">
    <thead>
      <tr style="background-color: #fee2e2; color: #991b1b;">
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Red Flag</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Possible Diagnoses</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Action</th>
      </tr>
    </thead>
    <tbody style="color: #374151;">
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">[Red Flag 1]</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">[Diagnosis]</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">[Action]</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">4. EXAMINATION FINDINGS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Describe key examination findings and checks to perform.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">5. INVESTIGATIONS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">List recommended first-line and second-line investigations.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">6. DIFFERENTIAL DIAGNOSIS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Summarise differential diagnoses in a comparative table.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">7. MANAGEMENT PRINCIPLES</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Outline the key principles of management and treatment pathways.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">8. WHEN TO REFER / ESCALATE</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Detail referral thresholds and emergency pathways.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">9. SAFETY NETTING &amp; FOLLOW-UP</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Safety netting instructions and follow-up timeline.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">10. RESOURCES</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Add relevant guidelines and patient information resources.</p>
<div style="font-size: 0.75rem; color: #94a3b8; text-align: right; margin-top: 2rem;">End of document ■</div>
`;
          }
        } else {
          const customizedBlocks = initialBlocks.map((block, idx) =>
            idx === 0 && block.type === "heading"
              ? { ...block, content: `${decodeHtml(item!.name)} in General Practice` }
              : block
          );
          savedHtml = blocksToHtml(customizedBlocks);
        }
      }

      const cleanedHtml = cleanTableHtmlStyles(savedHtml);

      if (editorRef.current) {
        editorRef.current.innerHTML = cleanedHtml;
        updateCounts();
        setHistory([cleanedHtml]);
        setHistoryIndex(0);

        const parsedPages = splitHtmlIntoPages(cleanedHtml);
        setPages(parsedPages);
        setActivePage(0);
        editorRef.current.innerHTML = parsedPages[0] || "";
        previousHtmlRef.current = cleanedHtml;
      }

      // Load linked questions from localStorage (not yet migrated)
      const rawLinks = localStorage.getItem(`gpedge_content_links_${id}`);
      if (rawLinks) {
        try { setLinkedQuestionIds(JSON.parse(rawLinks)); } catch {}
      } else {
        setLinkedQuestionIds([]);
      }

      fetchQuestions().then((list) => {
        setAllQuestions(list);
      });
    };
    loadContent();
  }, [id]);

  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      const cleanText = text.trim();
      const words = cleanText ? cleanText.split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(cleanText.length);
    }
  };

  const saveToHistory = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (history[historyIndex] !== html) {
        const newHist = [...history.slice(0, historyIndex + 1), html];
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);
        setEditTriggerCount(prev => prev + 1); // trigger auto-save!
      }
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevHtml = history[historyIndex - 1];
      if (editorRef.current) {
        editorRef.current.innerHTML = prevHtml;
      }
      setHistoryIndex(historyIndex - 1);
      updateCounts();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextHtml = history[historyIndex + 1];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
      }
      setHistoryIndex(historyIndex + 1);
      updateCounts();
    }
  };

  // Keyboard shortcuts: Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex]);

  // Page management
  const saveCurrentPageToPages = () => {
    if (!editorRef.current) return pages;
    const html = editorRef.current.innerHTML;
    const updated = [...pages];
    updated[activePage] = html;
    return updated;
  };

  const switchPage = (pageIndex: number) => {
    if (!editorRef.current) return;
    // Save current page content
    const updated = saveCurrentPageToPages();
    setPages(updated);
    // Switch to new page
    setActivePage(pageIndex);
    editorRef.current.innerHTML = updated[pageIndex] || "";
    updateCounts();
    // Scroll canvas back to top so the new page starts at the top
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const addPage = () => {
    if (!editorRef.current) return;
    // Save current page
    const updated = saveCurrentPageToPages();
    const newPages = [...updated, ""];
    setPages(newPages);
    const newIndex = newPages.length - 1;
    setActivePage(newIndex);
    editorRef.current.innerHTML = "";
    updateCounts();
    // Persist
    localStorage.setItem(`gpedge_content_pages_${id}`, JSON.stringify(newPages));
  };

  const deletePage = (pageIndex: number) => {
    if (pages.length <= 1) {
      alert("Cannot delete the only page.");
      return;
    }
    const updated = saveCurrentPageToPages();
    const newPages = updated.filter((_, i) => i !== pageIndex);
    setPages(newPages);
    const newActive = Math.min(activePage, newPages.length - 1);
    setActivePage(newActive);
    if (editorRef.current) {
      editorRef.current.innerHTML = newPages[newActive] || "";
      updateCounts();
    }
    localStorage.setItem(`gpedge_content_pages_${id}`, JSON.stringify(newPages));
  };

  // Debounced real-time update auto-save hook
  useEffect(() => {
    if (!docTitle.trim() || !id || String(id).startsWith("local")) return;

    const timer = setTimeout(() => {
      // Save all pages (update active page first)
      const allPages = saveCurrentPageToPages();
      setPages(allPages);
      const combinedHtml = allPages.join("");

      // Save to Neon via PATCH API
      updateMedicalContentItem(String(id), {
        name: docTitle.trim(),
        system: selectedSystem,
        category: selectedCategory,
        status: "published",
        isFree,
        author,
        fullHtml: combinedHtml,
      }).then(() => {
        // Auto-create history entry and version snapshot on content change
        if (previousHtmlRef.current && previousHtmlRef.current !== combinedHtml) {
          const entityType = contentItem?.type === "Approach" ? "approach" : "medical_condition";
          fetch(`/api/content-history/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resource: "history",
              entityType,
              fieldName: "full_html",
              changeType: "modified",
              oldContent: previousHtmlRef.current,
              newContent: combinedHtml,
              adminUserId: currentAdmin?.id,
              adminUserName: currentAdmin?.name || author,
            }),
          }).catch(console.error);

          fetch(`/api/content-history/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resource: "version",
              entityType,
              fullHtml: combinedHtml,
              metadata: {
                name: docTitle.trim(),
                status: "published",
                author,
                tags,
              },
              createdBy: currentAdmin?.id,
              createdByName: currentAdmin?.name || author,
            }),
          }).then(() => loadHistoryAndVersions(String(id), entityType)).catch(console.error);

          previousHtmlRef.current = combinedHtml;
        }
      }).catch(console.error);

      // Update local storage cache
      const list = getMedicalContent();
      const updated = list.map((c) => {
        if (String(c.id) === String(id)) {
          return {
            ...c,
            name: docTitle.trim(),
            system: selectedSystem,
            category: selectedCategory,
            status: "published" as const,
            isFree,
            lastUpdated: new Date().toISOString().split("T")[0],
            references: docReferences.length,
          };
        }
        return c;
      });
      setMedicalContents(updated);
      saveMedicalContent(updated);
    }, 1000); // 1-second debounce

    return () => clearTimeout(timer);
  }, [docTitle, selectedSystem, selectedCategory, isFree, docReferences, editTriggerCount, activePage]);

  const handleOptimizePagination = () => {
    const updatedPages = saveCurrentPageToPages();
    const combinedHtml = updatedPages.join("");
    const newPages = splitHtmlIntoPages(combinedHtml);
    
    if (newPages.length === pages.length && newPages[0] === pages[0]) {
      alert("Pagination is already optimized for this document!");
      return;
    }
    
    if (confirm(`Optimize Pagination will redistribute your content across ${newPages.length} pages. Do you want to proceed?`)) {
      setPages(newPages);
      setActivePage(0);
      if (editorRef.current) {
        editorRef.current.innerHTML = newPages[0] || "";
      }
      updateCounts();
      
      const newHist = [...history.slice(0, historyIndex + 1), newPages[0] || ""];
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
      
      addUserNotification(
        "Pagination Optimized",
        `Redistributed clinical content across ${newPages.length} pages.`,
        newPages.length,
        "custom"
      );
      
      alert(`Content successfully redistributed across ${newPages.length} pages! Click 'Save Changes' to commit.`);
    }
  };

  const saveSelection = () => {
    if (typeof window === "undefined") return null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (!range || typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const insertHTMLAtCursor = (html: string) => {
    if (typeof window === "undefined" || !editorRef.current) return;

    // Always bring focus to editor
    editorRef.current.focus();

    const sel = window.getSelection();

    // Determine a valid range inside the editor
    let activeRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const candidate = sel.getRangeAt(0);
      if (editorRef.current.contains(candidate.commonAncestorContainer)) {
        activeRange = candidate;
      }
    }
    if (!activeRange && savedEditorRangeRef.current) {
      activeRange = savedEditorRangeRef.current;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(activeRange);
      }
    }

    if (!activeRange) {
      // Fallback: just append to end
      editorRef.current.innerHTML += html;
      return;
    }

    activeRange.deleteContents();
    
    const el = document.createElement("div");
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node: ChildNode | null = null;
    let lastNode: ChildNode | null = null;
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    activeRange.insertNode(frag);
    
    if (lastNode && sel) {
      const nextRange = activeRange.cloneRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nextRange);
      savedEditorRangeRef.current = nextRange;
    }
  };

  const handleFormatText = (format: string, value: string = "") => {
    document.execCommand(format, false, value);
    updateCounts();
    saveToHistory();
  };

  const applyStyleToSelection = (property: "fontFamily" | "fontSize", value: string) => {
    if (typeof window === "undefined" || !editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();

    let activeRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const candidate = sel.getRangeAt(0);
      if (editorRef.current.contains(candidate.commonAncestorContainer)) {
        activeRange = candidate;
      }
    }
    if (!activeRange && savedEditorRangeRef.current) {
      activeRange = savedEditorRangeRef.current;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(activeRange);
      }
    }

    if (!activeRange) return;

    if (activeRange.collapsed) {
      const span = document.createElement("span");
      if (property === "fontFamily") {
        span.style.fontFamily = value;
      } else {
        span.style.fontSize = value;
      }
      span.appendChild(document.createTextNode("\u200b"));
      activeRange.insertNode(span);
      
      const newRange = document.createRange();
      newRange.setStart(span.firstChild!, 1);
      newRange.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      savedEditorRangeRef.current = newRange;
      return;
    }

    const tempValue = "temp-" + Math.random().toString(36).substring(2, 9);
    if (property === "fontFamily") {
      document.execCommand("fontName", false, tempValue);
      const fonts = editorRef.current.querySelectorAll(`font[face="${tempValue}"]`);
      fonts.forEach((font) => {
        const span = document.createElement("span");
        span.style.fontFamily = value;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
    } else {
      document.execCommand("fontSize", false, "7");
      const fonts = editorRef.current.querySelectorAll('font[size="7"]');
      fonts.forEach((font) => {
        const span = document.createElement("span");
        span.style.fontSize = value;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
    }

    updateCounts();
    saveToHistory();
  };

  const insertTable = () => {
    const savedRange = saveSelection();
    const cols = prompt("Enter number of columns:", "4");
    const rows = prompt("Enter number of rows:", "3");
    if (!cols || !rows) return;
    
    const colCount = parseInt(cols, 10);
    const rowCount = parseInt(rows, 10);
    if (isNaN(colCount) || isNaN(rowCount) || colCount <= 0 || rowCount <= 0) return;
    
    restoreSelection(savedRange);
    
    let tableHtml = `<div style="overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 0.75rem; margin-bottom: 1.25rem; background-color: #ffffff;"><table style="width: 100%; border-collapse: collapse; text-align: left;"><thead><tr>`;
    for (let i = 0; i < colCount; i++) {
      tableHtml += `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #0f766e; border-bottom: 2px solid #cbd5e1; color: #ffffff;">Header ${i+1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rowCount; r++) {
      const bg = r % 2 === 1 ? "#f8fafc" : "#ffffff";
      tableHtml += `<tr>`;
      for (let c = 0; c < colCount; c++) {
        tableHtml += `<td style="padding: 0.75rem 1rem; font-size: 0.825rem; border-bottom: 1px solid #e2e8f0; background-color: ${bg}; color: #475569;">Cell</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    
    insertHTMLAtCursor(tableHtml);
    
    // Trigger updates
    setTimeout(() => {
      updateCounts();
      saveToHistory();
    }, 10);
  };

  // MS Word-like Table Actions
  const insertRowAbove = () => {
    const { row, table } = getActiveTableCellAndRow();
    if (!row || !table) return;
    
    const newRow = document.createElement("tr");
    const cellCount = row.cells.length;
    const isHeader = row.cells[0].tagName.toLowerCase() === "th";
    
    for (let i = 0; i < cellCount; i++) {
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.cssText = row.cells[i].style.cssText;
      newCell.innerHTML = isHeader ? `Header` : `Cell`;
      newRow.appendChild(newCell);
    }
    
    row.parentNode?.insertBefore(newRow, row);
    updateCounts();
    saveToHistory();
  };

  const insertRowBelow = () => {
    const { row, table } = getActiveTableCellAndRow();
    if (!row || !table) return;
    
    const newRow = document.createElement("tr");
    const cellCount = row.cells.length;
    
    for (let i = 0; i < cellCount; i++) {
      const newCell = document.createElement("td");
      newCell.style.cssText = "padding: 0.75rem 1rem; font-size: 0.825rem; border-bottom: 1px solid #e2e8f0; color: #475569;";
      newCell.innerHTML = "Cell";
      newRow.appendChild(newCell);
    }
    
    row.parentNode?.insertBefore(newRow, row.nextSibling);
    updateCounts();
    saveToHistory();
  };

  const deleteRow = () => {
    const { row, table } = getActiveTableCellAndRow();
    if (!row || !table) return;
    
    if (table.rows.length <= 1) {
      const wrapper = table.parentElement;
      if (wrapper && wrapper.style.overflowX === "auto") {
        wrapper.parentNode?.removeChild(wrapper);
      } else {
        table.parentNode?.removeChild(table);
      }
      setActiveCell(null);
      setActiveRow(null);
      setActiveTable(null);
    } else {
      row.parentNode?.removeChild(row);
      setTimeout(handleSelectionOrClick, 10);
    }
    
    updateCounts();
    saveToHistory();
  };

  const insertColumnLeft = () => {
    const { cell, table } = getActiveTableCellAndRow();
    if (!cell || !table) return;
    
    const colIndex = cell.cellIndex;
    
    for (let r = 0; r < table.rows.length; r++) {
      const currentRow = table.rows[r];
      const referenceCell = currentRow.cells[colIndex];
      const isHeader = referenceCell.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      
      newCell.style.cssText = referenceCell.style.cssText;
      newCell.innerHTML = isHeader ? "Header" : "Cell";
      
      currentRow.insertBefore(newCell, referenceCell);
    }
    
    updateCounts();
    saveToHistory();
  };

  const insertColumnRight = () => {
    const { cell, table } = getActiveTableCellAndRow();
    if (!cell || !table) return;
    
    const colIndex = cell.cellIndex;
    
    for (let r = 0; r < table.rows.length; r++) {
      const currentRow = table.rows[r];
      const referenceCell = currentRow.cells[colIndex];
      const isHeader = referenceCell.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      
      newCell.style.cssText = referenceCell.style.cssText;
      newCell.innerHTML = isHeader ? "Header" : "Cell";
      
      currentRow.insertBefore(newCell, referenceCell.nextSibling);
    }
    
    updateCounts();
    saveToHistory();
  };

  const deleteColumn = () => {
    const { cell, row, table } = getActiveTableCellAndRow();
    if (!cell || !row || !table) return;
    
    const colIndex = cell.cellIndex;
    
    if (row.cells.length <= 1) {
      const wrapper = table.parentElement;
      if (wrapper && wrapper.style.overflowX === "auto") {
        wrapper.parentNode?.removeChild(wrapper);
      } else {
        table.parentNode?.removeChild(table);
      }
      setActiveCell(null);
      setActiveRow(null);
      setActiveTable(null);
    } else {
      for (let r = 0; r < table.rows.length; r++) {
        const currentRow = table.rows[r];
        if (currentRow.cells[colIndex]) {
          currentRow.removeChild(currentRow.cells[colIndex]);
        }
      }
      setTimeout(handleSelectionOrClick, 10);
    }
    
    updateCounts();
    saveToHistory();
  };

  const deleteTable = () => {
    const { table } = getActiveTableCellAndRow();
    if (!table) return;
    
    const wrapper = table.parentElement;
    if (wrapper && wrapper.style.overflowX === "auto") {
      wrapper.parentNode?.removeChild(wrapper);
    } else {
      table.parentNode?.removeChild(table);
    }
    
    setActiveCell(null);
    setActiveRow(null);
    setActiveTable(null);
    updateCounts();
    saveToHistory();
  };

  const setCellBackground = (color: string) => {
    const { cell } = getActiveTableCellAndRow();
    if (!cell) return;
    cell.style.backgroundColor = color;
    updateCounts();
    saveToHistory();
  };
  const insertCallout = (variant: "info" | "warning" | "pearl" | "billing" | "danger") => {
    let bg = "#e6f7f4";
    let border = "#e6f7f4";
    let color = "#1a5c51";
    let titleColor = "#2bb09c";
    let label = "Guideline";
    let icon = "";
    if (variant === "billing") {
      bg = "#f8fafc";
      border = "#f8fafc";
      color = "#334155";
      titleColor = "#475569";
      label = "Billing";
      icon = "";
    } else if (variant === "pearl") {
      bg = "#e6f7f4";
      border = "#e6f7f4";
      color = "#1a5c51";
      titleColor = "#2bb09c";
      label = "Key Points";
      icon = "";
    } else if (variant === "warning") {
      bg = "#fff9e6";
      border = "#fff9e6";
      color = "#7b341e";
      titleColor = "#dd6b20";
      label = "Important";
      icon = "";
    } else if (variant === "danger") {
      bg = "#fff5f5";
      border = "#fff5f5";
      color = "#9b2c2c";
      titleColor = "#c53030";
      label = "Red Flags";
      icon = "";
    }

    let selectedContent = "";
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      let range: Range | null = null;
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const candidate = sel.getRangeAt(0);
        if (editorRef.current.contains(candidate.commonAncestorContainer)) {
          range = candidate;
        }
      }
      if (!range && savedEditorRangeRef.current && editorRef.current) {
        if (editorRef.current.contains(savedEditorRangeRef.current.commonAncestorContainer)) {
          range = savedEditorRangeRef.current;
        }
      }
      if (range) {
        const div = document.createElement("div");
        div.appendChild(range.cloneContents());
        selectedContent = div.innerHTML;
      }
    }

    const finalContent = selectedContent.trim() || "Callout instruction / guidelines context...";
    
    const calloutHtml = `
      <div class="callout-block" data-variant="${variant}" style="background-color: ${bg}; border: 1px solid ${border}; border-left: 5px solid ${titleColor}; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: ${color};">
        <div style="font-weight: bold; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: ${titleColor};">${icon} ${label}</div>
        <div style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; line-height: 1.6;">${finalContent}</div>
      </div>
    `;
    insertHTMLAtCursor(calloutHtml);
    updateCounts();
    saveToHistory();
  };

  const insertTableDirectly = (rowCount: number, colCount: number) => {
    const savedRange = saveSelection();
    restoreSelection(savedRange);
    
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; text-align: left;"><thead><tr>`;
    for (let i = 0; i < colCount; i++) {
      tableHtml += `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #16a34a; border: 1px solid #cbd5e1; color: #ffffff;">Header ${i+1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rowCount; r++) {
      const bg = "#ffffff";
      tableHtml += `<tr>`;
      for (let c = 0; c < colCount; c++) {
        tableHtml += `<td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; background-color: ${bg}; color: #475569;">Cell</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table>`;
    const html = `<div class="tbl-wrapper" style="position:relative;margin:1.25rem 0;cursor:move;user-select:none;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s;overflow-x:auto;background:#fff;border:1px solid #cbd5e1;border-radius:0.75rem" title="Drag to move">${tableHtml}</div>`;
    
    insertHTMLAtCursor(html);
    
    setTimeout(() => {
      updateCounts();
      saveToHistory();
    }, 10);
  };

  const insertBlockNodeAtCursor = (blockNode: Node) => {
    if (typeof window === "undefined" || !editorRef.current) return;
    
    // Always focus the editor first
    editorRef.current.focus();

    const sel = window.getSelection();
    const p = document.createElement("p");
    p.innerHTML = "<br>";

    // Use saved range if current selection is outside the editor
    let activeRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const candidate = sel.getRangeAt(0);
      if (editorRef.current.contains(candidate.commonAncestorContainer)) {
        activeRange = candidate;
      }
    }
    // Fall back to saved range from last editor interaction
    if (!activeRange && savedEditorRangeRef.current) {
      activeRange = savedEditorRangeRef.current;
    }

    if (!activeRange) {
      // Append to end of editor as last resort
      editorRef.current.appendChild(blockNode);
      editorRef.current.appendChild(p);
    } else {
      activeRange.deleteContents();

      // Find the closest block-level parent inside the editor
      let container: Node | null = activeRange.startContainer;
      let parentBlock: HTMLElement | null = null;
      
      while (container && container !== editorRef.current) {
        if (container.nodeType === Node.ELEMENT_NODE) {
          const tag = (container as HTMLElement).tagName.toLowerCase();
          if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(tag)) {
            parentBlock = container as HTMLElement;
            break;
          }
        }
        container = container.parentNode;
      }

      if (parentBlock && editorRef.current.contains(parentBlock)) {
        const isEmpty = parentBlock.innerText.trim() === "" && parentBlock.querySelectorAll("img, table, hr").length === 0;
        const parentOfBlock = parentBlock.parentNode;
        
        if (parentOfBlock) {
          const nextSibling = parentBlock.nextSibling;
          parentOfBlock.insertBefore(p, nextSibling);
          parentOfBlock.insertBefore(blockNode, p);
          if (isEmpty) {
            parentOfBlock.removeChild(parentBlock);
          }
        }
      } else {
        activeRange.insertNode(p);
        activeRange.insertNode(blockNode);
      }
    }

    // Move cursor to the paragraph after the inserted block
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    savedEditorRangeRef.current = newRange;
    editorRef.current.focus();
  };

  const insertImageDirectly = (url: string) => {
    const wrapper = `<div class="img-wrapper" contenteditable="false" style="display:inline-block;position:relative;margin:1rem 0;cursor:move;user-select:none;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s;resize:both;overflow:auto;min-width:80px;min-height:40px" title="Drag to move · Resize from corner"><img src="${url}" alt="Image" style="display:block;width:100%;height:auto;border-radius:0.6rem;pointer-events:none"/><div style="position:absolute;bottom:3px;right:5px;font-size:9px;color:#94a3b8;pointer-events:none;font-family:'DM Sans',sans-serif">↔ resize</div></div>`;
    insertHTMLAtCursor(wrapper);
    updateCounts();
    saveToHistory();
  };

  const insertPageBreak = () => {
    insertHTMLAtCursor(`<div style="break-after:page;border-top:2px dashed #cbd5e1;margin:2rem 0;text-align:center;color:#94a3b8;font-size:0.7rem;font-weight:700;letter-spacing:0.1em;padding-top:0.5rem">— PAGE BREAK —</div>`);
    updateCounts(); saveToHistory();
  };

  const openLinkDropdown = () => {
    if (linkBtnRef.current) {
      const r = linkBtnRef.current.getBoundingClientRect();
      setLinkAnchorPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
    }
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) setLinkText(sel.toString().trim());
    setLinkOpen(o => !o);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand("createLink", false, linkUrl.trim());
    } else {
      const display = linkText.trim() || linkUrl.trim();
      insertHTMLAtCursor(`<a href="${linkUrl.trim()}" target="_blank" style="color:#0f766e;text-decoration:underline">${display}</a>`);
    }
    setLinkOpen(false);
    setLinkText("");
    setLinkUrl("");
    saveToHistory();
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds 5MB limit.");
      return;
    }
    
    try {
      const fileUrl = await uploadToR2(file, file.name, file.type);
      insertImageDirectly(fileUrl);
      setImageMenuOpen(false);
    } catch (err: any) {
      console.error("Image upload to R2 failed:", err);
      alert(`Image upload failed: ${err.message || "Unknown error"}`);
    }
  };

  const insertDivider = () => {
    const hr = document.createElement("hr");
    hr.style.cssText = "border: 0; border-top: 1px solid #cbd5e1; margin: 1rem 0;";
    
    insertBlockNodeAtCursor(hr);
    updateCounts();
    saveToHistory();
  };

  const insertClinicalProtocolTemplate = (variant: "approach" | "guideline" | "protocol") => {
    const templates: Record<string, string> = {
      approach: `
<div style="background-color: #0f766e; color: #ffffff; padding: 1.5rem; border-radius: 0.75rem 0.75rem 0 0; margin-bottom: 1.5rem; text-align: center;">
  <h1 style="font-family: Georgia, serif; font-size: 2.25rem; font-weight: bold; margin: 0; color: #ffffff;">Approach to Headache</h1>
  <div style="background-color: #2bb09c; color: #ffffff; display: inline-block; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; margin-top: 0.5rem; margin-bottom: 0.5rem;">Approach to a Presentation</div>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-style: italic; color: #e6f7f4; margin: 0; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5;">A structured GP framework for the assessment, classification, and initial management of headache — with a focus on identifying red flags, differentiating primary from secondary headache, and guiding appropriate investigation and referral.</p>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">1. OVERVIEW</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Headache is one of the most common presentations in general practice and a leading cause of disability worldwide. The GP's primary role in the assessment of a new or changed headache is to distinguish primary headache disorders (migraine, tension-type, cluster, others) from secondary headaches caused by an underlying structural, vascular, infectious, or metabolic condition. A systematic approach to history, examination, and targeted investigation is essential.</p>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">The International Classification of Headache Disorders, 3rd edition (ICHD-3) classifies headaches into three broad groups: primary headaches, secondary headaches, and painful cranial neuropathies. Most headaches seen in general practice are primary — but secondary causes must be actively excluded, particularly in any new or changed headache pattern.</p>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">A headache diary is an invaluable tool — it establishes frequency, identifies triggers, quantifies analgesic use, and is essential before specialist referral. Recommend completing it from the first consultation.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">2. KEY QUESTIONS TO ASK</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">A structured headache history should cover the following domains. The history alone will establish the diagnosis in the majority of primary headache presentations.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Headache Characteristics</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Onset:</strong> Sudden/thunderclap (peak intensity within seconds → subarachnoid haemorrhage until proven otherwise) vs gradual onset</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Location:</strong> Unilateral or bilateral? Side-locked (always same side = cluster headache feature) or shifting? Periorbital? Occipital?</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Severity:</strong> Mild/moderate/severe; impact on ADLs (work, social, family, exercise, sleep)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Character:</strong> Pulsating/throbbing (migraine), pressure/tightness (TTH), stabbing/shock-like (neuralgia, TAC), excruciating (cluster)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Duration:</strong> Seconds (neuralgia, SUNCT), minutes (TAC subtypes), hours (migraine, cluster), days (TTH, migraine)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Frequency and pattern:</strong> Same time each day/month? Episodic with remission (cluster)? Daily/near-daily (MOH, chronic migraine)?</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Associated and Exacerbating Features</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Nausea, vomiting, photophobia, phonophobia, osmophobia → migraine</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Aura — focal neurological symptoms preceding headache: visual (flashing lights, zigzags, visual loss), sensory, speech → migraine with aura</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Ipsilateral autonomic features: tearing, conjunctival injection, nasal stuffiness, ptosis, miosis, periorbital oedema → TAC</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Agitation and restlessness during attack (cannot lie still) → cluster headache; contrast with migraine (wants to lie still in dark)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Neck stiffness, fever, rash → meningitis / subarachnoid haemorrhage</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worse lying down, improved upright → raised ICP / posterior fossa lesion / IIH</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worse upright, improved lying flat → low CSF pressure / intracranial hypotension</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Worsened by movement, neck palpation, limited neck range of motion → cervicogenic headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Triggered by exertion, sexual activity, Valsalva → primary exertional/sexual headache or secondary cause</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Medication and Analgesic History</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">All current and recent medications — particularly analgesics, triptans, opioids, OCP/HRT, antihypertensives</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Frequency of analgesic use: &gt;10–15 days/month = medication overuse headache risk — ask specifically</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Previously trialled headache treatments: drug, dose, response, frequency of use</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Review medications that can cause or worsen headache: nitrates, PDE5 inhibitors, vasodilators, oral contraceptives</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Additional History</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Family history of headache — migraine and cluster headache can be familial</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Head or neck trauma — even mild; may precede cervicogenic headache, subdural haematoma, or arterial dissection</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Relevant comorbidities: HIV, cancer (active or previous), pregnancy/postpartum, immunosuppression</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Psychosocial history: stress, anxiety, depression — major contributors to headache frequency and disability</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Cognitive change, visual disturbance, or other neurological symptoms — may indicate secondary cause</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">3. RED FLAGS</h2>
<div class="callout-block" style="background-color: #fff1f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #7f1d1d;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b91c1c;">Red Flags — Require Urgent Investigation and/or Emergency Referral</div>
  <div style="font-size: 0.875rem; line-height: 1.6; margin-bottom: 0.75rem;">The following red flags require urgent neuroimaging (CT/MRI), lumbar puncture, and/or emergency department review:</div>
  <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; border: 1px solid #fec2c2; background-color: #ffffff; border-radius: 0.5rem; overflow: hidden;">
    <thead>
      <tr style="background-color: #fee2e2; color: #991b1b;">
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Red Flag</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Possible Diagnoses</th>
        <th style="padding: 0.5rem; border: 1px solid #fec2c2; font-size: 0.75rem; text-align: left;">Action</th>
      </tr>
    </thead>
    <tbody style="color: #374151;">
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Thunderclap headache — severe explosive headache reaching peak intensity within seconds</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Subarachnoid haemorrhage, pituitary apoplexy, haemorrhage into mass lesion, arterial dissection, RCVS</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department — urgent CT head; if CT negative, lumbar puncture</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache with focal neurological signs, confusion, or drowsiness</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Stroke, venous sinus thrombosis, RCVS, meningitis, encephalitis, arterial dissection</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department urgently</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache type or first headache in patient ≥50 years</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Giant cell arteritis, space-occupying lesion, stroke</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent investigation — ESR/CRP, neuroimaging; same-day if GCA suspected</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache onset after head trauma</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Subdural/epidural haemorrhage, arterial dissection</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent CT head</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache frequency/severity progressively worsens weeks to months + focal neurology</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, cerebral venous sinus thrombosis, subdural haematoma, MOH, subacute meningitis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">New headache in HIV, cancer, or immunosuppression</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Meningitis (incl. TB), abscess, metastasis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent specialist review and neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Signs of systemic illness or meningism (fever, rash, neck stiffness)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Systemic infection/meningitis, TB meningitis, encephalitis, vasculitis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Papilloedema</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, malignant hypertension, IIH, cerebral venous sinus thrombosis</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Urgent ophthalmology/neurology; emergency if vision threatened</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Positional headache (worse lying down, cough, valsalva; especially if prolonged)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Space-occupying lesion, posterior fossa lesion, Chiari malformation, IIH</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Neuroimaging</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Positional headache (worse upright, better lying flat)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Intracranial hypotension (low CSF pressure headache)</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Neuroimaging (brain MRI with gadolinium)</td>
      </tr>
      <tr>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Headache during pregnancy or postpartum</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem;">Pre-eclampsia, CVST, pituitary apoplexy, RCVS, PRES/RCVS</td>
        <td style="padding: 0.5rem; border: 1px solid #fee2e2; font-size: 0.75rem; font-weight: bold;">Emergency department or urgent obstetric review</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="callout-block" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #d97706; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #78350f;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b45309;">Important</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;"><strong>Thunderclap headache = subarachnoid haemorrhage until proven otherwise</strong> — a normal CT does NOT exclude SAH; lumbar puncture is required if CT is negative.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;"><strong>New headache or changed headache pattern in a patient &gt;50 years</strong> warrants urgent investigation — always consider giant cell arteritis (ESR/CRP same day) and space-occupying lesion.</li>
  </ul>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">4. EXAMINATION FINDINGS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Physical examination is guided by the history. A focused neurological examination is essential for all patients with new or changed headache. The key aim is to detect signs that would indicate a secondary cause.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">General and Vital Signs</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Blood pressure:</strong> hypertensive emergency can cause headache; malignant hypertension may cause papilloedema</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Temperature:</strong> fever with headache raises concern for meningitis or encephalitis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>BMI:</strong> obesity is associated with IIH</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Neurological Examination</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Level of consciousness and cognition:</strong> confusion or drowsiness warrants urgent assessment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Cranial nerve examination:</strong> focal deficits suggest structural or vascular cause</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Fundoscopy:</strong> assess for papilloedema — if unable to perform adequately, refer for urgent ophthalmological assessment (optical coherence tomography)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Motor and sensory examination:</strong> focal neurological signs require urgent neuroimaging</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Meningism:</strong> neck stiffness, Kernig's and Brudzinski's signs — assess in all patients with fever and headache</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Headache-Specific Examination</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Pericranial tenderness:</strong> tender muscle palpation of the head and neck — present in tension-type headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Neck range of movement and cervical palpation:</strong> limited ROM and tenderness at specific cervical levels → cervicogenic headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Temporal artery tenderness or thickening:</strong> pulselessness in &gt;50 years → giant cell arteritis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Periorbital/ocular examination:</strong> red eye, reduced vision, pupil abnormality → acute angle-closure glaucoma, uveitis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Ipsilateral autonomic features:</strong> tearing, ptosis, miosis, nasal stuffiness → TAC</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Triggerpoint examination:</strong> touching specific facial/scalp areas triggers pain → trigeminal neuralgia, greater occipital neuralgia</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">5. INVESTIGATIONS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Neuroimaging is generally NOT indicated for new-onset headache unless a neurological abnormality is detected on examination or a red flag is present. Over-investigation with CT scanning exposes patients to unnecessary radiation and false positives. Investigations should be targeted.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">First-Line Blood Tests (Guided by History)</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>ESR and CRP:</strong> mandatory in any new headache in a patient &gt;50 years — to exclude giant cell arteritis; if GCA suspected, start steroids before imaging results</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Full blood count, EUC, LFTs, glucose:</strong> systemic illness, metabolic cause, or baseline before starting prophylaxis</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Thyroid function:</strong> hypothyroidism and hyperthyroidism can cause headache</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Blood pressure measurement:</strong> at every headache consultation</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Urinalysis and urine protein/creatinine ratio:</strong> if pre-eclampsia considered in pregnancy</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Neuroimaging</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>CT head (non-contrast):</strong> first-line for suspected SAH, acute stroke, trauma, haemorrhage — fast and widely available</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>MRI brain:</strong> superior for posterior fossa lesions, white matter, venous sinus thrombosis, low CSF pressure, Chiari malformation, structural causes of TACs, trigeminal neuralgia neurovascular compression</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>CT or MR angiography:</strong> if vascular cause suspected (dissection, aneurysm, RCVS, vasculitis)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>MRI with gadolinium:</strong> preferred for low CSF pressure headache (pachymeningeal enhancement)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Imaging NOT routinely indicated for: classic migraine, tension-type headache, medication overuse headache, or established cluster headache with no change in pattern</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Lumbar Puncture</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Indicated after negative CT in suspected SAH — xanthochromia or elevated red cells at &gt;12 hours from headache onset</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Also indicated for suspected meningitis/encephalitis, IIH (opening pressure measurement), and low CSF pressure syndromes</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">6. DIFFERENTIAL DIAGNOSIS</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">The following table summarises the key distinguishing features of the most common headache types encountered in general practice. Refer to individual Synapse notes for detailed management of each condition.</p>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; overflow: hidden;">
  <thead>
    <tr style="background-color: #0d9488; color: #ffffff;">
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Diagnosis</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Duration</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Location &amp; Character</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Key Features</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Distinguishing Pearls</th>
    </tr>
  </thead>
  <tbody style="color: #475569; font-size: 0.75rem;">
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Migraine</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">4–72 hours</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral (not side-locked), pulsating; moderate-severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Nausea, vomit, photophob, phonophob; aggravated by activity; ± aura</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">3 screening questions: nausea? lightsensitivity? impact on ADLs?</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Tension-type headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">30 min – 7 days</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Bilateral, pressure/tightness; mild-moderate</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">No nausea; not aggravated by activity; ± photo or phonophobia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Most common headache type; diagnosis of exclusion from migraine</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cluster headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">15–180 min</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, periorbital, side-locked, excruciating; severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Ipsilateral autonomic features, restlessness, agitation</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Patient cannot lie still — opposite of migraine; urgent specialist referral required</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Paroxysmal hemicrania</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">2–30 min per attack</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, side-locked, severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Multiple attacks/day; ipsilateral autonomic features</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Absolute indomethacin response is diagnostic</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Hemicrania continua</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Continuous</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, continuous, variable severity</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Exacerbations with autonomic features; may have migraine features</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Absolute indomethacin response is diagnostic</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">SUNCT</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">5 sec – 4 min</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, brief, severe</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Up to 200+ attacks/day; prominent tearing/conjunctival injection; cutaneous triggers</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Very rare; no indomethacin response; expert management required</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Medication overuse headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">≥15 days/month</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Variable</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Headache on ≥15 days/month with escalating analgesic use</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Always ask analgesic frequency; daily essential; migraine/TTH more susceptible than cluster</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cervicogenic headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Variable</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, from neck to head</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Reduced neck ROM; worsened by neck movement/palpation; onset with cervical lesion</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Physiotherapy first-line; imaging usually not helpful initially</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Primary exertional / sexual</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">&lt;48 hours (exertional); variable (sexual)</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Bilateral (exertional); severe at orgasm</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Thunderclap at orgasm = exclude SAH; exclude structural causes first</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Perform imaging for all new presentations; propranolol or indomethacin prophylaxis</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Trigeminal neuralgia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Seconds–minutes</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral, shock-like, V2/V3</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Triggered by touch, eating, speaking; brief refractory period after attack</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Always image to exclude structural causes; carbamazepine first-line</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Giant cell arteritis</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Persistent/progressive</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Unilateral or bilateral temporal</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Age &gt;50; temporal artery tenderness; jaw claudication, visual changes; elevated ESR/CRP</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Medical emergency; if visual symptoms start, prednisone immediately</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">SAH</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Sudden onset, persistent</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Diffuse 'worst headache of life'</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Thunderclap onset; meningism; loss of consciousness possible</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Emergency! If CT negative, lumbar puncture; emergency department immediately</td>
    </tr>
  </tbody>
</table>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">7. MANAGEMENT PRINCIPLES</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Management depends on the headache diagnosis. For all primary headaches, the GP approach includes: confirming diagnosis, excluding secondary causes, initiating appropriate acute treatment, considering prophylaxis where indicated, managing lifestyle factors, and monitoring for medication overuse.</p>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">General Principles — All Headache Types</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Provide the diagnosis clearly</strong> — many patients fear their headache represents a sinister cause. Address concerns explicitly.</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Recommend a headache diary</strong> — establishes frequency, triggers, analgesic use, and response to treatment. Essential before specialist referral.</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Identify and address medication overuse:</strong> limit nonopioid analgesics to &lt;15 days/month and triptans/opioids to &lt;10 days/month (eTG)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Lifestyle optimisation for all primary headaches:</strong> regular sleep, adequate hydration (1.5–2 L water/day), regular meals, limit caffeine (&lt;200 mg/day), regular aerobic exercise, stress management</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Address psychological comorbidities</strong> — anxiety and depression are common in patients with frequent headache and worsen outcomes if untreated</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Acute Treatment — By Diagnosis (Summary)</h3>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Refer to individual Synapse notes for complete dosing tables. The following summarises first-line acute approaches:</p>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; overflow: hidden;">
  <thead>
    <tr style="background-color: #0d9488; color: #ffffff;">
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">Header Type</th>
      <th style="padding: 0.6rem; border: 1px solid #cbd5e1; font-size: 0.75rem; text-align: left;">First-Line Acute Treatment</th>
    </tr>
  </thead>
  <tbody style="color: #475569; font-size: 0.75rem;">
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Migraine</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">NSAIDs (ibuprofen 400–600 mg, naproxen, aspirin 900–1000 mg, diclofenac) ± antiemetic (metoclopramide, prochlorperazine). Triptan if NSAIDs insufficient. Start at symptom onset.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Tension-type headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">NSAIDs (aspirin 600–900 mg, ibuprofen 400 mg, naproxen, diclofenac 50 mg) or paracetamol 1 g. Avoid regular use (&gt;15 days/month).</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cluster headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">SC sumatriptan 6 mg + high-flow Oxygen 100% at 15 L/min via non-rebreathing mask for 15–20 min. Refer urgently to specialist.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Paroxysmal hemicrania / Hemicrania continua</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Indomethacin titration trial: 25 → 50 → 75 mg TDS, 3 days each step. Absolute response is diagnostic.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Primary exertional / sexual headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Indomethacin 25–50 mg orally 2 hours before activity (prophylactic). Propranolol 40–80 mg BD for 1 month if regular prophylaxis needed.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Cervicogenic headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Physiotherapy and exercises (first-line despite initial worsening), NSAIDs or paracetamol for symptom relief.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Medication overuse headache</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Analgesic withdrawal (graded or abrupt with bridging therapy). bridging: naproxen MRI 750–1000 mg daily reducing over 3 weeks. OR prednisolone 50 mg daily for 5 days then taper. Start prophylaxis before withdrawal.</td>
    </tr>
    <tr>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">Trigeminal neuralgia</td>
      <td style="padding: 0.6rem; border: 1px solid #cbd5e1;">Carbamazepine MR 100 mg BD titrated to 400 mg BD. Oxcarbazepine or pregabalin if intolerant.</td>
    </tr>
  </tbody>
</table>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">When to Consider Prophylaxis</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Migraine:</strong> ≥4 migraine days/month, or fewer if severe or significantly impacting quality of life, or acute treatment ineffective/poorly tolerated</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Tension-type headache:</strong> frequent TTH not adequately controlled by acute treatment — amitriptyline or nortriptyline first-line</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Cluster headache:</strong> all patients with episodic or chronic cluster headache — verapamil first-line (specialist-initiated with ECG monitoring)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Primary exertional/sexual headache:</strong> if frequent — propranolol 10–40 mg BD for 1 month, then review</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">8. WHEN TO REFER / ESCALATE</h2>

<div class="callout-block" style="background-color: #fff1f2; border: 1px solid #fee2e2; border-left: 5px solid #ef4444; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #7f1d1d;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #b91c1c;">Emergency Referral — Send to ED Immediately</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Thunderclap headache — any sudden severe headache reaching peak intensity within seconds</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Headache with focal neurological signs, confusion, or drowsiness</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Signs of meningism with fever and headache</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">New headache with visual obscuration or visual loss — possible IIH or raised ICP emergency</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Headache in pregnancy with hypertension or proteinuria — possible pre-eclampsia</li>
  </ul>
</div>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Urgent (Same-Day or Within Days)</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>New headache in patient &gt;50 years</strong> — giant cell arteritis must be excluded urgently (ESR/CRP; if suspected, start prednisolone before waiting for results)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Suspected cluster headache</strong> — requires urgent specialist review to confirm diagnosis, arrange MRI brain, and optimise treatment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Papilloedema found on examination</strong> — urgent ophthalmology and neurology referral</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">Non-Urgent Neurology Referral</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Migraine:</strong> inadequate control after several trials of acute and prophylactic therapy; consideration of CGRP-targeted therapies or botulinum toxin A</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Diagnostic uncertainty</strong> — headache not clearly fitting a primary headache type after thorough GP workup</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Trigeminal neuralgia:</strong> loss of drug efficacy, intolerance, or consideration of surgical/interventional therapy</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>TACs:</strong> all paroxysmal hemicrania and hemicrania continua cases for specialist confirmation; SUNCT always requires expert management</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Children with frequent or disabling headache</strong> — paediatric neurology referral for prophylaxis decisions</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">9. SAFETY NETTING &amp; FOLLOW-UP</h2>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Advise all patients to return promptly if:</strong> headache becomes thunderclap, character changes significantly, new neurological symptoms develop, or any red flag emerges</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Document baseline headache frequency and character</strong> — this is the reference point for monitoring and detecting deterioration</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Review headache diary at 4–6 weeks</strong> — assess frequency, triggers, analgesic use, and response to initial treatment</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>If prophylaxis started: review at 8–12 weeks</strong> for response and tolerability; titrate dose; effective prophylaxis = 30–50% reduction in headache days</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Screen for medication overuse at every review</strong> — ask specifically about analgesic frequency</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><strong>Screen for depression and anxiety</strong> — common comorbidities that worsen headache outcomes</li>
</ul>

<div class="callout-block" style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-left: 5px solid #0d9488; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: #115e59;">
  <div style="font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: #0f766e;">Key Points</div>
  <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 0;">
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Neuroimaging is NOT routinely needed for primary headaches — investigate only if red flags are present or examination is abnormal.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Thunderclap headache = SAH until proven otherwise — CT then LP; send to ED immediately.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">Always ask about analgesic frequency — medication overuse headache is common, underrecognised, and worsens prognosis of the primary headache disorder.</li>
    <li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: inherit;">A headache diary is essential for establishing diagnosis, monitoring treatment, and preparing for specialist referral.</li>
  </ul>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">10. RESOURCES</h2>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">For Health Professionals</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">Therapeutic Guidelines — Neurology (eTG, December 2025)</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;">UpToDate — Headache (uptodate.com)</li>
</ul>

<h3 style="font-family: 'DM Sans', sans-serif; font-size: 1.05rem; font-weight: bold; color: #0f766e; margin-top: 1.25rem; margin-bottom: 0.5rem;">For Patients</h3>
<ul style="padding-left: 1.25rem; margin-bottom: 1.25rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Headache diary — Children (RCH)</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Headache diary — Adults</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine &amp; Headache Australia</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">healthdirect — Headache</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine Monitor (app)</a></li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem; line-height: 1.6;"><a href="#" style="color: #0f766e;">Migraine Buddy (app)</a></li>
</ul>
<div style="font-size: 0.75rem; color: #94a3b8; text-align: right; margin-top: 2rem;">End of document ■</div>`,

      guideline: `
<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Background &amp; Rationale</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7;">Provide the clinical background, why this guideline exists, and the population it targets.</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Screening &amp; Diagnosis Criteria</h2>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; overflow: hidden;">
  <thead><tr><th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #0d9488; color: #ffffff; border: 1px solid #cbd5e1;">Criteria</th><th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #0d9488; color: #ffffff; border: 1px solid #cbd5e1;">Threshold / Value</th><th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #0d9488; color: #ffffff; border: 1px solid #cbd5e1;">Notes</th></tr></thead>
  <tbody>
    <tr><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Criteria 1</td><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Value</td><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Clinical note</td></tr>
    <tr><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Criteria 2</td><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Value</td><td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; color: #475569;">Clinical note</td></tr>
  </tbody>
</table>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Management Algorithm</h2>
<div class="callout-block" style="background: #f0fdfa; border-left: 4px solid #0d9488; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem;">
<p style="font-size: 0.875rem; font-weight: 600; color: #115e59; margin-bottom: 0.5rem;">First-line treatment</p>
<ul style="padding-left: 1.25rem; margin: 0;"><li style="font-size: 0.875rem; color: #134e4a; margin-bottom: 0.25rem;">Treatment option 1</li><li style="font-size: 0.875rem; color: #134e4a;">Treatment option 2</li></ul>
</div>`,

      protocol: `
<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Protocol Overview</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7;">This clinical protocol outlines the standardised process for managing [condition/situation]. It is applicable in [setting] and should be followed by [clinician type].</p>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Indications &amp; Eligibility</h2>
<ul style="padding-left: 1.25rem; margin-bottom: 1rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem;">Patient meets criteria: [specify]</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.5rem;">No exclusion criteria apply</li>
  <li style="font-size: 0.875rem; color: #334155;">Informed consent obtained</li>
</ul>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Step-by-Step Protocol</h2>
<ol style="padding-left: 1.25rem; margin-bottom: 1rem;">
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.75rem; line-height: 1.6;"><strong>Step 1:</strong> Describe first clinical action here</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.75rem; line-height: 1.6;"><strong>Step 2:</strong> Describe second clinical action here</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.75rem; line-height: 1.6;"><strong>Step 3:</strong> Describe third clinical action here</li>
  <li style="font-size: 0.875rem; color: #334155; margin-bottom: 0.75rem; line-height: 1.6;"><strong>Step 4:</strong> Describe fourth clinical action here</li>
</ol>

<div class="callout-block" style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem;">
<p style="font-size: 0.875rem; font-weight: 600; color: #92400e; margin-bottom: 0.5rem;">Important Safety Note</p>
<p style="font-size: 0.875rem; color: #78350f;">Insert any safety warnings, contraindications, or monitoring requirements relevant to this protocol.</p>
</div>

<h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Documentation &amp; Follow-up</h2>
<p style="font-size: 0.875rem; color: #334155; line-height: 1.7;">Document in patient record: [what to record]. Schedule follow-up: [timeframe and criteria].</p>`
    };

    const html = templates[variant];
    if (!editorRef.current || !html) return;

    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const div = document.createElement("div");
      div.innerHTML = html;
      const frag = document.createDocumentFragment();
      while (div.firstChild) frag.appendChild(div.firstChild);
      range.insertNode(frag);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current.innerHTML += html;
    }
    updateCounts();
    saveToHistory();
  };


  const handleSave = (statusOverride?: "published" | "draft" | "review" | "archived") => {
    if (!docTitle.trim()) {
      alert("Please enter a content title.");
      return;
    }
    const finalStatus: "published" | "draft" | "review" | "archived" = statusOverride || contentStatus;
    if (statusOverride) setContentStatus(statusOverride);
    // Save all pages (update active page first)
    const allPages = saveCurrentPageToPages();
    const combinedHtml = allPages.join("");

    // Save to Neon via PATCH API
    if (id && !String(id).startsWith("local")) {
      updateMedicalContentItem(String(id), {
        name: docTitle.trim(),
        system: selectedSystem,
        category: selectedCategory,
        status: finalStatus,
        author,
        fullHtml: combinedHtml,
      }).catch(console.error);
    }

    // Update cache
    const list = getMedicalContent();
    const updated = list.map((c) => {
      if (String(c.id) === String(id)) {
        return {
          ...c,
          name: docTitle.trim(),
          system: selectedSystem,
          category: selectedCategory,
          status: finalStatus,
          lastUpdated: new Date().toISOString().split("T")[0],
          references: docReferences.length,
        };
      }
      return c;
    });
    setMedicalContents(updated);
    saveMedicalContent(updated);

    addUserNotification(
      "Content Saved",
      `Saved changes to "${docTitle}".`,
      1,
      "custom"
    );
    setShowSaveToast(true);

    if (id && !String(id).startsWith("local")) {
      const entityType = contentItem?.type === "Approach" ? "approach" : "medical_condition";
      if (previousHtmlRef.current !== combinedHtml) {
        // Record edit history
        fetch(`/api/content-history/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource: "history",
            entityType,
            fieldName: "full_html",
            changeType: "modified",
            oldContent: previousHtmlRef.current || null,
            newContent: combinedHtml,
            adminUserId: currentAdmin?.id,
            adminUserName: currentAdmin?.name || author,
          }),
        }).catch(console.error);

        // Auto-save a version snapshot
        fetch(`/api/content-history/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource: "version",
            entityType,
            fullHtml: combinedHtml,
            metadata: {
              name: docTitle.trim(),
              status: finalStatus,
              author,
              tags,
            },
            createdBy: currentAdmin?.id,
            createdByName: currentAdmin?.name || author,
          }),
        }).then(() => loadHistoryAndVersions(String(id), entityType)).catch(console.error);

        previousHtmlRef.current = combinedHtml;
      }
    }
  };

  const loadHistoryAndVersions = useCallback(async (entityId: string, entityType: string = "medical_condition") => {
    if (!entityId || entityId.startsWith("local")) return;
    setIsHistoryLoading(true);
    try {
      const [histRes, verRes] = await Promise.all([
        fetch(`/api/content-history/${entityId}?resource=history&type=${entityType}`).then((r) => r.json()),
        fetch(`/api/content-history/${entityId}?resource=versions&type=${entityType}`).then((r) => r.json()),
      ]);
      if (histRes.success && histRes.history) {
        setHistoryLog(histRes.history);
      }
      if (verRes.success && verRes.versions) {
        setVersionList(verRes.versions);
        // If no versions exist yet, auto-create v1 from current editor content
        if (verRes.versions.length === 0) {
          const currentContent = previousHtmlRef.current || (editorRef.current ? editorRef.current.innerHTML : "");
          if (currentContent && currentContent.trim()) {
            fetch(`/api/content-history/${entityId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resource: "version",
                entityType,
                fullHtml: currentContent,
                label: "v1 – Initial Version",
                metadata: {
                  name: docTitle || "Document",
                  status: contentStatus || "published",
                  author: author || "GP Edge Admin",
                },
                createdBy: currentAdmin?.id,
                createdByName: currentAdmin?.name || author,
              }),
            })
              .then((r) => r.json())
              .then((j) => {
                if (j.success) {
                  fetch(`/api/content-history/${entityId}?resource=versions&type=${entityType}`)
                    .then((r) => r.json())
                    .then((v) => { if (v.success && v.versions) setVersionList(v.versions); });
                }
              })
              .catch(console.error);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load history or versions:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [docTitle, contentStatus, author, currentAdmin]);

  const handleSaveVersion = async () => {
    if (!id || String(id).startsWith("local")) {
      alert("Please save the document first before creating a version snapshot.");
      return;
    }
    setIsSavingVersion(true);
    try {
      const allPages = saveCurrentPageToPages();
      const combinedHtml = allPages.join("");
      const res = await fetch(`/api/content-history/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "version",
          entityType: contentItem?.type === "Approach" ? "approach" : "medical_condition",
          fullHtml: combinedHtml,
          metadata: {
            name: docTitle.trim(),
            status: contentStatus,
            author,
            tags,
          },
          createdBy: currentAdmin?.id,
          createdByName: currentAdmin?.name || author,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addUserNotification("Version Saved", `Saved version snapshot ${json.label}.`, 1, "custom");
        await loadHistoryAndVersions(String(id), contentItem?.type === "Approach" ? "approach" : "medical_condition");
      }
    } catch (err) {
      console.error("Failed to save version:", err);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleRestoreVersion = async (version: VersionInfo) => {
    if (!id || String(id).startsWith("local")) return;
    try {
      const res = await fetch(`/api/content-history/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "restore",
          versionId: version.id,
          entityType: contentItem?.type === "Approach" ? "approach" : "medical_condition",
          adminUserId: currentAdmin?.id,
          adminUserName: currentAdmin?.name || author,
        }),
      });
      const json = await res.json();
      if (json.success && json.restoredHtml) {
        const restoredHtml = json.restoredHtml;
        const parsedPages = splitHtmlIntoPages(restoredHtml);
        setPages(parsedPages);
        setActivePage(0);
        if (editorRef.current) {
          editorRef.current.innerHTML = parsedPages[0] || "";
          updateCounts();
        }
        previousHtmlRef.current = restoredHtml;
        if (json.restoredMetadata) {
          if (json.restoredMetadata.name) setDocTitle(json.restoredMetadata.name);
          if (json.restoredMetadata.status) setContentStatus(json.restoredMetadata.status);
          if (json.restoredMetadata.author) setAuthor(json.restoredMetadata.author);
        }
        addUserNotification("Version Restored", `Restored content to ${version.label}.`, 1, "custom");
        await loadHistoryAndVersions(String(id), contentItem?.type === "Approach" ? "approach" : "medical_condition");
      }
    } catch (err) {
      console.error("Failed to restore version:", err);
    }
  };

  const handleAddReference = () => {
    if (!newRefText.trim()) return;
    const newRef: Reference = {
      id: docReferences.length > 0 ? Math.max(...docReferences.map(r => r.id)) + 1 : 1,
      text: newRefText.trim(),
      url: newRefUrl.trim() || "#"
    };
    const updated = [...docReferences, newRef];
    setDocReferences(updated);
    // Sync to Neon if this is a persisted item
    if (id && !String(id).startsWith("local")) {
      updateMedicalContentItem(String(id), {}).catch(console.error);
    }
    setNewRefText("");
    setNewRefUrl("");
    
    addUserNotification(
      "Reference Added",
      `Added a new reference to "${docTitle}".`,
      1,
      "custom"
    );
  };

  const handleRemoveReference = (refId: number) => {
    const updated = docReferences.filter(r => r.id !== refId);
    setDocReferences(updated);
    localStorage.setItem(`gpedge_content_refs_${id}`, JSON.stringify(updated));
  };

  // Quick Actions Activation
  const handleExportPDF = () => {
    // Inject dynamic print title for printing preview window title matching docTitle
    const originalTitle = document.title;
    document.title = docTitle;
    window.print();
    document.title = originalTitle;
  };

  const handleDuplicate = () => {
    const html = editorRef.current?.innerHTML || "";
    saveMedicalContentItem({
      name: `Copy of ${docTitle}`,
      system: selectedSystem,
      category: selectedCategory,
      type: contentItem?.type || "Guideline",
      status: "draft",
      author: "GP Edge Admin",
      fullHtml: html,
    }).then((savedId) => {
      const newId = savedId || `local-${Date.now()}`;
      const duplicateItem: MedicalContent = {
        id: newId,
        name: `Copy of ${docTitle}`,
        system: selectedSystem,
        category: selectedCategory,
        type: contentItem?.type || "Guideline",
        status: "draft",
        lastUpdated: new Date().toISOString().split("T")[0],
        author: "GP Edge Admin",
        references: docReferences.length,
        usedInQuestions: 0,
      };
      const list = getMedicalContent();
      const updated = [duplicateItem, ...list];
      setMedicalContents(updated);
      saveMedicalContent(updated);
      addUserNotification("Content Duplicated", `Created draft duplicate "${duplicateItem.name}".`, 1, "custom");
      alert(`Duplicated successfully! Redirecting to copy...`);
      router.push(`/admin/content/editor?id=${newId}`);
    });
  };

  const handleLinkQuestion = (qid: number) => {
    const newLinks = [...linkedQuestionIds, qid];
    setLinkedQuestionIds(newLinks);
    localStorage.setItem(`gpedge_content_links_${id}`, JSON.stringify(newLinks));
    addUserNotification(
      "Question Linked",
      `Linked question #${qid} to content document "${docTitle}".`,
      1,
      "custom"
    );
  };

  const handleUnlinkQuestion = (qid: number) => {
    const newLinks = linkedQuestionIds.filter((id) => id !== qid);
    setLinkedQuestionIds(newLinks);
    localStorage.setItem(`gpedge_content_links_${id}`, JSON.stringify(newLinks));
  };

  const handleGenerateQuiz = async () => {
    const bank = allQuestions;
    // Filter questions by system name matches
    const related = bank.filter(q => 
      q.topic.toLowerCase().includes(selectedSystem.toLowerCase()) ||
      q.text.toLowerCase().includes(selectedSystem.toLowerCase()) ||
      q.text.toLowerCase().includes(selectedCategory.toLowerCase())
    );
    const quizQuestions = related.slice(0, 8);
    if (quizQuestions.length === 0) {
      // Fallback
      quizQuestions.push(...bank.slice(0, 5));
    }

    const quizName = `Quiz: ${docTitle}`;
    const result = await syncQuizToDbAction({
      name: quizName,
      description: `Auto-generated practice quiz based on the clinical content "${docTitle}".`,
      timeLimit: quizQuestions.length * 2,
      passingScore: 70,
      randomize: true,
      status: "draft",
      examType: "AKT",
    }, quizQuestions, currentAdmin?.id);

    if (result.success && result.dbId) {
      addUserNotification(
        "Quiz Generated",
        `Successfully generated practice quiz "${quizName}" with ${quizQuestions.length} related questions.`,
        quizQuestions.length,
        "quiz"
      );

      alert(`Practice quiz generated successfully! Redirecting to quiz settings...`);
      router.push(`/admin/quizzes/${result.dbId}/edit`);
    }
  };

  // Filter questions for linking modal
  const filteredQuestions = allQuestions.filter(q => 
    q.text.toLowerCase().includes(questionSearch.toLowerCase()) || 
    q.id.toString().includes(questionSearch) || 
    q.topic.toLowerCase().includes(questionSearch.toLowerCase())
  );

  const suggestedTags = [
    "Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS",
    "Cardiovascular", "Emergency", "Preventive", "Mental Health",
    "Skin Cancer", "Obstetrics", "GI", "MSK", "Billing"
  ].filter(tag => !tags.includes(tag));

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // ── Ribbon tab definitions ──
  const ribbonContent = () => {
    if (ribbonTab === "home") return (
      <div
        data-toolbar="true"
        className="border-t border-slate-200/40 dark:border-slate-800 px-5 py-2 flex items-center gap-1 flex-wrap bg-slate-50/50 dark:bg-slate-900/50"
      >
        {/* Undo / Redo */}
        <ToolbarBtn title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={historyIndex <= 0}>
          <Lucide.Undo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
          <Lucide.Redo2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarSep />

        {/* Font family dropdown */}
        <div ref={fontDropdownRef} className="relative inline-block text-left">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setFontOpen(f => !f); setSizeOpen(false); }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-355 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span style={{ fontFamily: selectedFont.value }} className="truncate max-w-[90px]">{selectedFont.label}</span>
            <Lucide.ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          <AnimatePresence>
            {fontOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 4 }} exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[60] overflow-hidden"
              >
                <div className="p-1 max-h-60 overflow-y-auto">
                  {fontOptions.map(f => (
                    <button
                      key={f.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelectedFont(f); handleFormatText("fontFamily", f.value); setFontOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                        selectedFont.value === f.value
                          ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font size */}
        <div ref={sizeDropdownRef} className="relative inline-block text-left">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setSizeOpen(s => !s); setFontOpen(false); }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-355 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{selectedSize.label}</span>
            <Lucide.ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          <AnimatePresence>
            {sizeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 4 }} exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 mt-1 w-20 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[60] overflow-hidden"
              >
                <div className="p-1">
                  {fontSizeOptions.map(s => (
                    <button
                      key={s.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelectedSize(s); handleFormatText("fontSize", s.value); setSizeOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                        selectedSize.value === s.value
                          ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ToolbarSep />

        {/* Bold Italic Underline Strike */}
        {[
          { icon: <Lucide.Bold className="w-4 h-4" />, title: "Bold (Ctrl+B)", cmd: "bold" },
          { icon: <Lucide.Italic className="w-4 h-4" />, title: "Italic (Ctrl+I)", cmd: "italic" },
          { icon: <Lucide.Underline className="w-4 h-4" />, title: "Underline (Ctrl+U)", cmd: "underline" },
          { icon: <Lucide.Strikethrough className="w-4 h-4" />, title: "Strikethrough", cmd: "strikeThrough" },
        ].map((b) => (
          <ToolbarBtn key={b.title} title={b.title} onClick={() => { document.execCommand(b.cmd, false); updateCounts(); saveToHistory(); }}>{b.icon}</ToolbarBtn>
        ))}

        {/* Text color */}
        <div ref={textColorRef} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setTextColorOpen(!textColorOpen)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 px-2 text-xs font-semibold text-slate-700 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
            title="Text Color"
          >
            <Lucide.Type className="w-3.5 h-3.5" />
            <span className="w-2.5 h-2.5 rounded-full border border-slate-200 dark:border-slate-600" style={{ backgroundColor: "#0f172a" }} />
          </button>
          <AnimatePresence>
            {textColorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 4 }} exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[60] p-2"
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Text Color</div>
                <div className="grid grid-cols-4 gap-1.5 p-1">
                  {[
                    { name: "Default", color: "#0f172a" },
                    { name: "Teal", color: "#0f766e" },
                    { name: "Slate", color: "#475569" },
                    { name: "Green", color: "#059669" },
                    { name: "Amber", color: "#d97706" },
                    { name: "Red", color: "#dc2626" },
                    { name: "Blue", color: "#2563eb" },
                    { name: "Purple", color: "#7c3aed" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      title={item.name}
                      onMouseDown={(e) => { e.preventDefault(); document.execCommand("foreColor", false, item.color); updateCounts(); saveToHistory(); setTextColorOpen(false); }}
                      className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name === "Default" && <span className="text-[10px] text-white font-bold">A</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Highlight */}
        <div ref={highlightColorRef} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setHighlightColorOpen(!highlightColorOpen)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 px-2 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
            title="Text Highlight"
          >
            <Lucide.Highlighter className="w-3.5 h-3.5" />
            <span className="w-2.5 h-1 bg-yellow-300 rounded-sm" />
          </button>
          <AnimatePresence>
            {highlightColorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 4 }} exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[60] p-2"
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Highlight</div>
                <div className="grid grid-cols-4 gap-1.5 p-1">
                  {[
                    { name: "None", color: "transparent" },
                    { name: "Yellow", color: "#fef08a" },
                    { name: "Teal", color: "#ccfbf1" },
                    { name: "Green", color: "#d1fae5" },
                    { name: "Amber", color: "#fef3c7" },
                    { name: "Rose", color: "#ffe4e6" },
                    { name: "Blue", color: "#dbeafe" },
                    { name: "Slate", color: "#e2e8f0" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      title={item.name}
                      onMouseDown={(e) => { e.preventDefault(); document.execCommand("hiliteColor", false, item.color); updateCounts(); saveToHistory(); setHighlightColorOpen(false); }}
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center bg-white"
                      style={{ backgroundColor: item.color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ToolbarSep />

        {/* Headings */}
        {[
          { label: "H1", title: "Heading 1", value: "h1", className: "text-base font-bold" },
          { label: "H2", title: "Heading 2", value: "h2", className: "text-sm font-bold" },
          { label: "H3", title: "Heading 3", value: "h3", className: "text-xs font-bold" },
          { label: "¶", title: "Normal Paragraph", value: "p", className: "text-xs" },
        ].map((b) => (
          <ToolbarBtn key={b.label} title={b.title} onClick={() => { document.execCommand("formatBlock", false, b.value); updateCounts(); saveToHistory(); }}>
            <span className={b.className}>{b.label}</span>
          </ToolbarBtn>
        ))}
        <ToolbarSep />

        {/* Paragraph alignment + lists */}
        {[
          { icon: <Lucide.AlignLeft className="w-4 h-4" />, title: "Align Left", cmd: "justifyLeft" },
          { icon: <Lucide.AlignCenter className="w-4 h-4" />, title: "Align Center", cmd: "justifyCenter" },
          { icon: <Lucide.AlignRight className="w-4 h-4" />, title: "Align Right", cmd: "justifyRight" },
          { icon: <Lucide.AlignJustify className="w-4 h-4" />, title: "Justify", cmd: "justifyFull" },
          { icon: <Lucide.List className="w-4 h-4" />, title: "Bullet List", cmd: "insertUnorderedList" },
          { icon: <Lucide.ListOrdered className="w-4 h-4" />, title: "Numbered List", cmd: "insertOrderedList" },
          { icon: <Lucide.Indent className="w-4 h-4" />, title: "Indent", cmd: "indent" },
          { icon: <Lucide.Outdent className="w-4 h-4" />, title: "Outdent", cmd: "outdent" },
        ].map((b) => (
          <ToolbarBtn key={b.title} title={b.title} onClick={() => { document.execCommand(b.cmd, false); updateCounts(); saveToHistory(); }}>{b.icon}</ToolbarBtn>
        ))}
      </div>
    );

    if (ribbonTab === "insert") return (
      <div className="border-t border-slate-200/40 dark:border-slate-800 px-5 py-2 flex items-center gap-1 flex-wrap bg-slate-50/50 dark:bg-slate-900/50 min-h-[54px]">
        {/* Table */}
        <RibbonGroup label="Tables">
          <div ref={tableBtnRef}>
            <RibbonBtn title="Insert Table" onClick={() => {
              const a = calcAnchor(tableBtnRef);
              setTableAnchor(tableMenuOpen ? null : a);
              setTableMenuOpen(o => !o);
              setCalloutMenuOpen(false); setCalloutAnchor(null);
              setImageMenuOpen(false); setImageAnchor(null);
            }}>
              <Lucide.Table className="w-5 h-5" /><span>Table</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Callouts */}
        <RibbonGroup label="Callouts">
          <div ref={calloutBtnRef}>
            <RibbonBtn title="Insert Callout" onClick={() => {
              const a = calcAnchor(calloutBtnRef);
              setCalloutAnchor(calloutMenuOpen ? null : a);
              setCalloutMenuOpen(o => !o);
              setTableMenuOpen(false); setTableAnchor(null);
              setImageMenuOpen(false); setImageAnchor(null);
            }}>
              <Lucide.MessageSquare className="w-5 h-5" /><span>Callout</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Media */}
        <RibbonGroup label="Media">
          <div ref={imageBtnRef}>
            <RibbonBtn title="Insert Image" onClick={() => {
              const a = calcAnchor(imageBtnRef);
              setImageAnchor(imageMenuOpen ? null : a);
              setImageMenuOpen(o => !o);
              setTableMenuOpen(false); setTableAnchor(null);
              setCalloutMenuOpen(false); setCalloutAnchor(null);
            }}>
              <Lucide.Image className="w-5 h-5" /><span>Image</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Symbols */}
        <RibbonGroup label="Symbols">
          <RibbonBtn title="Insert Horizontal Rule" onClick={insertDivider}><Lucide.Minus className="w-5 h-5" /><span>Divider</span></RibbonBtn>
          <RibbonBtn title="Insert Page Break" onClick={insertPageBreak}><Lucide.FileText className="w-5 h-5" /><span>Page Break</span></RibbonBtn>
          <div ref={linkBtnRef}>
            <RibbonBtn title="Insert Link" active={linkOpen} onClick={() => {
              const a = calcAnchor(linkBtnRef);
              setLinkAnchorPos(linkOpen ? null : a);
              setLinkOpen(o => !o);
            }}>
              <Lucide.Link className="w-5 h-5" /><span>Link</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Templates */}
        <RibbonGroup label="Templates">
          <div ref={templateBtnRef}>
            <RibbonBtn title="Clinical Template" onClick={() => {
              setTemplateMenuOpen(o => !o);
            }}>
              <Lucide.LayoutTemplate className="w-5 h-5" /><span>Template</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
      </div>
    );

    if (ribbonTab === "layout") return (
      <div className="border-t border-slate-200/40 dark:border-slate-800 px-5 py-2 flex items-center gap-1 flex-wrap bg-slate-50/50 dark:bg-slate-900/50 min-h-[54px]">
        <RibbonGroup label="Pages">
          <RibbonBtn title="Add Page" onClick={addPage}><Lucide.FilePlus className="w-5 h-5" /><span>New Page</span></RibbonBtn>
          <RibbonBtn title="Delete Current Page" onClick={() => deletePage(activePage)}><Lucide.FileX className="w-5 h-5" /><span>Delete Page</span></RibbonBtn>
        </RibbonGroup>
        <RibbonSep />

        {/* Table tools — only show when inside a table */}
        {activeTable && (
          <RibbonGroup label="Table Tools">
            <RibbonBtn title="Row Above" onClick={insertRowAbove}><Lucide.ArrowUp className="w-4 h-4" /><span>Row ↑</span></RibbonBtn>
            <RibbonBtn title="Row Below" onClick={insertRowBelow}><Lucide.ArrowDown className="w-4 h-4" /><span>Row ↓</span></RibbonBtn>
            <RibbonBtn title="Delete Row" onClick={deleteRow}><Lucide.Trash2 className="w-4 h-4 text-red-500" /><span>Del Row</span></RibbonBtn>
            <RibbonBtn title="Column Left" onClick={insertColumnLeft}><Lucide.ArrowLeft className="w-4 h-4" /><span>Col ←</span></RibbonBtn>
            <RibbonBtn title="Column Right" onClick={insertColumnRight}><Lucide.ArrowRight className="w-4 h-4" /><span>Col →</span></RibbonBtn>
            <RibbonBtn title="Delete Column" onClick={deleteColumn}><Lucide.Trash2 className="w-4 h-4 text-red-500" /><span>Del Col</span></RibbonBtn>
            <RibbonBtn title="Delete Table" onClick={deleteTable}><Lucide.X className="w-4 h-4 text-red-600" /><span>Del Table</span></RibbonBtn>
          </RibbonGroup>
        )}
        <RibbonSep />
        <RibbonGroup label="View">
          <RibbonBtn title="Toggle Sidebar" onClick={() => setShowSidebar(s => !s)} active={showSidebar}>
            <Lucide.PanelRight className="w-5 h-5" /><span>Sidebar</span>
          </RibbonBtn>
        </RibbonGroup>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .print-area h2 {
          font-family: Georgia, serif !important;
          font-size: 1.35rem !important;
          font-weight: bold !important;
          color: #0f766e !important;
          border-left: 4px solid #0f766e !important;
          padding-left: 0.75rem !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.25 !important;
        }
        .print-area p, .print-area li, .print-area ul, .print-area ol {
          color: #334155 !important;
        }
        .print-area table {
          width: 100% !important;
          border-collapse: collapse !important;
          text-align: left !important;
          margin-bottom: 1.25rem !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
        }
        .print-area th {
          text-align: left !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 0.75rem 1rem !important;
          background-color: #16a34a !important;
          color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
        }
        .print-area td {
          padding: 0.75rem 1rem !important;
          font-size: 0.825rem !important;
          border: 1px solid #e2e8f0 !important;
          color: #475569;
        }
        .print-area td p, .print-area th p {
          margin: 0 !important;
          font-size: inherit !important;
          color: inherit !important;
          line-height: inherit !important;
        }
        .print-area tr:nth-child(even) td {
          background-color: #ffffff;
        }
        .print-area tr:nth-child(odd) td {
          background-color: #ffffff;
        }
        .print-area .callout-block {
          border-radius: 0.75rem !important;
          padding: 1rem !important;
          margin-bottom: 1.25rem !important;
        }
        .print-area .callout-block p {
          color: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
          margin-bottom: 0.75rem !important;
        }
        .print-area .callout-block p:last-child {
          margin-bottom: 0 !important;
        }
        .print-area .callout-block ul, .print-area .callout-block ol {
          margin-bottom: 0.75rem !important;
        }
        .print-area .callout-block li {
          color: inherit !important;
          font-size: inherit !important;
        }
        .print-area .callout-block[data-variant="info"], 
        .print-area .callout-block:not([data-variant]) {
          background-color: #e6f7f4 !important;
          border: 1px solid #e6f7f4 !important;
          border-left: 5px solid #2bb09c !important;
          color: #1a5c51 !important;
        }
        .print-area .callout-block[data-variant="pearl"] {
          background-color: #f0fdf4 !important;
          border: 1px solid #d1fae5 !important;
          border-left: 5px solid #16a34a !important;
          color: #14532d !important;
        }
        .print-area .callout-block[data-variant="pearl"] > div:first-child {
          color: #15803d !important;
        }
        .print-area .callout-block[data-variant="important"] {
          background-color: #fefce8 !important;
          border: 1px solid #fef08a !important;
          border-left: 5px solid #eab308 !important;
          color: #713f12 !important;
        }
        .print-area .callout-block[data-variant="important"] > div:first-child {
          color: #854d0e !important;
        }
        .print-area .callout-block[data-variant="warning"],
        .print-area .callout-block[data-variant="danger"] {
          background-color: #fef2f2 !important;
          border: 1px solid #fee2e2 !important;
          border-left: 5px solid #ef4444 !important;
          color: #7f1d1d !important;
        }
        .print-area .callout-block[data-variant="warning"] > div:first-child,
        .print-area .callout-block[data-variant="danger"] > div:first-child {
          color: #b91c1c !important;
        }
        .print-area .callout-block[data-variant="billing"] {
          background-color: #f8fafc !important;
          border: 1px solid #f8fafc !important;
          border-left: 5px solid #64748b !important;
          color: #334155 !important;
        }

        /* Dark mode overrides for print-area content */
        .dark .print-area {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: #334155 !important;
        }
        .dark .print-area h1,
        .dark .print-area h2,
        .dark .print-area h3,
        .dark .print-area h4 {
          color: #2dd4bf !important;
          border-color: #2dd4bf !important;
        }
        .dark .print-area p,
        .dark .print-area li,
        .dark .print-area ul,
        .dark .print-area ol,
        .dark .print-area span {
          color: #cbd5e1 !important;
        }
        .dark .print-area table {
          border-color: #334155 !important;
          background-color: #1e293b !important;
        }
        .dark .print-area th {
          background-color: #115e59 !important;
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
        .dark .print-area td {
          border-color: #334155 !important;
          color: #cbd5e1;
        }
        .dark .print-area tr:nth-child(even) td {
          background-color: #1e293b !important;
        }
        .dark .print-area tr:nth-child(odd) td {
          background-color: #0f172a !important;
        }
        .dark .print-area .callout-block {
          border-color: transparent !important;
        }
        .dark .print-area .callout-block[data-variant="info"], 
        .dark .print-area .callout-block:not([data-variant]) {
          background-color: rgba(20, 184, 166, 0.1) !important;
          border-left: 5px solid #2dd4bf !important;
          color: #a7f3d0 !important;
        }
        .dark .print-area .callout-block[data-variant="info"] > div:first-child, 
        .dark .print-area .callout-block:not([data-variant]) > div:first-child {
          color: #2dd4bf !important;
        }
        .dark .print-area .callout-block[data-variant="pearl"] {
          background-color: rgba(22, 163, 74, 0.12) !important;
          border-left: 5px solid #4ade80 !important;
          color: #bbf7d0 !important;
        }
        .dark .print-area .callout-block[data-variant="pearl"] > div:first-child {
          color: #4ade80 !important;
        }
        .dark .print-area .callout-block[data-variant="important"] {
          background-color: rgba(234, 179, 8, 0.1) !important;
          border-left: 5px solid #facc15 !important;
          color: #fef08a !important;
        }
        .dark .print-area .callout-block[data-variant="important"] > div:first-child {
          color: #facc15 !important;
        }
        .dark .print-area .callout-block[data-variant="warning"],
        .dark .print-area .callout-block[data-variant="danger"] {
          background-color: rgba(239, 68, 68, 0.1) !important;
          border-left: 5px solid #f87171 !important;
          color: #fca5a5 !important;
        }
        .dark .print-area .callout-block[data-variant="warning"] > div:first-child,
        .dark .print-area .callout-block[data-variant="danger"] > div:first-child {
          color: #f87171 !important;
        }
        .dark .print-area .callout-block[data-variant="billing"] {
          background-color: rgba(148, 163, 184, 0.1) !important;
          border-left: 5px solid #94a3b8 !important;
          color: #cbd5e1 !important;
        }
        .dark .print-area .callout-block[data-variant="billing"] > div:first-child {
          color: #94a3b8 !important;
        }

        /* Ruler markings & custom formatting styles */
        .word-editor { outline: none; min-height: 860px; caret-color: #0f766e; }
        .word-editor h1 { font-family: Georgia,serif; font-size: 1.7rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
        .word-editor h2 { font-family: Georgia,serif; font-size: 1.15rem; font-weight: 700; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin: 1.75rem 0 0.5rem; }
        .word-editor h3 { font-family: Georgia,serif; font-size: 1rem; font-weight: 700; color: #1e40af; margin: 1.25rem 0 0.4rem; }
        .word-editor p { font-size: 0.875rem; color: #334155; line-height: 1.75; margin: 0 0 0.75rem; font-family: 'DM Sans',sans-serif; }
        .word-editor ul, .word-editor ol { padding-left: 1.5rem; margin: 0.5rem 0 1rem; font-size: 0.875rem; color: #334155; line-height: 1.75; }
        .word-editor li { margin-bottom: 0.25rem; }
        .word-editor a { color: #0f766e; text-decoration: underline; }
        .word-editor table { width: 100%; border-collapse: collapse; }
        .word-editor th { background: #0f766e; color: #fff; padding: 0.65rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .word-editor td { padding: 0.65rem 1rem; font-size: 0.825rem; border-bottom: 1px solid #e2e8f0; color: #475569; }
        .word-editor blockquote { border-left: 4px solid #0f766e; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1rem 0; }
        
        .img-wrapper { display: inline-block; position: relative; }
        .img-wrapper:hover { border-color: #0ea5e9 !important; }
        .fc-wrapper:hover { border-color: #0ea5e9 !important; }
        .tbl-wrapper { position: relative; }
        .tbl-wrapper:hover { outline: 2px dashed #0ea5e9; outline-offset: 2px; }
        
        @media print {
          .no-print { display: none !important; }
          .word-canvas { box-shadow: none !important; }
          .tbl-drag-handle { display: none !important; }
        }
      ` }} />

      {/* ── Fixed dropdown overlay coordinates to prevent clipping ── */}
      {tableAnchor && tableMenuOpen && (
        <div
          ref={tableMenuRef}
          style={{ position: "absolute", top: tableAnchor.top, left: tableAnchor.left }}
          className="rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[99] p-3 space-y-2.5 w-48"
        >
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Table Dimensions</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Rows</label>
              <input
                type="number" min="1" max="20"
                value={tableRows} onChange={(e) => setTableRows(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Columns</label>
              <input
                type="number" min="1" max="15"
                value={tableCols} onChange={(e) => setTableCols(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
              />
            </div>
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const rowsNum = parseInt(tableRows, 10);
              const colsNum = parseInt(tableCols, 10);
              if (rowsNum > 0 && colsNum > 0) {
                insertTableDirectly(rowsNum, colsNum);
                setTableMenuOpen(false);
                setTableAnchor(null);
              }
            }}
            className="w-full py-1 text-center text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-all cursor-pointer border-none shadow-sm"
          >
            Insert Table
          </button>
        </div>
      )}

      {calloutAnchor && calloutMenuOpen && (
        <div
          ref={calloutMenuRef}
          style={{ position: "absolute", top: calloutAnchor.top, left: calloutAnchor.left }}
          className="rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[99] overflow-hidden w-44"
        >
          <div className="p-1 space-y-0.5">
            {[
              { value: "info", label: "Guideline" },
              { value: "pearl", label: "Clinical Pearl" },
              { value: "warning", label: "Warning" },
              { value: "danger", label: "Red Flag" },
              { value: "billing", label: "Billing" }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  insertCallout(item.value as any);
                  setCalloutMenuOpen(false);
                  setCalloutAnchor(null);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium hover:bg-teal-50/50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 border-none bg-transparent"
              >
                <span className={`w-2 h-2 rounded-full ${item.value === 'billing' ? 'bg-slate-400' : item.value === 'warning' ? 'bg-amber-500' : item.value === 'pearl' ? 'bg-emerald-500' : item.value === 'danger' ? 'bg-red-500' : 'bg-teal-500'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {imageAnchor && imageMenuOpen && (
        <div
          ref={imageMenuRef}
          style={{ position: "absolute", top: imageAnchor.top, left: imageAnchor.left }}
          className="rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[99] p-3.5 space-y-3 w-64"
        >
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Image URL</div>
            <input
              type="text" placeholder="https://example.com/image.png"
              value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">OR</span>
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Upload Local Image</div>
            <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center bg-slate-50 dark:bg-slate-800 hover:bg-teal-50/10 dark:hover:bg-teal-950/10 transition-colors cursor-pointer group">
              <input
                type="file" accept="image/*"
                onChange={handleImageFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Lucide.Upload className="w-5 h-5 text-slate-400 dark:text-slate-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block">Choose image file</span>
              <span className="text-[8px] text-slate-400 block mt-0.5">PNG, JPG, WebP up to 5MB</span>
            </div>
          </div>
          <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button" onClick={() => { setImageMenuOpen(false); setImageAnchor(null); }}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (imageUrl.trim()) {
                  insertImageDirectly(imageUrl.trim());
                  setImageMenuOpen(false);
                  setImageAnchor(null);
                }
              }}
              className="px-3 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-all cursor-pointer border-none"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      {linkAnchorPos && linkOpen && (
        <div
          data-insert-dropdown="link"
          style={{ position: "absolute", top: linkAnchorPos.top, left: linkAnchorPos.left }}
          className="rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[99] p-3 space-y-2.5 w-60"
        >
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Display Text</label>
            <input
              type="text" placeholder="Optional text"
              value={linkText} onChange={(e) => setLinkText(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Link URL</label>
            <input
              type="text" placeholder="https://..."
              value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { setLinkOpen(false); setLinkAnchorPos(null); }}
              className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              onClick={() => { insertLink(); setLinkAnchorPos(null); }}
              className="px-3 py-1 text-[10px] font-bold text-white bg-teal-800 rounded cursor-pointer border-none"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      {templateMenuOpen && (
        <div
          ref={templateMenuRef}
          style={{
            position: "absolute",
            top: (calcAnchor(templateBtnRef)?.top || 0),
            left: (calcAnchor(templateBtnRef)?.left || 0)
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-xl z-[99] overflow-hidden w-52"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">Clinical Templates</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Insert a pre-formatted clinical template</p>
          </div>
          <div className="p-1 space-y-0.5">
            {[
              { value: "approach", label: "Clinical Approach", desc: "Step-by-step assessment guide" },
              { value: "guideline", label: "Guideline Summary", desc: "Evidence-based guideline format" },
              { value: "protocol", label: "Treatment Protocol", desc: "Step-by-step protocol checklist" },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  insertClinicalProtocolTemplate(t.value as any);
                  setTemplateMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 text-xs rounded-lg transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/20 flex items-start gap-2 cursor-pointer border-none bg-transparent"
              >
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{t.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col bg-slate-100 dark:bg-slate-950 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8" style={{ minHeight: "calc(100vh - 7rem)" }}>
        {/* ── Editor Toolbar (Ribbon Tabbed) ── */}
        <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 sticky top-14 z-30">
          {/* Top title line & auto-save indicators */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Link href={contentItem?.type === "Approach" ? "/admin/approaches" : "/admin/content"} className="text-slate-400 hover:text-teal-600 transition-colors">
                {contentItem?.type === "Approach" ? "Approaches" : "Content"}
              </Link>
              <svg className="w-3.5 h-3.5 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-slate-700 dark:text-slate-200 font-bold">{docTitle || "Untitled Document"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${previewMode ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"}`}
              >
                {previewMode ? (
                  <><Lucide.Edit2 className="w-3.5 h-3.5" /><span>Edit</span></>
                ) : (
                  <><Lucide.Eye className="w-3.5 h-3.5" /><span>Preview</span></>
                )}
              </button>

              <a
                href={contentItem?.type === "Approach" ? "/templates/clinical_approach_template.docx" : "/templates/medical_content_template.docx"} download
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-355 dark:border-slate-700 hover:border-teal-355 hover:text-teal-700 transition-all flex items-center gap-1.5 bg-white text-slate-500 shadow-sm"
              >
                <Lucide.Download className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
                <span>Download Template</span>
              </a>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-700/60 select-none">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Saved in real-time</span>
              </div>

              <Link
                href={contentItem?.type === "Approach" ? "/admin/approaches" : "/admin/content"}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-800 text-white hover:bg-teal-900 transition-all shadow-sm flex items-center gap-1.5 border-none cursor-pointer"
              >
                <Lucide.ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {contentItem?.type === "Approach" ? "Approaches" : "Content"}</span>
              </Link>
            </div>
          </div>

          {/* Ribbon Tabs headers */}
          <div className="flex border-b border-slate-200/50 dark:border-slate-800 px-4 bg-slate-50 dark:bg-slate-900/50">
            {[
              { id: "home", label: "Home" },
              { id: "insert", label: "Insert" },
              { id: "layout", label: "Layout" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRibbonTab(tab.id as any)}
                className={`
                  px-4 py-1.5 text-[11px] font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none
                  ${ribbonTab === tab.id
                    ? "text-teal-700 border-b-teal-500 font-extrabold dark:text-teal-400"
                    : "text-slate-450 border-b-transparent hover:text-slate-700 dark:hover:text-slate-200"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ribbon tab actions content */}
          <div className="bg-white dark:bg-slate-900 min-h-[64px] border-b border-slate-200 dark:border-slate-800">
            {ribbonContent()}
          </div>
        </div>

        {/* ── Ruler ── */}
        <div className="no-print bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 h-5 flex items-center px-4 overflow-hidden">
          <div className="mx-auto" style={{ width: "794px", maxWidth: "100%" }}>
            <div className="relative h-full flex items-center">
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} className="absolute flex flex-col items-center" style={{ left: `${(i / 21) * 100}%` }}>
                  <div className={`bg-slate-400 dark:bg-slate-600 ${i % 2 === 0 ? "h-2.5 w-px" : "h-1.5 w-px"}`} />
                  {i % 2 === 0 && i > 0 && i < 21 && <span className="text-[7px] text-slate-400 dark:text-slate-655 absolute top-3 -translate-x-1/2">{i / 2}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main columns workspace ── */}
        <div className="flex flex-1">
          {/* Main workspace container */}
          <div ref={scrollContainerRef} className="flex-1 bg-slate-200/50 dark:bg-slate-950/20 px-8 py-8 flex flex-col items-center">
            <div
              ref={containerRef}
              className="w-full max-w-[794px] min-h-[1123px]"
            >
              <div 
                className="print-area w-full min-h-[1123px] bg-white dark:bg-white border border-slate-200 dark:border-slate-800/80 shadow-2xl p-16 rounded-sm flex flex-col text-slate-900"
                style={{ color: "#0f172a" }}
              >
                {/* Page indicator + navigation - no-print */}
                <div className="no-print flex items-center justify-between mb-4 -mt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Page {activePage + 1} of {pages.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {activePage > 0 && (
                      <button
                        onClick={() => switchPage(activePage - 1)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:text-teal-600 transition-all cursor-pointer"
                      >
                        ← Prev
                      </button>
                    )}
                    {activePage < pages.length - 1 && (
                      <button
                        onClick={() => switchPage(activePage + 1)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 hover:text-teal-605 transition-all cursor-pointer"
                      >
                        Next →
                      </button>
                    )}
                    <button
                      onClick={addPage}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all cursor-pointer"
                    >
                      + Add Page
                    </button>
                  </div>
                </div>

                {/* Header info / title inside document */}
                <div className="mb-8 border-b-2 border-teal-700/30 pb-4">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest leading-none">{selectedSystem} · {selectedCategory}</span>
                  {activePage === 0 && (
                    <>
                      <h1 className="font-serif text-3xl text-slate-900 dark:text-slate-100 mt-2 font-normal tracking-tight leading-snug">{docTitle || "Untitled Document"}</h1>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>Author: {author}</span>
                        <span>•</span>
                        <span>Last updated: {contentItem?.lastUpdated || "Just now"}</span>
                      </div>
                      {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50 px-2.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {activePage > 0 && (
                    <p className="text-lg font-serif text-slate-600 dark:text-slate-300 mt-1 italic">{docTitle} — continued (Page {activePage + 1})</p>
                  )}
                </div>

                {/* contentEditable element representing word document body */}
                <div
                  ref={editorRef}
                  contentEditable={!previewMode}
                  suppressContentEditableWarning
                  onInput={() => { updateCounts(); setEditTriggerCount(prev => prev + 1); }}
                  onFocus={saveToHistory}
                  onMouseUp={() => {
                    if (typeof window !== "undefined") {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0 && editorRef.current) {
                        const r = sel.getRangeAt(0);
                        if (editorRef.current.contains(r.commonAncestorContainer)) {
                          savedEditorRangeRef.current = r.cloneRange();
                        }
                      }
                    }
                  }}
                  onKeyUp={() => {
                    if (typeof window !== "undefined") {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0 && editorRef.current) {
                        const r = sel.getRangeAt(0);
                        if (editorRef.current.contains(r.commonAncestorContainer)) {
                          savedEditorRangeRef.current = r.cloneRange();
                        }
                      }
                    }
                  }}
                  className="flex-1 w-full prose prose-sm max-w-none text-slate-800 focus:outline-none min-h-[800px] leading-relaxed text-sm select-text word-editor"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#0f172a" }}
                />

                {/* Page footer navigation */}
                <div className="no-print mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] text-slate-300 dark:text-slate-655">Page {activePage + 1} / {pages.length}</span>
                  <div className="flex items-center gap-2">
                    {activePage > 0 && (
                      <button
                        onClick={() => switchPage(activePage - 1)}
                        className="text-[10px] text-slate-400 hover:text-teal-600 transition-colors font-semibold cursor-pointer bg-transparent border-none"
                      >
                        ← Previous Page
                      </button>
                    )}
                    {activePage < pages.length - 1 ? (
                      <button
                        onClick={() => switchPage(activePage + 1)}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold cursor-pointer bg-transparent border-none"
                      >
                        Next Page →
                      </button>
                    ) : (
                      <button
                        onClick={addPage}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold cursor-pointer flex items-center gap-1 bg-transparent border-none"
                      >
                        + Add Page
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Independently scrollable) */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-[320px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 no-print sticky top-[192px] self-start h-[calc(100vh-192px)]"
              >
                {/* Sidebar tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
                  {(["pages", "meta", "refs", "history"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSidebarTab(tab)}
                      className={`flex-1 px-1.5 py-3 text-[11px] font-semibold text-center transition-all whitespace-nowrap border-none bg-transparent cursor-pointer ${sidebarTab === tab ? "text-teal-700 border-b-2 border-teal-500 bg-teal-50/30 dark:bg-teal-955/10 dark:text-teal-400 font-bold" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {tab === "pages" ? "Pages" : tab === "meta" ? "Meta" : tab === "refs" ? "Refs" : "History"}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {sidebarTab === "meta" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Document Title</label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">System</label>
                        <CustomSelect
                          value={selectedSystem}
                          onChange={setSelectedSystem}
                          options={[
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Cardiology", label: "Cardiology" },
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" },
                            { value: "Gastroenterology", label: "Gastroenterology" },
                            { value: "Musculoskeletal", label: "Musculoskeletal" },
                            { value: "MBS", label: "MBS" }
                          ]}
                          className="w-full font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                        <input
                          type="text"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Author</label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium font-sans"
                        />
                      </div>

                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-sans">
                          <input
                            type="checkbox"
                            checked={isFree}
                            onChange={(e) => setIsFree(e.target.checked)}
                            className="w-4 h-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500/20"
                          />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Free Access Item (Allow Free Tier access)
                          </span>
                        </label>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tags</label>
                        <div className="flex flex-wrap gap-1.5 mb-2 font-sans">
                          {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50 px-2 py-0.5 rounded-full">
                              {tag}
                              <button onClick={() => removeTag(tag)} className="text-teal-450 hover:text-teal-650 bg-transparent border-none cursor-pointer">✕</button>
                            </span>
                          ))}
                          {!showTagInput ? (
                            <button 
                              onClick={() => setShowTagInput(true)}
                              className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-teal-350 hover:text-teal-600 transition-all cursor-pointer bg-transparent"
                            >
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addTag(newTag)}
                                placeholder="New tag..."
                                className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-20 dark:bg-slate-800 dark:text-slate-100"
                                autoFocus
                              />
                              <button onClick={() => { addTag(newTag); setShowTagInput(false); }} className="text-[10px] text-teal-650 font-bold hover:text-teal-700 bg-transparent border-none cursor-pointer">✓</button>
                            </div>
                          )}
                        </div>
                        {suggestedTags.length > 0 && (
                          <div className="mt-2 font-sans">
                            <p className="text-[9px] text-slate-405 dark:text-slate-500 font-semibold mb-1">Suggestions:</p>
                            <div className="flex flex-wrap gap-1">
                              {suggestedTags.slice(0, 5).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => addTag(t)}
                                  className="text-[9px] text-slate-500 hover:text-teal-650 hover:bg-teal-50 dark:hover:bg-teal-950/20 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 bg-transparent cursor-pointer"
                                >
                                  + {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Document stats */}
                      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 font-sans">
                        <h4 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-2">Content Stats</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-55 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center">
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{wordCount}</p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase">Words</p>
                          </div>
                          <div className="bg-slate-55 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center">
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{charCount}</p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase">Chars</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {sidebarTab === "refs" && (
                    <div className="space-y-4 font-sans">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-medium">{docReferences.length} general references linked</p>
                        {docReferences.map((ref, idx) => (
                          <div key={ref.id} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 relative group">
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-100 dark:bg-teal-950/30 w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                            <div className="flex-1 min-w-0 pr-5">
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-light break-words">{ref.text}</p>
                              {ref.url && ref.url !== "#" && (
                                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-650 dark:text-teal-400 hover:underline mt-1 block break-all font-medium">
                                  {ref.url}
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveReference(ref.id)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 cursor-pointer border-none bg-transparent"
                              title="Remove Reference"
                            >
                              <Lucide.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Reference Form */}
                      <div className="pt-3.5 border-t border-slate-200/50 dark:border-slate-800 space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Add Reference</h5>
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            placeholder="e.g. RACGP Guidelines 2026..."
                            value={newRefText}
                            onChange={(e) => setNewRefText(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            placeholder="URL (optional) e.g., https://..."
                            value={newRefUrl}
                            onChange={(e) => setNewRefUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100"
                          />
                          <button
                            onClick={handleAddReference}
                            className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border-none"
                          >
                            Add Reference
                          </button>
                        </div>
                      </div>

                      {/* Linked Quiz Questions section */}
                      <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked Questions</h5>
                          <button 
                            onClick={() => {
                              setQuestionSearch("");
                              setShowLinkQuestionModal(true);
                            }}
                            className="text-[10px] text-teal-605 font-bold hover:underline bg-transparent border-none cursor-pointer"
                          >
                            + Link Question
                          </button>
                        </div>

                        {linkedQuestionIds.length === 0 ? (
                          <p className="text-[11px] text-slate-404 py-2 text-center font-light">No practice questions linked yet.</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto">
                            {linkedQuestionIds.map((qid) => {
                              const q = allQuestions.find(quest => quest.id === qid);
                              return q ? (
                                <div key={qid} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl relative group">
                                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-1">
                                    <span>Question #{qid}</span>
                                    <button 
                                      onClick={() => handleUnlinkQuestion(qid)} 
                                      className="text-red-500 hover:text-red-655 hover:underline bg-transparent border-none cursor-pointer"
                                    >
                                      Unlink
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-slate-700 dark:text-slate-350 font-medium line-clamp-2 leading-relaxed">{q.text}</p>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sidebarTab === "pages" && (
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">{pages.length} {pages.length === 1 ? "Page" : "Pages"}</p>
                        <button
                          onClick={addPage}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-teal-705 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all cursor-pointer bg-transparent"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          Add Page
                        </button>
                      </div>

                      <div className="space-y-2">
                        {pages.map((_, pageIdx) => (
                          <div
                            key={pageIdx}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group ${
                              pageIdx === activePage
                                ? "bg-teal-50 dark:bg-teal-955/30 border-teal-300 dark:border-teal-800 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900"
                            }`}
                            onClick={() => switchPage(pageIdx)}
                          >
                            <div className={`w-7 h-9 rounded border flex items-center justify-center shrink-0 text-[8px] font-bold ${
                              pageIdx === activePage
                                ? "bg-teal-600 border-teal-700 text-white"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-455"
                            }`}>
                              {pageIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${
                                pageIdx === activePage ? "text-teal-750 dark:text-teal-400" : "text-slate-600 dark:text-slate-300"
                              }`}>Page {pageIdx + 1}</p>
                              {pageIdx === activePage && (
                                <p className="text-[9px] text-teal-600 dark:text-teal-505 font-bold">Currently editing</p>
                              )}
                            </div>
                            {pages.length > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deletePage(pageIdx); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-655 hover:bg-red-50 dark:hover:bg-red-955/20 transition-all cursor-pointer bg-transparent border-none"
                                title="Delete Page"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={addPage}
                        className="w-full py-2 border-2 border-dashed border-teal-200 dark:border-teal-900/40 rounded-xl text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-transparent"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add New Page
                      </button>

                      <button
                        onClick={handleOptimizePagination}
                        className="w-full py-2 border border-teal-600 rounded-xl text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-transparent"
                      >
                        <Lucide.Sparkles className="w-3.5 h-3.5" />
                        Optimize Pagination
                      </button>
                    </div>
                  )}

                  {sidebarTab === "history" && (
                    <EditHistorySidebar
                      entityId={String(id)}
                      entityType={contentItem?.type === "Approach" ? "approach" : "medical_condition"}
                      history={historyLog}
                      versions={versionList}
                      loading={isHistoryLoading}
                      currentHtml={pages.join("")}
                      adminUserName={currentAdmin?.name || author}
                      onRestore={handleRestoreVersion}
                      onSaveVersion={handleSaveVersion}
                      isSavingVersion={isSavingVersion}
                    />
                  )}
                </div>

            {/* Quick Actions Panel */}
              <div className="bg-white/85 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-teal-200/20 dark:border-teal-900/30 p-4 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-transparent via-transparent to-teal-50/2 dark:to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                  {[
                    { label: "Export as PDF", icon: <Lucide.Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleExportPDF },
                    { label: "Duplicate Content", icon: <Lucide.Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleDuplicate },
                    { label: "Link to Question", icon: <Lucide.Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: () => { setQuestionSearch(""); setShowLinkQuestionModal(true); } },
                    { label: "Generate Quiz", icon: <Lucide.Zap className="w-4 h-4 text-teal-650 dark:text-teal-400" />, action: handleGenerateQuiz },
                  ].map((action) => (
                    <button 
                      key={action.label} 
                      onClick={action.action}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400 transition-all border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900 text-left cursor-pointer"
                    >
                      <span className="flex items-center justify-center shrink-0">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom Status Bar ── */}
      <div className="no-print bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>Page {activePage + 1} of {pages.length}</span>
          <span className="text-slate-355 dark:text-slate-700">|</span>
          <span>{wordCount} words</span>
          <span className="text-slate-355 dark:text-slate-700">|</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-4">
          {activeTable && <span className="text-amber-500 dark:text-amber-400 font-bold">● Table selected — use Layout tab for table tools</span>}
          <span>{docTitle || "Untitled Document"}</span>
          <span className="text-slate-355 dark:text-slate-700">|</span>
          <span className="capitalize">Published</span>
          <span className="text-slate-355 dark:text-slate-700">|</span>
          <span>GP Edge Medical Content Editor</span>
        </div>
      </div>
    </div>

      {/* Link Question Selector Modal */}
      <AnimatePresence>
        {showLinkQuestionModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[80] no-print pointer-events-auto"
              onClick={() => setShowLinkQuestionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="fixed inset-x-4 top-[10%] mx-auto w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[90] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col pointer-events-auto text-slate-900 dark:text-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white">
                <div>
                  <h3 className="font-serif text-lg font-bold">Link Question to Content</h3>
                  <p className="text-xs text-slate-400">Select questions from the bank to link with this document</p>
                </div>
                <button
                  onClick={() => setShowLinkQuestionModal(false)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <input
                  type="text"
                  placeholder="Search questions by ID, text, or topic..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-slate-100"
                />

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[40vh] overflow-y-auto">
                  {filteredQuestions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No matching questions found.</p>
                  ) : (
                    filteredQuestions.map((q) => {
                      const isLinked = linkedQuestionIds.includes(q.id);
                      return (
                        <div key={q.id} className="py-3.5 flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-400 font-mono font-bold">ID: #{q.id}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed mt-0.5">{q.text}</p>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mt-1">{q.topic}</p>
                          </div>
                          <button
                            onClick={() => isLinked ? handleUnlinkQuestion(q.id) : handleLinkQuestion(q.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                              isLinked
                                ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100"
                                : "bg-teal-500 text-white hover:bg-teal-600"
                            }`}
                          >
                            {isLinked ? "Unlink" : "Link"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowLinkQuestionModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFlowchart && (
          <FlowchartBuilder
            initialData={editingFlowchartData ?? undefined}
            onInsert={(svg) => {
              if (editingFlowchartEl) {
                const temp = document.createElement("div");
                temp.innerHTML = svg;
                const newWrapper = temp.firstElementChild as HTMLElement | null;
                if (newWrapper && editingFlowchartEl.parentNode) {
                  editingFlowchartEl.parentNode.replaceChild(newWrapper, editingFlowchartEl);
                }
              } else {
                insertHTMLAtCursor(svg);
              }
              updateCounts();
              saveToHistory();
              setEditingFlowchartEl(null);
              setEditingFlowchartData(null);
              setShowFlowchart(false);
            }}
            onClose={() => {
              setShowFlowchart(false);
              setEditingFlowchartEl(null);
              setEditingFlowchartData(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSaveToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Lucide.CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Changes Saved!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 dark:text-slate-400 leading-relaxed">
                  Your document updates have been saved persistently to the medical library.
                </p>
              </div>
              <button
                onClick={() => setShowSaveToast(false)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors border-none cursor-pointer"
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ContentEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    }>
      <ContentEditorContent />
    </Suspense>
  );
}

