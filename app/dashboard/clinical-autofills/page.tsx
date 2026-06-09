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
  {
    id: 7,
    title: "Wound Review",
    category: "Wound Management",
    description: "Structured wound review template including wound assessment, healing phase, dressing management, and follow-up planning.",
    updated: "just now",
    content: `F2F
^presents with ^
^New to me, presents for wound review 
^Planned present for ^

Subjective
 - Progress: ^Improving / Stalled / Deteriorating
 - Pain: ^Score /10, ^Constant / During dressing changes only, ^Overall Improving
 - Interim events: <Fevers / Systemic symptoms / Antibiotics completed?>

Objective 
Wound Assessment
 - Location: ^Site
 - Dimensions: (Length) x (Width) x (Depth) in mm
 - Tissue Type (TIME): 
 T (Tissue): ^% Granulation / % Slough / % Eschar / % Epithelial. Colour of the tissue bed. 
 I (Infection): ^No/Signs of clinical infection? Odour / Heat / Swelling / Erythema
 M (Moisture): ^Exudate: Low / Med / High ^Serous / Haemoserous / Purulent. Is there any bleeding? 
 E (Edge): ^Advancing / Stalled / Rolled / Macerated
 - Periwound: ^Healthy / Eczematous / Cellulitic / Macerated
 - Circulation: ^Pulses present? / Capillary refill time: 

Clinical Photography: 
Consent obtained for clinical photography; image uploaded to gallery/record.

Assessment
 - Diagnosis: ^E.g., Venous ulcer / Dehisced surgical wound / Traumatic tear^
 - Healing Phase: ^Inflammatory / Proliferative / Maturation
 - Debridement needed: ^None / Autolytic / Conservative Sharp / Mechanical / Biological

Plan
 - Debridement performed: <Type: > - <Result: >
 - Cleansing: <Normal saline / Prontosan / Tap water>
 - Primary Dressing: <E.g., Inadine / Aquacel Ag / Hydrogel / Foam>
 - Secondary Dressing/Fixation: <E.g., Zetuvit / Hypafix / Compression bandage>
 - Frequency: <Review in __ days / PRN if strike-through>
 - Referral/Escalation: <Wound clinic / Vascular / Not required>
*If a wound is stalled, use the assessment section to document if you’ve considered underlying causes (e.g., “Check HbA1c/Iron/ABI if no progress in 2 weeks”).`
  },
  {
    id: 8,
    title: "Male Fertility Issues",
    category: "Men's Health",
    description: "Structured template for investigation of male sub-fertility, including history, examination, and management plan.",
    updated: "just now",
    content: `F2F
^presents with ^
^New to me, presents 
^Planned present for ^
^Patient and partner presenting for investigation of sub-fertility.

SUBJECTIVE
Duration: Trying to conceive for ^ months/years.
Partner's Details:
 - Partner's age: ^yrs
 - Known female factor issues (e.g., PMOS, endometriosis, tubal-blockage): Yes / No
 - Partner's previous conceptions: Yes / No
Fertility History (Patient):
 - Previous children (with current or previous partners): Yes / No, at age ^yrs 
Sexual History:
 - Frequency of intercourse: ^ times per week/month.
 - Timing of intercourse (re: fertile window):
 - Difficulties: Erectile dysfunction (present/absent), ejaculatory issues (premature, delayed, anejaculation), dyspareunia.
 - Libido: Normal / Decreased / Increased.

Past Medical History:
Childhood:
 - ^declines hx of cryptorchidism 
 - ^declines hx of scrotal surgery 
 - ^declines hx of hernia repair 
 - ^declines hx of mumps 
Genitourinary:
 - ^Declines hx of STIs (Chlamydia, Gonorrhoea) 
 - ^declines hx of Epididymo-orchitis / Prostatitis 
 - ^declines hx of Testicular/scrotal trauma 
 - ^declines vasectomy 
Systemic Illness:
 - ^no known hx of Diabetes Mellitus 
 - ^declines hx of chemotherapy / radiotherapy 

Medications & Allergies 
(mention if on TRT, 5-ARIs, spironolactone or sulfasalasine) 

Social History:
Occupation:
 - Exposure to: Heat / Pesticides / Solvents / Heavy metals / Radiation: Yes / No
 - Details:
Substance Use:
 - Smoking: Current / Ex / Never. (^ packs/day)
 - Alcohol: ^ standard drinks per week.
 - Recreational Drugs: ^Declines any 
 Marijuana: Yes / No, Cocaine: Yes / No
 Opiates: Yes / No
 Anabolic steroids (current or past): Yes / No
General Health:
 - Diet and exercise:
 - Recent high fevers: Yes / No
 - Testicular heat exposure (e.g., saunas, hot tubs): Yes / No

Family History:
 - Infertility (siblings, parents): Yes / No
 - Genetic conditions (e.g., Cystic Fibrosis, Klinefelter): Yes / No

OBJECTIVE/ Examination 
Vitals: 
 - BMI: 
 - Height
 - Weight: 
General appearance, secondary sexual characteristics (gynaecomastia, hair distribution, muscle mass):
Genital Examination:
 - Penis: (e.g., meatal position)
 - Testes (Scrotal Exam):
 - Volume (Orchidometer): Left: _____ ml, Right: _____ ml (Normal >15ml)
   - Consistency: Firm / Soft / Other
 - Epididymis: Tender / Non-tender / Cysts
 - Vas Deferens: Present bilaterally / Absent (unilateral/bilateral)
 - Varicocele:
   - Palpable: Yes / No
   - Present on Valsalva: Yes / No
 - Other: (e.g., hydrocele, surgical scars)

ASSESSMENT 
?Male factor sub-fertility 
^There are no obvious predispositions on history. 
^On examination, patient is well androgenised 

PLAN 
Investigations to consider: 
 - Semen Analysis (Initial):
 - [ ] Request 2x Semen Analysis (6-12 weeks apart).
 - Instructions given: 2-7 days of abstinence, deliver to lab within 1 hour, keep at body temp. 
 https://www.snp.com.au/media/ghbjmts2/item-35170-semen-collection-202601.pdf and 
 https://www.snp.com.au/patients/patient-resources/pre-test-information/semen-collection/patient (information sheet). 
 - Hormonal Profile (If SA abnormal or clinical suspicion):
 - FSH, LH, Testosterone (early morning, 8-10 am), Prolactin (if low T or low libido), SHBG
 - Genetic (If severe oligo- or azoospermia):
 - Karyotype (Check for Klinefelter XXY)
 - Y-chromosome microdeletions
 - CFTR gene mutation (if vas deferens absent)
 - Imaging:
 - Scrotal Ultrasound (if exam abnormal, varicocele suspected, or testicular mass).
 - Other:
 - STI screen (if not recent)

Advice & further plan 
Education:
 - Discussed fertile window and advised regular intercourse (e.t., every 2-3 days).
 - Reassurance provided.
Lifestyle Modifications:
 - Advised smoking cessation.
 - Advised reduction of alcohol.
 - Advised cessation of illicit drugs (esp. marijuana, anabolic steroids).
 - Weight management (if BMI high).
 - Avoid testicular heat (e.g., loose underwear, avoid spas/saunas).
Medication Review:
 - Reviewed current medications.
 - Advised to stop [e.g., anabolic steroids] if applicable.
Supplements:
 - Discussed limited evidence but low risk of antioxidants/folic acid.
Follow-up & Referral:
 - [ ] Follow up to review Semen Analysis results.
Consider referral to Fertility Specialist / Urologist if:
 - Abnormal Semen Analysis.
 - Azoospermia or severe oligozoospermia.
 - Suspected genetic cause.
 - Significant examination finding (e.g., varicocele, absent vas).
 - Female partner factors also present.

Patient information sheets: 
1. https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/infertility-in-men
2. https://www.thewomens.org.au/health-information/fertility-information/fertility-problems/male-infertility
3. https://www.ivf.com.au/sites/ivfa/files/2023-03/MFC05%20Male%20Fertility%20eBook%2017.03.23-LR_3.pdf`
  }
];

