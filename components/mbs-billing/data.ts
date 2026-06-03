export type TabType = "explore" | "scenarios" | "calculator";
export type ComplexityLevel = "simple" | "moderate" | "complex";

export interface MBSItem {
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

export const mbsItems: MBSItem[] = [
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

export const filterCategories = ["Standard Consults", "Mental Health", "Care Plans"];

export const complexityConfig: Record<ComplexityLevel, { label: string; bg: string; text: string; border: string }> = {
  simple: { label: "Simple", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  moderate: { label: "Moderate", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  complex: { label: "Complex", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};
