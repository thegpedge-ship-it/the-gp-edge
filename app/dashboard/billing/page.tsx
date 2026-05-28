"use client";

import { useState } from "react";
import { Search, Clock, ChevronDown, AlertTriangle, CheckCircle2, Calculator, BookOpen, Layers, ExternalLink } from "lucide-react";

type TabType = "explore" | "scenarios" | "calculator";
type ComplexityLevel = "simple" | "moderate" | "complex";

interface MBSItem {
  id: string;
  humanTitle: string;
  officialTitle: string;
  timeRange: string;
  timeMins: { min: number; max: number };
  complexity: ComplexityLevel;
  scheduleFee: number;
  medicareRebate: number;
  bulkBillable: boolean;
  category: string;
  searchTags: string[];
  plainEnglish: string;
  commonUses: string[];
  comparisonItem: {
    id: string;
    title: string;
    duration: string;
    complexity: string;
    intent: string;
  } | null;
  billingRestrictions: string[];
  officialNotes: string[];
  scenarios: {
    presentation: string;
    time: string;
    complexity: ComplexityLevel;
    correctItem: string;
    reasoning: string;
  }[];
}

const mbsItems: MBSItem[] = [
  {
    id: "23",
    humanTitle: "Standard short GP consultation (under 10 mins)",
    officialTitle: "Professional attendance at consulting rooms ΓÇö Level B",
    timeRange: "Under 10 mins",
    timeMins: { min: 0, max: 10 },
    complexity: "simple",
    scheduleFee: 41.20,
    medicareRebate: 35.05,
    bulkBillable: true,
    category: "Standard Consults",
    searchTags: ["short", "quick", "brief", "script", "renewal", "blood pressure", "simple", "minor"],
    plainEnglish: "Commonly used for script renewals, simple reviews, blood pressure checks, and minor issues that don't require detailed examination.",
    commonUses: [
      "Quick GP consultations",
      "Prescription renewals",
      "Basic symptom reviews",
      "Minor follow-ups",
      "Single issue presentations",
    ],
    comparisonItem: {
      id: "36",
      title: "Standard GP consultation (10-20 mins)",
      duration: "10-20 minutes required",
      complexity: "Moderate complexity, multiple issues",
      intent: "Detailed history, examination, and management plan",
    },
    billingRestrictions: [
      "Cannot bill with Item 36 on the same attendance",
      "Cannot bill with any other attendance item on the same occasion",
      "Not appropriate for multiple presenting problems",
      "Not suitable when detailed examination is required",
    ],
    officialNotes: [
      "This item is intended for consultations that are obvious in nature and do not require complex decision making.",
      "The service must be rendered in person at the practitioner's consulting rooms.",
      "A 'short patient history' means a history that is limited to the presenting complaint.",
      "Level B attendances are not appropriate where the patient presents with multiple problems.",
      "Time is not a determining factor - the nature and complexity determines the appropriate item.",
    ],
    scenarios: [
      {
        presentation: "45-year-old patient presents for routine blood pressure check and script renewal for existing antihypertensive medication.",
        time: "8 minutes",
        complexity: "simple",
        correctItem: "23",
        reasoning: "Single straightforward issue, no new clinical decisions required, routine monitoring only.",
      },
    ],
  },
  {
    id: "36",
    humanTitle: "Standard GP consultation (10-20 mins)",
    officialTitle: "Professional attendance at consulting rooms ΓÇö Level C",
    timeRange: "10-20 mins",
    timeMins: { min: 10, max: 20 },
    complexity: "moderate",
    scheduleFee: 80.10,
    medicareRebate: 68.10,
    bulkBillable: true,
    category: "Standard Consults",
    searchTags: ["standard", "regular", "consultation", "assessment", "examination", "moderate", "review"],
    plainEnglish: "The most common GP consultation item. Used when you need to take a proper history, examine the patient, and create a management plan.",
    commonUses: [
      "New symptom presentations",
      "Chronic disease reviews",
      "Medication adjustments",
      "Referral assessments",
      "Multiple minor issues",
    ],
    comparisonItem: {
      id: "44",
      title: "Extended GP consultation (20+ mins)",
      duration: "Over 20 minutes required",
      complexity: "High complexity, comprehensive assessment",
      intent: "Complex multi-system evaluation and planning",
    },
    billingRestrictions: [
      "Cannot bill with Item 23 or 44 on the same attendance",
      "Minimum 10-minute consultation time required",
      "Must involve selective history AND examination AND management",
      "Documentation must support the level of service claimed",
    ],
    officialNotes: [
      "This item requires consultation duration between 10 and 20 minutes.",
      "A 'selective history' means a history focused on the presenting problem(s) and relevant background.",
      "The examination must be relevant to the presenting complaint(s).",
      "A management plan must be discussed with and provided to the patient.",
      "Documentation must clearly demonstrate the components of the service and time spent.",
    ],
    scenarios: [
      {
        presentation: "62-year-old diabetic patient presents for quarterly review. Requires HbA1c discussion, medication review, and foot examination.",
        time: "15 minutes",
        complexity: "moderate",
        correctItem: "36",
        reasoning: "Multiple clinical components (history, examination, management), moderate complexity, within 10-20 minute range.",
      },
    ],
  },
  {
    id: "44",
    humanTitle: "Extended GP consultation (over 20 mins)",
    officialTitle: "Professional attendance at consulting rooms ΓÇö Level D",
    timeRange: "Over 20 mins",
    timeMins: { min: 20, max: 60 },
    complexity: "complex",
    scheduleFee: 117.20,
    medicareRebate: 99.65,
    bulkBillable: true,
    category: "Standard Consults",
    searchTags: ["long", "extended", "complex", "comprehensive", "multiple", "detailed", "thorough"],
    plainEnglish: "Reserved for complex consultations requiring comprehensive assessment. Think new patient workups, multiple chronic conditions, or difficult diagnostic cases.",
    commonUses: [
      "New patient comprehensive assessments",
      "Multiple complex conditions",
      "Difficult diagnostic workups",
      "Health assessments",
      "Complex medication reviews",
    ],
    comparisonItem: {
      id: "36",
      title: "Standard GP consultation (10-20 mins)",
      duration: "10-20 minutes",
      complexity: "Moderate complexity",
      intent: "Standard assessment and management",
    },
    billingRestrictions: [
      "Cannot bill with Item 23 or 36 on the same attendance",
      "Minimum 20-minute consultation time required",
      "Must demonstrate comprehensive history and examination",
      "Not appropriate for simple or routine presentations",
    ],
    officialNotes: [
      "This item requires a minimum consultation duration of 20 minutes.",
      "The 20-minute threshold refers to the time spent with the patient.",
      "Comprehensive history and examination must be documented.",
      "This item is appropriate for consultations involving complex health problems.",
    ],
    scenarios: [
      {
        presentation: "New 58-year-old patient with uncontrolled diabetes, hypertension, and recent chest pain. Requires full history, cardiovascular examination, ECG review, and comprehensive management plan.",
        time: "35 minutes",
        complexity: "complex",
        correctItem: "44",
        reasoning: "Multiple complex conditions, new patient requiring comprehensive assessment, extended time for thorough evaluation and planning.",
      },
    ],
  },
  {
    id: "2713",
    humanTitle: "Mental Health Treatment Plan",
    officialTitle: "GP Mental Health Treatment Plan (GPMHTP)",
    timeRange: "20-40 mins",
    timeMins: { min: 20, max: 40 },
    complexity: "moderate",
    scheduleFee: 81.40,
    medicareRebate: 69.20,
    bulkBillable: true,
    category: "Mental Health",
    searchTags: ["mental health", "depression", "anxiety", "psychology", "psychiatry", "treatment plan", "better access"],
    plainEnglish: "Creates a formal mental health treatment plan that unlocks Medicare rebates for psychology sessions. Essential first step for patients needing psychological support.",
    commonUses: [
      "New depression diagnosis",
      "Anxiety management initiation",
      "Referral to psychologist",
      "Better Access program entry",
      "Structured mental health care",
    ],
    comparisonItem: {
      id: "2700",
      title: "Mental Health Consultation",
      duration: "No minimum time",
      complexity: "Assessment only, no plan",
      intent: "Mental health assessment without formal plan",
    },
    billingRestrictions: [
      "Cannot bill with Items 2700, 2701, 2712, 2717, or 2721 on same day",
      "Patient must have assessed mental disorder",
      "Plan must include assessment, goals, and referral arrangements",
      "Copy of plan must be provided to patient",
    ],
    officialNotes: [
      "This item is for the preparation of a GP Mental Health Treatment Plan under the Better Access initiative.",
      "The patient must have an assessed mental disorder that would benefit from a structured approach.",
      "The plan must include: assessment; agreed treatment goals; treatment, referral and review arrangements.",
      "A GPMHTP enables the patient to access Medicare rebates for psychological therapy services.",
      "The plan should be reviewed at least every 12 months.",
    ],
    scenarios: [
      {
        presentation: "32-year-old presenting with 6-week history of low mood, poor sleep, and work difficulties. PHQ-9 score of 14. Wants to see a psychologist.",
        time: "25 minutes",
        complexity: "moderate",
        correctItem: "2713",
        reasoning: "Formal mental health assessment completed, treatment plan created, referral to psychology arranged. Unlocks Better Access rebates.",
      },
    ],
  },
  {
    id: "721",
    humanTitle: "Chronic Disease Management Plan (GPMP)",
    officialTitle: "GP Management Plan for chronic conditions",
    timeRange: "30-45 mins",
    timeMins: { min: 30, max: 45 },
    complexity: "complex",
    scheduleFee: 152.80,
    medicareRebate: 129.90,
    bulkBillable: true,
    category: "Care Plans",
    searchTags: ["chronic", "diabetes", "copd", "heart failure", "management plan", "gpmp", "care plan"],
    plainEnglish: "Creates a formal management plan for patients with chronic conditions. Unlocks 5 allied health visits per year and coordinates ongoing care.",
    commonUses: [
      "Diabetes management",
      "COPD care coordination",
      "Heart failure planning",
      "Chronic pain management",
      "Multi-morbidity coordination",
    ],
    comparisonItem: {
      id: "723",
      title: "Team Care Arrangements (TCA)",
      duration: "Additional coordination time",
      complexity: "Requires 2+ allied health providers",
      intent: "Coordinates multidisciplinary team care",
    },
    billingRestrictions: [
      "Cannot bill with Item 723 on the same day",
      "Only claimable once per patient per 12 months",
      "Condition must be chronic (6+ months duration)",
      "Plan must be offered to patient in writing",
    ],
    officialNotes: [
      "This item is for patients with chronic or terminal medical conditions.",
      "A chronic medical condition is one present for six months or longer.",
      "The GPMP must include: health care needs assessment; treatment goals; actions to be taken.",
      "Item 721 can only be claimed once per patient in a 12-month period.",
      "A copy of the plan must be offered to the patient.",
    ],
    scenarios: [
      {
        presentation: "67-year-old with newly diagnosed Type 2 Diabetes, requiring comprehensive management plan including diet, exercise, medication, and allied health referrals.",
        time: "40 minutes",
        complexity: "complex",
        correctItem: "721",
        reasoning: "Chronic condition requiring structured management approach. GPMP unlocks 5 allied health visits (dietitian, podiatrist, etc.).",
      },
    ],
  },
];

