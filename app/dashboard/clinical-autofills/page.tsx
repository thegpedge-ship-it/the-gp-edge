"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search,
  Clock,
  Bookmark,
  BookmarkCheck,
  X,
  Copy,
  Check,
  FileText,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
} from "lucide-react";
import { fetchAutofillTemplatesFromDbAction } from "@/actions/autofill.actions";
import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeModal from "@/components/UpgradeModal";

// ─── Template Data ───────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 1,
    title: "Mental Health Care Plan",
    category: "Mental Health",
    description: "Pre-written template suitable for Mental Health Treatment Plan consultations.",
    updated: "2 weeks ago",
    content: `MENTAL HEALTH TREATMENT PLAN

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

PRESENTING ISSUE:
- [Describe main psychological symptoms]
- Duration: [Duration]
- Impact on daily functioning: [Impact]

HISTORY:
- Past mental health history: [History]
- Current medications: [Medications]
- Social history: [Social details]

RISK ASSESSMENT:
- Harm to self: [Low/Medium/High]
- Harm to others: [Low/Medium/High]

MANAGEMENT PLAN:
1. Referral to Psychology for focused psychological strategies.
2. Review in 4 weeks.
3. Patient provided with crisis contact numbers (Lifeline 13 11 14).`,
  },
  {
    id: 2,
    title: "DIABETES ANNUAL CYCLE OF CARE",
    category: "Chronic Disease",
    description: "Structured template for diabetes review and ongoing management.",
    updated: "4 days ago",
    content: `DIABETES ANNUAL CYCLE OF CARE

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

CURRENT STATUS:
- Latest HbA1c: [Value] %
- Fasting Lipids: Chol [Value], Trig [Value], HDL [Value], LDL [Value]
- eGFR: [Value]
- Urine ACR: [Value]

EXAMINATIONS:
- Blood Pressure: [Value] mmHg
- BMI: [Value] kg/m2
- Foot Exam: Intact sensation, pulses present. No ulcers.
- Eye Check: Optometrist review completed on [Date].

MANAGEMENT PLAN:
1. Continue current medications: [Medications]
2. Dietary advice provided.
3. Encourage 150 mins moderate exercise per week.
4. Next review in 6 months.`,
  },
  {
    id: 3,
    title: "Asthma Management Plan",
    category: "Respiratory",
    description: "Comprehensive asthma management plan for routine consultations.",
    updated: "yesterday",
    content: `ASTHMA ACTION PLAN

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

CURRENT CONTROL:
- Daytime symptoms: [Frequency]
- Night-time waking: [Frequency]
- Reliever use: [Frequency]
- Impact on activity: [None/Mild/Moderate/Severe]

MEDICATIONS:
- Preventer: [Medication and dose]
- Reliever: [Medication and dose]

ACTION PLAN:
* When well: Continue preventer as prescribed.
* When symptoms flare up: Take [Number] puffs of reliever every [Number] hours.
* If severe (difficulty speaking, breathless at rest): Call 000 immediately.

FOLLOW UP:
- Review in [Number] months or earlier if unwell.`,
  },
  {
    id: 4,
    title: "Skin Cancer Follow-Up",
    category: "Dermatology",
    description: "Follow-up template for skin cancer excision and results.",
    updated: "1 week ago",
    content: `SKIN EXCISION RESULTS & FOLLOW-UP

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

PROCEDURE DETAILS:
- Excision site: [Site]
- Date of excision: [Date]

HISTOPATHOLOGY RESULTS:
- Diagnosis: [BCC / SCC / Melanoma / Benign]
- Margins: [Clear / Involved]
- Subtype/Breslow thickness: [Details if applicable]

WOUND CHECK:
- Wound healing well. No signs of infection.
- Sutures removed today.

PLAN:
1. Results discussed with patient.
2. Advised on strict sun protection.
3. Next full skin check scheduled in [Number] months.`,
  },
  {
    id: 5,
    title: "Chronic Disease Management Plan",
    category: "General Practice",
    description: "Long term condition management plan for GP consultations.",
    updated: "5 days ago",
    content: `GP MANAGEMENT PLAN (ITEM 721)

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

PRIMARY DIAGNOSES:
1. [Diagnosis 1]
2. [Diagnosis 2]

PATIENT GOALS:
- [Goal 1]
- [Goal 2]

MEDICAL MANAGEMENT:
- Optimise symptom control.
- Ensure compliance with current medication regimen.
- Monitor for complications.

ALLIED HEALTH TEAM (TCA Item 723):
- Physiotherapy: 2 sessions
- Podiatry: 2 sessions
- Dietitian: 1 session

REVIEW:
- Plan to be reviewed in 6 months (Item 732).`,
  },
  {
    id: 6,
    title: "Women's Health Assessment",
    category: "Women's Health",
    description: "Comprehensive women's health assessment template.",
    updated: "3 weeks ago",
    content: `WOMEN'S HEALTH CHECK

Patient Name: [Patient Name]
DOB: [DOB]
Date: [Date]

CERVICAL SCREENING:
- Last CST: [Date]
- Result: [Result]
- Next due: [Date]

CONTRACEPTION / MENSTRUAL HISTORY:
- Current contraception: [Type]
- LMP: [Date]
- Cycle: [Regular/Irregular, Heavy/Light]

BREAST CHECK:
- Self-examination discussed.
- Mammogram: [Date of last mammogram, if applicable]

OTHER:
- STI screening offered/declined.
- Pre-conception advice provided (if applicable).
- Menopause symptom management (if applicable).

PLAN:
- Routine screening up to date.
- Review PRN.`,
  },
  {
    id: 7,
    title: "Wound Review",
    category: "Wound Management",
    description: "Structured wound review including wound assessment, healing phase, dressing management, and follow-up planning.",
    updated: "just now",
    content: `F2F
^presents with ^
^New to me, presents for wound review
^Planned present for ^

Subjective
 - Progress: ^Improving / Stalled / Deteriorating
 - Pain: ^Score /10, ^Constant / During dressing changes only
 - Interim events: <Fevers / Systemic symptoms / Antibiotics completed?>

Objective — Wound Assessment
 - Location: ^Site
 - Dimensions: (Length) x (Width) x (Depth) in mm
 - Tissue Type (TIME):
   T (Tissue): ^% Granulation / % Slough / % Eschar / % Epithelial
   I (Infection): ^No/Signs of clinical infection? Odour / Heat / Swelling / Erythema
   M (Moisture): ^Exudate: Low / Med / High. Serous / Haemoserous / Purulent.
   E (Edge): ^Advancing / Stalled / Rolled / Macerated
 - Periwound: ^Healthy / Eczematous / Cellulitic / Macerated

Clinical Photography:
Consent obtained. Image uploaded to gallery/record.

Assessment
 - Diagnosis: ^E.g., Venous ulcer / Dehisced surgical wound
 - Healing Phase: ^Inflammatory / Proliferative / Maturation

Plan
 - Primary Dressing: <E.g., Inadine / Aquacel Ag / Hydrogel / Foam>
 - Secondary Dressing: <E.g., Zetuvit / Hypafix / Compression bandage>
 - Frequency: <Review in __ days / PRN if strike-through>
 - Referral: <Wound clinic / Vascular / Not required>`,
  },
  {
    id: 8,
    title: "Male Fertility Issues",
    category: "Men's Health",
    description: "Structured template for investigation of male sub-fertility, including history, examination, and management plan.",
    updated: "just now",
    content: `F2F — Male Fertility Consultation

Patient and partner presenting for investigation of sub-fertility.

SUBJECTIVE
Duration: Trying to conceive for ^ months/years.

Partner's Details:
 - Partner's age: ^yrs
 - Known female factor issues: Yes / No
 - Partner's previous conceptions: Yes / No

Sexual History:
 - Frequency of intercourse: ^ times per week/month.
 - Difficulties: Erectile dysfunction / ejaculatory issues / dyspareunia.
 - Libido: Normal / Decreased / Increased.

PLAN
Investigations:
 - Semen Analysis: Request 2x (6-12 weeks apart).
   Instructions: 2-7 days abstinence, deliver to lab within 1 hour.
 - Hormonal Profile (if SA abnormal): FSH, LH, Testosterone, Prolactin, SHBG.

Follow-up & Referral:
 - Follow up to review Semen Analysis results.
 - Consider referral to Fertility Specialist / Urologist if:
   - Abnormal Semen Analysis.
   - Azoospermia or severe oligozoospermia.
   - Female partner factors also present.`,
  },
];

