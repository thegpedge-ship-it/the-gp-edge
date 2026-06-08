"use client";

import { useState } from "react";

// ─── Mock Data ─────────────────────────────────────────────────────────────
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
3. Patient provided with crisis contact numbers (Lifeline 13 11 14).`
  },
  {
    id: 2,
    title: "Diabetes Review",
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
4. Next review in 6 months.`
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
- Review in [Number] months or earlier if unwell.`
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
3. Next full skin check scheduled in [Number] months.`
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
- Plan to be reviewed in 6 months (Item 732).`
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
- Review PRN.`
  },
];

const RECENT_TEMPLATES = [
  { title: "Mental Health Care Plan", time: "2 hours ago" },
  { title: "Diabetes Review", time: "Yesterday" },
  { title: "Asthma Management Plan", time: "2 days ago" },
  { title: "Skin Cancer Follow-Up", time: "4 days ago" },
];

const SAVED_TEMPLATES = [
  "Chronic Disease Management Plan",
  "Women's Health Assessment",
  "Immigration Medical Report",
  "Mental Health Care Plan",
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function ClinicalAutofillsPage() {
  const [filter, setFilter] = useState("All Templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedContent, setCopiedContent] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const FILTERS = ["All Templates", "Recently Used", "Most Used", "Favourites"];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Filter logic
  const filteredTemplates = TEMPLATES.filter((t) => {
    // 1. Search Query
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Tab Filters (Mocked logic for demonstration)
    if (filter === "Recently Used" && !["Mental Health Care Plan", "Diabetes Review", "Asthma Management Plan", "Skin Cancer Follow-Up"].includes(t.title)) {
      return false;
    }
    if (filter === "Most Used" && !["Chronic Disease Management Plan", "Diabetes Review"].includes(t.title)) {
      return false;
    }
    if (filter === "Favourites" && !SAVED_TEMPLATES.includes(t.title)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-12">
      {/* HEADER SECTION */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Clinical Autofills
        </h1>
        <p className="text-[15px] font-medium text-slate-500">
          Access pre-written clinical templates, edit when required, and copy directly into Best Practice.
        </p>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full xl:flex-1">
          <div className="relative glass dark:glass-strong rounded-2xl p-1.5 border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinical templates..."
              className="w-full pl-4 pr-10 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[15px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex w-full xl:w-auto overflow-x-auto bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                filter === f
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TEMPLATE LIBRARY */}
      <section className="space-y-6">

        {/* EMPTY STATE OR TEMPLATE GRID */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-6 relative">
              <svg className="w-24 h-24 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Template Not Found</h3>
            <p className="text-slate-500 font-medium mb-8">No results match your search or filter.</p>
            <button 
              onClick={() => { setSearchQuery(""); setFilter("All Templates"); }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[16px] py-3 px-8 rounded-2xl shadow-sm transition-colors"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.slice(0, visibleCount).map((t) => (
                <div
                  key={t.id}
                  className="glass dark:glass-strong rounded-3xl p-4 border border-slate-200/50 dark:border-slate-800/60 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                      {t.title}
                    </h3>
                    <span className="inline-flex bg-teal-50/80 text-teal-700 font-bold text-[10px] px-2 py-0.5 rounded-full mb-2">
                      {t.category}
                    </span>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-3">
                      {t.description}
                    </p>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col gap-2">
                    <p className="text-[11px] font-medium text-slate-400">
                      Updated {t.updated}
                    </p>
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedTemplate(t)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] py-1.5 px-4 rounded-xl transition-colors"
                      >
                        View Template
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(t.content); }}
                        className="text-teal-600 hover:text-teal-800 font-bold text-[13px] px-2 transition-colors capitalize"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* LOAD MORE */}
            {visibleCount < filteredTemplates.length && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setVisibleCount((v) => v + 6)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-teal-700 font-bold text-[14px] rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Load More Templates
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* RECENTLY USED SECTION */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">Recently Used</h2>
          <button className="text-[13px] font-bold text-teal-600 hover:text-teal-800 transition-colors">
            View all
          </button>
        </div>
        <div className="glass dark:glass-strong rounded-2xl p-4 border border-slate-200/50 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECENT_TEMPLATES.slice(0, 4).map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm cursor-pointer hover:border-teal-500/30 transition-colors flex flex-col justify-center"
              >
                <h3 className="text-[13px] font-bold text-slate-900 mb-0.5 truncate">{t.title}</h3>
                <p className="text-[11px] font-medium text-slate-400">{t.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAVED TEMPLATES SECTION */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">Saved Templates</h2>
          <button className="text-[13px] font-bold text-teal-600 hover:text-teal-800 transition-colors">
            View all
          </button>
        </div>
        <div className="glass dark:glass-strong rounded-2xl p-4 border border-slate-200/50 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAVED_TEMPLATES.slice(0, 4).map((title, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm cursor-pointer hover:border-teal-500/30 transition-colors flex flex-col justify-center"
              >
                <h3 className="text-[13px] font-bold text-slate-900 truncate">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATE DRAWER (MODAL) */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-0 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          {/* Overlay to click-away */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedTemplate(null)} 
          />
          
          {/* Full-Screen Modal Panel (Touching the Top Edge) */}
          <div className="relative w-full max-w-5xl bg-white h-[100vh] flex flex-col rounded-b-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex-shrink-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">{selectedTemplate.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex bg-teal-50/80 text-teal-700 font-bold text-[12px] px-3 py-1 rounded-full">
                      {selectedTemplate.category}
                    </span>
                    <span className="text-[13px] font-medium text-slate-500">Updated {selectedTemplate.updated}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleCopy(selectedTemplate.content)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] py-2 px-6 rounded-xl shadow-sm transition-colors whitespace-nowrap"
                  >
                    Copy Template
                  </button>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="text-slate-400 hover:text-slate-700 text-3xl font-bold p-1 leading-none transition-colors"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-white relative">
              <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-5 mb-8">
                <p className="text-teal-800 text-[14px] font-medium leading-relaxed">
                  Copy the text below and paste directly into Best Practice.
                  <br />
                  Formatting will be preserved.
                </p>
              </div>

              <div className="border border-slate-100 rounded-2xl p-8 pb-20 max-w-4xl relative">
                <h3 className="text-xl font-bold text-slate-900 mb-6">{selectedTemplate.title}</h3>
                <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-slate-800">
                  {selectedTemplate.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SUCCESS POPUP (FLOATING TOAST) */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-2xl bg-teal-50/95 backdrop-blur-md border border-teal-200/80 p-5 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-2xl ${isCopied ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="flex items-center gap-4">
          <div className="bg-teal-600 rounded-full p-2 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <p className="text-[15px] font-bold text-teal-900">Template copied to clipboard!</p>
            <p className="text-[13px] font-medium text-teal-700">You can now paste it into Best Practice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
