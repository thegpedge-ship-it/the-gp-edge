"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";

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
const SEARCH_SUGGESTIONS = [
  "Mental Health Care Plan",
  "DIABETES ANNUAL CYCLE OF CARE",
  "Asthma Management Plan",
  "Skin Cancer Follow-Up",
  "Chronic Disease Management Plan",
];

// ─── Vertical Carousel Component ────────────────────────────────────────────

function SearchCarousel() {
  const [idx, setIdx] = useState(0);
  // phase: "idle" | "exit" | "enter"
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");

  useEffect(() => {
    const idleTimer = setTimeout(() => {
      // Begin exit animation
      setPhase("exit");

      const exitTimer = setTimeout(() => {
        // Swap text while invisible
        setIdx(i => (i + 1) % SEARCH_SUGGESTIONS.length);
        setPhase("enter");

        const enterTimer = setTimeout(() => {
          setPhase("idle");
        }, 350); // settle duration

        return () => clearTimeout(enterTimer);
      }, 350); // exit duration

      return () => clearTimeout(exitTimer);
    }, 3000); // visible pause

    return () => clearTimeout(idleTimer);
  }, [idx]);

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
      <span className="text-slate-400">Search - &nbsp;</span>
      {/* overflow-hidden clips the sliding text so it doesn't bleed outside the bar */}
      <span className="overflow-hidden" style={{ height: "1.5em", display: "inline-flex", alignItems: "center" }}>
        <span style={style}>{SEARCH_SUGGESTIONS[idx]}</span>
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
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<string[]>(DEFAULT_SAVED);
  const [visibleCount, setVisibleCount] = useState(6);
  const [showBookmarks, setShowBookmarks] = useState(false);

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

  // Refs
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click-outside closes suggestion dropdown
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
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

  // Suggestion list (dropdown)
  const suggestions = searchQuery.trim().length > 0
    ? TEMPLATES.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    : TEMPLATES.slice(0, 5);

  // Main grid filter
  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmarks = !showBookmarks || savedTemplates.includes(t.title);
    return matchesSearch && matchesBookmarks;
  });

  return (
    <div className="w-full px-4 sm:px-6 pb-24 pt-2" style={{ fontFamily: "inherit" }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="space-y-2 select-none mb-6">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-55">
          Clinical Autofills
        </h1>
        <p className="font-sans text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Pre-written templates — edit and copy directly into Best Practice.
        </p>
      </div>

      {/* ── SMART COMMAND BAR ────────────────────────────────────────────────── */}
      <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto mb-8">
        <div
          className={`w-full h-12 bg-white border transition-all duration-200 rounded-2xl shadow-sm flex items-center px-4 gap-3 overflow-hidden ${showSuggestions
            ? "border-teal-500 ring-2 ring-teal-500/20"
            : "border-slate-200 hover:border-slate-300"
            }`}
        >       <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />

          {/* Animated placeholder — only shown when field is empty */}
          {!searchQuery && (
            <span className="absolute left-[52px] flex items-center pointer-events-none select-none overflow-hidden">
              <SearchCarousel />
            </span>
          )}

          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder=""
            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-base text-slate-800 z-10 relative"
          />

          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 flex-shrink-0"
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

      {/* ── GRID HEADER + BOOKMARKS TOGGLE ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {showBookmarks ? "Saved Bookmarks" : "All Templates"}
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
              Saved Bookmarks
              {savedTemplates.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showBookmarks
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
                  }`}>
                  {savedTemplates.length}
                </span>
              )}
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
              return (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow relative group cursor-pointer flex flex-col"
                  onClick={() => setSelectedTemplate(t)}
                >
                  {/* Bookmark icon — top-right, appears on hover; always shown if bookmarked */}
                  <button
                    onClick={e => toggleSaved(t.title, e)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark template"}
                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-xl transition-all duration-150 ${isBookmarked
                      ? "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900"
                      : "text-slate-300 dark:text-slate-600 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                      }`}
                  >
                    {isBookmarked
                      ? <BookmarkCheck className="w-4 h-4" />
                      : <Bookmark className="w-4 h-4" />
                    }
                  </button>

                  {/* Title */}
                  <div className="pr-8 mb-2">
                    <h3 className="font-sans text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                      {t.title}
                    </h3>
                  </div>

                  {/* Uniform slate badge — no color coding */}
                  <span className="inline-block self-start mb-3 font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                    {t.category}
                  </span>

                  {/* Description — 2-line clamp */}
                  <p className="font-sans text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400 flex-1 mb-4 line-clamp-2">
                    {t.description}
                  </p>

                  {/* Footer row */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto flex items-center justify-between">
                    <p className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Updated {t.updated}</p>
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
                      Updated {selectedTemplate.updated}
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
                className={`btn-modal-copy flex items-center gap-2 px-4 py-2 font-semibold text-sm ${modalCopied ? 'is-copied' : ''}`}
              >
                <span data-text-end="Copied!" data-text-initial="Copy to clipboard" className="modal-tooltip" />
                <span className="flex items-center gap-2 relative">
                  <svg xmlSpace="preserve" viewBox="0 0 6.35 6.35" height={16} width={16} xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" className="modal-clipboard">
                    <g>
                      <path fill="currentColor" d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z" />
                    </g>
                  </svg>
                  <svg xmlSpace="preserve" viewBox="0 0 24 24" height={16} width={16} xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" xmlns="http://www.w3.org/2000/svg" className="modal-checkmark">
                    <g>
                      <path data-original="#000000" fill="currentColor" d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
                    </g>
                  </svg>
                  Copy
                </span>
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
        .animated-modal-copy {
          position: relative;
          background-color: #f2f7fa;
          width: 100px;
          height: 30px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition-duration: 700ms;
        }
        .dark .animated-modal-copy {
          background-color: #1e293b;
        }
        .animated-modal-copy span:first-child {
          color: #0e418f;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          transition-duration: 400ms;
        }
        .dark .animated-modal-copy span:first-child {
          color: #5ac8b0;
        }
        .animated-modal-copy span:last-child {
          position: absolute;
          top: 50%;
          left: 50%;
          color: #b5ccf3;
          font-weight: 700;
          opacity: 0;
          transform: translateY(100%) translateX(-50%);
          height: 14px;
          line-height: 13px;
          transition-duration: 400ms;
        }
        .dark .animated-modal-copy span:last-child {
          color: #2dd4bf;
        }
        .animated-modal-copy:focus {
          background-color: #0e418f;
          width: 120px;
          height: 40px;
          transition-delay: 100ms;
          transition-duration: 500ms;
        }
        .dark .animated-modal-copy:focus {
          background-color: #0f766e;
        }
        .animated-modal-copy:focus span:first-child {
          transform: translateX(-50%) translateY(-150%);
          opacity: 0;
          transition-duration: 500ms;
        }
        .animated-modal-copy:focus span:last-child {
          transform: translateX(-50%) translateY(-50%);
          opacity: 1;
          color: #ffffff;
          transition-delay: 300ms;
          transition-duration: 500ms;
        }
        .dark .animated-modal-copy:focus span:last-child {
          color: #ffffff;
        }
        .animated-modal-copy:focus:not(:active) {
          transition-duration: 900ms;
        }
      `}</style>
    </div>
  );
}