const RECENT_TEMPLATES = [
  { id: 1, title: "Mental Health Care Plan", time: "2h ago" },
  { id: 2, title: "DIABETES ANNUAL CYCLE OF CARE", time: "Yesterday" },
  { id: 3, title: "Asthma Management Plan", time: "2 days" },
  { id: 7, title: "Wound Review", time: "4 days" },
];

const DEFAULT_SAVED = [
  "Chronic Disease Management Plan",
  "Women's Health Assessment",
  "Mental Health Care Plan",
];

// Carousel suggestions for the search bar
const CONDITION_SUGGESTIONS = [
  "Mental Health Care Plan",
  "DIABETES ANNUAL CYCLE OF CARE",
  "Asthma Management Plan",
  "Skin Cancer Follow-Up",
  "Chronic Disease Management Plan",
];

const APPROACH_SUGGESTIONS = [
  "Care Plan",
  "Management Plan",
  "Assessment",
  "Review",
  "Follow Up",
];

// ─── Vertical Carousel Component ────────────────────────────────────────────

function SearchCarousel({ mode }: { mode: "condition" | "approach" }) {
  const [idx, setIdx] = useState(0);
  // phase: "idle" | "exit" | "enter"
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const suggestions = mode === "condition" ? CONDITION_SUGGESTIONS : APPROACH_SUGGESTIONS;
  const prefix = mode === "condition" ? "Search by medical condition" : "Search by approach";

  useEffect(() => {
    setIdx(0);
  }, [mode]);

  useEffect(() => {
    const idleTimer = setTimeout(() => {
      // Begin exit animation
      setPhase("exit");

      const exitTimer = setTimeout(() => {
        // Swap text while invisible
        setIdx(i => (i + 1) % suggestions.length);
        setPhase("enter");

        const enterTimer = setTimeout(() => {
          setPhase("idle");
        }, 350); // settle duration

        return () => clearTimeout(enterTimer);
      }, 350); // exit duration

      return () => clearTimeout(exitTimer);
    }, 3000); // visible pause

    return () => clearTimeout(idleTimer);
  }, [idx, suggestions.length]);

  const style: React.CSSProperties = {
    display: "inline-block",
    transition: "transform 350ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease",
    transform:
      phase === "exit"
        ? "translateY(-14px)"
        : phase === "enter"
          ? "translateY(14px)"
          : "translateY(0)",
    opacity: phase === "idle" ? 1 : 0,
    willChange: "transform, opacity",
  };

  return (
    <span className="flex items-center gap-0 text-slate-400 text-base pointer-events-none select-none">
      <span className="text-slate-400">{prefix}... &nbsp;</span>
      {/* overflow-hidden clips the sliding text so it doesn't bleed outside the bar */}
      <span className="overflow-hidden" style={{ height: "1.5em", display: "inline-flex", alignItems: "center" }}>
        <span style={style}>{suggestions[idx]}</span>
      </span>
    </span>
  );
}

