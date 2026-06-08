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
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const FILTERS = ["All Templates", "Recently Used", "Most Used", "Favourites"];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Template copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-12">
      {/* HEADER SECTION */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Clinical Autofills
        </h1>
        <p className="text-[15px] font-medium text-slate-500">
          Access pre-written clinical templates, edit when required, and copy directly into Best Practice.
        </p>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search clinical templates..."
            className="w-full pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 placeholder-slate-400 font-medium text-[15px] shadow-sm transition-all"
          />
        </div>
        <div className="flex w-full md:w-auto overflow-x-auto bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
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

        {/* TEMPLATE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col hover:shadow-md transition-shadow"
            >
              <h3 className="text-[17px] font-bold text-slate-900 mb-3">{t.title}</h3>
              <div>
                <span className="inline-flex bg-teal-50/80 text-teal-700 font-bold text-[11px] px-3 py-1 rounded-full mb-4">
                  {t.category}
                </span>
              </div>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-6 flex-grow">
                {t.description}
              </p>
              <div className="mt-auto space-y-5">
                <p className="text-[12px] font-medium text-slate-400">
                  Updated {t.updated}
                </p>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedTemplate(t)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] py-2.5 px-6 rounded-xl transition-colors"
                  >
                    View Template
                  </button>
                  <button 
                    onClick={() => handleCopy(t.content)}
                    className="text-teal-600 hover:text-teal-800 font-bold text-[14px] px-2 transition-colors capitalize"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LOAD MORE */}
        <div className="flex justify-center pt-4">
          <button className="px-6 py-2.5 bg-white border border-slate-200 text-teal-700 font-bold text-[14px] rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Load More Templates
          </button>
        </div>
      </section>

      {/* RECENTLY USED SECTION */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">Recently Used</h2>
          <button className="text-[13px] font-bold text-teal-600 hover:text-teal-800 transition-colors">
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RECENT_TEMPLATES.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm cursor-pointer hover:border-teal-500/30 transition-colors"
            >
              <h3 className="text-[14px] font-bold text-slate-900 mb-1">{t.title}</h3>
              <p className="text-[12px] font-medium text-slate-400">{t.time}</p>
            </div>
          ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAVED_TEMPLATES.map((title, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm cursor-pointer hover:border-teal-500/30 transition-colors"
            >
              <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATE DRAWER (MODAL) */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          {/* Overlay to click-away */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedTemplate(null)} 
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-8 space-y-8">
              {/* Drawer Header */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{selectedTemplate.title}</h2>
                    <span className="inline-flex bg-teal-50/80 text-teal-700 font-bold text-[12px] px-3 py-1 rounded-full">
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold p-2"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[13px] font-medium text-slate-500">Updated {selectedTemplate.updated}</p>
                
                <div className="pt-2">
                  <button 
                    onClick={() => handleCopy(selectedTemplate.content)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] py-3 px-8 rounded-xl shadow-md transition-colors"
                  >
                    Copy Template
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Template Content */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-slate-800">
                  {selectedTemplate.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