const RECENT_TEMPLATES = [
  { title: "Mental Health Care Plan", time: "2 hours ago" },
  { title: "Diabetes Review", time: "Yesterday" },
  { title: "Asthma Management Plan", time: "2 days ago" },
  { title: "Skin Cancer Follow-Up", time: "4 days ago" },
  { title: "Chronic Disease Management Plan", time: "5 days ago" },
  { title: "Women's Health Assessment", time: "1 week ago" },
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
  const [savedTemplates, setSavedTemplates] = useState<string[]>(SAVED_TEMPLATES);

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
    if (filter === "Recently Used" && !["Mental Health Care Plan", "Diabetes Review", "Asthma Management Plan", "Skin Cancer Follow-Up", "Chronic Disease Management Plan", "Women's Health Assessment"].includes(t.title)) {
      return false;
    }
    if (filter === "Most Used" && !["Chronic Disease Management Plan", "Diabetes Review"].includes(t.title)) {
      return false;
    }
    if (filter === "Favourites" && !savedTemplates.includes(t.title)) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-6 pb-20 pt-2 space-y-4">
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
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-4">
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
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${filter === f
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* RECENTLY USED & SAVED TEMPLATES (SIDE-BY-SIDE 2x2 GRIDS) */}
      <section className="pt-2 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* RECENTLY USED SECTION */}
          <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-[32px] px-8 pt-8 pb-4 shadow-[10px_10px_20px_#d1d5db,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#1e293b] flex flex-col border border-slate-100/50 dark:border-slate-800/50">
            <h2 className="text-[16px] font-bold text-slate-900 mb-5 ml-2">Recently Used</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RECENT_TEMPLATES.slice(0, 4).map((t, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const template = TEMPLATES.find(temp => temp.title === t.title);
                    if (template) setSelectedTemplate(template);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-center h-20 group"
                >
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1.5 truncate">{t.title}</h3>
                  <p className="text-[11px] font-medium text-slate-500">{t.time}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center w-full">
              <button 
                onClick={() => { 
                  setFilter("Recently Used"); 
                  document.getElementById('main-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] py-1.5 px-6 rounded-xl transition-colors shadow-sm"
              >
                View all
              </button>
            </div>
          </div>

          {/* SAVED TEMPLATES SECTION */}
          <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-[32px] px-8 pt-8 pb-4 shadow-[10px_10px_20px_#d1d5db,-10px_-10px_20px_#ffffff] dark:shadow-[10px_10px_20px_#0f172a,-10px_-10px_20px_#1e293b] flex flex-col border border-slate-100/50 dark:border-slate-800/50">
            <h2 className="text-[16px] font-bold text-slate-900 mb-5 ml-2">Saved Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedTemplates.slice(0, 4).map((title, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const template = TEMPLATES.find(temp => temp.title === title);
                    if (template) setSelectedTemplate(template);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-center h-20 group"
                >
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">{title}</h3>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-center w-full">
              <button 
                onClick={() => { 
                  setFilter("Favourites"); 
                  document.getElementById('main-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] py-1.5 px-6 rounded-xl transition-colors shadow-sm"
              >
                View all
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN TEMPLATE LIBRARY */}
      <section id="main-library" className="space-y-6 pt-4">
        
        <p className="text-[15px] font-medium text-slate-500">
          Access pre-written clinical templates, edit when required, and copy directly into Best Practice.
        </p>

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
                  className="relative glass dark:glass-strong rounded-3xl p-4 border border-slate-200/50 dark:border-slate-800/60 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedTemplates(prev =>
                        prev.includes(t.title)
                          ? prev.filter(title => title !== t.title)
                          : [t.title, ...prev]
                      );
                    }}
                    className={`absolute top-4 right-4 z-10 transition-opacity duration-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${savedTemplates.includes(t.title) ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-yellow-400'}`}
                    title={savedTemplates.includes(t.title) ? "Remove from saved" : "Add to saved"}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>

                  <div className="pr-8">
                    <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1.5">
                      {t.title}
                    </h3>
                    <span className="inline-flex bg-teal-50/80 text-teal-700 font-bold text-[10px] px-2 py-0.5 rounded-full mb-2">
                      {t.category}
                    </span>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-3">
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
                        className="text-teal-600 hover:text-teal-800 font-bold text-[13px] px-2 transition-colors"
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
                    Copy
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
