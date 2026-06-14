"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import FlowchartBuilder from "@/components/admin/FlowchartBuilder";
import {
  getAutofillTemplates,
  saveAutofillTemplates,
  AutofillTemplate,
  getQuestions,
  createQuiz,
  Question,
} from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";

// ─────────────────────────────────────────────────────────────
// SOAP → HTML seed
// ─────────────────────────────────────────────────────────────
function soapToHtml(t: AutofillTemplate): string {
  let html = `<h1 style="font-family:Georgia,serif;font-size:1.7rem;font-weight:700;color:#0f172a;margin:0 0 0.25rem;line-height:1.2">${t.name}</h1>`;
  html += `<p style="font-size:0.8rem;color:#64748b;margin:0 0 2rem;font-family:'DM Sans',sans-serif">${t.description || ""}</p>`;
  
  const content = t.content || [t.subjective, t.objective, t.assessment, t.plan, t.doctorSummary, t.patientResources].filter(Boolean).join("\n\n");
  
  html += `<p style="font-size:0.875rem;color:#334155;line-height:1.75;margin:0 0 1rem;font-family:'DM Sans',sans-serif;white-space:pre-wrap">${content.replace(/\n/g, '<br />')}</p>`;
  
  if (t.references) {
    html += `<hr style="border:0;border-top:1px solid #cbd5e1;margin:1.75rem 0"/>`;
    html += `<h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#0f766e;border-left:4px solid #0f766e;padding-left:0.75rem;margin-bottom:0.5rem">References</h2>`;
    html += `<p style="font-size:0.875rem;color:#334155;line-height:1.75;font-family:'DM Sans',sans-serif">${t.references}</p>`;
  }
  return html;
}

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

// Flat toolbar button — matches the content editor's icon-only h-8 style
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

// Flat toolbar divider — matches the content editor's h-5 separator
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