// ─── Feature Discovery Tooltip ──────────────────────────────────────────────
// Stateless — parent controls visibility. No internal fade state needed.

function BookmarkTooltip({ onDismiss, show }: { onDismiss: () => void; show: boolean }) {
  return (
    <div
      className="pointer-events-auto"
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        // Animate based on parent-controlled `show` prop
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 380ms ease, transform 380ms ease",
        // z-[100] ensures it breaks out of any overflow context
        zIndex: 100,
        pointerEvents: show ? "auto" : "none",
      }}
    >
      {/* Arrow nub pointing upward to the button */}
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
      {/* Tooltip card */}
      <div className="bg-slate-800 text-white rounded-xl px-3.5 py-2.5 shadow-2xl flex items-start gap-2.5 max-w-[220px]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-teal-400 mb-0.5 uppercase tracking-wide">New Feature</p>
          <p className="text-[12px] leading-snug text-slate-200">
            Tip: Access your saved templates here.
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ClinicalAutofillsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<"condition" | "approach">("condition");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<string[]>(DEFAULT_SAVED);
  const [visibleCount, setVisibleCount] = useState(6);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { resolvedTheme } = useTheme();

  // Tooltip — shows on every page mount, 1 second after load
  const [showTooltip, setShowTooltip] = useState(false);

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

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const { hasPaidAccess } = useUserAccess();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTemplateTitle, setUpgradeTemplateTitle] = useState<string | undefined>();

  // Refs
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click-outside closes suggestion dropdown and mode dropdown
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowModeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Body scroll lock when drawer open
  useEffect(() => {
    document.body.style.overflow = selectedTemplate ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedTemplate]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Quick Copy (outside modal)
  const handleQuickCopy = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Modal Copy
  const handleModalCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2000);
  }, []);

  // Bookmark toggle
  const toggleSaved = useCallback((title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedTemplates(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [title, ...prev]
    );
  }, []);

  const [dbTemplates, setDbTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchAutofillTemplatesFromDbAction().then((dbList) => {
      if (dbList && dbList.length > 0) {
        const mapped = dbList.map((t) => ({
          id: t.id,
          dbId: (t as any).dbId,
          title: t.name,
          category: t.category,
          description: t.description,
          updated: t.lastUsed || "Recently",
          isFree: (t as any).isFree ?? (t as any).is_free ?? false,
          content: [
            t.subjective ? `SUBJECTIVE:\n${t.subjective}` : "",
            t.objective ? `OBJECTIVE:\n${t.objective}` : "",
            t.assessment ? `ASSESSMENT:\n${t.assessment}` : "",
            t.plan ? `PLAN:\n${t.plan}` : "",
            t.doctorSummary ? `DOCTOR SUMMARY:\n${t.doctorSummary}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        }));
        setDbTemplates(mapped);
      }
    });
  }, []);

  const activeTemplates = dbTemplates.length > 0 ? dbTemplates : TEMPLATES;

  // Suggestion list (dropdown)
  const suggestions = searchQuery.trim().length > 0
    ? activeTemplates.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    : activeTemplates.slice(0, 5);

  // Main grid filter (free items sorted first)
  const filteredTemplates = activeTemplates
    .filter(t => {
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBookmarks = !showBookmarks || savedTemplates.includes(t.title);
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesBookmarks && matchesCategory;
    })
    .sort((a, b) => {
      const aFree = a.isFree === true ? 1 : 0;
      const bFree = b.isFree === true ? 1 : 0;
      if (bFree !== aFree) return bFree - aFree;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="w-full pb-24 pt-2" style={{ fontFamily: "inherit" }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="space-y-2 select-none mb-6">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          Clinical Autofills
        </h1>
      </div>

      {/* ── SMART COMMAND BAR ────────────────────────────────────────────────── */}
      <div ref={wrapperRef} className="relative w-full max-w-4xl mx-auto mb-8">
        <div
          className={`w-full bg-white dark:bg-[#151922] border transition-all duration-200 rounded-2xl shadow-sm flex items-center px-4 py-3 ${
            showSuggestions
              ? "border-teal-500 ring-2 ring-teal-500/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search templates, conditions, or categories..."
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm md:text-base p-0 m-0"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                searchRef.current?.focus();
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                {searchQuery ? "Matching Templates" : "Suggested Templates"}
              </p>
            </div>
            {suggestions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-500">No templates found.</div>
            ) : (
              <ul className="pb-2">
                {suggestions.map(t => (
                  <li key={t.id}>
                    <button
                      onMouseDown={e => {
                        e.preventDefault();
                        setSelectedTemplate(t);
                        setShowSuggestions(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                          {t.title}
                        </p>
                        <p className="text-xs text-slate-400">{t.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── QUICK ACCESS ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Quick Access
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {RECENT_TEMPLATES.map(rt => {
            const tmpl = TEMPLATES.find(t => t.id === rt.id);
            return (
              <button
                key={rt.id}
                onClick={() => tmpl && setSelectedTemplate(tmpl)}
                className="
                  h-[58px] flex items-center gap-2.5 px-3.5
                  bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                  border-l-2 border-l-transparent
                  hover:border-l-teal-500 dark:hover:border-l-teal-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/70
                  rounded-xl cursor-pointer transition-all duration-150 text-left group
                "
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 group-hover:text-teal-500 transition-colors" />
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-tight">
                    {rt.title}
                  </p>
                  <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rt.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SORT TEMPLATES BY CATEGORIES ─────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Sort Templates by Categories
        </p>
        <div className="flex overflow-x-auto pb-2 -mb-2 scrollbar-hide lg:flex-wrap gap-2.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 border shadow-sm ${selectedCategory === cat
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-teal-900/30"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID HEADER + BOOKMARKS TOGGLE ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {showBookmarks ? "Saved Templates" : "All Templates"}
          {searchQuery && (
            <span className="ml-2 bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredTemplates.length} result{filteredTemplates.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          {/* Bookmarks button — tooltip anchored here */}
          <div className="relative">
            <button
              id="bookmarks-btn"
              onClick={() => {
                setShowBookmarks(v => !v);
                dismissTooltip();
              }}
              className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 ${showBookmarks
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600"
                }`}
            >
              {showBookmarks
                ? <BookmarkCheck className="w-3.5 h-3.5" />
                : <Bookmark className="w-3.5 h-3.5" />
              }
              Saved Templates
            </button>

            {/* Feature discovery tooltip — always rendered, show prop drives visibility */}
            <BookmarkTooltip onDismiss={dismissTooltip} show={showTooltip} />
          </div>
        </div>
      </div>

      {/* ── TEMPLATE GRID ─────────────────────────────────────────────────────── */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            {showBookmarks
              ? <Bookmark className="w-7 h-7 text-slate-300" />
              : <Search className="w-7 h-7 text-slate-300" />
            }
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {showBookmarks ? "No bookmarks yet" : "No templates found"}
          </h3>
          <p className="text-slate-500 text-sm mb-5">
            {showBookmarks
              ? "Bookmark templates from the grid to save them here."
              : "Try a different keyword or category."
            }
          </p>
          <button
            onClick={() => { setSearchQuery(""); setShowBookmarks(false); }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-colors shadow-sm"
          >
            {showBookmarks ? "Browse All Templates" : "Clear Search"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.slice(0, visibleCount).map(t => {
              const isBookmarked = savedTemplates.includes(t.title);
              const isFree = t.isFree === true;
              const isLocked = !isFree && !hasPaidAccess;

              return (
                <div
                  key={t.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-shadow relative group cursor-pointer flex flex-col ${
                    isLocked ? "border-slate-200/70 dark:border-slate-800/70" : "border-slate-200 dark:border-slate-800"
                  }`}
                  onClick={() => {
                    if (isLocked) {
                      setUpgradeTemplateTitle(t.title);
                      setUpgradeModalOpen(true);
                    } else {
                      setSelectedTemplate(t);
                    }
                  }}
                >
                  {/* Locked Banner Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-slate-900/75 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                      <button className="group relative flex flex-row items-center bg-[#151922] justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-[inset_0_-8px_10px_#0d94881f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#0d94883f] cursor-pointer">
                        <div className="absolute inset-0 block h-full w-full animate-gradient-x bg-gradient-to-r from-amber-500/50 via-teal-400/50 to-amber-500/50 bg-[length:200%_auto] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] p-[1px] ![mask-composite:subtract]" />
                        <svg className="size-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 15 15" height={15} width={15}>
                          <path clipRule="evenodd" fillRule="evenodd" fill="currentColor" d="M5 4.63601C5 3.76031 5.24219 3.1054 5.64323 2.67357C6.03934 2.24705 6.64582 1.9783 7.5014 1.9783C8.35745 1.9783 8.96306 2.24652 9.35823 2.67208C9.75838 3.10299 10 3.75708 10 4.63325V5.99999H5V4.63601ZM4 5.99999V4.63601C4 3.58148 4.29339 2.65754 4.91049 1.99307C5.53252 1.32329 6.42675 0.978302 7.5014 0.978302C8.57583 0.978302 9.46952 1.32233 10.091 1.99162C10.7076 2.65557 11 3.57896 11 4.63325V5.99999H12C12.5523 5.99999 13 6.44771 13 6.99999V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V6.99999C2 6.44771 2.44772 5.99999 3 5.99999H4ZM3 6.99999H12V13H3V6.99999Z" />
                        </svg>
                        <div className="shrink-0 bg-slate-700 w-[1px] h-4" role="none" data-orientation="vertical" />
                        <span className="inline animate-gradient-x whitespace-pre bg-gradient-to-r from-amber-400 via-teal-300 to-amber-400 bg-[length:200%_auto] bg-clip-text text-transparent text-center font-semibold">Get Access</span>
                        <svg strokeLinecap="round" className="text-teal-400" strokeWidth="1.5" aria-hidden="true" viewBox="0 0 10 10" height={11} width={11} stroke="currentColor" fill="none">
                          <path strokeLinecap="round" d="M0 5h7" className="opacity-0 transition group-hover:opacity-100" />
                          <path strokeLinecap="round" d="M1 1l4 4-4 4" className="transition group-hover:translate-x-[3px]" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Bookmark icon — top-right, visible ONLY for unlocked cards */}
                  {!isLocked && (
                    <label
                      className="absolute top-4 right-4 z-10 custom-bookmark cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isBookmarked}
                        onChange={() => toggleSaved(t.title)}
                      />
                      <div className="bookmark-icon-wrapper">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 bookmark-svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                        </svg>
                      </div>
                    </label>
                  )}

                  {/* Title */}
                  <div className="pr-8 mb-2">
                    <h3 className="font-sans text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                      {t.title}
                    </h3>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                      {t.category}
                    </span>
                  </div>

                  {/* Description — 2-line clamp */}
                  <p className="font-sans text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400 flex-1 mb-4 line-clamp-2">
                    {t.description}
                  </p>

                  {/* Footer row */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto flex items-center justify-between">
                    <p className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Updated in 2026</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); handleQuickCopy(t.id, t.content); }}
                        className={`quick-copy-btn flex items-center justify-center gap-1.5 ${copiedId === t.id ? "is-copied" : ""}`}
                      >
                        <span data-text-end="Copied!" data-text-initial="Copy to clipboard" className="qc-tooltip" />
                        <span className="flex items-center gap-1.5 relative">
                          <svg xmlSpace="preserve" viewBox="0 0 6.35 6.35" y={0} x={0} xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" className="qc-clipboard w-3.5 h-3.5">
                            <g>
                              <path fill="currentColor" d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z" />
                            </g>
                          </svg>
                          <svg xmlSpace="preserve" viewBox="0 0 24 24" y={0} x={0} xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" className="qc-checkmark w-3.5 h-3.5">
                            <g>
                              <path data-original="#000000" fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
                            </g>
                          </svg>
                          <span className="text-[12px] font-semibold tracking-wide">Quick Copy</span>
                        </span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedTemplate(t); }}
                        className="text-[12px] font-bold bg-teal-600 hover:bg-teal-700 text-white py-1 px-3 rounded-xl transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filteredTemplates.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount(v => v + 6)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Load more templates
              </button>
            </div>
          )}
        </>
      )}

      {/* ── SLIDE-OVER DRAWER ────────────────────────────────────────────────── */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Glassmorphism backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTemplate(null)}
          />

          {/*
            ┌─────────────────────────────────────────┐
            │  Drawer shell: flex-col, h-screen       │
            │  overflow-hidden on the shell itself    │
            │  (never let children expand it)         │
            ├─────────────────────────────────────────┤
            │ ① FIXED HEADER     flex-shrink-0        │
            ├─────────────────────────────────────────┤
            │ ② INSTRUCTION BANNER  flex-shrink-0     │
            ├─────────────────────────────────────────┤
            │ ③ SCROLLABLE CONTENT  flex-1 min-h-0    │
            │   overflow-y-auto                       │
            ├─────────────────────────────────────────┤
            │ ④ PINNED FOOTER    flex-shrink-0        │
            └─────────────────────────────────────────┘
          */}
          <div
            className="relative ml-auto w-full max-w-2xl h-screen flex flex-col bg-white shadow-2xl overflow-hidden"
            style={{ animation: "slideInRight 210ms cubic-bezier(0.22,1,0.36,1) both" }}
          >

            {/* ① FIXED HEADER — never scrolls */}
            <div className="flex-shrink-0 px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                      {selectedTemplate.category}
                    </span>
                    <span className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-400">
                      Updated in 2026
                    </span>
                  </div>
                  <h2 className="font-sans text-lg md:text-xl font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {selectedTemplate.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-shrink-0 w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ② INSTRUCTION BANNER — never scrolls, solid bg blocks text bleed */}
            <div className="flex-shrink-0 px-7 pt-4 pb-3 bg-white dark:bg-slate-900 z-10">
              <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl px-4 py-3">
                <p className="font-sans text-sm font-normal leading-relaxed text-teal-850 dark:text-teal-400">
                  Copy the text below and paste directly into{" "}
                  <span className="font-bold">Best Practice</span>.{" "}
                  Formatting will be preserved.
                </p>
              </div>
            </div>

            {/* ③ SCROLLABLE CONTENT — min-h-0 is essential to confine it */}
            <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-2 pt-3 bg-white dark:bg-slate-900 custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-inner">
                <pre className="font-mono text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                  {selectedTemplate.content}
                </pre>
              </div>
            </div>

            {/* ④ PINNED COPY FOOTER — never scrolls */}
            <div className="flex-shrink-0 px-7 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => handleModalCopy(selectedTemplate.content)}
                className={`btn-modal-copy ${modalCopied ? 'is-copied' : ''}`}
              >
                <span>
                  <svg width={12} height={12} fill="currentColor" className="w-3.5 h-3.5 inline mr-1" xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 467 512.22">
                    <path fillRule="nonzero" d="M131.07 372.11c.37 1 .57 2.08.57 3.2 0 1.13-.2 2.21-.57 3.21v75.91c0 10.74 4.41 20.53 11.5 27.62s16.87 11.49 27.62 11.49h239.02c10.75 0 20.53-4.4 27.62-11.49s11.49-16.88 11.49-27.62V152.42c0-10.55-4.21-20.15-11.02-27.18l-.47-.43c-7.09-7.09-16.87-11.5-27.62-11.5H170.19c-10.75 0-20.53 4.41-27.62 11.5s-11.5 16.87-11.5 27.61v219.69zm-18.67 12.54H57.23c-15.82 0-30.1-6.58-40.45-17.11C6.41 356.97 0 342.4 0 326.52V57.79c0-15.86 6.5-30.3 16.97-40.78l.04-.04C27.51 6.49 41.94 0 57.79 0h243.63c15.87 0 30.3 6.51 40.77 16.98l.03.03c10.48 10.48 16.99 24.93 16.99 40.78v36.85h50c15.9 0 30.36 6.5 40.82 16.96l.54.58c10.15 10.44 16.43 24.66 16.43 40.24v302.01c0 15.9-6.5 30.36-16.96 40.82-10.47 10.47-24.93 16.97-40.83 16.97H170.19c-15.9 0-30.35-6.5-40.82-16.97-10.47-10.46-16.97-24.92-16.97-40.82v-69.78zM340.54 94.64V57.79c0-10.74-4.41-20.53-11.5-27.63-7.09-7.08-16.86-11.48-27.62-11.48H57.79c-10.78 0-20.56 4.38-27.62 11.45l-.04.04c-7.06 7.06-11.45 16.84-11.45 27.62v268.73c0 10.86 4.34 20.79 11.38 27.97 6.95 7.07 16.54 11.49 27.17 11.49h55.17V152.42c0-15.9 6.5-30.35 16.97-40.82 10.47-10.47 24.92-16.96 40.82-16.96h170.35z" />
                  </svg>
                  Copy
                </span>
                <span>Copied</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL QUICK-COPY TOAST ──────────────────────────────────────────── */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl transition-all duration-300 ${isCopied
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-6 opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
        <div>
          <p className="text-[14px] font-bold">Copied to clipboard</p>
          <p className="text-[12px] text-slate-400">Paste directly into Best Practice</p>
        </div>
      </div>

      {/* ── GLOBAL CSS ───────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* SCROLLBAR STYLES */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b;
        }

        /* QUICK COPY BUTTON STYLES */
        .quick-copy-btn {
          --button-bg: transparent;
          --button-hover-bg: #f1f5f9;
          --button-text-color: #64748b;
          --button-hover-text-color: #0d9488;
          --button-border-radius: 8px;
          --button-outline-width: 1px;
          --button-outline-color: #cbd5e1;
          --tooltip-bg: #1e293b;
          --toolptip-border-radius: 6px;
          --tooltip-font-family: inherit;
          --tooltip-font-size: 11px;
          --tootip-text-color: #ffffff;
          --tooltip-padding-x: 8px;
          --tooltip-padding-y: 6px;
          --tooltip-offset: 10px;
          --tooltip-transition-duration: 0.2s;
          box-sizing: border-box;
          padding: 6px 10px;
          border-radius: var(--button-border-radius);
          background-color: var(--button-bg);
          color: var(--button-text-color);
          border: none;
          cursor: pointer;
          position: relative;
          outline: none;
          transition: all 0.2s ease;
        }
        .dark .quick-copy-btn {
          --button-hover-bg: rgba(20,184,166,0.1);
          --button-text-color: #94a3b8;
          --button-hover-text-color: #58c1ae;
          --tooltip-bg: #0f172a;
          --tootip-text-color: #e2e8f0;
        }
        .qc-tooltip {
          position: absolute;
          opacity: 0;
          visibility: hidden;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font: var(--tooltip-font-size) var(--tooltip-font-family);
          color: var(--tootip-text-color);
          background: var(--tooltip-bg);
          padding: var(--tooltip-padding-y) var(--tooltip-padding-x);
          border-radius: var(--toolptip-border-radius);
          pointer-events: none;
          transition: all var(--tooltip-transition-duration) cubic-bezier(0.68, -0.55, 0.265, 1.55);
          z-index: 50;
        }
        .qc-tooltip::before {
          content: attr(data-text-initial);
        }
        .qc-tooltip::after {
          content: "";
          position: absolute;
          bottom: calc(var(--tooltip-padding-y) / 2 * -1);
          width: var(--tooltip-padding-y);
          height: var(--tooltip-padding-y);
          background: inherit;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          z-index: -999;
          pointer-events: none;
        }
        .qc-checkmark {
          display: none;
        }
        .quick-copy-btn:hover .qc-tooltip,
        .quick-copy-btn.is-copied .qc-tooltip {
          opacity: 1;
          visibility: visible;
          top: calc((100% + var(--tooltip-offset)) * -1);
        }
        .quick-copy-btn.is-copied .qc-tooltip::before {
          content: attr(data-text-end);
        }
        .quick-copy-btn.is-copied .qc-clipboard {
          display: none;
        }
        .quick-copy-btn.is-copied .qc-checkmark {
          display: block;
        }
        .quick-copy-btn:hover,
        .quick-copy-btn:focus {
          background-color: var(--button-hover-bg);
          color: var(--button-hover-text-color);
        }
        .quick-copy-btn:active {
          outline: var(--button-outline-width) solid var(--button-outline-color);
        }

        /* MODAL COPY BUTTON STYLES */
        .btn-modal-copy {
          position: relative;
          background-color: #f0fdfa;
          width: 100px;
          height: 30px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition-duration: 700ms;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .dark .btn-modal-copy {
          background-color: rgba(20, 184, 166, 0.1);
        }
        .btn-modal-copy span {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition-duration: 400ms;
        }
        .btn-modal-copy span:first-child {
          color: #0d9488;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        }
        .dark .btn-modal-copy span:first-child {
          color: #2dd4bf;
        }
        .btn-modal-copy span:last-child {
          position: absolute;
          top: 50%;
          left: 50%;
          color: #99f6e4;
          font-weight: 700;
          opacity: 0;
          transform: translateY(100%) translateX(-50%);
          height: 14px;
          line-height: 13px;
        }
        .dark .btn-modal-copy span:last-child {
          color: #ccfbf1;
        }
        .btn-modal-copy.is-copied {
          background-color: #0d9488;
          width: 120px;
          height: 40px;
          transition-delay: 100ms;
          transition-duration: 500ms;
        }
        .dark .btn-modal-copy.is-copied {
          background-color: #0d9488;
        }
        .btn-modal-copy.is-copied span:first-child {
          transform: translateX(-50%) translateY(-150%);
          opacity: 0;
          transition-duration: 500ms;
        }
        .btn-modal-copy.is-copied span:last-child {
          transform: translateX(-50%) translateY(-50%);
          opacity: 1;
          color: #ffffff;
          transition-delay: 300ms;
          transition-duration: 500ms;
        }
        .dark .btn-modal-copy.is-copied span:last-child {
          color: #ffffff;
        }
        .btn-modal-copy.is-copied:not(:active) {
          transition-duration: 900ms;
        }

        /* CUSTOM BOOKMARK BUTTON STYLES */
        .custom-bookmark {
          --icon-color: #94a3b8; /* Soft Slate Gray */
          --icon-hover: #64748b; 
          --icon-active: #0d9488; /* Matches "View" button */
        }
        .dark .custom-bookmark {
          --icon-color: #64748b; /* Muted Gray */
          --icon-hover: #94a3b8;
        }
        .custom-bookmark input {
          display: none;
        }
        
        .bookmark-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--icon-color);
          transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.2s ease;
        }
        .bookmark-svg {
          fill: transparent;
          transition: fill 0.25s ease, transform 0.25s cubic-bezier(0.2, 0, 0, 1);
        }

        .custom-bookmark:hover .bookmark-icon-wrapper {
          transform: scale(1.08);
          color: var(--icon-hover);
        }

        /* Sparkles effect */
        .bookmark-icon-wrapper::after {
          content: "";
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 
            0 30px 0 -4px var(--icon-active),
            30px 0 0 -4px var(--icon-active),
            0 -30px 0 -4px var(--icon-active),
            -30px 0 0 -4px var(--icon-active),
            -22px 22px 0 -4px var(--icon-active),
            -22px -22px 0 -4px var(--icon-active),
            22px -22px 0 -4px var(--icon-active),
            22px 22px 0 -4px var(--icon-active);
          transform: scale(0);
          z-index: -1;
        }

        /* Checked states */
        .custom-bookmark input:checked + .bookmark-icon-wrapper {
          color: var(--icon-active);
        }
        .custom-bookmark input:checked + .bookmark-icon-wrapper .bookmark-svg {
          fill: var(--icon-active);
          animation: bookmark-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transition-delay: 0.2s; /* Add a slight delay for the fill so the sparkle starts */
        }
        .custom-bookmark input:checked + .bookmark-icon-wrapper::after {
          animation: circles 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.1s;
        }

        @keyframes bookmark-pop {
          0% { transform: scale(1); }
          40% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }

        @keyframes circles {
          from {
            transform: scale(0);
          }
          40% {
            opacity: 1;
          }
          to {
            transform: scale(0.8);
            opacity: 0;
          }
        }
      `}</style>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={upgradeTemplateTitle}
        requiredTier="paid"
      />
    </div>
  );
}
