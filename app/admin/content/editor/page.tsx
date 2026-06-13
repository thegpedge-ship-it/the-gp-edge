"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import * as Lucide from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import { 
  getMedicalContent, 
  saveMedicalContent, 
  MedicalContent, 
  getQuestions, 
  createQuiz,
  Question
} from "@/lib/quizData";
import { addUserNotification } from "@/utils/notifications";

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
        let icon = "ℹ️";
        if (variant === "billing") {
          bg = "#f8fafc";
          border = "#f8fafc";
          color = "#334155";
          titleColor = "#475569";
          label = "Billing";
          icon = "📋";
        } else if (variant === "pearl") {
          bg = "#e6f7f4";
          border = "#e6f7f4";
          color = "#1a5c51";
          titleColor = "#2bb09c";
          label = "Key Points";
          icon = "☑";
        } else if (variant === "warning") {
          bg = "#fff9e6";
          border = "#fff9e6";
          color = "#7b341e";
          titleColor = "#dd6b20";
          label = "Important";
          icon = "⚡";
        } else if (variant === "danger") {
          bg = "#fff5f5";
          border = "#fff5f5";
          color = "#9b2c2c";
          titleColor = "#c53030";
          label = "Red Flags";
          icon = "⚠️";
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
        const ths = rows[0]?.map(cell => `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #2bb09c; border: 1px solid #cbd5e1; color: #ffffff;">${cell}</th>`).join("");
        const tds = rows.slice(1).map((row, ri) => {
          const bg = ri % 2 === 1 ? "#f8fafc" : "#ffffff";
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

function ContentEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const id = idStr ? parseInt(idStr, 10) : 1;

  const [medicalContents, setMedicalContents] = useState<MedicalContent[]>([]);
  const [contentItem, setContentItem] = useState<MedicalContent | null>(null);

  const [docTitle, setDocTitle] = useState("");
  const [selectedSystem, setSelectedSystem] = useState("Endocrine");
  const [selectedCategory, setSelectedCategory] = useState("Chronic Disease");
  const [contentStatus, setContentStatus] = useState<"draft" | "review" | "published">("draft");
  const [author, setAuthor] = useState("GP Edge Content Team");
  const [tags, setTags] = useState<string[]>(["Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS"]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"meta" | "refs" | "pages">("meta");

  // Multi-page support
  const [pages, setPages] = useState<string[]>([""]);  // Array of page HTML
  const [activePage, setActivePage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Dropdown states
  const [statusOpen, setStatusOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  // Popover menu states
  const [calloutMenuOpen, setCalloutMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);

  // Popover inputs
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("4");
  const [imageUrl, setImageUrl] = useState("");

  const fontOptions = [
    { value: "'DM Sans', sans-serif", label: "DM Sans" },
    { value: "Arial", label: "Arial" },
    { value: "'Times New Roman'", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "Courier New", label: "Courier New" }
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

  // Dropdown Refs
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  // Popover Refs
  const calloutMenuRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);

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
      if (calloutMenuRef.current && !calloutMenuRef.current.contains(e.target as Node)) {
        setCalloutMenuOpen(false);
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setTableMenuOpen(false);
      }
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setImageMenuOpen(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) {
        setTextColorOpen(false);
      }
      if (highlightColorRef.current && !highlightColorRef.current.contains(e.target as Node)) {
        setHighlightColorOpen(false);
      }
    }

    const handleMouseUpInEditor = (e: MouseEvent) => {
      if (editorRef.current && editorRef.current.contains(e.target as Node)) {
        handleSelectionOrClick();
      } else {
        // Clicked outside editor - keep table context if it was inside
        const target = e.target as Node;
        // Don't clear if clicking toolbar buttons (they have onMouseDown preventDefault)
        if (!target || !(target as HTMLElement).closest?.('[data-toolbar]')) {
          setTimeout(() => {
            // Only clear if focus left the editor entirely
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

  // Load content metadata & body
  useEffect(() => {
    const list = getMedicalContent();
    setMedicalContents(list);
    const item = list.find((c) => c.id === id) || list[0] || {
      id: 1,
      name: "Type 2 Diabetes Management",
      category: "Chronic Disease",
      system: "Endocrine",
      type: "Guideline",
      status: "published",
      lastUpdated: "28 May 2026",
      author: "GP Edge Content Team",
      references: 5,
    };
    
    setContentItem(item);
    setDocTitle(item.name);
    setSelectedSystem(item.system);
    setSelectedCategory(item.category);
    setContentStatus(item.status);
    setAuthor(item.author);

    // Initial tags setup
    const rawTags = localStorage.getItem(`gpedge_content_tags_${id}`);
    if (rawTags) {
      try {
        setTags(JSON.parse(rawTags));
      } catch {
        if (item.name.includes("Diabetes")) {
          setTags(["Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS"]);
        } else if (item.name.includes("Coronary")) {
          setTags(["Cardiology", "Emergency", "ACS", "Protocol"]);
        } else {
          setTags([item.system, item.category]);
        }
      }
    } else {
      if (item.name.includes("Diabetes")) {
        setTags(["Diabetes", "Endocrine", "Chronic", "Pharmacology", "MBS"]);
      } else if (item.name.includes("Coronary")) {
        setTags(["Cardiology", "Emergency", "ACS", "Protocol"]);
      } else {
        setTags([item.system, item.category]);
      }
    }

    // Load body HTML
    let savedHtml = localStorage.getItem(`gpedge_content_body_${id}`);
    if (!savedHtml) {
      // Seed default content blocks
      const customizedBlocks = initialBlocks.map((block, idx) =>
        idx === 0 && block.type === "heading"
          ? { ...block, content: `${item.name} in General Practice` }
          : block
      );
      savedHtml = blocksToHtml(customizedBlocks);
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = savedHtml;
      updateCounts();
      
      // Seed initial undo entry
      setHistory([savedHtml]);
      setHistoryIndex(0);

      // Seed pages: try loading saved pages, else use single page with content
      const savedPages = localStorage.getItem(`gpedge_content_pages_${id}`);
      if (savedPages) {
        try {
          const parsedPages = JSON.parse(savedPages) as string[];
          if (parsedPages.length > 0) {
            setPages(parsedPages);
            setActivePage(0);
            editorRef.current.innerHTML = parsedPages[0];
          }
        } catch {
          setPages([savedHtml]);
        }
      } else {
        setPages([savedHtml]);
      }
    }

    // Load linked questions
    const rawLinks = localStorage.getItem(`gpedge_content_links_${id}`);
    if (rawLinks) {
      try {
        setLinkedQuestionIds(JSON.parse(rawLinks));
      } catch {}
    } else {
      setLinkedQuestionIds([]);
    }

    // Load references
    const rawRefs = localStorage.getItem(`gpedge_content_refs_${id}`);
    if (rawRefs) {
      try {
        setDocReferences(JSON.parse(rawRefs));
      } catch {
        setDocReferences(initialReferences);
      }
    } else {
      setDocReferences(initialReferences);
    }

    // Load question bank
    setAllQuestions(getQuestions());
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
    let icon = "ℹ️";
    if (variant === "billing") {
      bg = "#f8fafc";
      border = "#f8fafc";
      color = "#334155";
      titleColor = "#475569";
      label = "Billing";
      icon = "📋";
    } else if (variant === "pearl") {
      bg = "#e6f7f4";
      border = "#e6f7f4";
      color = "#1a5c51";
      titleColor = "#2bb09c";
      label = "Key Points";
      icon = "☑";
    } else if (variant === "warning") {
      bg = "#fff9e6";
      border = "#fff9e6";
      color = "#7b341e";
      titleColor = "#dd6b20";
      label = "Important";
      icon = "⚡";
    } else if (variant === "danger") {
      bg = "#fff5f5";
      border = "#fff5f5";
      color = "#9b2c2c";
      titleColor = "#c53030";
      label = "Red Flags";
      icon = "⚠️";
    }
    
    const calloutHtml = `
      <div class="callout-block" data-variant="${variant}" style="background-color: ${bg}; border: 1px solid ${border}; border-left: 5px solid ${titleColor}; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: ${color};">
        <div style="font-weight: bold; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: ${titleColor};">${icon} ${label}</div>
        <div style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; line-height: 1.6;">Callout instruction / guidelines context...</div>
      </div>
    `;
    insertHTMLAtCursor(calloutHtml);
    updateCounts();
    saveToHistory();
  };

  const insertTableDirectly = (rowCount: number, colCount: number) => {
    const savedRange = saveSelection();
    restoreSelection(savedRange);
    
    let tableHtml = `<div style="overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 0.75rem; margin-bottom: 1.25rem; background-color: #ffffff;"><table style="width: 100%; border-collapse: collapse; text-align: left;"><thead><tr>`;
    for (let i = 0; i < colCount; i++) {
      tableHtml += `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #2bb09c; border: 1px solid #cbd5e1; color: #ffffff;">Header ${i+1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rowCount; r++) {
      const bg = r % 2 === 1 ? "#f8fafc" : "#ffffff";
      tableHtml += `<tr>`;
      for (let c = 0; c < colCount; c++) {
        tableHtml += `<td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; background-color: ${bg}; color: #475569;">Cell</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div>`;
    
    insertHTMLAtCursor(tableHtml);
    
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
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Image";
    img.style.cssText = "border-radius: 0.75rem; max-width: 100%; height: auto; display: block; margin: 1rem auto;";
    
    insertBlockNodeAtCursor(img);
    updateCounts();
    saveToHistory();
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds 5MB limit.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        insertImageDirectly(base64Url);
        setImageMenuOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const insertDivider = () => {
    const hr = document.createElement("hr");
    hr.style.cssText = "border: 0; border-top: 1px solid #cbd5e1; margin: 1rem 0;";
    
    insertBlockNodeAtCursor(hr);
    updateCounts();
    saveToHistory();
  };

  const handleSave = () => {
    if (!docTitle.trim()) {
      alert("Please enter a content title.");
      return;
    }
    const html = editorRef.current?.innerHTML || "";
    localStorage.setItem(`gpedge_content_body_${id}`, html);

    // Save all pages (update active page first)
    const allPages = saveCurrentPageToPages();
    localStorage.setItem(`gpedge_content_pages_${id}`, JSON.stringify(allPages));

    // Save tags
    localStorage.setItem(`gpedge_content_tags_${id}`, JSON.stringify(tags));


    const list = getMedicalContent();
    const updated = list.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: docTitle.trim(),
          system: selectedSystem,
          category: selectedCategory,
          status: contentStatus,
          lastUpdated: "Just now",
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
    alert("Changes saved persistently!");
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
    localStorage.setItem(`gpedge_content_refs_${id}`, JSON.stringify(updated));
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
    const list = getMedicalContent();
    const nextId = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1;
    
    const duplicateItem: MedicalContent = {
      id: nextId,
      name: `Copy of ${docTitle}`,
      system: selectedSystem,
      category: selectedCategory,
      type: contentItem?.type || "Guideline",
      status: "draft",
      lastUpdated: "Just now",
      author: "GP Edge Admin",
      references: docReferences.length,
      usedInQuestions: 0,
    };


    const updated = [duplicateItem, ...list];
    setMedicalContents(updated);
    saveMedicalContent(updated);

    const html = editorRef.current?.innerHTML || "";
    localStorage.setItem(`gpedge_content_body_${nextId}`, html);

    addUserNotification(
      "Content Duplicated",
      `Created draft duplicate "${duplicateItem.name}" from original content guide.`,
      1,
      "custom"
    );

    alert(`Duplicated content successfully! Redirecting to copy...`);
    router.push(`/admin/content/editor?id=${nextId}`);
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

  const handleGenerateQuiz = () => {
    const bank = getQuestions();
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

    const newQuiz = createQuiz({
      name: `Quiz: ${docTitle}`,
      description: `Auto-generated practice quiz based on the clinical content "${docTitle}".`,
      timeLimit: quizQuestions.length * 2,
      passingScore: 70,
      randomize: true,
      status: "draft",
      examType: "AKT",
      questionIds: quizQuestions.map(q => q.id),
      topics: [selectedSystem],
    });

    addUserNotification(
      "Quiz Generated",
      `Successfully generated practice quiz "${newQuiz.name}" with ${quizQuestions.length} related questions.`,
      quizQuestions.length,
      "quiz"
    );

    alert(`Practice quiz generated successfully! Redirecting to quiz settings...`);
    router.push(`/admin/quizzes/${newQuiz.id}/edit`);
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

  const statusColors = {
    draft: { bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
    review: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    published: { bg: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
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
          background-color: #2bb09c !important;
          color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
        }
        .print-area td {
          padding: 0.75rem 1rem !important;
          font-size: 0.825rem !important;
          border: 1px solid #e2e8f0 !important;
          color: #475569 !important;
        }
        .print-area td p, .print-area th p {
          margin: 0 !important;
          font-size: inherit !important;
          color: inherit !important;
          line-height: inherit !important;
        }
        .print-area tr:nth-child(even) td {
          background-color: #f8fafc !important;
        }
        .print-area tr:nth-child(odd) td {
          background-color: #ffffff !important;
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
          background-color: #e6f7f4 !important;
          border: 1px solid #e6f7f4 !important;
          border-left: 5px solid #2bb09c !important;
          color: #1a5c51 !important;
        }
        .print-area .callout-block[data-variant="warning"] {
          background-color: #fff9e6 !important;
          border: 1px solid #fff9e6 !important;
          border-left: 5px solid #dd6b20 !important;
          color: #7b341e !important;
        }
        .print-area .callout-block[data-variant="danger"] {
          background-color: #fff5f5 !important;
          border: 1px solid #fff5f5 !important;
          border-left: 5px solid #c53030 !important;
          color: #9b2c2c !important;
        }
        .print-area .callout-block[data-variant="billing"] {
          background-color: #f8fafc !important;
          border: 1px solid #f8fafc !important;
          border-left: 5px solid #64748b !important;
          color: #334155 !important;
        }
      ` }} />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Editor toolbar - STICKY WRAPPER */}
      <div className="sticky top-14 z-30 no-print">
        <motion.div variants={itemVariants} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-teal-200/40 dark:border-teal-900/40 shadow-md shadow-slate-200/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 rounded-2xl pointer-events-none" />
        <div className="relative z-10 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/content" className="text-slate-400 hover:text-teal-600 transition-colors font-semibold">Content</Link>
            <svg className="w-3.5 h-3.5 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-700 dark:text-slate-200 font-bold">{docTitle || "Untitled Document"}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Selector */}
            <div className="relative inline-block text-left" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 hover:border-teal-350 hover:text-teal-650 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Status: <span className="capitalize font-bold text-teal-800 dark:text-teal-400">{contentStatus}</span></span>
                <Lucide.ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              <AnimatePresence>
                {statusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 mt-1 w-28 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-1">
                      {(["draft", "review", "published"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setContentStatus(status);
                            setStatusOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors capitalize ${
                            contentStatus === status
                              ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preview toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${previewMode ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"}`}
            >
              {previewMode ? (
                <>
                  <Lucide.Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </>
              ) : (
                <>
                  <Lucide.Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              )}
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>

            {/* Download Template */}
            <a
              href="/templates/medical_content_template.docx"
              download
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 hover:border-teal-350 hover:text-teal-700 transition-all flex items-center gap-1.5 bg-white text-slate-500 shadow-sm"
            >
              <Lucide.Download className="w-3.5 h-3.5 text-teal-800 dark:text-teal-400" />
              <span>Download Template</span>
            </a>

            {/* Save */}
            <button onClick={handleSave} className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-all shadow-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Save Changes
            </button>
          </div>
        </div>

        {/* Formatting toolbar */}
        {!previewMode && (
          <div
            data-toolbar="true"
            className="border-t border-slate-200/40 dark:border-slate-800 px-5 py-2 flex items-center gap-1 flex-wrap bg-slate-50/50 dark:bg-slate-900/50"
          >
            {/* Undo / Redo buttons */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className={`w-8 h-8 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${historyIndex > 0 ? "text-slate-500 bg-slate-100 hover:bg-teal-50 hover:text-teal-600 dark:bg-slate-800 dark:text-slate-300" : "text-slate-300 bg-slate-100 dark:bg-slate-950/20 cursor-not-allowed"}`}
            >
              <Lucide.Undo2 className="w-4 h-4" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className={`w-8 h-8 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${historyIndex < history.length - 1 ? "text-slate-500 bg-slate-100 hover:bg-teal-50 hover:text-teal-600 dark:bg-slate-800 dark:text-slate-300" : "text-slate-300 bg-slate-100 dark:bg-slate-950/20 cursor-not-allowed"}`}
            >
              <Lucide.Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
            
            {/* Font family */}
            <div className="relative inline-block text-left" ref={fontDropdownRef}>
              <button
                type="button"
                onClick={() => setFontOpen(!fontOpen)}
                className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="truncate max-w-[90px]">{selectedFont.label}</span>
                <Lucide.ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <AnimatePresence>
                {fontOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-1 max-h-60 overflow-y-auto">
                      {fontOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedFont(opt);
                            applyStyleToSelection("fontFamily", opt.value);
                            setFontOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                            selectedFont.value === opt.value
                              ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                          style={{ fontFamily: opt.value }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Font size */}
            <div className="relative inline-block text-left" ref={sizeDropdownRef}>
              <button
                type="button"
                onClick={() => setSizeOpen(!sizeOpen)}
                className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{selectedSize.label}</span>
                <Lucide.ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <AnimatePresence>
                {sizeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-20 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-1">
                      {fontSizeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedSize(opt);
                            applyStyleToSelection("fontSize", opt.label);
                            setSizeOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                            selectedSize.value === opt.value
                              ? "bg-teal-50 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 font-bold"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Headings */}
            {[
              { label: "H1", title: "Heading 1", format: "formatBlock", value: "<h1>" },
              { label: "H2", title: "Heading 2", format: "formatBlock", value: "<h2>" },
              { label: "H3", title: "Heading 3", format: "formatBlock", value: "<h3>" },
            ].map((b) => (
              <button 
                key={b.label} 
                title={b.title} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormatText(b.format, b.value)} 
                className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center"
              >
                {b.label}
              </button>
            ))}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Bold Italic Underline Strikethrough */}
            {[
              { label: "B", title: "Bold", format: "bold" },
              { label: "I", title: "Italic", format: "italic" },
              { label: "U", title: "Underline", format: "underline" },
              { label: "S", title: "Strikethrough", format: "strikeThrough" },
            ].map((b) => (
              <button 
                key={b.label} 
                title={b.title} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormatText(b.format)} 
                className={`w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center ${b.label === "I" ? "italic" : ""} ${b.label === "U" ? "underline" : ""} ${b.label === "S" ? "line-through" : ""}`}
              >
                {b.label}
              </button>
            ))}

            {/* Text color */}
            <div className="relative inline-block text-left" ref={textColorRef}>
              <button
                type="button"
                onClick={() => setTextColorOpen(!textColorOpen)}
                className="h-8 px-2 text-xs font-semibold text-slate-705 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
                title="Text Color"
              >
                <Lucide.Type className="w-3.5 h-3.5" />
                <span className="w-2.5 h-2.5 rounded-full border border-slate-200 dark:border-slate-600 bg-current" style={{ color: "currentColor" }} />
              </button>
              <AnimatePresence>
                {textColorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 p-2"
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
                        { name: "Purple", color: "#7c3aed" }
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          title={item.name}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleFormatText("foreColor", item.color);
                            setTextColorOpen(false);
                          }}
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
            
            {/* Highlight color */}
            <div className="relative inline-block text-left" ref={highlightColorRef}>
              <button
                type="button"
                onClick={() => setHighlightColorOpen(!highlightColorOpen)}
                className="h-8 px-2 text-xs font-semibold text-slate-705 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-350 transition-all flex items-center gap-1 shadow-sm"
                title="Text Highlight"
              >
                <Lucide.Highlighter className="w-3.5 h-3.5" />
                <span className="w-2.5 h-1 bg-yellow-300 rounded-sm" />
              </button>
              <AnimatePresence>
                {highlightColorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-40 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 p-2"
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
                        { name: "Slate", color: "#e2e8f0" }
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          title={item.name}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleFormatText("backColor", item.color);
                            setHighlightColorOpen(false);
                          }}
                          className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center bg-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.name === "None" && <Lucide.Slash className="w-3 h-3 text-red-500" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Alignment */}
            {[
              { icon: <Lucide.AlignLeft className="w-4 h-4" />, title: "Align Left", format: "justifyLeft" },
              { icon: <Lucide.AlignCenter className="w-4 h-4" />, title: "Align Center", format: "justifyCenter" },
              { icon: <Lucide.AlignRight className="w-4 h-4" />, title: "Align Right", format: "justifyRight" },
              { icon: <Lucide.AlignJustify className="w-4 h-4" />, title: "Justify", format: "justifyFull" },
            ].map((b) => (
              <button 
                key={b.title} 
                title={b.title} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormatText(b.format)} 
                className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
              >
                {b.icon}
              </button>
            ))}

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Lists & Link */}
            {[
              { icon: <Lucide.List className="w-4 h-4" />, title: "Bullet List", format: "insertUnorderedList" },
              { icon: <Lucide.ListOrdered className="w-4 h-4" />, title: "Numbered List", format: "insertOrderedList" },
            ].map((b) => (
              <button 
                key={b.title} 
                title={b.title} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormatText(b.format)} 
                className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
              >
                {b.icon}
              </button>
            ))}

            <button 
              title="Link" 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const savedRange = saveSelection();
                const url = prompt("Enter URL:");
                if (url) {
                  restoreSelection(savedRange);
                  handleFormatText("createLink", url);
                }
              }} 
              className="w-8 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
            >
              <Lucide.Link2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Custom inserts */}
            {/* Insert Table */}
            <div className="relative inline-block text-left" ref={tableMenuRef}>
              <button 
                title="Insert Table" 
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTableMenuOpen(!tableMenuOpen)} 
                className="px-2 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-750 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-none bg-transparent animate-fade-in"
              >
                <Lucide.Table className="w-3.5 h-3.5" /> Table
              </button>
              <AnimatePresence>
                {tableMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-48 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 p-3 space-y-2.5"
                  >
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Table Dimensions</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Rows</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={tableRows}
                          onChange={(e) => setTableRows(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Columns</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={tableCols}
                          onChange={(e) => setTableCols(e.target.value)}
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
                        }
                      }}
                      className="w-full py-1 text-center text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-all cursor-pointer border-none shadow-sm"
                    >
                      Insert Table
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Insert Callout */}
            <div className="relative inline-block text-left" ref={calloutMenuRef}>
              <button 
                title="Insert Callout" 
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCalloutMenuOpen(!calloutMenuOpen)} 
                className="px-2 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-none bg-transparent"
              >
                <Lucide.Lightbulb className="w-3.5 h-3.5" /> Callout
              </button>
              <AnimatePresence>
                {calloutMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-44 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-1 space-y-0.5">
                      {[
                        { value: "info", label: "Guideline", bg: "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400" },
                        { value: "pearl", label: "Clinical Pearl", bg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" },
                        { value: "warning", label: "Warning", bg: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" },
                        { value: "danger", label: "Red Flag", bg: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400" },
                        { value: "billing", label: "Billing", bg: "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-300" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            insertCallout(item.value as any);
                            setCalloutMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors font-medium hover:bg-teal-50/50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 border-none bg-transparent"
                        >
                          <span className={`w-2 h-2 rounded-full ${item.value === 'billing' ? 'bg-slate-400' : item.value === 'warning' ? 'bg-amber-500' : item.value === 'pearl' ? 'bg-emerald-500' : item.value === 'danger' ? 'bg-red-500' : 'bg-teal-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Insert Image */}
            <div className="relative inline-block text-left" ref={imageMenuRef}>
              <button 
                title="Insert Image" 
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setImageUrl("");
                  setImageMenuOpen(!imageMenuOpen);
                }} 
                className="px-2 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-none bg-transparent"
              >
                <Lucide.Image className="w-3.5 h-3.5" /> Image
              </button>
              <AnimatePresence>
                {imageMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 mt-1 w-64 rounded-lg bg-white dark:bg-slate-900 border border-teal-200/50 dark:border-teal-900/40 shadow-lg z-50 p-3.5 space-y-3"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Image URL</div>
                      <input
                        type="text"
                        placeholder="https://example.com/image.png"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
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
                          type="file"
                          accept="image/*"
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
                        type="button"
                        onClick={() => setImageMenuOpen(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer border-none bg-transparent"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (imageUrl.trim()) {
                            insertImageDirectly(imageUrl.trim());
                            setImageMenuOpen(false);
                          }
                        }}
                        className="px-3 py-1 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-all cursor-pointer border-none"
                      >
                        Insert
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <button 
              title="Insert Divider" 
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertDivider} 
              className="px-2 h-8 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 dark:text-slate-400 dark:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-none bg-transparent"
            >
              <Lucide.Minus className="w-3.5 h-3.5" /> Divider
            </button>

            {/* Dynamic Table Tools Sub-Toolbar (MS Word Style) */}
            <AnimatePresence>
              {activeTable && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="flex items-center gap-1.5 flex-wrap w-full border-t border-teal-100 dark:border-teal-900/50 mt-2 pt-2"
                >
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                    <Lucide.Table className="w-3.5 h-3.5" /> Table Actions:
                  </span>
                  
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertRowAbove}
                    title="Insert Row Above"
                    className="h-7 px-2 text-xs font-semibold text-slate-600 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.ArrowUp className="w-3 h-3" /> Row Above
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertRowBelow}
                    title="Insert Row Below"
                    className="h-7 px-2 text-xs font-semibold text-slate-600 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.ArrowDown className="w-3 h-3" /> Row Below
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertColumnLeft}
                    title="Insert Column Left"
                    className="h-7 px-2 text-xs font-semibold text-slate-600 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.ArrowLeft className="w-3 h-3" /> Col Left
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={insertColumnRight}
                    title="Insert Column Right"
                    className="h-7 px-2 text-xs font-semibold text-slate-600 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-700 dark:hover:text-teal-400 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.ArrowRight className="w-3 h-3" /> Col Right
                  </button>
                  
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                  
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={deleteRow}
                    title="Delete Row"
                    className="h-7 px-2 text-xs font-semibold text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.Trash2 className="w-3 h-3" /> Del Row
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={deleteColumn}
                    title="Delete Column"
                    className="h-7 px-2 text-xs font-semibold text-red-600 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lucide.Trash2 className="w-3 h-3" /> Del Col
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={deleteTable}
                    title="Delete Table"
                    className="h-7 px-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-950 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer border-none"
                  >
                    <Lucide.Trash2 className="w-3 h-3" /> Del Table
                  </button>

                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

                  {/* Cell shading */}
                  <span className="text-[10px] text-slate-400 font-medium">Cell Shading:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { name: "None", color: "" },
                      { name: "Teal", color: "#f0fdfa" },
                      { name: "Amber", color: "#fffbeb" },
                      { name: "Slate", color: "#f8fafc" },
                      { name: "Rose", color: "#fff1f2" }
                    ].map((shade) => (
                      <button
                        key={shade.name}
                        type="button"
                        title={`Shade Cell ${shade.name}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setCellBackground(shade.color)}
                        className="w-5 h-5 rounded border border-slate-200 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: shade.color || "#ffffff" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </motion.div>
      </div>

      {/* Editor + sidebar layout */}
      <div className={`grid gap-6 ${showSidebar ? "grid-cols-1 xl:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        {/* Main A4 Document Workspace */}
        <motion.div variants={itemVariants} className="flex-1 overflow-x-auto bg-slate-100/70 dark:bg-slate-950/40 p-4 sm:p-8 rounded-2xl border border-teal-200/30 dark:border-teal-900/30 flex justify-center shadow-inner">
          <div className="print-area w-full max-w-[812px] min-h-[1130px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-2xl p-16 rounded-sm relative flex flex-col">
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
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:text-teal-600 transition-all cursor-pointer"
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
              onInput={updateCounts}
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
              className="flex-1 w-full prose prose-sm max-w-none text-slate-700 dark:text-slate-300 focus:outline-none min-h-[900px] leading-relaxed text-sm select-text"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />

            {/* Page footer navigation */}
            <div className="no-print mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[9px] text-slate-300 dark:text-slate-600">Page {activePage + 1} / {pages.length}</span>
              <div className="flex items-center gap-2">
                {activePage > 0 && (
                  <button
                    onClick={() => switchPage(activePage - 1)}
                    className="text-[10px] text-slate-400 hover:text-teal-600 transition-colors font-semibold cursor-pointer"
                  >
                    ← Previous Page
                  </button>
                )}
                {activePage < pages.length - 1 ? (
                  <button
                    onClick={() => switchPage(activePage + 1)}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
                  >
                    Next Page →
                  </button>
                ) : (
                  <button
                    onClick={addPage}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold cursor-pointer flex items-center gap-1"
                  >
                    + Add Page
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 no-print"
            >
              {/* Sidebar tabs */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-250/20 dark:border-teal-900/30 shadow-md shadow-slate-200/30 relative z-20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex border-b border-slate-200/40 dark:border-slate-800 overflow-x-auto">
                    {(["pages", "meta", "refs"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSidebarTab(tab)}
                        className={`flex-1 px-2 py-3 text-xs font-semibold text-center transition-all whitespace-nowrap ${sidebarTab === tab ? "text-teal-700 border-b-2 border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 dark:text-teal-400" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {tab === "pages" ? "Pages" : tab === "meta" ? "Meta" : "Refs"}
                      </button>
                    ))}
                  </div>

                  <div className="p-4">
                    {sidebarTab === "meta" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Document Title</label>
                          <input
                            type="text"
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium"
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
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                          <input
                            type="text"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Author</label>
                          <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-slate-200 transition-all font-medium"
                          />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tags</label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50 px-2 py-0.5 rounded-full">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="text-teal-400 hover:text-teal-600">✕</button>
                              </span>
                            ))}
                            {!showTagInput ? (
                              <button 
                                onClick={() => setShowTagInput(true)}
                                className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:text-teal-600 transition-all"
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
                                <button onClick={() => { addTag(newTag); setShowTagInput(false); }} className="text-[10px] text-teal-600 font-bold hover:text-teal-700">✓</button>
                              </div>
                            )}
                          </div>
                          {suggestedTags.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[9px] text-slate-400 font-medium mb-1">Suggestions:</p>
                              <div className="flex flex-wrap gap-1">
                                {suggestedTags.slice(0, 5).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => addTag(t)}
                                    className="text-[9px] text-slate-500 hover:text-teal-650 hover:bg-teal-50 dark:hover:bg-teal-950/20 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800"
                                  >
                                    + {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Document stats */}
                        <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content Stats</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{wordCount}</p>
                              <p className="text-[9px] text-slate-400 font-semibold uppercase">Words</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{charCount}</p>
                              <p className="text-[9px] text-slate-400 font-semibold uppercase">Chars</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {sidebarTab === "refs" && (
                      <div className="space-y-4">
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
                              className="text-[10px] text-teal-600 font-bold hover:underline"
                            >
                              + Link Question
                            </button>
                          </div>

                          {linkedQuestionIds.length === 0 ? (
                            <p className="text-[11px] text-slate-400 py-2 text-center font-light">No practice questions linked yet.</p>
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
                                        className="text-red-500 hover:text-red-600 hover:underline"
                                      >
                                        Unlink
                                      </button>
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


                    {sidebarTab === "pages" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{pages.length} {pages.length === 1 ? "Page" : "Pages"}</p>
                          <button
                            onClick={addPage}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/60 dark:border-teal-900/40 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all cursor-pointer"
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
                                  ? "bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900"
                              }`}
                              onClick={() => switchPage(pageIdx)}
                            >
                              {/* Page icon */}
                              <div className={`w-7 h-9 rounded border flex items-center justify-center shrink-0 text-[8px] font-bold ${
                                pageIdx === activePage
                                  ? "bg-teal-600 border-teal-700 text-white"
                                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400"
                              }`}>
                                {pageIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${
                                  pageIdx === activePage ? "text-teal-700 dark:text-teal-400" : "text-slate-600 dark:text-slate-300"
                                }`}>Page {pageIdx + 1}</p>
                                {pageIdx === activePage && (
                                  <p className="text-[9px] text-teal-500 dark:text-teal-500 font-medium">Currently editing</p>
                                )}
                              </div>
                              {/* Delete page button */}
                              {pages.length > 1 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deletePage(pageIdx); }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
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
                          className="w-full py-2 border-2 border-dashed border-teal-200 dark:border-teal-900/40 rounded-xl text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          Add New Page
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-200/20 dark:border-teal-900/30 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                  {[
                    { label: "Export as PDF", icon: <Lucide.Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleExportPDF },
                    { label: "Duplicate Content", icon: <Lucide.Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleDuplicate },
                    { label: "Link to Question", icon: <Lucide.Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: () => { setQuestionSearch(""); setShowLinkQuestionModal(true); } },
                    { label: "Generate Quiz", icon: <Lucide.Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />, action: handleGenerateQuiz },
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

      </motion.div>

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

