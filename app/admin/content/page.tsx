"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomSelect from "@/components/admin/CustomSelect";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { getMedicalContent, saveMedicalContent, MedicalContent } from "@/lib/quizData";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

const typeColors: Record<string, string> = {
  Condition: "bg-teal-50/70 text-teal-800 border-teal-200/60 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/50",
  Guideline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/25 dark:text-teal-300 dark:border-teal-900/60",
  Protocol: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50",
  Pathway: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700/70",
  Document: "bg-teal-50/40 text-teal-700 border-teal-100 dark:bg-teal-950/10 dark:text-teal-400 dark:border-teal-900/30",
  Note: "bg-teal-50/30 text-teal-800 border-teal-100/70 dark:bg-teal-950/15 dark:text-teal-400 dark:border-teal-900/20",
};

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<MedicalContent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  // Content Upload Modal Wizard
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState<"select" | "condition" | "document" | "note">("select");
  
  // New entry states
  const [newTitle, setNewTitle] = useState("");
  const [newSystem, setNewSystem] = useState("Endocrine");
  const [newCategory, setNewCategory] = useState("");
  
  // Custom Condition items
  const [symptomsInput, setSymptomsInput] = useState("");
  const [treatmentInput, setTreatmentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Multiple PDF/Word uploads queue
  interface ContentUploadQueueItem {
    id: string;
    name: string;
    size: string;
    progress: number;
    status: "idle" | "uploading" | "extracting" | "success" | "error";
    error?: string;
    extractedData?: {
      title?: string;
      system?: string;
      category?: string;
      symptoms?: string;
      treatment?: string;
      notes?: string;
      fullHtml?: string;
      references?: string[];
    };
  }

  const [contentUploadQueue, setContentUploadQueue] = useState<ContentUploadQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    setContent(getMedicalContent());
  }, []);

  const systems = Array.from(new Set(content.map((c) => c.system)));

  const filtered = content.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.system.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSystem = systemFilter === "all" || c.system === systemFilter;
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchSystem && matchType && matchStatus;
  });

  const sortedContent = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id - a.id;
    });
  }, [filtered]);

  const displayedContent = useMemo(() => {
    return sortedContent.slice(0, visibleCount);
  }, [sortedContent, visibleCount]);

  const updateStatus = (id: number, newStatus: MedicalContent["status"]) => {
    const updated = content.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    setContent(updated);
    saveMedicalContent(updated);
  };

  const deleteContent = (id: number) => {
    if (confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      const updated = content.filter((c) => c.id !== id);
      setContent(updated);
      saveMedicalContent(updated);
    }
  };

  // Reset Modal Form
  const resetForm = () => {
    setNewTitle("");
    setNewSystem("Endocrine");
    setNewCategory("");
    setSymptomsInput("");
    setTreatmentInput("");
    setNotesInput("");
    setContentUploadQueue([]);
    setModalStep("select");
    setExtractedData(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: ContentUploadQueueItem[] = fileList.map((file, idx) => ({
      id: `content-upload-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      progress: 5,
      status: "uploading",
    }));

    setContentUploadQueue((prev) => [...prev, ...newItems]);

    // Process each file in parallel
    newItems.forEach((item, index) => {
      const originalFile = fileList[index];
      runContentExtraction(item.id, originalFile);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runContentExtraction = async (id: string, file: File) => {
    // Progress interval for extraction steps
    let currentProgress = 5;
    const progressTimer = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 90) {
        clearInterval(progressTimer);
        currentProgress = 90;
      }
      setContentUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: Math.min(95, Math.round(currentProgress)) } : item
        )
      );
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      const result = await res.json();

      if (result.success) {
        setContentUploadQueue((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "success",
                  progress: 100,
                  extractedData: {
                    title: result.title || file.name.replace(/\.[^/.]+$/, ""),
                    system: result.system || "Endocrine",
                    category: result.category || "Clinical Reference",
                    symptoms: result.symptoms || "",
                    treatment: result.treatment || "",
                    notes: result.notes || "",
                    fullHtml: result.fullHtml || "",
                    references: result.references || [],
                  },
                }
              : item
          )
        );
      } else {
        setContentUploadQueue((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "error",
                  progress: 100,
                  error: result.error || "Failed to extract content.",
                }
              : item
          )
        );
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setContentUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "error",
                progress: 100,
                error: err.message || "Network error occurred.",
              }
            : item
        )
      );
    }
  };

  const updateQueueItemMetadata = (id: string, field: "title" | "system" | "category", value: string) => {
    setContentUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id && item.extractedData
          ? {
              ...item,
              extractedData: {
                ...item.extractedData,
                [field]: value,
              },
            }
          : item
      )
    );
  };

  const removeQueueItem = (id: string) => {
    setContentUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveAllDocuments = () => {
    const successItems = contentUploadQueue.filter((item) => item.status === "success" && item.extractedData);
    if (successItems.length === 0) {
      alert("No successfully extracted documents to import.");
      return;
    }

    let nextId = content.length > 0 ? Math.max(...content.map((c) => c.id)) + 1 : 1;
    const newContentItems: MedicalContent[] = [];

    successItems.forEach((item) => {
      const ext = item.extractedData!;
      const newItem: MedicalContent = {
        id: nextId++,
        name: ext.title || "Extracted Document",
        system: ext.system || "Endocrine",
        category: ext.category || "Clinical Reference",
        type: "Document",
        status: "published",
        lastUpdated: "Just now",
        author: "GP Edge Admin",
        references: ext.references && ext.references.length > 0 ? ext.references.length : 1,
        usedInQuestions: 0,
      };

      newContentItems.push(newItem);

      // Save HTML body to localStorage
      let contentHtml = "";
      if (ext.fullHtml) {
        contentHtml = ext.fullHtml;
      } else {
        contentHtml = `
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">1. Overview</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">${ext.notes || "[Enter Overview Here]"}</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">2. Pathophysiology</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Pathophysiology Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">3. Clinical Features</h2>
          <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
            ${(ext.symptoms || "[Enter Clinical Features Here]").split("\n").filter(Boolean).map(s => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${s}</li>`).join("")}
          </ul>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">4. Diagnosis & Investigations</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Diagnosis & Investigations Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5. Management</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Management Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5a. Non-Pharmacological Management</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Non-Pharmacological Management Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5b. Pharmacological Management</h2>
          <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
            ${(ext.treatment || "[Enter Pharmacological Management Here]").split("\n").filter(Boolean).map(t => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${t}</li>`).join("")}
          </ul>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">6. Complications</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Complications Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">7. When to Refer</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Referral Criteria Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">8. Prognosis</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Prognosis Here]</p>
          
          <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">9. Resources</h2>
          <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Resources Here]</p>
        `;
      }

      localStorage.setItem(`gpedge_content_body_${newItem.id}`, contentHtml.trim());
      localStorage.setItem(`gpedge_content_pages_${newItem.id}`, JSON.stringify([contentHtml.trim()]));

      if (ext.references && ext.references.length > 0) {
        const refObjects = ext.references.map((refText: string, index: number) => ({
          id: index + 1,
          text: refText,
          url: "#"
        }));
        localStorage.setItem(`gpedge_content_refs_${newItem.id}`, JSON.stringify(refObjects));
      } else {
        const defaultRefs = [
          {
            id: 1,
            text: `Clinical reference handbook - Resource 1`,
            url: "#"
          }
        ];
        localStorage.setItem(`gpedge_content_refs_${newItem.id}`, JSON.stringify(defaultRefs));
      }
    });

    const updated = [...newContentItems, ...content];
    setContent(updated);
    saveMedicalContent(updated);
    setShowAddModal(false);
    resetForm();
    alert(`Successfully imported ${newContentItems.length} documents!`);
  };

  // Lock body scroll when modal is open to prevent background scrolling lag
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal]);

  // Reset visibleCount when search query or filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [searchQuery, statusFilter, typeFilter, systemFilter]);

  // Submit and save content
  const handleSaveContent = (type: MedicalContent["type"]) => {
    if (!newTitle.trim()) {
      alert("Please fill in the title field.");
      return;
    }

    const extractedRefs = extractedData?.references || [];
    const referencesCount = extractedRefs.length;

    const newItem: MedicalContent = {
      id: content.length > 0 ? Math.max(...content.map(c => c.id)) + 1 : 1,
      name: newTitle,
      system: newSystem,
      category: newCategory.trim() || "Clinical Reference",
      type: type,
      status: "published",
      lastUpdated: "Just now",
      author: "GP Edge Admin",
      references: referencesCount > 0 ? referencesCount : (type === "Condition" ? 3 : 1),
      usedInQuestions: 0,
    };

    // Pre-populate HTML body if symptoms/treatment/notes exist to import into editor
    let contentHtml = "";
    if (extractedData && extractedData.fullHtml) {
      contentHtml = extractedData.fullHtml;
    } else {
      contentHtml = `
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">1. Overview</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">${notesInput || "[Enter Overview Here]"}</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">2. Pathophysiology</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Pathophysiology Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">3. Clinical Features</h2>
        <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
          ${(symptomsInput || "[Enter Clinical Features Here]").split("\n").filter(Boolean).map(item => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${item}</li>`).join("")}
        </ul>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">4. Diagnosis & Investigations</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Clinical diagnosis based on symptom presentation</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5. Management</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Management Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5a. Non-Pharmacological Management</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Non-Pharmacological Management Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5b. Pharmacological Management</h2>
        <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
          ${(treatmentInput || "[Enter Pharmacological Management Here]").split("\n").filter(Boolean).map(item => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${item}</li>`).join("")}
        </ul>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">6. Complications</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Complications Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">7. When to Refer</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Referral Criteria Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">8. Prognosis</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Prognosis Here]</p>
        
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">9. Resources</h2>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Resources Here]</p>
      `;
    }
    localStorage.setItem(`gpedge_content_body_${newItem.id}`, contentHtml.trim());
    localStorage.setItem(`gpedge_content_pages_${newItem.id}`, JSON.stringify([contentHtml.trim()]));

    if (extractedRefs.length > 0) {
      const refObjects = extractedRefs.map((refText: string, index: number) => ({
        id: index + 1,
        text: refText,
        url: "#"
      }));
      localStorage.setItem(`gpedge_content_refs_${newItem.id}`, JSON.stringify(refObjects));
    } else {
      const defaultCount = type === "Condition" ? 3 : 1;
      const defaultRefs = Array.from({ length: defaultCount }, (_, index) => ({
        id: index + 1,
        text: `Clinical reference handbook - Resource ${index + 1}`,
        url: "#"
      }));
      localStorage.setItem(`gpedge_content_refs_${newItem.id}`, JSON.stringify(defaultRefs));
    }

    const updated = [newItem, ...content];
    setContent(updated);
    saveMedicalContent(updated);
    setShowAddModal(false);
    resetForm();
  };

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      <AdminPageHeader
        title="Medical"
        highlightedText="Content"
        subtitle={`Clinical guidelines, protocols, and care pathways · ${content.length} items`}
        actions={
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-teal-800 text-sm font-semibold text-white rounded-xl hover:bg-teal-900 transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Lucide.Plus className="w-4 h-4" />
            Add Content
          </button>
        }
        variants={itemVariants}
      />

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Guidelines"
          percentage="+12%"
          data={content.filter((c) => c.type === "Guideline").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Guideline").length / content.length) * 100) : 0}
        />
        <AnalyticsCard
          title="Protocols / Conditions"
          percentage="+8%"
          data={content.filter((c) => c.type === "Protocol" || c.type === "Condition").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Protocol" || c.type === "Condition").length / content.length) * 100) : 0}
        />
        <AnalyticsCard
          title="Documents / PDFs"
          percentage="+15%"
          data={content.filter((c) => c.type === "Document" || c.type === "Pathway").length.toString()}
          progress={content.length > 0 ? Math.round((content.filter((c) => c.type === "Document" || c.type === "Pathway").length / content.length) * 100) : 0}
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative flex-1 max-w-sm">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700/60 transition-all dark:text-slate-200" />
        </div>
        <CustomSelect
          value={systemFilter}
          onChange={setSystemFilter}
          options={[
            { value: "all", label: "All Systems" },
            ...systems.map((s) => ({ value: s, label: s })),
          ]}
          className="w-48"
        />
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Types" },
            { value: "Condition", label: "Condition" },
            { value: "Guideline", label: "Guideline" },
            { value: "Protocol", label: "Protocol" },
            { value: "Pathway", label: "Pathway" },
            { value: "Document", label: "Document" },
            { value: "Note", label: "Note" },
          ]}
          className="w-48"
        />
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "published", label: "Published" },
            { value: "review", label: "Review" },
            { value: "draft", label: "Draft" },
          ]}
          className="w-48"
        />
      </motion.div>

      {/* Content cards grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayedContent.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-teal-200/70 dark:border-teal-900/40 shadow-md shadow-slate-200/30 overflow-hidden relative group hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-[inset_4px_0_0_0_#0f766e] transition-all duration-300 cursor-pointer"
            onClick={() => router.push(`/admin/content/${item.id}`)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/85 dark:from-slate-900/60 via-transparent to-slate-50/5 dark:to-teal-950/5 pointer-events-none" />
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[item.type]}`}>{item.type}</span>
                  <StatusBadge variant={item.status} />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.lastUpdated}</span>
              </div>
              <h3 className="font-serif text-base text-slate-900 dark:text-slate-100 mb-1 leading-tight group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">{item.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{item.system} · {item.category}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lucide.Link className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {item.references} refs
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <Link
                    href={`/admin/content/editor?id=${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50/65 dark:hover:bg-slate-950/25 transition-all"
                    title="Edit Content"
                  >
                    <Lucide.Edit className="w-4 h-4" />
                  </Link>
                  {item.status === "draft" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "review"); }} className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all" title="Send to Review">
                      <Lucide.ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === "review" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "published"); }} className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all" title="Publish">
                      <Lucide.Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }} className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all" title="Delete Content">
                    <Lucide.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {sortedContent.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 9)}
            className="px-6 py-3 text-sm font-semibold rounded-xl border border-teal-200/60 dark:border-teal-900/40 text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Lucide.ChevronDown className="w-4 h-4 animate-bounce shrink-0" />
            See More Content
          </button>
        </div>
      )}

      </motion.div>

      {/* Content Upload wizard Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div key="content-add-modal-container" className="fixed inset-0 z-[60] pointer-events-none">
            <motion.div
              key="content-add-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto cursor-pointer"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              key="content-add-modal-content"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32, mass: 0.8 }}
              className={`fixed inset-x-4 top-[8%] mx-auto w-full ${
                modalStep === "condition" ? "max-w-2xl" : "max-w-lg"
              } max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-y-auto flex flex-col pointer-events-auto`}
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#090d16] text-white">
                <div>
                  <h3 className="font-serif text-lg font-bold">Add Clinical Content</h3>
                  <p className="text-xs text-slate-400">Create new directory elements, PDFs, or summaries</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition">
                  <Lucide.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 flex-1">
                
                {/* STEP 1: Select Type */}
                {modalStep === "select" && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Choose how to add content</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Option 1: Upload PDF / Word */}
                      <button
                        onClick={() => { setModalStep("document"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all text-left flex items-start gap-4 group cursor-pointer"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FileUp className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">Upload PDF or Word Document</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload a clinical guideline, protocol, or reference document (PDF or DOCX).</p>
                        </div>
                      </button>

                      {/* Option 2: Create New Content */}
                      <button
                        onClick={() => { setModalStep("condition"); }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all text-left flex items-start gap-4 group cursor-pointer"
                      >
                        <span className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl group-hover:scale-105 transition">
                          <Lucide.FilePlus2 className="w-6 h-6 text-slate-600" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">Create New Content</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start with a blank document and write clinical content in the full editor.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2A: Create Condition */}
                {modalStep === "condition" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Condition Name</label>
                        <input type="text" placeholder="e.g. Chronic Kidney Disease" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Body System</label>
                        <CustomSelect
                          value={newSystem}
                          onChange={setNewSystem}
                          options={[
                            { value: "Endocrine", label: "Endocrine" },
                            { value: "Cardiology", label: "Cardiology" },
                            { value: "Respiratory", label: "Respiratory" },
                            { value: "Gastroenterology", label: "Gastrointestinal" },
                            { value: "Psychiatry", label: "Psychiatry" },
                            { value: "Dermatology", label: "Dermatology" },
                            { value: "Women's Health", label: "Women's Health" },
                            { value: "Paediatrics", label: "Paediatrics" }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Category / Area</label>
                      <input type="text" placeholder="e.g. Chronic Disease, Reference Care" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Overview / Notes</label>
                      <textarea rows={3} placeholder="Overview or introductory notes..." value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200 resize-y min-h-[80px]" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Symptoms (one per line)</label>
                      <textarea rows={3} placeholder="Polyuria&#10;Polydipsia" value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200 resize-y min-h-[80px]" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Treatment Options (one per line)</label>
                      <textarea rows={3} placeholder="First-line: Metformin&#10;Second-line: SGLT2i" value={treatmentInput} onChange={(e) => setTreatmentInput(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 text-xs dark:text-slate-200 resize-y min-h-[80px]" />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setModalStep("select")} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">Back</button>
                      <button onClick={() => handleSaveContent("Condition")} className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer border-none">Save Content</button>
                      <button
                        onClick={() => {
                          if (!newTitle.trim()) { alert("Please enter a title."); return; }                          const extractedRefs = extractedData?.references || [];
                          const referencesCount = extractedRefs.length;
                          const newItem: MedicalContent = {
                            id: content.length > 0 ? Math.max(...content.map(c => c.id)) + 1 : 1,
                            name: newTitle,
                            system: newSystem,
                            category: newCategory.trim() || "Clinical Reference",
                            type: "Guideline",
                            status: "draft",
                            lastUpdated: "Just now",
                            author: "GP Edge Admin",
                            references: referencesCount > 0 ? referencesCount : 0,
                            usedInQuestions: 0,
                          };

                          let contentHtml = "";
                          if (extractedData && extractedData.fullHtml) {
                            contentHtml = extractedData.fullHtml;
                          } else {
                            contentHtml = `
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">1. Overview</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">${notesInput || "[Enter Overview Here]"}</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">2. Pathophysiology</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Pathophysiology Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">3. Clinical Features</h2>
                              <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
                                ${(symptomsInput || "[Enter Clinical Features Here]").split("\n").filter(Boolean).map(item => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${item}</li>`).join("")}
                              </ul>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">4. Diagnosis & Investigations</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">Clinical diagnosis based on symptom presentation</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5. Management</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Management Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5a. Non-Pharmacological Management</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Non-Pharmacological Management Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">5b. Pharmacological Management</h2>
                              <ul style="list-style-type: disc; padding-left: 1.25rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">
                                ${(treatmentInput || "[Enter Pharmacological Management Here]").split("\n").filter(Boolean).map(item => `<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">${item}</li>`).join("")}
                              </ul>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">6. Complications</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Complications Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">7. When to Refer</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Referral Criteria Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">8. Prognosis</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Prognosis Here]</p>
                              
                              <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">9. Resources</h2>
                              <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">[Enter Resources Here]</p>
                            `;
                          }
                          localStorage.setItem(`gpedge_content_body_${newItem.id}`, contentHtml.trim());
                          localStorage.setItem(`gpedge_content_pages_${newItem.id}`, JSON.stringify([contentHtml.trim()]));
                          
                          if (extractedRefs.length > 0) {
                            const refObjects = extractedRefs.map((refText: string, index: number) => ({
                              id: index + 1,
                              text: refText,
                              url: "#"
                            }));
                            localStorage.setItem(`gpedge_content_refs_${newItem.id}`, JSON.stringify(refObjects));
                          }
                          
                          const updated = [newItem, ...content];
                          setContent(updated);
                          saveMedicalContent(updated);
                          router.push(`/admin/content/editor?id=${newItem.id}`);
                        }}
                        className="px-5 py-2 bg-teal-800 text-white rounded-xl text-xs font-semibold hover:bg-teal-900 shadow transition-all flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <Lucide.ArrowRight className="w-3.5 h-3.5" />
                        Open in Editor
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: Upload PDF Document */}
                {modalStep === "document" && (
                  <div className="space-y-4">
                    {/* Document Import Template download block */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-400">Download medical content import template:</span>
                      <a href="/templates/medical_content_template.docx" download className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-900 shadow transition flex items-center gap-1 shrink-0">
                        <Lucide.Download className="w-3 h-3" />
                        Download Template
                      </a>
                    </div>

                    {/* File Drag & Drop Zone */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-50/10 transition-all flex flex-col items-center justify-center"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".pdf,.docx" 
                        multiple={true}
                        className="hidden" 
                      />
                      <Lucide.Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop Guideline PDF or DOCX files here</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">or click to choose files from directory (Supports multiple files, Max 10MB each)</p>
                    </div>

                    {/* Interactive Queue */}
                    {contentUploadQueue.length > 0 && (
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Upload Queue ({contentUploadQueue.length} files)</p>
                        {contentUploadQueue.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-3 relative group">
                            {/* File Header */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold">{item.size}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.status === "uploading" && (
                                  <span className="text-[10px] font-bold text-teal-850 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lucide.Loader2 className="w-3 h-3 animate-spin" /> Uploading
                                  </span>
                                )}
                                {item.status === "success" && (
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                                    Extracted
                                  </span>
                                )}
                                {item.status === "error" && (
                                  <span className="text-[10px] font-bold text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                                    Error
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeQueueItem(item.id)}
                                  className="p-1 rounded-lg text-slate-455 hover:text-red-500 hover:bg-red-55 dark:hover:bg-red-950/20 transition-all border-none bg-transparent cursor-pointer"
                                >
                                  <Lucide.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Progress Bar (if active) */}
                            {item.status === "uploading" && (
                              <div className="space-y-1">
                                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                            )}

                            {/* Error Details */}
                            {item.status === "error" && (
                              <p className="text-[10px] font-semibold text-red-500">{item.error || "Failed to extract text from document."}</p>
                            )}

                            {/* Editable Fields (if parsed successfully) */}
                            {item.status === "success" && item.extractedData && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Title</label>
                                  <input
                                    type="text"
                                    value={item.extractedData.title || ""}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "title", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Body System</label>
                                  <select
                                    value={item.extractedData.system || "Endocrine"}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "system", e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                  >
                                    <option value="Respiratory">Respiratory</option>
                                    <option value="Endocrine">Endocrine</option>
                                    <option value="Psychiatry">Psychiatry</option>
                                    <option value="Dermatology">Dermatology</option>
                                    <option value="Women's Health">Women's Health</option>
                                    <option value="Paediatrics">Paediatrics</option>
                                    <option value="Cardiovascular">Cardiovascular</option>
                                    <option value="Gastroenterology">Gastroenterology</option>
                                    <option value="Musculoskeletal">Musculoskeletal</option>
                                    <option value="MBS">MBS</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Category</label>
                                  <input
                                    type="text"
                                    value={item.extractedData.category || ""}
                                    onChange={(e) => updateQueueItemMetadata(item.id, "category", e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-700"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        type="button"
                        onClick={() => setModalStep("select")} 
                        disabled={contentUploadQueue.some(item => item.status === "uploading")}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button 
                        type="button"
                        onClick={handleSaveAllDocuments} 
                        disabled={!contentUploadQueue.some(item => item.status === "success")}
                        className="px-4 py-2 bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow border-none cursor-pointer"
                      >
                        Import Documents ({contentUploadQueue.filter(item => item.status === "success").length})
                      </button>
                    </div>
                  </div>
                )}


              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