// ─────────────────────────────────────────────────────────────
// Main editor
// ─────────────────────────────────────────────────────────────
function TemplateEditorContent() {
  const params = useParams();
  const router = useRouter();
  const templateId = Number(params.id);

  const [templates, setTemplates] = useState<AutofillTemplate[]>([]);
  const [templateItem, setTemplateItem] = useState<AutofillTemplate | null>(null);

  // Meta
  const [docTitle, setDocTitle] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("Respiratory");
  const [selectedCategory, setSelectedCategory] = useState("Acute");
  const [templateStatus, setTemplateStatus] = useState<"active" | "draft" | "suspended">("draft");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Content
  const [templateContent, setTemplateContent] = useState("");

  // Layout
  const [ribbonTab, setRibbonTab] = useState<"home" | "insert" | "layout">("home");
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"meta" | "refs" | "pages" | "soap">("soap");
  const [showFlowchart, setShowFlowchart] = useState(false);

  // Flowchart edit — stores the wrapper element being re-edited + pre-loaded data
  const [editingFlowchartEl, setEditingFlowchartEl] = useState<HTMLElement | null>(null);
  const [editingFlowchartData, setEditingFlowchartData] = useState<{ nodes: unknown[]; edges: unknown[] } | null>(null);

  // Pages
  const [pages, setPages] = useState<string[]>([""]);
  const [activePage, setActivePage] = useState(0);

  // Counts
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // References
  interface Reference { id: number; text: string; url: string; }
  const [docReferences, setDocReferences] = useState<Reference[]>([]);
  const [newRefText, setNewRefText] = useState("");
  const [newRefUrl, setNewRefUrl] = useState("");

  // Linked questions
  const [linkedQuestionIds, setLinkedQuestionIds] = useState<number[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  // Dropdowns
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [calloutOpen, setCalloutOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Table insert
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("4");
  const [imageUrl, setImageUrl] = useState("");

  // Font / size
  const fontOptions = [
    { value: "'DM Sans',sans-serif", label: "DM Sans" },
    { value: "Arial,sans-serif", label: "Arial" },
    { value: "'Times New Roman',serif", label: "Times New Roman" },
    { value: "Georgia,serif", label: "Georgia" },
    { value: "Verdana,sans-serif", label: "Verdana" },
    { value: "'Courier New',monospace", label: "Courier New" },
  ];
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);

  const sizeOptions = [
    { value: "10px", label: "8pt" }, { value: "13px", label: "10pt" },
    { value: "16px", label: "12pt" }, { value: "19px", label: "14pt" },
    { value: "24px", label: "18pt" }, { value: "32px", label: "24pt" },
    { value: "48px", label: "36pt" },
  ];
  const [selectedSize, setSelectedSize] = useState(sizeOptions[2]);

  // Table context
  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null);
  const [activeRow, setActiveRow] = useState<HTMLTableRowElement | null>(null);
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Document import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [docImportFile, setDocImportFile] = useState<File | null>(null);
  const [docUploadState, setDocUploadState] = useState<"idle" | "uploading" | "success" | "extracting">("idle");
  const [docUploadProgress, setDocUploadProgress] = useState(0);
  const [docExtractionProgress, setDocExtractionProgress] = useState(0);
  const [docExtractionLog, setDocExtractionLog] = useState("");
  const [docUploadedFileName, setDocUploadedFileName] = useState("");
  const [docUploadedFileSize, setDocUploadedFileSize] = useState("");



  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerDocImport(file);
  };

  const triggerDocImport = async (file: File) => {
    setDocImportFile(file);
    setDocUploadedFileName(file.name);
    setDocUploadedFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");
    setDocUploadState("uploading");
    setDocUploadProgress(0);
    setShowImportModal(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "autofill");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/extract", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setDocUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            setDocUploadProgress(100);
            setDocUploadState("success");
            runDocExtraction(result);
          } else {
            alert(result.error || "Failed to extract text from document");
            setDocUploadState("idle");
            setShowImportModal(false);
          }
        } catch {
          alert("Error parsing extraction response");
          setDocUploadState("idle");
          setShowImportModal(false);
        }
      } else {
        alert("Upload failed with status code: " + xhr.status);
        setDocUploadState("idle");
        setShowImportModal(false);
      }
    };

    xhr.onerror = () => {
      alert("Network error during file upload");
      setDocUploadState("idle");
      setShowImportModal(false);
    };

    xhr.send(formData);
  };

  const runDocExtraction = (data: any) => {
    setDocUploadState("extracting");
    setDocExtractionProgress(0);
    setDocExtractionLog("Opening document stream...");

    setTimeout(() => {
      setDocExtractionProgress(25);
      setDocExtractionLog("Extracting raw text from pages...");
    }, 300);

    setTimeout(() => {
      setDocExtractionProgress(55);
      setDocExtractionLog("Identifying clinical sections...");
    }, 600);

    setTimeout(() => {
      setDocExtractionProgress(85);
      setDocExtractionLog("Mapping fields...");
    }, 900);

    setTimeout(() => {
      setDocExtractionProgress(100);
      setDocExtractionLog("Extraction complete!");

      const title = data.title || "Extracted Template";
      const system = data.system || "Respiratory";
      const category = data.category || "Acute";
      const subjective = data.subjective || data.symptoms || "";
      const objective = data.objective || "";
      const assessment = data.assessment || data.notes || "";
      const plan = data.plan || data.treatment || "";
      const doctorSummary = data.doctorSummary || "";
      const patientResources = data.patientResources || "";
      const references = data.references || [];
      const fullHtml = data.fullHtml || "";
      const content = data.content || [subjective, objective, assessment, plan, doctorSummary, patientResources].filter(Boolean).join("\n\n");

      setDocTitle(title);
      setSelectedSystem(system);
      setSelectedCategory(category);
      setTemplateContent(content);

      if (references && references.length > 0) {
        setDocReferences(references.map((refText: string, i: number) => ({
          id: i + 1,
          text: refText,
          url: "#"
        })));
      }

      if (editorRef.current) {
        let finalHtml = fullHtml;
        if (!finalHtml) {
          finalHtml = soapToHtml({
            id: templateId,
            name: title,
            system: system,
            category: category,
            status: templateStatus,
            author,
            tags,
            fields: 0,
            version: "1.0",
            usageCount: 0,
            lastUsed: "Never",
            sampleFields: [],
            versions: [],
            subjective,
            objective,
            assessment,
            plan,
            doctorSummary,
            patientResources,
            references: references ? references.join("\n") : ""
          });
        }
        editorRef.current.innerHTML = finalHtml;
        setPages([finalHtml]);
        setActivePage(0);
        updateCounts();
        saveToHistory();
      }

      setShowImportModal(false);
      setDocUploadState("idle");
      addUserNotification("Template Imported", `Successfully imported content from "${title}".`, 1, "custom");
    }, 1200);
  };

  const dropdownRefs = {
    font: useRef<HTMLDivElement>(null),
    size: useRef<HTMLDivElement>(null),
    callout: useRef<HTMLDivElement>(null),
    table: useRef<HTMLDivElement>(null),
    image: useRef<HTMLDivElement>(null),
    textColor: useRef<HTMLDivElement>(null),
    highlight: useRef<HTMLDivElement>(null),
    status: useRef<HTMLDivElement>(null),
  };

  // ── Table detection ──
  const getTableContext = useCallback(() => {
    if (typeof window === "undefined") return { cell: null, row: null, table: null };
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { cell: null, row: null, table: null };
    let node: Node | null = sel.getRangeAt(0).startContainer;
    let cell: HTMLTableCellElement | null = null, row: HTMLTableRowElement | null = null, table: HTMLTableElement | null = null;
    while (node && editorRef.current?.contains(node)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === "td" || tag === "th") cell = node as HTMLTableCellElement;
        else if (tag === "tr") row = node as HTMLTableRowElement;
        else if (tag === "table") { table = node as HTMLTableElement; break; }
      }
      node = node.parentNode;
    }
    return { cell, row, table };
  }, []);

  // ── Click outside / mouseup ──
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      Object.values(dropdownRefs).forEach((ref) => {
        // handled per-dropdown via state setters in JSX
      });
      if (dropdownRefs.font.current && !dropdownRefs.font.current.contains(e.target as Node)) setFontOpen(false);
      if (dropdownRefs.size.current && !dropdownRefs.size.current.contains(e.target as Node)) setSizeOpen(false);
      if (dropdownRefs.callout.current && !dropdownRefs.callout.current.contains(e.target as Node)) setCalloutOpen(false);
      if (dropdownRefs.table.current && !dropdownRefs.table.current.contains(e.target as Node)) {
        // Don't auto-close table dropdown — only close via its own X or Insert button
      }
      if (dropdownRefs.image.current && !dropdownRefs.image.current.contains(e.target as Node)) setImageMenuOpen(false);
      if (dropdownRefs.textColor.current && !dropdownRefs.textColor.current.contains(e.target as Node)) setTextColorOpen(false);
      if (dropdownRefs.highlight.current && !dropdownRefs.highlight.current.contains(e.target as Node)) setHighlightOpen(false);
      if (dropdownRefs.status.current && !dropdownRefs.status.current.contains(e.target as Node)) setStatusOpen(false);
      if (linkBtnRef.current && !linkBtnRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-insert-dropdown="link"]')) setLinkOpen(false);
      // Close fixed-position insert dropdowns on outside click
      const tgt = e.target as HTMLElement;
      if (!tgt.closest("[data-insert-dropdown]")) {
        // Table dropdown stays open until user clicks "Insert Table" or X — don't auto-close on outside click
        if (!dropdownRefs.callout.current?.contains(tgt)) { setCalloutOpen(false); setCalloutAnchor(null); }
        if (!dropdownRefs.image.current?.contains(tgt)) { setImageMenuOpen(false); setImageAnchor(null); }
      }
    };
    const mouseUp = () => {
      setTimeout(() => {
        const { cell, row, table } = getTableContext();
        setActiveCell(cell); setActiveRow(row); setActiveTable(table);
      }, 30);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("mouseup", mouseUp);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("mouseup", mouseUp); };
  }, [getTableContext]);

  // ── Load template ──
  useEffect(() => {
    const list = getAutofillTemplates();
    setTemplates(list);
    const item = list.find((t) => t.id === templateId) || list[0];
    if (!item) return;
    setTemplateItem(item);
    setDocTitle(item.name);
    setSelectedSystem(item.system);
    setSelectedCategory(item.category);
    setTemplateStatus(item.status === "archived" ? "draft" : item.status);
    setAuthor(item.author);
    setTags(item.tags || []);
    setTemplateContent(item.content || [item.subjective, item.objective, item.assessment, item.plan, item.doctorSummary, item.patientResources].filter(Boolean).join("\n\n"));

    let savedHtml = localStorage.getItem(`gpedge_template_body_${templateId}`);
    if (!savedHtml) savedHtml = soapToHtml(item);

    if (editorRef.current) {
      const savedPages = localStorage.getItem(`gpedge_template_pages_${templateId}`);
      if (savedPages) {
        try {
          const parsed = JSON.parse(savedPages) as string[];
          if (parsed.length > 0) { setPages(parsed); setActivePage(0); editorRef.current.innerHTML = parsed[0]; }
        } catch { setPages([savedHtml]); editorRef.current.innerHTML = savedHtml; }
      } else {
        setPages([savedHtml]); editorRef.current.innerHTML = savedHtml;
      }
      updateCounts(); setHistory([editorRef.current.innerHTML]); setHistoryIndex(0);
    }
    const rawRefs = localStorage.getItem(`gpedge_template_refs_${templateId}`);
    if (rawRefs) { try { setDocReferences(JSON.parse(rawRefs)); } catch {} }
    else if (item.references) setDocReferences([{ id: 1, text: item.references, url: "#" }]);
    const rawLinks = localStorage.getItem(`gpedge_template_links_${templateId}`);
    if (rawLinks) { try { setLinkedQuestionIds(JSON.parse(rawLinks)); } catch {} }
    setAllQuestions(getQuestions());
  }, [templateId]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, historyIndex]);

  // ── Interactive element interactivity: flowcharts, images, tables (drag, resize, select) ──
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
      editor.querySelectorAll<HTMLElement>(".fc-wrapper,.img-wrapper,.tbl-wrapper").forEach(el => {
        highlight(el, false);
        // Hide any floating toolbar when deselecting
        el.querySelectorAll<HTMLElement>("[data-action]").forEach(btn => {
          const tb = btn.parentElement;
          if (tb && el !== document.querySelector(":hover")) tb.style.display = "none";
        });
      });
      selectedEl = null;
    };

    // ── Generic drag-to-move logic ──
    const makeDraggable = (wrapper: HTMLElement) => {
      let isDragging = false;
      let startX = 0, startY = 0;
      let origML = 0, origMT = 0;

      const isResizeCorner = (e: MouseEvent) => {
        // Bottom-right 20px corner is the native CSS resize handle — don't interfere
        const rect = wrapper.getBoundingClientRect();
        return e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20;
      };

      const onDown = (e: MouseEvent) => {
        // Don't drag when clicking inside table cells (allow editing)
        if ((e.target as HTMLElement).tagName === "TD" || (e.target as HTMLElement).tagName === "TH") return;
        // Don't drag on the resize corner
        if (isResizeCorner(e)) return;
        // Deselect others, select this
        deselectAll();
        selectedEl = wrapper;
        highlight(wrapper, true);

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const cs = window.getComputedStyle(wrapper);
        origML = parseFloat(cs.marginLeft) || 0;
        origMT = parseFloat(cs.marginTop) || 0;
        e.preventDefault();
        e.stopPropagation();
      };

      const onMove = (e: MouseEvent) => {
        if (!isDragging) return;
        wrapper.style.marginLeft = `${origML + (e.clientX - startX)}px`;
        wrapper.style.marginTop = `${origMT + (e.clientY - startY)}px`;
      };

      const onUp = () => {
        if (isDragging) { isDragging = false; saveToHistory(); }
      };

      wrapper.addEventListener("mousedown", onDown);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      return () => {
        wrapper.removeEventListener("mousedown", onDown);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
    };

    const cleanups: (() => void)[] = [];

    // ── Attach to flowchart wrappers ──
    const attachFc = (wrapper: HTMLElement) => {
      if (wrapper.dataset.fcAttached) return;
      wrapper.dataset.fcAttached = "1";
      wrapper.setAttribute("contenteditable", "false");
      wrapper.style.cursor = "move";

      // ── Floating toolbar (edit + delete) ──
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

      // Click to select
      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        deselectAll();
        selectedEl = wrapper;
        highlight(wrapper, true);
        toolbar.style.display = "flex";
      });

      // Double-click to re-edit
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

      cleanups.push(makeDraggable(wrapper));
    };

    // ── Attach to image wrappers ──
    const attachImg = (wrapper: HTMLElement) => {
      if (wrapper.dataset.imgAttached) return;
      wrapper.dataset.imgAttached = "1";
      wrapper.setAttribute("contenteditable", "false");
      wrapper.style.cursor = "move";

      // ── Floating delete toolbar ──
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

      cleanups.push(makeDraggable(wrapper));
    };

    // ── Attach to table wrappers ──
    const attachTbl = (wrapper: HTMLElement) => {
      if (wrapper.dataset.tblAttached) return;
      wrapper.dataset.tblAttached = "1";

      // ── Floating toolbar: drag handle + delete ──
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

      // Delete button
      toolbar.querySelector<HTMLElement>("[data-action='delete']")?.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.remove();
        selectedEl = null;
        setActiveCell(null); setActiveRow(null); setActiveTable(null);
        saveToHistory();
      });

      // Drag from the move button
      const dragBtn = toolbar.querySelector<HTMLElement>("[data-action='drag']");
      let isDragging = false, startX = 0, startY = 0, origML = 0, origMT = 0;

      dragBtn?.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const cs = window.getComputedStyle(wrapper);
        origML = parseFloat(cs.marginLeft) || 0;
        origMT = parseFloat(cs.marginTop) || 0;
        deselectAll(); selectedEl = wrapper; highlight(wrapper, true);
        toolbar.style.display = "flex";
        e.preventDefault(); e.stopPropagation();
      });

      const onMove = (e: MouseEvent) => {
        if (!isDragging) return;
        wrapper.style.marginLeft = `${origML + (e.clientX - startX)}px`;
        wrapper.style.marginTop = `${origMT + (e.clientY - startY)}px`;
      };
      const onUp = () => { if (isDragging) { isDragging = false; saveToHistory(); } };

      // Click wrapper (not cell) to select
      wrapper.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (t.tagName !== "TD" && t.tagName !== "TH") {
          deselectAll(); selectedEl = wrapper; highlight(wrapper, true);
          toolbar.style.display = "flex";
        }
      });

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      cleanups.push(() => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      });
    };

    // ── Initial attach ──
    editor.querySelectorAll<HTMLElement>(".fc-wrapper").forEach(attachFc);
    editor.querySelectorAll<HTMLElement>(".img-wrapper").forEach(attachImg);
    editor.querySelectorAll<HTMLElement>(".tbl-wrapper").forEach(attachTbl);

    // ── Watch for new elements ──
    const observer = new MutationObserver(() => {
      editor.querySelectorAll<HTMLElement>(".fc-wrapper").forEach(attachFc);
      editor.querySelectorAll<HTMLElement>(".img-wrapper").forEach(attachImg);
      editor.querySelectorAll<HTMLElement>(".tbl-wrapper").forEach(attachTbl);
    });
    observer.observe(editor, { childList: true, subtree: true });

    // ── Click outside deselects ──
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".fc-wrapper") && !t.closest(".img-wrapper") && !t.closest(".tbl-wrapper")) {
        deselectAll();
      }
    };
    document.addEventListener("click", onDocClick);

    // ── Delete key removes selected element ──
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
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      cleanups.forEach(fn => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, activePage]);

  // ── Utilities ──
  const updateCounts = () => {
    const text = editorRef.current?.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  const saveToHistory = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (history[historyIndex] !== html) {
      const h = [...history.slice(0, historyIndex + 1), html];
      setHistory(h); setHistoryIndex(h.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0 && editorRef.current) { editorRef.current.innerHTML = history[historyIndex - 1]; setHistoryIndex(historyIndex - 1); updateCounts(); }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1 && editorRef.current) { editorRef.current.innerHTML = history[historyIndex + 1]; setHistoryIndex(historyIndex + 1); updateCounts(); }
  };

  // ── Selection ──
  const saveSelection = () => {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  };
  const restoreSelection = (range: Range | null) => {
    if (!range) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }
  };

  const insertHTMLAtCursor = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const c = sel.getRangeAt(0);
      if (editorRef.current.contains(c.commonAncestorContainer)) range = c;
    }
    if (!range && savedRangeRef.current) { range = savedRangeRef.current; restoreSelection(range); }
    if (!range) { editorRef.current.innerHTML += html; return; }
    range.deleteContents();
    const el = document.createElement("div"); el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node: ChildNode | null = null, last: ChildNode | null = null;
    while ((node = el.firstChild)) last = frag.appendChild(node);
    range.insertNode(frag);
    if (last && sel) {
      const r = range.cloneRange(); r.setStartAfter(last); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r); savedRangeRef.current = r;
    }
  };

  const fmt = (cmd: string, val = "") => {
    document.execCommand(cmd, false, val); updateCounts(); saveToHistory();
  };

  const applyFont = (fontFamily: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      const c = sel.getRangeAt(0);
      if (editorRef.current.contains(c.commonAncestorContainer)) range = c;
    }
    if (!range) return;
    if (range.collapsed) {
      const span = document.createElement("span");
      span.style.fontFamily = fontFamily;
      span.appendChild(document.createTextNode("\u200b"));
      range.insertNode(span);
      const r = document.createRange(); r.setStart(span.firstChild!, 1); r.collapse(true);
      if (sel) { sel.removeAllRanges(); sel.addRange(r); } savedRangeRef.current = r; return;
    }
    const id = "f" + Math.random().toString(36).slice(2, 8);
    document.execCommand("fontName", false, id);
    editorRef.current.querySelectorAll(`font[face="${id}"]`).forEach((el) => {
      const sp = document.createElement("span"); sp.style.fontFamily = fontFamily; sp.innerHTML = el.innerHTML;
      el.parentNode?.replaceChild(sp, el);
    });
    updateCounts(); saveToHistory();
  };

  const applyFontSize = (px: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("fontSize", false, "7");
    editorRef.current.querySelectorAll('font[size="7"]').forEach((el) => {
      const sp = document.createElement("span"); sp.style.fontSize = px; sp.innerHTML = el.innerHTML;
      el.parentNode?.replaceChild(sp, el);
    });
    updateCounts(); saveToHistory();
  };

  // ── Table helpers ──
  const insertTable = (rows: number, cols: number) => {
    let tableHtml = `<table style="width:100%;border-collapse:collapse;text-align:left"><thead><tr>`;
    for (let i = 0; i < cols; i++) tableHtml += `<th style="text-align:left;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;padding:0.65rem 1rem;background:#0f766e;border-bottom:2px solid #cbd5e1;color:#fff">Header ${i+1}</th>`;
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cols; c++) tableHtml += `<td style="padding:0.65rem 1rem;font-size:0.825rem;border-bottom:1px solid #e2e8f0;background:${r%2?"#f8fafc":"#fff"};color:#475569">Cell</td>`;
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table>`;
    const html = `<div class="tbl-wrapper" style="position:relative;margin:1.25rem 0;cursor:move;user-select:none;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s;overflow-x:auto;background:#fff;border:1px solid #cbd5e1;border-radius:0.75rem" title="Drag to move">${tableHtml}</div>`;
    insertHTMLAtCursor(html); setTimeout(() => { updateCounts(); saveToHistory(); }, 10);
  };

  const insertCallout = (variant: "info" | "warning" | "pearl" | "billing") => {
    const cfg = {
      info:    { bg:"#f0fdfa", border:"#ccfbf1", color:"#0f766e", label:"Guideline" },
      pearl:   { bg:"#ecfdf5", border:"#d1fae5", color:"#059669", label:"Clinical Pearl" },
      warning: { bg:"#fffbeb", border:"#fef3c7", color:"#b45309", label:"Warning" },
      billing: { bg:"#f8fafc", border:"#e2e8f0", color:"#475569", label:"Billing" },
    }[variant];
    insertHTMLAtCursor(`<div class="callout-block" data-variant="${variant}" style="background:${cfg.bg};border:1px solid ${cfg.border};border-left:5px solid ${cfg.color};border-radius:0.75rem;padding:1rem;margin-bottom:1.25rem;color:${cfg.color}"><div style="font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem">${cfg.label}</div><div contenteditable="true" style="font-size:0.875rem;line-height:1.6">Callout text...</div></div>`);
    updateCounts(); saveToHistory();
  };

  const insertDivider = () => {
    insertHTMLAtCursor(`<hr style="border:0;border-top:2px solid #e2e8f0;margin:1.5rem 0"/>`);
    updateCounts(); saveToHistory();
  };

  const insertPageBreak = () => {
    insertHTMLAtCursor(`<div style="break-after:page;border-top:2px dashed #cbd5e1;margin:2rem 0;text-align:center;color:#94a3b8;font-size:0.7rem;font-weight:700;letter-spacing:0.1em;padding-top:0.5rem">— PAGE BREAK —</div>`);
    updateCounts(); saveToHistory();
  };

  // ── Table row/col operations ──
  const rowAbove = () => {
    const { row } = getTableContext(); if (!row) return;
    const nr = document.createElement("tr");
    const isH = row.cells[0]?.tagName.toLowerCase() === "th";
    for (let i = 0; i < row.cells.length; i++) {
      const nc = document.createElement(isH ? "th" : "td"); nc.style.cssText = row.cells[i].style.cssText; nc.innerHTML = isH ? "Header" : "Cell"; nr.appendChild(nc);
    }
    row.parentNode?.insertBefore(nr, row); updateCounts(); saveToHistory();
  };
  const rowBelow = () => {
    const { row } = getTableContext(); if (!row) return;
    const nr = document.createElement("tr");
    for (let i = 0; i < row.cells.length; i++) {
      const nc = document.createElement("td"); nc.style.cssText = "padding:0.65rem 1rem;font-size:0.825rem;border-bottom:1px solid #e2e8f0;color:#475569"; nc.innerHTML = "Cell"; nr.appendChild(nc);
    }
    row.parentNode?.insertBefore(nr, row.nextSibling); updateCounts(); saveToHistory();
  };
  const deleteRow = () => {
    const { row, table } = getTableContext(); if (!row || !table) return;
    if (table.rows.length <= 1) {
      const wrapper = table.closest(".tbl-wrapper");
      if (wrapper) wrapper.parentNode?.removeChild(wrapper);
      else table.parentNode?.removeChild(table);
    } else row.parentNode?.removeChild(row);
    setActiveCell(null); setActiveRow(null); setActiveTable(null); updateCounts(); saveToHistory();
  };
  const colLeft = () => {
    const { cell, table } = getTableContext(); if (!cell || !table) return;
    const ci = cell.cellIndex;
    for (let r = 0; r < table.rows.length; r++) {
      const ref = table.rows[r].cells[ci]; const isH = ref.tagName.toLowerCase() === "th";
      const nc = document.createElement(isH ? "th" : "td"); nc.style.cssText = ref.style.cssText; nc.innerHTML = isH ? "Header" : "Cell"; table.rows[r].insertBefore(nc, ref);
    }
    updateCounts(); saveToHistory();
  };
  const colRight = () => {
    const { cell, table } = getTableContext(); if (!cell || !table) return;
    const ci = cell.cellIndex;
    for (let r = 0; r < table.rows.length; r++) {
      const ref = table.rows[r].cells[ci]; const isH = ref.tagName.toLowerCase() === "th";
      const nc = document.createElement(isH ? "th" : "td"); nc.style.cssText = ref.style.cssText; nc.innerHTML = isH ? "Header" : "Cell"; table.rows[r].insertBefore(nc, ref.nextSibling);
    }
    updateCounts(); saveToHistory();
  };
  const deleteCol = () => {
    const { cell, row, table } = getTableContext(); if (!cell || !row || !table) return;
    const ci = cell.cellIndex;
    if (row.cells.length <= 1) {
      const wrapper = table.closest(".tbl-wrapper");
      if (wrapper) wrapper.parentNode?.removeChild(wrapper);
      else table.parentNode?.removeChild(table);
    } else { for (let r = 0; r < table.rows.length; r++) { if (table.rows[r].cells[ci]) table.rows[r].removeChild(table.rows[r].cells[ci]); } }
    setActiveCell(null); setActiveRow(null); setActiveTable(null); updateCounts(); saveToHistory();
  };
  const deleteTable = () => {
    const { table } = getTableContext(); if (!table) return;
    const wrapper = table.closest(".tbl-wrapper");
    if (wrapper) wrapper.parentNode?.removeChild(wrapper);
    else table.parentNode?.removeChild(table);
    setActiveCell(null); setActiveRow(null); setActiveTable(null); updateCounts(); saveToHistory();
  };

  // ── Pages ──
  const syncPages = () => {
    if (!editorRef.current) return pages;
    const up = [...pages]; up[activePage] = editorRef.current.innerHTML; return up;
  };
  const switchPage = (i: number) => {
    if (!editorRef.current) return;
    const up = syncPages(); setPages(up); setActivePage(i); editorRef.current.innerHTML = up[i] || ""; updateCounts();
  };
  const addPage = () => {
    if (!editorRef.current) return;
    const up = syncPages(); const np = [...up, ""]; setPages(np); const ni = np.length - 1; setActivePage(ni); editorRef.current.innerHTML = ""; updateCounts();
    localStorage.setItem(`gpedge_template_pages_${templateId}`, JSON.stringify(np));
  };
  const deletePage = (i: number) => {
    if (pages.length <= 1) { alert("Cannot delete the only page."); return; }
    const up = syncPages(); const np = up.filter((_, idx) => idx !== i); setPages(np);
    const na = Math.min(activePage, np.length - 1); setActivePage(na);
    if (editorRef.current) { editorRef.current.innerHTML = np[na] || ""; updateCounts(); }
    localStorage.setItem(`gpedge_template_pages_${templateId}`, JSON.stringify(np));
  };

  // ── Image ──
  const insertImageUrl = () => {
    if (!imageUrl.trim()) return;
    const wrapper = `<div class="img-wrapper" contenteditable="false" style="display:inline-block;position:relative;margin:1rem 0;cursor:move;user-select:none;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s;resize:both;overflow:auto;min-width:80px;min-height:40px" title="Drag to move · Resize from corner"><img src="${imageUrl.trim()}" alt="Image" style="display:block;width:100%;height:auto;border-radius:0.6rem;pointer-events:none"/><div style="position:absolute;bottom:3px;right:5px;font-size:9px;color:#94a3b8;pointer-events:none;font-family:'DM Sans',sans-serif">↔ resize</div></div>`;
    insertHTMLAtCursor(wrapper);
    setImageUrl(""); setImageMenuOpen(false); updateCounts(); saveToHistory();
  };
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      if (b64) {
        const wrapper = `<div class="img-wrapper" contenteditable="false" style="display:inline-block;position:relative;margin:1rem 0;cursor:move;user-select:none;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s;resize:both;overflow:auto;min-width:80px;min-height:40px" title="Drag to move · Resize from corner"><img src="${b64}" alt="Image" style="display:block;width:100%;height:auto;border-radius:0.6rem;pointer-events:none"/><div style="position:absolute;bottom:3px;right:5px;font-size:9px;color:#94a3b8;pointer-events:none;font-family:'DM Sans',sans-serif">↔ resize</div></div>`;
        insertHTMLAtCursor(wrapper);
        setImageMenuOpen(false); updateCounts(); saveToHistory();
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Save ──
  const handleSave = () => {
    if (!docTitle.trim()) { alert("Please enter a template name."); return; }
    const html = editorRef.current?.innerHTML || "";
    localStorage.setItem(`gpedge_template_body_${templateId}`, html);
    const ap = syncPages(); localStorage.setItem(`gpedge_template_pages_${templateId}`, JSON.stringify(ap));
    localStorage.setItem(`gpedge_template_refs_${templateId}`, JSON.stringify(docReferences));
    const list = getAutofillTemplates();
    const up = list.map((t) => t.id === templateId ? {
      ...t, name: docTitle.trim(), system: selectedSystem, category: selectedCategory,
      status: templateStatus as AutofillTemplate["status"], author, tags,
      content: templateContent,
    } : t);
    setTemplates(up); saveAutofillTemplates(up);
    addUserNotification("Template Saved", `Saved changes to "${docTitle}".`, 1, "custom");
  };

  const handleDuplicate = () => {
    const list = getAutofillTemplates();
    const nextId = list.length > 0 ? Math.max(...list.map((t) => t.id)) + 1 : 1;
    const dup: AutofillTemplate = { ...(templateItem || list[0]), id: nextId, name: `Copy of ${docTitle}`, status: "draft", usageCount: 0, lastUsed: "Never", sampleFields: templateItem?.sampleFields || [], versions: [] };
    const ul = [dup, ...list]; setTemplates(ul); saveAutofillTemplates(ul);
    localStorage.setItem(`gpedge_template_body_${nextId}`, editorRef.current?.innerHTML || "");
    addUserNotification("Template Duplicated", `Created draft "${dup.name}".`, 1, "custom");
    router.push(`/admin/autofill/${nextId}/editor`);
  };

  const handleGenerateQuiz = () => {
    const bank = getQuestions();
    const rel = bank.filter(q => q.topic.toLowerCase().includes(selectedSystem.toLowerCase()));
    const qqs = rel.slice(0, 8); if (qqs.length === 0) qqs.push(...bank.slice(0, 5));
    const nq = createQuiz({ name: `Quiz: ${docTitle}`, description: `Auto-generated from "${docTitle}"`, timeLimit: qqs.length * 2, passingScore: 70, randomize: true, status: "draft", examType: "AKT", questionIds: qqs.map(q => q.id), topics: [selectedSystem] });
    addUserNotification("Quiz Generated", `Generated quiz "${nq.name}".`, qqs.length, "quiz");
    router.push(`/admin/quizzes/${nq.id}/edit`);
  };

  const handleAddRef = () => {
    if (!newRefText.trim()) return;
    const nr: Reference = { id: docReferences.length > 0 ? Math.max(...docReferences.map(r => r.id)) + 1 : 1, text: newRefText.trim(), url: newRefUrl.trim() || "#" };
    const up = [...docReferences, nr]; setDocReferences(up); localStorage.setItem(`gpedge_template_refs_${templateId}`, JSON.stringify(up)); setNewRefText(""); setNewRefUrl("");
  };

  // Link insert state
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAnchorPos, setLinkAnchorPos] = useState<{ top: number; left: number } | null>(null);
  const linkBtnRef = useRef<HTMLDivElement>(null);

  // Insert-tab dropdown anchor positions (fixed coords to escape overflow clipping)
  const [tableAnchor, setTableAnchor] = useState<{ top: number; left: number } | null>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<{ top: number; left: number } | null>(null);
  const [imageAnchor, setImageAnchor] = useState<{ top: number; left: number } | null>(null);

  const calcAnchor = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    const r = ref.current.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  };

  const openLinkDropdown = () => {
    if (linkBtnRef.current) {
      const r = linkBtnRef.current.getBoundingClientRect();
      setLinkAnchorPos({ top: r.bottom + 4, left: r.left });
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

  // Export to PDF
  const handleExportPDF = () => {
    const style = document.createElement("style");
    style.id = "gpedge-pdf-override";
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        .print-area, .print-area * { visibility: visible !important; }
        .print-area {
          position: fixed !important; top: 0 !important; left: 0 !important;
          width: 210mm !important; padding: 20mm !important;
          background: white !important;
        }
        .no-print { display: none !important; }
        .fc-wrapper { border: 2px solid transparent !important; box-shadow: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 3000);
  };

  const suggestedTags = ["SOAP","Acute","Chronic","Screening","Mental Health","Respiratory","Cardiology","Paediatrics","Dermatology","MBS"].filter(t => !tags.includes(t));

  const colors = ["#0f172a","#1e40af","#7c3aed","#be185d","#b45309","#047857","#0f766e","#9f1239","#1d4ed8","#6d28d9","#c026d3","#0891b2","#065f46","#ffffff","#f1f5f9","#fef3c7","#fce7f3","#e0f2fe","#d1fae5","#f0fdfa"];

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
        <div ref={dropdownRefs.font} className="relative inline-block text-left">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setFontOpen(f => !f); setSizeOpen(false); }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1.5 shadow-sm"
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
                        onClick={() => { setSelectedFont(f); applyFont(f.value); setFontOpen(false); }}
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
        <div ref={dropdownRefs.size} className="relative inline-block text-left">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setSizeOpen(s => !s); setFontOpen(false); }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all flex items-center gap-1.5 shadow-sm"
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
                  {sizeOptions.map(s => (
                    <button
                      key={s.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelectedSize(s); applyFontSize(s.value); setSizeOpen(false); }}
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
          <ToolbarBtn key={b.title} title={b.title} onClick={() => fmt(b.cmd)}>{b.icon}</ToolbarBtn>
        ))}

        {/* Text color */}
        <div ref={dropdownRefs.textColor} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setTextColorOpen(!textColorOpen)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 px-2 text-xs font-semibold text-slate-705 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
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
                      onMouseDown={(e) => { e.preventDefault(); fmt("foreColor", item.color); setTextColorOpen(false); }}
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
        <div ref={dropdownRefs.highlight} className="relative inline-block text-left">
          <button
            type="button"
            onClick={() => setHighlightOpen(!highlightOpen)}
            onMouseDown={(e) => e.preventDefault()}
            className="h-8 px-2 text-xs font-semibold text-slate-705 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
            title="Text Highlight"
          >
            <Lucide.Highlighter className="w-3.5 h-3.5" />
            <span className="w-2.5 h-1 bg-yellow-300 rounded-sm" />
          </button>
          <AnimatePresence>
            {highlightOpen && (
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
                      onMouseDown={(e) => { e.preventDefault(); fmt("hiliteColor", item.color); setHighlightOpen(false); }}
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
          <ToolbarBtn key={b.label} title={b.title} onClick={() => fmt("formatBlock", b.value)}>
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
          <ToolbarBtn key={b.title} title={b.title} onClick={() => fmt(b.cmd)}>{b.icon}</ToolbarBtn>
        ))}
      </div>
    );

    if (ribbonTab === "insert") return (
      <div className="flex items-end gap-2 px-3 py-1.5 flex-wrap">
        {/* Table */}
        <RibbonGroup label="Tables">
          <div ref={dropdownRefs.table}>
            <RibbonBtn title="Insert Table" onClick={() => {
              const a = calcAnchor(dropdownRefs.table);
              setTableAnchor(tableMenuOpen ? null : a);
              setTableMenuOpen(o => !o);
              setCalloutOpen(false); setCalloutAnchor(null);
              setImageMenuOpen(false); setImageAnchor(null);
            }}>
              <Lucide.Table className="w-5 h-5" /><span>Table</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Callouts */}
        <RibbonGroup label="Callouts">
          <div ref={dropdownRefs.callout}>
            <RibbonBtn title="Insert Callout" onClick={() => {
              const a = calcAnchor(dropdownRefs.callout);
              setCalloutAnchor(calloutOpen ? null : a);
              setCalloutOpen(o => !o);
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
          <div ref={dropdownRefs.image}>
            <RibbonBtn title="Insert Image" onClick={() => {
              const a = calcAnchor(dropdownRefs.image);
              setImageAnchor(imageMenuOpen ? null : a);
              setImageMenuOpen(o => !o);
              setTableMenuOpen(false); setTableAnchor(null);
              setCalloutOpen(false); setCalloutAnchor(null);
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
          {/* Link with structured dropdown */}
          <div ref={linkBtnRef}>
            <RibbonBtn title="Insert Link" active={linkOpen} onClick={openLinkDropdown}>
              <Lucide.Link className="w-5 h-5" /><span>Link</span>
            </RibbonBtn>
          </div>
        </RibbonGroup>
        <RibbonSep />

        {/* Flowchart */}
        <RibbonGroup label="Diagram">
          <RibbonBtn title="Insert Flowchart" onClick={() => { savedRangeRef.current = saveSelection(); setShowFlowchart(true); }}>
            <Lucide.GitBranch className="w-5 h-5" /><span>Flowchart</span>
          </RibbonBtn>
        </RibbonGroup>
      </div>
    );

    if (ribbonTab === "layout") return (
      <div className="flex items-end gap-2 px-3 py-1.5 flex-wrap overflow-x-auto">
        <RibbonGroup label="Pages">
          <RibbonBtn title="Add Page" onClick={addPage}><Lucide.FilePlus className="w-5 h-5" /><span>New Page</span></RibbonBtn>
          <RibbonBtn title="Delete Current Page" onClick={() => deletePage(activePage)}><Lucide.FileX className="w-5 h-5" /><span>Delete Page</span></RibbonBtn>
        </RibbonGroup>
        <RibbonSep />

        {/* Table tools — only show when inside a table */}
        {activeTable && (
          <RibbonGroup label="Table Tools">
            <RibbonBtn title="Row Above" onClick={rowAbove}><Lucide.ArrowUp className="w-4 h-4" /><span>Row ↑</span></RibbonBtn>
            <RibbonBtn title="Row Below" onClick={rowBelow}><Lucide.ArrowDown className="w-4 h-4" /><span>Row ↓</span></RibbonBtn>
            <RibbonBtn title="Delete Row" onClick={deleteRow}><Lucide.Trash2 className="w-4 h-4 text-red-500" /><span>Del Row</span></RibbonBtn>
            <RibbonBtn title="Column Left" onClick={colLeft}><Lucide.ArrowLeft className="w-4 h-4" /><span>Col ←</span></RibbonBtn>
            <RibbonBtn title="Column Right" onClick={colRight}><Lucide.ArrowRight className="w-4 h-4" /><span>Col →</span></RibbonBtn>
            <RibbonBtn title="Delete Column" onClick={deleteCol}><Lucide.Trash2 className="w-4 h-4 text-red-500" /><span>Del Col</span></RibbonBtn>
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

  const taInput = "px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 dark:text-slate-100 w-full";
  const taLabel = "block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
        .img-wrapper:hover { border-color: #94d1f5 !important; }
        .fc-wrapper:hover { border-color: #94d1f5 !important; }
        .tbl-wrapper { position: relative; }
        .tbl-wrapper:hover { outline: 2px dashed #94d1f5; outline-offset: 2px; }
        @media print { .no-print { display: none !important; } .word-canvas { box-shadow: none !important; } .tbl-drag-handle { display: none !important; } }
      `}} />

      <div className="flex flex-col bg-slate-100 dark:bg-slate-950 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>

        {/* ── Breadcrumb / Action bar (matches content editor style, sticky below topbar) ── */}
        <div className="no-print sticky top-14 z-30">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-teal-200/40 dark:border-teal-900/40 shadow-md shadow-slate-200/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
            <div className="relative z-10 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <Link href="/admin/autofill" className="text-slate-400 hover:text-teal-600 transition-colors font-semibold">Autofill</Link>
                <svg className="w-3.5 h-3.5 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-slate-700 dark:text-slate-200 font-bold">{docTitle || "Untitled Template"}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Selector */}
                <div className="relative inline-block text-left" ref={dropdownRefs.status}>
                  <button
                    type="button"
                    onClick={() => setStatusOpen(o => !o)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 hover:border-teal-350 hover:text-teal-650 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Status: <span className="capitalize font-bold text-teal-800 dark:text-teal-400">{templateStatus}</span></span>
                    <Lucide.ChevronDown className="w-3 h-3 opacity-70" />
                  </button>
                  <AnimatePresence>
                    {statusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 4 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 mt-1 w-32 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-[60] overflow-hidden"
                      >
                        <div className="p-1">
                          {(["active", "draft", "suspended"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => { setTemplateStatus(s); setStatusOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors capitalize ${
                                templateStatus === s
                                  ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>


                {/* Sidebar toggle */}
                <button
                  onClick={() => setShowSidebar(s => !s)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>

                {/* Export PDF */}
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 hover:border-teal-350 hover:text-teal-700 transition-all flex items-center gap-1.5 bg-white text-slate-500 shadow-sm"
                  title="Export as PDF"
                >
                  <Lucide.FileDown className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
                  <span>Export PDF</span>
                </button>


                {/* Import Document */}
                <button
                  onClick={() => docFileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 hover:border-teal-350 hover:text-teal-700 transition-all flex items-center gap-1.5 bg-white text-slate-500 shadow-sm cursor-pointer"
                  title="Import DOCX or PDF"
                >
                  <Lucide.Upload className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
                  <span>Import Document</span>
                </button>

                {/* Duplicate */}
                <button
                  onClick={handleDuplicate}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 hover:border-teal-350 hover:text-teal-700 transition-all flex items-center gap-1.5 bg-white text-slate-500 shadow-sm"
                  title="Duplicate"
                >
                  <Lucide.Copy className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
                  <span>Duplicate</span>
                </button>

                {/* Save */}
                <button onClick={handleSave} className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-all shadow-sm flex items-center gap-1.5">
                  <Lucide.Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main area: [ribbon+ruler+canvas] + sidebar side-by-side ── */}
        <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 7rem)' }}>

          {/* ── Left column: ribbon + ruler + canvas (scrolls independently) ── */}
          <div className="flex flex-col flex-1 min-w-0">

            {/* ── Ribbon ── */}
            <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-[calc(3.5rem+49px)] z-20">
              {/* Tab bar */}
              <div className="flex items-center gap-0 px-3 pt-1 border-b border-slate-100 dark:border-slate-800/60">
                {(["home","insert","layout"] as const).map(tab => (
                  <button key={tab} onClick={() => setRibbonTab(tab)}
                    className={`px-4 py-1.5 text-xs font-semibold capitalize transition-all rounded-t border border-transparent -mb-px ${
                      ribbonTab === tab
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-900 text-teal-800 dark:text-teal-300"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {/* Ribbon content — overflow-visible so dropdowns can escape */}
              <div className="overflow-visible">
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
                      {i % 2 === 0 && i > 0 && i < 21 && <span className="text-[7px] text-slate-400 dark:text-slate-600 absolute top-3 -translate-x-1/2">{i / 2}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Canvas area ── */}
            <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950 px-8 py-8" style={{ scrollbarWidth: "thin" }}>
            {/* Page navigator */}
            {pages.length > 1 && (
              <div className="no-print flex items-center justify-center gap-2 mb-4">
                {pages.map((_, i) => (
                  <button key={i} onClick={() => switchPage(i)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${activePage === i ? "bg-teal-800 text-white shadow" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"}`}>
                    Page {i + 1}
                  </button>
                ))}
                <button onClick={addPage} className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-all" title="Add page">
                  <Lucide.Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* A4 paper */}
            <div
              className="word-canvas mx-auto bg-white dark:bg-white rounded-sm shadow-2xl shadow-slate-400/30 dark:shadow-slate-950/80"
              style={{ width: "794px", minHeight: "1123px", maxWidth: "100%" }}
            >
              <div
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning
                className="word-editor print-area"
                style={{ padding: "96px 96px 80px", minHeight: "1123px", color: "#0f172a" }}
                onInput={() => { updateCounts(); saveToHistory(); }}
                onKeyUp={updateCounts}
                onMouseUp={() => { savedRangeRef.current = saveSelection(); }}
                onFocus={() => { savedRangeRef.current = saveSelection(); }}
              />
            </div>
          </div>
          {/* ── End of left column (ribbon + ruler + canvas) ── */}
          </div>

          {/* ── Sidebar ── */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="no-print flex flex-col shrink-0 overflow-y-auto bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 space-y-4 p-4"
                style={{ width: 320, scrollbarWidth: "thin" }}
              >
                {/* ── Main Sidebar Card ── */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-200/20 dark:border-teal-900/30 shadow-md shadow-slate-200/30 relative z-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none rounded-2xl" />
                  <div className="relative z-10">
                    <div className="flex border-b border-slate-200/40 dark:border-slate-800 overflow-x-auto">
                      {(["pages", "meta", "refs", "soap"] as const).map((tab) => (
                        <button key={tab} onClick={() => setSidebarTab(tab)}
                          className={`flex-1 px-2 py-3 text-xs font-semibold text-center transition-all whitespace-nowrap ${sidebarTab === tab ? "text-teal-700 border-b-2 border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 dark:text-teal-400" : "text-slate-500 hover:text-slate-700"}`}>
                          {tab === "pages" ? "Pages" : tab === "meta" ? "Meta" : tab === "refs" ? "Refs" : "Content"}
                        </button>
                      ))}
                    </div>
                    <div className="p-4">
                      {/* Pages tab */}
                      {sidebarTab === "pages" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{pages.length} {pages.length === 1 ? "Page" : "Pages"}</p>
                            <button onClick={addPage} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40 rounded-lg hover:bg-teal-100 transition-all cursor-pointer">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Add Page
                            </button>
                          </div>
                          <div className="space-y-2">
                            {pages.map((_, i) => (
                              <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group ${i === activePage ? "bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 shadow-sm" : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-teal-200"}`} onClick={() => switchPage(i)}>
                                <div className={`w-7 h-9 rounded border flex items-center justify-center shrink-0 text-[8px] font-bold ${i === activePage ? "bg-teal-600 border-teal-700 text-white" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400"}`}>{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${i === activePage ? "text-teal-700 dark:text-teal-400" : "text-slate-600 dark:text-slate-300"}`}>Page {i + 1}{i === 0 ? " (Cover)" : ""}</p>
                                  {i === activePage && <p className="text-[9px] text-teal-500 font-medium">Currently editing</p>}
                                </div>
                                {pages.length > 1 && (
                                  <button onClick={(e) => { e.stopPropagation(); deletePage(i); }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer border-none bg-transparent">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button onClick={addPage} className="w-full py-2 border-2 border-dashed border-teal-200 dark:border-teal-900/40 rounded-xl text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> Add New Page
                          </button>
                        </div>
                      )}

                      {/* Meta tab */}
                      {sidebarTab === "meta" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Template Name</label>
                            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">System</label>
                            <CustomSelect value={selectedSystem} onChange={setSelectedSystem} options={["Respiratory","Cardiovascular","Endocrine","Psychiatry","Dermatology","Women's Health","Paediatrics","Musculoskeletal","Gastroenterology","MBS"].map(v=>({value:v,label:v}))} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                            <CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={["Acute","Chronic","Screening","Mental Health","Billing"].map(v=>({value:v,label:v}))} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Author</label>
                            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tags</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {tags.map(t => (
                                <span key={t} className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50 px-2 py-0.5 rounded-full">
                                  {t}<button onClick={() => setTags(tags.filter(x => x !== t))} className="text-teal-400 hover:text-red-500 cursor-pointer border-none bg-transparent p-0 leading-none">✕</button>
                                </span>
                              ))}
                              <button onClick={() => { if (newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(""); }}} className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:text-teal-600 transition-all">+ Add</button>
                            </div>
                            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(""); }}} placeholder="Type and press Enter..." className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100" />
                            {suggestedTags.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[9px] text-slate-400 font-medium mb-1">Suggestions:</p>
                                <div className="flex flex-wrap gap-1">
                                  {suggestedTags.slice(0, 5).map(t => (<button key={t} onClick={() => setTags([...tags, t])} className="text-[9px] text-slate-500 hover:text-teal-650 hover:bg-teal-50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 transition-all cursor-pointer bg-transparent">+ {t}</button>))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content Stats</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center"><p className="text-lg font-bold text-slate-800 dark:text-slate-200">{wordCount}</p><p className="text-[9px] text-slate-400 font-semibold uppercase">Words</p></div>
                              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center"><p className="text-lg font-bold text-slate-800 dark:text-slate-200">{charCount}</p><p className="text-[9px] text-slate-400 font-semibold uppercase">Chars</p></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Refs tab */}
                      {sidebarTab === "refs" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-xs text-slate-400 font-medium">{docReferences.length} reference{docReferences.length !== 1 ? "s" : ""} linked</p>
                            {docReferences.map((ref, idx) => (
                              <div key={ref.id} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 relative group">
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-100 dark:bg-teal-950/30 w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                                <div className="flex-1 min-w-0 pr-5">
                                  <p className="text-[11px] text-slate-600 leading-relaxed font-light break-words">{ref.text}</p>
                                  {ref.url && ref.url !== "#" && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-650 dark:text-teal-400 hover:underline mt-1 block break-all font-medium">{ref.url}</a>}
                                </div>
                                <button onClick={() => setDocReferences(d => d.filter(r => r.id !== ref.id))} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 cursor-pointer border-none bg-transparent"><Lucide.Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="pt-3.5 border-t border-slate-200/50 dark:border-slate-800 space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add Reference</h5>
                            <textarea rows={2} placeholder="e.g. RACGP Guidelines 2026..." value={newRefText} onChange={(e) => setNewRefText(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100" />
                            <input type="text" placeholder="URL (optional)" value={newRefUrl} onChange={(e) => setNewRefUrl(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100" />
                            <button onClick={handleAddRef} className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border-none">Add Reference</button>
                          </div>
                          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked Questions</h5>
                              <button onClick={() => { setQuestionSearch(""); setShowLinkModal(true); }} className="text-[10px] text-teal-600 font-bold hover:underline cursor-pointer border-none bg-transparent">+ Link Question</button>
                            </div>
                            {linkedQuestionIds.length === 0 ? (
                              <p className="text-[11px] text-slate-400 py-2 text-center font-light">No questions linked yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                {linkedQuestionIds.map((qid) => {
                                  const q = allQuestions.find(quest => quest.id === qid);
                                  return q ? (
                                    <div key={qid} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-1">
                                        <span>Question #{qid}</span>
                                        <button onClick={() => { const nl = linkedQuestionIds.filter(id => id !== qid); setLinkedQuestionIds(nl); localStorage.setItem(`gpedge_template_links_${templateId}`, JSON.stringify(nl)); }} className="text-red-500 hover:text-red-600 hover:underline cursor-pointer border-none bg-transparent p-0">Unlink</button>
                                      </div>
                                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">{q.text}</p>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content tab */}
                      {sidebarTab === "soap" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1.5">Template Content</label>
                            <textarea rows={16} value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-100 resize-y font-mono" />
                          </div>
                          <button onClick={() => { if (editorRef.current && templateItem) { const t = { ...templateItem, content: templateContent }; editorRef.current.innerHTML = soapToHtml(t); updateCounts(); saveToHistory(); } }} className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"><Lucide.RefreshCw className="w-3 h-3" /> Regenerate Document</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Quick Actions Card ── */}
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-200/20 dark:border-teal-900/30 p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none rounded-2xl" />
                  <div className="relative z-10 space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                    {[
                      { label: "Export as PDF", icon: <Lucide.FileDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleExportPDF },
                      { label: "Duplicate Template", icon: <Lucide.Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleDuplicate },
                      { label: "Link to Question", icon: <Lucide.Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: () => { setQuestionSearch(""); setShowLinkModal(true); } },
                      { label: "Generate Quiz", icon: <Lucide.Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleGenerateQuiz },
                    ].map((action) => (
                      <button key={action.label} onClick={action.action} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400 transition-all border border-slate-100 dark:border-slate-800 hover:border-teal-200 text-left cursor-pointer">
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

        {/* ── Status bar ── */}
        <div className="no-print bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span>Page {activePage + 1} of {pages.length}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{wordCount} words</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{charCount} characters</span>
          </div>
          <div className="flex items-center gap-4">
            {activeTable && <span className="text-amber-500 dark:text-amber-400">● Table selected — use Layout tab for table tools</span>}
            <span>{docTitle || "Untitled Document"}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="capitalize">{templateStatus}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>GP Edge Template Editor</span>
          </div>
        </div>
      </div>

      {/* ── Flowchart Builder modal ── */}
      <AnimatePresence>
        {showFlowchart && (
          <FlowchartBuilder
            initialData={editingFlowchartData ?? undefined}
            onInsert={(svg) => {
              if (editingFlowchartEl) {
                // Replace existing wrapper in-place
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
            }}
            onClose={() => {
              setShowFlowchart(false);
              setEditingFlowchartEl(null);
              setEditingFlowchartData(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Fixed-position Insert-tab dropdowns (escape overflow clipping) ── */}
      <AnimatePresence>
        {tableMenuOpen && tableAnchor && (
          <motion.div
            data-insert-dropdown="table"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "fixed", top: tableAnchor.top, left: tableAnchor.left, zIndex: 200 }}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-52 space-y-2"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Table Size</p>
              <button onClick={() => { setTableMenuOpen(false); setTableAnchor(null); }} className="text-slate-300 hover:text-slate-500 transition-colors"><Lucide.X className="w-3 h-3" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-semibold uppercase tracking-wider">Rows</label>
                <input type="number" min="1" max="20" value={tableRows} onChange={(e) => setTableRows(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5 font-semibold uppercase tracking-wider">Cols</label>
                <input type="number" min="1" max="12" value={tableCols} onChange={(e) => setTableCols(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
              </div>
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { insertTable(Number(tableRows), Number(tableCols)); setTableMenuOpen(false); setTableAnchor(null); }}
              className="w-full py-2 bg-teal-800 text-white text-xs font-bold rounded-lg hover:bg-teal-900 transition-all flex items-center justify-center gap-1.5"
            >
              <Lucide.Table className="w-3.5 h-3.5" /> Insert Table
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {calloutOpen && calloutAnchor && (
          <motion.div
            data-insert-dropdown="callout"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "fixed", top: calloutAnchor.top, left: calloutAnchor.left, zIndex: 200 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden w-44"
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Callout Style</p>
              <button onClick={() => { setCalloutOpen(false); setCalloutAnchor(null); }} className="text-slate-300 hover:text-slate-500 transition-colors"><Lucide.X className="w-3 h-3" /></button>
            </div>
            {([
              ["info",    "Guideline",      "bg-teal-50    hover:bg-teal-100    text-teal-700",   "border-l-teal-500"],
              ["pearl",   "Clinical Pearl", "bg-emerald-50 hover:bg-emerald-100 text-emerald-700","border-l-emerald-500"],
              ["warning", "⚠ Warning",      "bg-amber-50   hover:bg-amber-100   text-amber-700",  "border-l-amber-500"],
              ["billing", "Billing Note",   "bg-slate-50   hover:bg-slate-100   text-slate-600",  "border-l-slate-400"],
            ] as const).map(([v, l, cls, border]) => (
              <button key={v}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { insertCallout(v as any); setCalloutOpen(false); setCalloutAnchor(null); }}
                className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-all border-l-4 ${cls} ${border}`}
              >
                {l}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {imageMenuOpen && imageAnchor && (
          <motion.div
            data-insert-dropdown="image"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "fixed", top: imageAnchor.top, left: imageAnchor.left, zIndex: 200 }}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-60 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Insert Image</p>
              <button onClick={() => { setImageMenuOpen(false); setImageAnchor(null); }} className="text-slate-300 hover:text-slate-500 transition-colors"><Lucide.X className="w-3 h-3" /></button>
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Image URL</label>
              <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") insertImageUrl(); }}
                placeholder="https://example.com/image.png"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { insertImageUrl(); setImageAnchor(null); }}
              className="w-full py-2 bg-teal-800 text-white text-xs font-bold rounded-lg hover:bg-teal-900 transition-all flex items-center justify-center gap-1.5">
              <Lucide.Link className="w-3.5 h-3.5" /> Insert from URL
            </button>
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[9px] text-slate-400 font-semibold uppercase">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                // Save cursor position before dialog opens so insertHTMLAtCursor knows where to place the image
                savedRangeRef.current = saveSelection();
                fileInputRef.current?.click();
              }}
              className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg hover:border-teal-400 hover:text-teal-600 transition-all flex items-center justify-center gap-1.5">
              <Lucide.Upload className="w-3.5 h-3.5" /> Upload from Device
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {linkOpen && linkAnchorPos && (
          <motion.div
            data-insert-dropdown="link"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "fixed", top: linkAnchorPos.top, left: linkAnchorPos.left, zIndex: 200 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-72 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lucide.Link className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300">Insert Link</span>
              </div>
              <button onClick={() => setLinkOpen(false)} className="text-teal-400 hover:text-teal-700 transition-colors"><Lucide.X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="p-3 space-y-3">
              {/* Link Text */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Display Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link label (optional — uses selection)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* URL */}
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">URL <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lucide.Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") insertLink(); if (e.key === "Escape") setLinkOpen(false); }}
                    placeholder="https://example.com"
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick URLs */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quick Insert</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "MBS Online", url: "https://www.mbsonline.gov.au" },
                    { label: "RACGP Guidelines", url: "https://www.racgp.org.au/guidelines" },
                    { label: "UpToDate", url: "https://www.uptodate.com" },
                    { label: "PBS Medicines", url: "https://www.pbs.gov.au" },
                  ].map(q => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setLinkUrl(q.url)}
                      className="text-left px-2 py-1 text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 rounded-lg hover:bg-teal-100 transition-all truncate"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setLinkOpen(false)}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  disabled={!linkUrl.trim()}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-teal-800 rounded-lg hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  <Lucide.Link className="w-3 h-3" /> Insert Link
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Document Import & Review Modal ── */}
      <AnimatePresence>
        {showImportModal && (
          <div key="doc-import-modal-container" className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              key="doc-import-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
              onClick={() => {
                if (docUploadState !== "uploading" && docUploadState !== "extracting") {
                  setShowImportModal(false);
                }
              }}
            />
            <motion.div
              key="doc-import-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-[8%] mx-auto max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl z-50 shadow-2xl overflow-y-auto max-h-[84vh] pointer-events-auto text-slate-950 dark:text-slate-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5 border-b border-slate-105 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Lucide.Sparkles className="w-5 h-5 text-teal-600" />
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                      Import Document Content
                    </h3>
                  </div>
                  {(docUploadState !== "uploading" && docUploadState !== "extracting") && (
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-none outline-none bg-transparent cursor-pointer"
                    >
                      <Lucide.X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {docUploadState === "uploading" && (
                  <div className="py-8 text-center space-y-4">
                    <Lucide.Loader className="w-10 h-10 text-teal-700 animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-355">Uploading "{docUploadedFileName}"...</p>
                      <p className="text-xs text-slate-400">File size: {docUploadedFileSize}</p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 mb-1">
                        <span>Uploading...</span>
                        <span>{docUploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-700 transition-all duration-150" style={{ width: `${docUploadProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {docUploadState === "extracting" && (
                  <div className="py-8 text-center space-y-4">
                    <Lucide.Cpu className="w-10 h-10 text-teal-700 animate-bounce mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-355">Analyzing Clinical Document...</p>
                      <p className="text-xs text-teal-650 dark:text-teal-400 font-medium">{docExtractionLog}</p>
                    </div>
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 mb-1">
                        <span>Extracting fields...</span>
                        <span>{docExtractionProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-700 transition-all duration-300" style={{ width: `${docExtractionProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Persistent hidden file input — lives outside all portals so it's always in DOM ── */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleImageFile(e);
          setImageMenuOpen(false);
          setImageAnchor(null);
          // Reset so the same file can be re-selected next time
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      <input
        type="file"
        ref={docFileInputRef}
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          handleDocFileChange(e);
          if (docFileInputRef.current) docFileInputRef.current.value = "";
        }}
      />
    </>
  );
}

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400 text-sm">Loading editor...</div>}>
      <TemplateEditorContent />
    </Suspense>
  );
}