const filterCategories = ["Standard Consults", "Mental Health", "Care Plans"];

const complexityConfig = {
  simple: { label: "Simple", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  moderate: { label: "Moderate", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  complex: { label: "Complex", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MBSItem | null>(mbsItems[0]);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [scenarioExpanded, setScenariosExpanded] = useState<number[]>([]);

  // Calculator state
  const [calcItemId, setCalcItemId] = useState("36");
  const [calcFeeCharged, setCalcFeeCharged] = useState("95.00");

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const toggleScenario = (index: number) => {
    setScenariosExpanded((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Smart tag search - matches searchTags array
  const filteredItems = mbsItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === "" ||
      item.id.includes(query) ||
      item.humanTitle.toLowerCase().includes(query) ||
      item.searchTags.some((tag) => tag.includes(query));
    const matchesFilter =
      activeFilters.length === 0 || activeFilters.includes(item.category);
    return matchesSearch && matchesFilter;
  });

  // Calculator logic
  const calcItem = mbsItems.find((i) => i.id === calcItemId);
  const scheduleFee = calcItem?.scheduleFee || 0;
  const medicareRebate = calcItem?.medicareRebate || 0;
  const feeCharged = parseFloat(calcFeeCharged) || 0;
  const gapPayment = Math.max(0, feeCharged - medicareRebate);
  const clinicEarnings = feeCharged;

  const tabs = [
    { id: "explore" as TabType, label: "Explore Items", icon: Layers },
    { id: "scenarios" as TabType, label: "Case Studies", icon: BookOpen },
    { id: "calculator" as TabType, label: "Fee Calculator", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-medium border border-teal-100">
              MBS Learning System
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1 font-sans">
            MBS Decision & Billing Guide
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Learn to bill correctly with plain-English guidance and interactive scenarios.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* iOS-Style Segmented Tab Control */}
        <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Explore Items - Master Detail */}
        {activeTab === "explore" && (
          <div className="flex gap-6">
            {/* Left Sidebar (35%) */}
            <div className="w-[35%] flex-shrink-0">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by item, condition, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-sans placeholder:text-slate-400"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {filterCategories.map((filter) => {
                  const isActive = activeFilters.includes(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => toggleFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Item List */}
              <div className="h-[calc(100vh-300px)] overflow-y-auto space-y-1 pr-1">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const complexity = complexityConfig[item.complexity];
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setNotesExpanded(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-colors font-sans ${
                        isSelected
                          ? "bg-white border-l-4 border-l-teal-600 shadow-md ring-1 ring-slate-100"
                          : "bg-transparent hover:bg-white/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-lg font-semibold ${isSelected ? "text-teal-600" : "text-slate-900"}`}>
                          Item {item.id}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          ${item.scheduleFee.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {item.humanTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          {item.timeRange}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${complexity.bg} ${complexity.text} ${complexity.border}`}>
                          {complexity.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel (65%) - Dossier Card */}
            <div className="flex-1 min-w-0">
              {selectedItem ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8">
                    {/* A. Premium Item Header */}
                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-3xl font-bold text-teal-600 font-sans">
                          Item {selectedItem.id}
                        </h2>
                        <a
                          href="https://www.mbsonline.gov.au"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600"
                        >
                          MBS Online <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-4 font-sans">
                        {selectedItem.humanTitle}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-slate-500" />
                          {selectedItem.timeRange}
                        </span>
                        <span className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${complexityConfig[selectedItem.complexity].bg} ${complexityConfig[selectedItem.complexity].text} ${complexityConfig[selectedItem.complexity].border}`}>
                          {complexityConfig[selectedItem.complexity].label} Complexity
                        </span>
                      </div>
                    </div>

                    {/* B. Plain English Meaning */}
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        What this item means
                      </h4>
                      <p className="text-slate-600 text-sm font-normal leading-relaxed">
                        {selectedItem.plainEnglish}
                      </p>
                    </div>

                    {/* C. Common Uses */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        What this item is used for
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.commonUses.map((use, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                            {use}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* D. Decision Support - Comparison Matrix */}
                    {selectedItem.comparisonItem && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          When should you use this item?
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-teal-200">
                            <span className="text-xs font-semibold text-teal-600 uppercase">This Item ({selectedItem.id})</span>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p><span className="font-medium">Duration:</span> {selectedItem.timeRange}</p>
                              <p><span className="font-medium">Complexity:</span> {complexityConfig[selectedItem.complexity].label}</p>
                              <p><span className="font-medium">Intent:</span> {selectedItem.plainEnglish.split('.')[0]}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Step-Up: Item {selectedItem.comparisonItem.id}</span>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p><span className="font-medium">Duration:</span> {selectedItem.comparisonItem.duration}</p>
                              <p><span className="font-medium">Complexity:</span> {selectedItem.comparisonItem.complexity}</p>
                              <p><span className="font-medium">Intent:</span> {selectedItem.comparisonItem.intent}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* E. Critical Billing Restrictions */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-900 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        Important Billing Restrictions
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.billingRestrictions.map((restriction, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-rose-800">
                            <span className="text-rose-400 mt-1">ΓÇó</span>
                            {restriction}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* F. Financial Breakdown Widget */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Financial Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Schedule Fee</p>
                          <p className="text-xl font-semibold">${selectedItem.scheduleFee.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Medicare Rebate (85%)</p>
                          <p className="text-xl font-semibold">${selectedItem.medicareRebate.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Patient Gap (if bulk billed)</p>
                          <p className="text-xl font-mono font-bold text-teal-400">$0.00</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Bulk Bill Status</p>
                          <p className="text-lg font-semibold">
                            {selectedItem.bulkBillable ? (
                              <span className="text-emerald-400">Γ£ô Eligible</span>
                            ) : (
                              <span className="text-rose-400">Γ£ù Not Eligible</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* G. Educational Scenario */}
                    {selectedItem.scenarios.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Clinical Case Study
                        </h4>
                        {selectedItem.scenarios.map((scenario, i) => (
                          <div key={i} className="space-y-3">
                            <div>
                              <span className="text-xs font-medium text-slate-400">Patient Presentation</span>
                              <p className="text-sm text-slate-700 mt-1">{scenario.presentation}</p>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <span className="text-xs font-medium text-slate-400">Time</span>
                                <p className="text-sm font-medium text-slate-900">{scenario.time}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400">Complexity</span>
                                <p className={`text-sm font-medium ${complexityConfig[scenario.complexity].text}`}>
                                  {complexityConfig[scenario.complexity].label}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400">Correct Item</span>
                                <p className="text-sm font-bold text-teal-600">Item {scenario.correctItem}</p>
                              </div>
                            </div>
                            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                              <span className="text-xs font-semibold text-teal-700">Why this item?</span>
                              <p className="text-sm text-teal-800 mt-1">{scenario.reasoning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* H. Official Medicare Notes Accordion */}
                    <div>
                      <button
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          View Official Medicare Notes
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${notesExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {notesExpanded && (
                        <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <ul className="space-y-2">
                            {selectedItem.officialNotes.map((note, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                                <span className="text-slate-300">ΓÇó</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 h-96 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">Select an item from the list</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Case Studies */}
        {activeTab === "scenarios" && (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">Billing Case Studies</h2>
              <p className="text-sm text-slate-500">Step-by-step clinical scenarios to master MBS billing decisions.</p>
            </div>

            <div className="space-y-4">
              {mbsItems.flatMap((item, itemIndex) =>
                item.scenarios.map((scenario, scenarioIndex) => {
                  const key = itemIndex * 10 + scenarioIndex;
                  const isExpanded = scenarioExpanded.includes(key);
                  const complexity = complexityConfig[scenario.complexity];
                  return (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold tracking-wider text-teal-600 uppercase">
                            Case Study
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${complexity.bg} ${complexity.text} ${complexity.border}`}>
                            {complexity.label}
                          </span>
                        </div>

                        <div className="mb-4">
                          <span className="text-xs font-medium text-slate-400 block mb-1">Patient Presentation</span>
                          <p className="text-sm text-slate-700 leading-relaxed">{scenario.presentation}</p>
                        </div>

                        <div className="flex gap-6 mb-4">
                          <div>
                            <span className="text-xs font-medium text-slate-400">Consultation Time</span>
                            <p className="text-sm font-semibold text-slate-900">{scenario.time}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-400">Clinical Complexity</span>
                            <p className={`text-sm font-semibold ${complexity.text}`}>{complexity.label}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleScenario(key)}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          {isExpanded ? "Hide Answer" : "Reveal Answer"}
                        </button>

                        {isExpanded && (
                          <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-teal-700">Correct Item:</span>
                              <span className="text-lg font-bold text-teal-600">Item {scenario.correctItem}</span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-teal-700">Billing Reasoning:</span>
                              <p className="text-sm text-teal-800 mt-1 leading-relaxed">{scenario.reasoning}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Fee Calculator */}
        {activeTab === "calculator" && (
          <div className="max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">Fee Calculator</h2>
              <p className="text-sm text-slate-500">Calculate patient out-of-pocket costs and clinic earnings.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex">
                {/* Left - Inputs */}
                <div className="flex-1 p-6 border-r border-slate-100">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Item Number
                      </label>
                      <select
                        value={calcItemId}
                        onChange={(e) => setCalcItemId(e.target.value)}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-sans"
                      >
                        {mbsItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            Item {item.id} ΓÇö {item.humanTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Fee Charged ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcFeeCharged}
                        onChange={(e) => setCalcFeeCharged(e.target.value)}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-sans"
                        placeholder="95.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Right - Receipt Output (Dark Mode) */}
                <div className="w-[300px] bg-slate-900 text-white p-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Billing Summary
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Schedule Fee</p>
                      <p className="text-xl font-semibold">${scheduleFee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Medicare Rebate (85%)</p>
                      <p className="text-xl font-semibold">${medicareRebate.toFixed(2)}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Patient Gap Payment</p>
                      <p className="text-2xl font-mono font-bold text-teal-400">${gapPayment.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Clinic Earnings</p>
                      <p className="text-xl font-semibold text-emerald-400">${clinicEarnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Bulk Bill Status</p>
                      <p className="text-sm font-medium">
                        {calcItem?.bulkBillable ? (
                          <span className="text-emerald-400">Γ£ô Eligible for Bulk Billing</span>
                        ) : (
                          <span className="text-rose-400">Γ£ù Not Bulk Billable</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
