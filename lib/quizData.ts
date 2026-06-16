export type QuizStatus = "active" | "draft" | "suspended";

export interface Quiz {
  id: number;
  name: string;
  description: string;
  topics: string[];
  questionIds: number[];
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  attempts: number;
  avgScore: number;
  status: QuizStatus;
  examType: "AKT" | "KFP" | "Mixed";
  randomize: boolean;
  updatedAt: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  rationale: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  examType: "AKT" | "KFP";
  status: "draft" | "review" | "published";
  tags: string[];
  image?: string;
}

export type QuestionBankItem = Question;

export const AVAILABLE_TOPICS = [
  "Cardiology",
  "Respiratory",
  "Mental Health",
  "Dermatology",
  "Paediatrics",
  "MBS Billing",
  "Haematology",
  "Infectious Disease",
];

export const DEFAULT_QUESTIONS: Question[] = [
  { id: 2847, text: "A 54-year-old male presents with sudden chest pain. ECG shows ST elevation in leads II, III, and aVF. Which artery is most likely occluded?", options: ["Left anterior descending (LAD)", "Right coronary artery (RCA)", "Left circumflex (LCx)", "Posterior descending artery"], correctIndex: 1, rationale: "Inferior STEMI with ST elevation in II, III, aVF is most commonly caused by RCA occlusion.", topic: "Cardiology", difficulty: "Medium", examType: "AKT", status: "published", tags: ["STEMI", "ECG", "Coronary"], image: "/assets/ecg_inferior_stemi.png" },
  { id: 2848, text: "A 22-year-old female presents with acute asthma exacerbation. Her peak flow is 50% of predicted. What is the first-line medication?", options: ["Salbutamol (SABA) via spacer", "Oral prednisolone", "Inhaled fluticasone", "IV magnesium sulfate"], correctIndex: 0, rationale: "First-line treatment for acute asthma is inhaled SABA via spacer.", topic: "Respiratory", difficulty: "Easy", examType: "AKT", status: "published", tags: ["Asthma", "Emergency", "Pharmacology"] },
  { id: 2849, text: "A 35-year-old woman describes 3 weeks of depressed mood, insomnia, and anhedonia. Which screening tool is most appropriate?", options: ["GAD-7", "AUDIT", "PHQ-9", "K10"], correctIndex: 2, rationale: "PHQ-9 is the standard screening tool for depression severity.", topic: "Mental Health", difficulty: "Easy", examType: "KFP", status: "published", tags: ["Depression", "Screening", "PHQ-9"] },
  { id: 2850, text: "An elderly patient on warfarin presents with INR of 8.5 and minor gum bleeding. What is the most appropriate management?", options: ["Continue warfarin at same dose", "Withhold warfarin and give vitamin K 1-2mg orally", "Give fresh frozen plasma", "Administer prothrombinex"], correctIndex: 1, rationale: "For INR 5-9 with minor bleeding, withhold warfarin and give low-dose oral vitamin K.", topic: "Haematology", difficulty: "Hard", examType: "AKT", status: "review", tags: ["Warfarin", "INR", "Anticoagulation"] },
  { id: 2851, text: "A mother brings her 6-month-old infant for vaccination. Which vaccines are due at this age according to the Australian NIP?", options: ["DTPa, Hep B, IPV, Hib, PCV13, Rotavirus", "MMR, Varicella, MenACWY", "DTPa, IPV only", "No vaccines due at this age"], correctIndex: 0, rationale: "At 6 months, the third dose of DTPa-Hep B-IPV-Hib, PCV13 (3rd dose), and Rotavirus (3rd dose) are due.", topic: "Paediatrics", difficulty: "Medium", examType: "AKT", status: "published", tags: ["Vaccination", "NIP", "Paediatrics"] },
  { id: 2852, text: "A 45-year-old presents with a pigmented skin lesion. Which dermoscopic feature is most concerning for melanoma?", options: ["Symmetrical pattern", "Single uniform color", "Irregular blue-white veil", "Regular pigment network"], correctIndex: 2, rationale: "Blue-white veil is a high-risk dermoscopic feature associated with melanoma.", topic: "Dermatology", difficulty: "Hard", examType: "KFP", status: "draft", tags: ["Melanoma", "Dermoscopy", "Skin Cancer"], image: "/assets/melanoma_dermoscopy.png" },
  { id: 2853, text: "A GP registrar reviews MBS item 721. What is the minimum documentation required for a GPMP claim?", options: ["Patient name and date only", "Problem list, management goals, actions, review date", "Referral letter to specialist", "Hospital discharge summary"], correctIndex: 1, rationale: "A GPMP requires documented problem identification, treatment goals, actions/strategies, and agreed review arrangements.", topic: "MBS Billing", difficulty: "Medium", examType: "KFP", status: "review", tags: ["GPMP", "MBS", "Billing"] },
  { id: 2854, text: "What is the recommended first-line treatment for uncomplicated lower UTI in a non-pregnant woman?", options: ["Amoxicillin 500mg TDS for 7 days", "Trimethoprim 300mg daily for 3 days", "Ciprofloxacin 500mg BD for 5 days", "Nitrofurantoin 100mg QID for 14 days"], correctIndex: 1, rationale: "Trimethoprim 300mg daily for 3 days is first-line for uncomplicated UTI in Australia.", topic: "Infectious Disease", difficulty: "Easy", examType: "AKT", status: "published", tags: ["UTI", "Antibiotics", "Women's Health"] },
];

const QUESTIONS_STORAGE_KEY = "gpedge_admin_questions";

export function getQuestions(): Question[] {
  if (typeof window === "undefined") return DEFAULT_QUESTIONS;
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_QUESTIONS));
      return DEFAULT_QUESTIONS;
    }
    return JSON.parse(raw) as Question[];
  } catch {
    return DEFAULT_QUESTIONS;
  }
}

export function saveQuestions(questions: Question[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
  // Mutate QUESTION_BANK in-place to keep imports updated
  QUESTION_BANK.length = 0;
  QUESTION_BANK.push(...questions);
}

export const QUESTION_BANK: Question[] = [];
if (typeof window !== "undefined") {
  QUESTION_BANK.push(...getQuestions());
} else {
  QUESTION_BANK.push(...DEFAULT_QUESTIONS);
}

const STORAGE_KEY = "gpedge_admin_quizzes";

const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 1,
    name: "AKT Full Mock Exam 2026",
    description: "Comprehensive AKT mock covering cardiology, respiratory, mental health, and dermatology.",
    topics: ["Cardiology", "Respiratory", "Mental Health", "Dermatology"],
    questionIds: [2847, 2848, 2849, 2852],
    questionCount: 4,
    timeLimit: 210,
    passingScore: 65,
    attempts: 2340,
    avgScore: 72,
    status: "active",
    examType: "AKT",
    randomize: true,
    updatedAt: "2026-05-28T10:00:00.000Z",
  },
  {
    id: 2,
    name: "KFP Practice — Cardiovascular",
    description: "Focused KFP cardiovascular cases for registrar practice.",
    topics: ["Cardiology"],
    questionIds: [2847],
    questionCount: 1,
    timeLimit: 60,
    passingScore: 70,
    attempts: 876,
    avgScore: 68,
    status: "active",
    examType: "KFP",
    randomize: false,
    updatedAt: "2026-05-25T14:30:00.000Z",
  },
  {
    id: 3,
    name: "Mental Health Focused Quiz",
    description: "Screening tools and management pathways for common mental health presentations.",
    topics: ["Mental Health"],
    questionIds: [2849],
    questionCount: 1,
    timeLimit: 45,
    passingScore: 60,
    attempts: 543,
    avgScore: 61,
    status: "active",
    examType: "KFP",
    randomize: true,
    updatedAt: "2026-05-20T09:15:00.000Z",
  },
  {
    id: 4,
    name: "Paediatrics Rapid Fire",
    description: "Quick-fire paediatric vaccination and development questions.",
    topics: ["Paediatrics"],
    questionIds: [2851],
    questionCount: 1,
    timeLimit: 30,
    passingScore: 65,
    attempts: 321,
    avgScore: 74,
    status: "active",
    examType: "AKT",
    randomize: true,
    updatedAt: "2026-05-18T11:00:00.000Z",
  },
  {
    id: 5,
    name: "MBS Billing Mastery",
    description: "MBS items, GPMP documentation, and billing compliance scenarios.",
    topics: ["MBS Billing"],
    questionIds: [2853],
    questionCount: 1,
    timeLimit: 60,
    passingScore: 75,
    attempts: 198,
    avgScore: 69,
    status: "active",
    examType: "KFP",
    randomize: false,
    updatedAt: "2026-05-15T16:45:00.000Z",
  },
  {
    id: 6,
    name: "Dermatology Deep Dive",
    description: "Dermoscopy and skin cancer recognition for KFP preparation.",
    topics: ["Dermatology"],
    questionIds: [2852],
    questionCount: 1,
    timeLimit: 40,
    passingScore: 65,
    attempts: 0,
    avgScore: 0,
    status: "draft",
    examType: "KFP",
    randomize: true,
    updatedAt: "2026-05-10T08:00:00.000Z",
  },
];

function syncQuizDerivedFields(quiz: Quiz): Quiz {
  const topics = Array.from(
    new Set(
      quiz.questionIds
        .map((id) => QUESTION_BANK.find((q) => q.id === id)?.topic)
        .filter(Boolean) as string[]
    )
  );
  return {
    ...quiz,
    questionCount: quiz.questionIds.length,
    topics: quiz.topics.length > 0 ? quiz.topics : topics,
    updatedAt: new Date().toISOString(),
  };
}

export function getQuizzes(): Quiz[] {
  if (typeof window === "undefined") return DEFAULT_QUIZZES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_QUIZZES));
      return DEFAULT_QUIZZES;
    }
    return JSON.parse(raw) as Quiz[];
  } catch {
    return DEFAULT_QUIZZES;
  }
}

export function saveQuizzes(quizzes: Quiz[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

export function getQuizById(id: number): Quiz | undefined {
  return getQuizzes().find((q) => q.id === id);
}

export function createQuiz(
  partial: Pick<Quiz, "name"> &
    Partial<Omit<Quiz, "id" | "name" | "attempts" | "avgScore" | "updatedAt">>
): Quiz {
  const quizzes = getQuizzes();
  const nextId = quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.id)) + 1 : 1;
  const newQuiz = syncQuizDerivedFields({
    id: nextId,
    name: partial.name,
    description: partial.description ?? "",
    topics: partial.topics ?? [],
    questionIds: partial.questionIds ?? [],
    questionCount: partial.questionIds?.length ?? 0,
    timeLimit: partial.timeLimit ?? 60,
    passingScore: partial.passingScore ?? 65,
    attempts: 0,
    avgScore: 0,
    status: partial.status ?? "draft",
    examType: partial.examType ?? "AKT",
    randomize: partial.randomize ?? true,
    updatedAt: new Date().toISOString(),
  });
  saveQuizzes([newQuiz, ...quizzes]);
  return newQuiz;
}

export function updateQuiz(id: number, updates: Partial<Quiz>): Quiz | null {
  const quizzes = getQuizzes();
  const index = quizzes.findIndex((q) => q.id === id);
  if (index === -1) return null;
  const updated = syncQuizDerivedFields({ ...quizzes[index], ...updates, id });
  quizzes[index] = updated;
  saveQuizzes(quizzes);
  return updated;
}

export function deleteQuiz(id: number): boolean {
  const quizzes = getQuizzes();
  const filtered = quizzes.filter((q) => q.id !== id);
  if (filtered.length === quizzes.length) return false;
  saveQuizzes(filtered);
  return true;
}

export function duplicateQuiz(id: number): Quiz | null {
  const source = getQuizById(id);
  if (!source) return null;
  return createQuiz({
    name: `${source.name} (Copy)`,
    description: source.description,
    topics: [...source.topics],
    questionIds: [...source.questionIds],
    timeLimit: source.timeLimit,
    passingScore: source.passingScore,
    status: "draft",
    examType: source.examType,
    randomize: source.randomize,
  });
}

export function getQuestionById(id: number): QuestionBankItem | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

export interface TopicItem {
  name: string;
  questions: number;
  usage: number;
  subtopics: number;
  subtopicTags?: string[];
}

const DEFAULT_TOPICS: TopicItem[] = [
  { name: "Cardiology", questions: 420, usage: 1204, subtopics: 12 },
  { name: "Respiratory", questions: 380, usage: 987, subtopics: 8 },
  { name: "Mental Health", questions: 200, usage: 342, subtopics: 6 },
  { name: "Dermatology", questions: 160, usage: 289, subtopics: 9 },
  { name: "Paediatrics", questions: 170, usage: 256, subtopics: 7 },
  { name: "Musculoskeletal", questions: 290, usage: 756, subtopics: 10 },
  { name: "Endocrine", questions: 210, usage: 543, subtopics: 5 },
  { name: "Gastroenterology", questions: 250, usage: 654, subtopics: 8 },
  { name: "MBS Billing", questions: 180, usage: 198, subtopics: 4 },
  { name: "Women's Health", questions: 150, usage: 198, subtopics: 6 },
];

const TOPICS_STORAGE_KEY = "gpedge_admin_topics";

export function getTopics(): TopicItem[] {
  if (typeof window === "undefined") return DEFAULT_TOPICS;
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(DEFAULT_TOPICS));
      return DEFAULT_TOPICS;
    }
    return JSON.parse(raw) as TopicItem[];
  } catch {
    return DEFAULT_TOPICS;
  }
}

export function saveTopics(topics: TopicItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
}

const CUSTOM_TAGS_STORAGE_KEY = "gpedge_admin_custom_tags";

export function getCustomTags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveCustomTags(tags: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(tags));
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  plan: "premium" | "free";
  lastActive: string;
  status: "active" | "suspended";
  joined: string;
  notes: string[];
}

const DEFAULT_USERS: AdminUser[] = [
  { id: 1001, name: "Account #1001", email: "subscriber@domain.com", plan: "premium", lastActive: "2 mins ago", status: "active", joined: "12 Jan 2026", notes: [] },
  { id: 1002, name: "Account #1002", email: "subscriber@domain.com", plan: "premium", lastActive: "1 hour ago", status: "active", joined: "3 Feb 2026", notes: ["Referred via supervisor program"] },
  { id: 1003, name: "Account #1003", email: "subscriber@domain.com", plan: "free", lastActive: "3 hours ago", status: "active", joined: "18 Feb 2026", notes: [] },
  { id: 1004, name: "Account #1004", email: "subscriber@domain.com", plan: "premium", lastActive: "5 hours ago", status: "active", joined: "7 Dec 2025", notes: [] },
  { id: 1005, name: "Account #1005", email: "subscriber@domain.com", plan: "free", lastActive: "1 day ago", status: "active", joined: "28 Mar 2026", notes: [] },
  { id: 1006, name: "Account #1006", email: "subscriber@domain.com", plan: "free", lastActive: "3 days ago", status: "suspended", joined: "15 Apr 2026", notes: ["Flagged — ToS policy review"] },
  { id: 1007, name: "Account #1007", email: "subscriber@domain.com", plan: "premium", lastActive: "30 mins ago", status: "active", joined: "20 Jan 2026", notes: [] },
  { id: 1008, name: "Account #1008", email: "subscriber@domain.com", plan: "free", lastActive: "2 days ago", status: "active", joined: "9 Mar 2026", notes: [] },
  { id: 1009, name: "Account #1009", email: "subscriber@domain.com", plan: "premium", lastActive: "6 hours ago", status: "active", joined: "14 Feb 2026", notes: [] },
  { id: 1010, name: "Account #1010", email: "subscriber@domain.com", plan: "free", lastActive: "5 days ago", status: "active", joined: "2 May 2026", notes: [] },
  { id: 1011, name: "Account #1011", email: "subscriber@domain.com", plan: "premium", lastActive: "15 mins ago", status: "active", joined: "1 Nov 2025", notes: [] },
  { id: 1012, name: "Account #1012", email: "subscriber@domain.com", plan: "free", lastActive: "1 week ago", status: "suspended", joined: "22 Apr 2026", notes: ["Inactive — renewal not completed"] },
];

const ADMIN_USERS_STORAGE_KEY = "gpedge_admin_users";

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw) as AdminUser[];
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveAdminUsers(users: AdminUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
}

export interface MedicalContent {
  id: number;
  name: string;
  category: string;
  system: string;
  type: "Condition" | "Guideline" | "Protocol" | "Pathway" | "Document" | "Note";
  status: "published" | "draft" | "review";
  lastUpdated: string;
  author: string;
  references: number;
  tags?: string[];
  usedInQuestions?: number;
}

const DEFAULT_MEDICAL_CONTENT: MedicalContent[] = [
  { id: 1, name: "Type 2 Diabetes Management", category: "Chronic Disease", system: "Endocrine", type: "Guideline", status: "published", lastUpdated: "28 May 2026", author: "GP Edge Content Team", references: 12 },
  { id: 2, name: "Acute Coronary Syndrome", category: "Emergency", system: "Cardiovascular", type: "Protocol", status: "published", lastUpdated: "25 May 2026", author: "GP Edge Admin", references: 18 },
  { id: 3, name: "Childhood Immunisation Schedule", category: "Preventive", system: "Paediatrics", type: "Guideline", status: "published", lastUpdated: "22 May 2026", author: "GP Edge Content Team", references: 8 },
  { id: 4, name: "Depression Screening & Management", category: "Mental Health", system: "Psychiatry", type: "Pathway", status: "review", lastUpdated: "20 May 2026", author: "GP Edge Editorial Team", references: 15 },
  { id: 5, name: "Asthma Action Plan", category: "Chronic Disease", system: "Respiratory", type: "Protocol", status: "published", lastUpdated: "18 May 2026", author: "GP Edge Content Team", references: 9 },
  { id: 6, name: "Melanoma Detection & Referral", category: "Skin Cancer", system: "Dermatology", type: "Pathway", status: "draft", lastUpdated: "15 May 2026", author: "GP Edge Editorial Team", references: 6 },
  { id: 7, name: "Antenatal Care Schedule", category: "Obstetrics", system: "Women's Health", type: "Guideline", status: "published", lastUpdated: "12 May 2026", author: "GP Edge Admin", references: 14 },
  { id: 8, name: "GORD Management Algorithm", category: "GI", system: "Gastroenterology", type: "Pathway", status: "review", lastUpdated: "10 May 2026", author: "GP Edge Content Team", references: 7 },
  { id: 9, name: "Red Flags in Back Pain", category: "MSK", system: "Musculoskeletal", type: "Protocol", status: "published", lastUpdated: "8 May 2026", author: "GP Edge Admin", references: 11 },
  { id: 10, name: "MBS Item 721 — GPMP Guide", category: "Billing", system: "MBS", type: "Guideline", status: "draft", lastUpdated: "5 May 2026", author: "GP Edge Editorial Team", references: 4 },
];

const MEDICAL_CONTENT_STORAGE_KEY = "gpedge_admin_medical_content";

export function getMedicalContent(): MedicalContent[] {
  if (typeof window === "undefined") return DEFAULT_MEDICAL_CONTENT;
  try {
    const raw = localStorage.getItem(MEDICAL_CONTENT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEDICAL_CONTENT_STORAGE_KEY, JSON.stringify(DEFAULT_MEDICAL_CONTENT));
      return DEFAULT_MEDICAL_CONTENT;
    }
    return JSON.parse(raw) as MedicalContent[];
  } catch {
    return DEFAULT_MEDICAL_CONTENT;
  }
}

export function saveMedicalContent(content: MedicalContent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEDICAL_CONTENT_STORAGE_KEY, JSON.stringify(content));
}

export interface AutofillTemplate {
  id: number;
  name: string;
  category: string;
  system: string;
  fields: number;
  usageCount: number;
  lastUsed: string;
  status: "active" | "draft" | "suspended" | "archived";
  author: string;
  version: string;
  slug?: string;
  description?: string;
  tags?: string[];
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  doctorSummary?: string;
  patientResources?: string;
  references?: string;
  followupNotes?: string;
  sampleFields: { name: string; type: string; required: boolean; placeholder?: string; options?: string[] }[];
  versions?: { version: string; updatedAt: string; changeLog: string; content: any }[];
  content?: string;
}

export const DEFAULT_AUTOFILL_TEMPLATES: AutofillTemplate[] = [
  { 
    id: 1, 
    name: "URTI Assessment", 
    category: "Acute", 
    system: "Respiratory", 
    fields: 6, 
    usageCount: 2340, 
    lastUsed: "2 mins ago", 
    status: "active", 
    author: "GP Edge Content Team", 
    version: "v3.1",
    slug: "urti-assessment",
    description: "Routine clinical assessment for acute viral and bacterial upper respiratory tract infections.",
    tags: ["Sore Throat", "Cough", "Viral", "Respiratory"],
    subjective: "Patient presents with sore throat and dry cough for {{symptom_duration}} days. No dyspnoea, no fevers. Associated rhinorrhoea.",
    objective: "Temp: {{temperature}}C. Chest clear on auscultation. Throat: mild erythema, no tonsillar exudate, no cervical lymphadenopathy.",
    assessment: "Viral upper respiratory tract infection (URTI) with no signs of secondary bacterial complication.",
    plan: "Symptomatic management: paracetamol or ibuprofen PRN, warm saline gargles. Increase fluid intake and rest. Safety-netted: return if dyspnoea or high fevers develop.",
    doctorSummary: "Standard viral URTI template. No antibiotics indicated at this stage.",
    patientResources: "Provide RACGP viral URTI factsheet and healthdirect self-care guide.",
    references: "Australian Therapeutic Guidelines - Respiratory. RACGP Clinical Guidelines.",
    followupNotes: "Review in 3 days if symptoms do not improve or if systemic symptoms worsen.",
    sampleFields: [
      { name: "Symptom Duration (Days)", type: "Dropdown", required: true, options: ["1-2", "3-5", "7+"] },
      { name: "Temperature", type: "Numeric", required: true, placeholder: "e.g. 37.2" },
      { name: "Cough Present", type: "Checkbox", required: false }
    ],
    versions: []
  },
  { 
    id: 2, 
    name: "DIABETES ANNUAL CYCLE OF CARE", 
    category: "Chronic", 
    system: "Endocrine", 
    fields: 15, 
    usageCount: 1876, 
    lastUsed: "15 mins ago", 
    status: "active", 
    author: "GP Edge Admin", 
    version: "v2.4",
    slug: "t2dm-review",
    description: "DIABETES ANNUAL CYCLE OF CARE Chronic Disease management plan template.",
    tags: ["Diabetes", "Chronic", "Endocrine", "MBS"],
    subjective: `Patient Name: {{patient_name}}
DOB: {{dob}}
Date: {{date}}

CURRENT STATUS:
- Latest HbA1c: {{hba1c}} %
- Fasting Lipids: Chol {{cholesterol}}, Trig {{triglycerides}}, HDL {{hdl}}, LDL {{ldl}}
- eGFR: {{egfr}}
- Urine ACR: {{urine_acr}}`,
    objective: `EXAMINATIONS:
- Blood Pressure: {{blood_pressure}} mmHg
- BMI: {{bmi}} kg/m2
- Foot Exam: {{foot_exam}}
- Eye Check: {{eye_check}}`,
    assessment: "Established Type 2 Diabetes Mellitus.",
    plan: `MANAGEMENT PLAN:
1. Continue current medications: {{medications}}
2. Dietary advice provided.
3. Encourage 150 mins moderate exercise per week.
4. Next review in 6 months.`,
    content: `Patient Name: {{patient_name}}
DOB: {{dob}}
Date: {{date}}

CURRENT STATUS:
- Latest HbA1c: {{hba1c}} %
- Fasting Lipids: Chol {{cholesterol}}, Trig {{triglycerides}}, HDL {{hdl}}, LDL {{ldl}}
- eGFR: {{egfr}}
- Urine ACR: {{urine_acr}}

EXAMINATIONS:
- Blood Pressure: {{blood_pressure}} mmHg
- BMI: {{bmi}} kg/m2
- Foot Exam: {{foot_exam}}
- Eye Check: {{eye_check}}

MANAGEMENT PLAN:
1. Continue current medications: {{medications}}
2. Dietary advice provided.
3. Encourage 150 mins moderate exercise per week.
4. Next review in 6 months.`,
    doctorSummary: "Diabetes Cycle of Care checks up to date. Sensation intact.",
    patientResources: "Diabetes Australia lifestyle information pack and NDSS leaflet.",
    references: "RACGP/Diabetes Australia Management of Type 2 Diabetes in General Practice.",
    followupNotes: "Review in 6 months.",
    sampleFields: [
      { name: "Patient Name", type: "Text Input", required: true, placeholder: "e.g. John Doe" },
      { name: "DOB", type: "Text Input", required: true, placeholder: "e.g. 15/08/1980" },
      { name: "Date", type: "Text Input", required: true, placeholder: "e.g. 14/06/2026" },
      { name: "Latest HbA1c (%)", type: "Numeric", required: true, placeholder: "e.g. 6.8" },
      { name: "Cholesterol", type: "Numeric", required: true, placeholder: "e.g. 4.2" },
      { name: "Triglycerides", type: "Numeric", required: true, placeholder: "e.g. 1.7" },
      { name: "HDL", type: "Numeric", required: true, placeholder: "e.g. 1.1" },
      { name: "LDL", type: "Numeric", required: true, placeholder: "e.g. 2.4" },
      { name: "eGFR", type: "Numeric", required: true, placeholder: "e.g. 75" },
      { name: "Urine ACR", type: "Numeric", required: true, placeholder: "e.g. 1.5" },
      { name: "Blood Pressure", type: "Text Input", required: true, placeholder: "e.g. 130/80" },
      { name: "BMI", type: "Numeric", required: true, placeholder: "e.g. 27.5" },
      { name: "Foot Exam", type: "Text Input", required: true, placeholder: "e.g. Intact sensation, pulses present. No ulcers." },
      { name: "Eye Check", type: "Text Input", required: true, placeholder: "e.g. Optometrist review completed on 14/06/2026" },
      { name: "Medications", type: "Textarea", required: true, placeholder: "e.g. Metformin 1000mg BD" }
    ],
    versions: []
  },
  { 
    id: 3, 
    name: "Mental Health Treatment Plan", 
    category: "Mental Health", 
    system: "Psychiatry", 
    fields: 13, 
    usageCount: 1543, 
    lastUsed: "1 hour ago", 
    status: "active", 
    author: "GP Edge Editorial Team", 
    version: "v4.0",
    slug: "mental-health-plan",
    description: "Standardised GP Mental Health Treatment Plan (MHTP) including presenting issue, history, risk assessment, and management plan.",
    tags: ["Mental Health", "MHTP", "Psychiatry", "Referral", "MBS"],
    subjective: `Patient Name: {{patient_name}}
DOB: {{dob}}
Date: {{date}}

PRESENTING ISSUE:
- Main psychological symptoms: {{presenting_issue}}
- Duration: {{duration}}
- Impact on daily functioning: {{impact_on_functioning}}

HISTORY:
- Past mental health history: {{past_mh_history}}
- Current medications: {{current_medications}}
- Social history: {{social_history}}`,
    objective: `RISK ASSESSMENT:
- Harm to self: {{harm_to_self}}
- Harm to others: {{harm_to_others}}

Mental State Examination (MSE):
- Appearance & Behaviour: Appropriate dress, cooperative
- Speech: Normal rate, volume, and tone
- Mood & Affect: Euthymic / anxious / flat
- Thought Content & Process: No delusions, logical and goal-directed
- Perception: No hallucinations
- Cognition: Alert and oriented x3
- Insight & Judgement: Intact`,
    assessment: `GP Mental Health Treatment Plan (MBS Item 2715/2717)
Provisional Diagnosis: {{provisional_diagnosis}}`,
    plan: `MANAGEMENT PLAN:
1. Referral to Psychology: {{psychologist_name}} for focused psychological strategies (initial course of 6 sessions).
2. Review: in 4 weeks (MBS Item 2712).
3. Patient provided with crisis contact numbers (Lifeline 13 11 14).`,
    doctorSummary: "Standardised GP Mental Health Treatment Plan (MHTP). Enables MBS rebates for up to 10 psychology sessions per calendar year in Australia. Must include assessment, risk profile, and structured management plan.",
    patientResources: "- Lifeline Australia (24/7 Crisis Support): 13 11 14 (https://www.lifeline.org.au)\n- Beyond Blue: 1300 22 4636 (https://www.beyondblue.org.au)\n- Headspace (for young people 12-25): 1800 650 890 (https://headspace.org.au)",
    references: "MBS Online (Items 2715, 2717, 2712); RACGP GP Mental Health Treatment Plan Guide; GPMHSC Guidelines.",
    followupNotes: "Review in 4 weeks for MHTP Review (MBS Item 2712) to assess progress and psychologist feedback.",
    sampleFields: [
      { name: "Patient Name", type: "Text Input", required: true, placeholder: "e.g. John Doe" },
      { name: "DOB", type: "Text Input", required: true, placeholder: "e.g. 15/08/1988" },
      { name: "Date", type: "Text Input", required: true, placeholder: "e.g. 14/06/2026" },
      { name: "Presenting Issue", type: "Textarea", required: true, placeholder: "Describe main psychological symptoms..." },
      { name: "Duration", type: "Text Input", required: false, placeholder: "e.g. 3 months" },
      { name: "Impact on Functioning", type: "Dropdown", required: false, options: ["Mild", "Moderate", "Severe"] },
      { name: "Past MH History", type: "Text Input", required: false, placeholder: "e.g. Previous episode of anxiety in 2021" },
      { name: "Current Medications", type: "Text Input", required: false, placeholder: "e.g. Nil" },
      { name: "Social History", type: "Text Input", required: false, placeholder: "e.g. Lives with partner, employed full-time" },
      { name: "Harm to Self", type: "Dropdown", required: true, options: ["Low", "Medium", "High"] },
      { name: "Harm to Others", type: "Dropdown", required: true, options: ["Low", "Medium", "High"] },
      { name: "Provisional Diagnosis", type: "Dropdown", required: true, options: ["Generalized Anxiety Disorder", "Major Depressive Disorder", "Adjustment Disorder", "Other / Mixed Anxiety & Depression"] },
      { name: "Psychologist Name", type: "Text Input", required: false, placeholder: "e.g. Peak Psychology" }
    ],
    versions: []
  },
  { 
    id: 4, 
    name: "Skin Check Template", 
    category: "Screening", 
    system: "Dermatology", 
    fields: 6, 
    usageCount: 987, 
    lastUsed: "3 hours ago", 
    status: "active", 
    author: "GP Edge Content Team", 
    version: "v1.2",
    slug: "skin-check",
    description: "Structured template for full-body dermoscopic skin examinations.",
    tags: ["Skin Cancer", "Dermoscopy", "Excision", "Dermatology"],
    subjective: "Patient requests full skin check. Family history of melanoma. Patient reports one changing lesion on back.",
    objective: "Dermoscopy: {{lesion_location}} - asymmetrical pigment network, atypical dots/globules. Other moles within benign limits.",
    assessment: "Atypical melanocytic nevus on {{lesion_location}}, R/O early melanoma/dysplastic nevus.",
    plan: "Schedule excisional biopsy of lesion on {{lesion_location}} with 2mm margins next week. Suture removal in 7 days.",
    doctorSummary: "Atypical lesion noted. Excisional biopsy booked.",
    patientResources: "Cancer Council Australia: Excision patient guide and sun protection leaflet.",
    references: "Cancer Council Australia Clinical Practice Guidelines for Melanoma.",
    followupNotes: "Review pathology results in 5 days.",
    sampleFields: [
      { name: "Lesion Location", type: "Text Input", required: true, placeholder: "e.g. Right upper back" }
    ],
    versions: []
  },
  { 
    id: 5, 
    name: "Antenatal Visit", 
    category: "Screening", 
    system: "Women's Health", 
    fields: 6, 
    usageCount: 654, 
    lastUsed: "5 hours ago", 
    status: "active", 
    author: "GP Edge Admin", 
    version: "v2.0",
    slug: "antenatal-visit",
    description: "Standard checklist and summary template for antenatal checks.",
    tags: ["Pregnancy", "Antenatal", "Screening", "Obstetrics"],
    subjective: "Routine antenatal review. Gestation: {{gestation_weeks}} weeks. Reports good fetal movements. No bleeding, no fluid loss.",
    objective: "BP: {{blood_pressure}} mmHg. Symphyseal-fundal height: {{sf_height}} cm. Fetal heart rate: {{fetal_hr}} bpm, regular.",
    assessment: "Single intrauterine pregnancy at {{gestation_weeks}} weeks, progressing normally.",
    plan: "1. Arrange routine scans (morphology scan if due). 2. Discuss gestational diabetes screening (GTT due at 24-28 weeks). 3. Standard antenatal advice.",
    doctorSummary: "Progressing well. FHR regular.",
    patientResources: "Pregnancy, Birth and Baby helpline contacts and gestational diabetes factsheet.",
    references: "Australian Clinical Practice Guidelines for Pregnancy Care.",
    followupNotes: "Review in 4 weeks for next routine antenatal visit.",
    sampleFields: [
      { name: "Gestation Weeks", type: "Numeric", required: true, placeholder: "e.g. 24" },
      { name: "SF Height (cm)", type: "Numeric", required: false, placeholder: "e.g. 24" },
      { name: "Fetal HR (bpm)", type: "Numeric", required: true, placeholder: "e.g. 145" }
    ],
    versions: []
  },
  { 
    id: 6, 
    name: "Paediatric Well Child Check", 
    category: "Screening", 
    system: "Paediatrics", 
    fields: 6, 
    usageCount: 432, 
    lastUsed: "1 day ago", 
    status: "active", 
    author: "GP Edge Content Team", 
    version: "v1.8",
    slug: "paediatric-check",
    description: "Developmental checklist for pediatric well-child visits.",
    tags: ["Pediatrics", "Developmental", "Vaccination", "Screening"],
    subjective: "Mother presents with child {{child_name}} aged {{child_age}} for routine development review. No parental concerns regarding milestones.",
    objective: "Weight: {{child_weight}} kg. Developmental milestones: age-appropriate gross motor, social, and language development.",
    assessment: "Healthy developmental progress for age, milestones met.",
    plan: "1. Administer NIP vaccinations (due at {{child_age}}). 2. Provide guidance on safety and nutrition. 3. Book next check in 6 months.",
    doctorSummary: "Development normal. Immunisations up to date.",
    patientResources: "Australian NIP schedule brochure and raisingchildren.net.au portal guide.",
    references: "NSW Health Blue Book developmental checklist. Australian Immunisation Handbook.",
    followupNotes: "Review at next scheduled immunisation interval.",
    sampleFields: [
      { name: "Child Name", type: "Text Input", required: true, placeholder: "e.g. Leo" },
      { name: "Child Age", type: "Dropdown", required: true, options: ["6 weeks", "4 months", "6 months", "12 months", "18 months", "4 years"] },
      { name: "Child Weight (kg)", type: "Numeric", required: true, placeholder: "e.g. 8.2" }
    ],
    versions: []
  },
  { 
    id: 7, 
    name: "Hypertension Review", 
    category: "Chronic", 
    system: "Cardiovascular", 
    fields: 6, 
    usageCount: 876, 
    lastUsed: "2 hours ago", 
    status: "active", 
    author: "GP Edge Admin", 
    version: "v3.2",
    slug: "hypertension-review",
    description: "Standard GP consultation outline for hypertensive patients.",
    tags: ["Hypertension", "Cardiology", "Chronic", "BP"],
    subjective: "Presents for routine blood pressure check. Reports regular home readings around {{home_bp}} mmHg. Denies chest pain, shortness of breath, or headache.",
    objective: "Clinic BP: {{clinic_bp}} mmHg. Heart rate: {{heart_rate}} bpm, regular rhythm. No ankle oedema.",
    assessment: "Essential Hypertension, stable control on current pharmacotherapy.",
    plan: "1. Continue current antihypertensives. 2. Counsel on low-sodium diet and lifestyle. 3. Order UEC and ECG (due).",
    doctorSummary: "Control stable. Advised on home readings.",
    patientResources: "Heart Foundation guide to active BP management and salt restriction leaflet.",
    references: "National Heart Foundation of Australia Hypertension Guidelines.",
    followupNotes: "Review in 6 months with pathology results.",
    sampleFields: [
      { name: "Home BP", type: "Text Input", required: true, placeholder: "e.g. 130/80" },
      { name: "Clinic BP", type: "Text Input", required: true, placeholder: "e.g. 135/85" },
      { name: "Heart Rate", type: "Numeric", required: true, placeholder: "e.g. 72" }
    ],
    versions: []
  },
  { 
    id: 8, 
    name: "GORD Assessment", 
    category: "Acute", 
    system: "Gastroenterology", 
    fields: 6, 
    usageCount: 345, 
    lastUsed: "1 day ago", 
    status: "draft", 
    author: "GP Edge Editorial Team", 
    version: "v1.0",
    slug: "gord-assessment",
    description: "Assessment template for gastro-oesophageal reflux disease symptoms.",
    tags: ["Reflux", "GORD", "GI", "Dyspepsia"],
    subjective: "Presents with retrosternal burning pain after meals for {{symptom_duration}} weeks. Exacerbated by spicy food and recumbency. Denies dysphagia or weight loss.",
    objective: "Abdomen: soft, non-tender. No organomegaly or epigastric tenderness. Vital signs stable.",
    assessment: "Gastro-oesophageal Reflux Disease (GORD), likely uncomplicated.",
    plan: "1. Trial Pantoprazole {{ppi_dose}} daily for 4-8 weeks. 2. Lifestyle advice: avoid trigger foods, do not lie down immediately after eating.",
    doctorSummary: "Classic GORD symptoms. No alarm flags present.",
    patientResources: "Gastroenterological Society of Australia (GESA) reflux diet guide.",
    references: "Therapeutic Guidelines - Gastrointestinal. GESA GORD guidelines.",
    followupNotes: "Review in 4 weeks to assess PPI response.",
    sampleFields: [
      { name: "Symptom Duration (Weeks)", type: "Numeric", required: true, placeholder: "e.g. 3" },
      { name: "PPI Dose", type: "Dropdown", required: true, options: ["20mg daily", "40mg daily"] }
    ],
    versions: []
  },
  { 
    id: 9, 
    name: "Lower Back Pain", 
    category: "Acute", 
    system: "Musculoskeletal", 
    fields: 6, 
    usageCount: 567, 
    lastUsed: "6 hours ago", 
    status: "active", 
    author: "GP Edge Content Team", 
    version: "v2.1",
    slug: "lower-back-pain",
    description: "Comprehensive review template for mechanical lower back pain.",
    tags: ["Back Pain", "MSK", "Acute", "Spine"],
    subjective: "Presents with lower back pain after lifting object {{symptom_duration}} days ago. Pain is localized, no radiation down legs. Denies bowel or bladder dysfunction.",
    objective: "Spine: tenderness over lumbar region, range of movement restricted. SLR negative at {{slr_angle}} degrees bilateral. Lower limb neurology intact.",
    assessment: "Acute mechanical lower back pain.",
    plan: "1. Reassurance of self-limiting nature. 2. Regular paracetamol and NSAIDs. 3. Advise active movement, avoid bed rest. 4. Refer to physio if needed.",
    doctorSummary: "No red flags. Lumbar muscle strain suspected.",
    patientResources: "RACGP lower back pain self-management factsheet.",
    references: "RACGP Guideline for the Management of Musculoskeletal Pain.",
    followupNotes: "Review in 1 week if pain is not resolving.",
    sampleFields: [
      { name: "Symptom Duration (Days)", type: "Numeric", required: true, placeholder: "e.g. 2" },
      { name: "SLR Angle (Degrees)", type: "Numeric", required: true, placeholder: "e.g. 80" }
    ],
    versions: []
  },
  { 
    id: 10, 
    name: "MBS 721 — GPMP Template", 
    category: "Billing", 
    system: "MBS", 
    fields: 6, 
    usageCount: 198, 
    lastUsed: "2 days ago", 
    status: "draft", 
    author: "GP Edge Editorial Team", 
    version: "v0.9",
    slug: "gpmp-billing",
    description: "Billing checklist and planning guide for GP Management Plans.",
    tags: ["GPMP", "Billing", "MBS", "Item 721"],
    subjective: "Eligible chronic disease patient presents for GP Management Plan (GPMP). Co-morbidities: {{chronic_conditions}}.",
    objective: "Meets clinical criteria for chronic condition management plan under Medicare guidelines.",
    assessment: "Chronic disease management care coordination required (MBS Item 721).",
    plan: "1. Document patient details, management goals, and agreed care strategies. 2. Schedule allied health team reviews (TCA Item 723). 3. Obtain patient consent.",
    doctorSummary: "GPMP completed and signed. Review scheduled.",
    patientResources: "Medicare information pamphlet for chronic care plans.",
    references: "Medicare Benefits Schedule (MBS) General Practice Services rules.",
    followupNotes: "Schedule review in 6 months (Item 732).",
    sampleFields: [
      { name: "Chronic Conditions", type: "Text Input", required: true, placeholder: "e.g. T2DM, Hypertension" }
    ],
    versions: []
  },
  { 
    id: 11, 
    name: "Male Sub-fertility Assessment", 
    category: "Chronic", 
    system: "Men's Health", 
    fields: 8, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "male-sub-fertility",
    description: "Comprehensive assessment for male factor sub-fertility including history, examination, and investigation plan.",
    tags: ["Sub-fertility", "Semen Analysis", "Andrology", "Men's Health"],
    subjective: `F2F — Patient and partner presenting for investigation of sub-fertility.

DURATION: Trying to conceive for ^ months/years.

Partner's Details:
- Partner's age: ^ yrs
- Known female factor issues (e.g., PCOS, endometriosis, tubal-blockage): Yes / No
- Partner's previous conceptions: Yes / No

Fertility History (Patient):
- Previous children (with current or previous partners): Yes / No, at age ^ yrs

Sexual History:
- Frequency of intercourse: ^ times per week/month
- Timing of intercourse (re: fertile window): ^
- Difficulties: Erectile dysfunction (present/absent), ejaculatory issues (premature, delayed, anejaculation), dyspareunia
- Libido: Normal / Decreased / Increased

Past Medical History:
Childhood:
- ^ declines hx of cryptorchidism
- ^ declines hx of scrotal surgery
- ^ declines hx of hernia repair
- ^ declines hx of mumps

Genitourinary:
- ^ Declines hx of STIs (Chlamydia, Gonorrhoea)
- ^ declines hx of Epididymo-orchitis / Prostatitis
- ^ declines hx of Testicular/scrotal trauma
- ^ declines vasectomy

Systemic Illness:
- ^ no known hx of Diabetes Mellitus
- ^ declines hx of chemotherapy / radiotherapy

Medications & Allergies: (mention if on TRT, 5-ARIs, spironolactone or sulfasalazine)

Social History:
Occupation:
- Exposure to: Heat / Pesticides / Solvents / Heavy metals / Radiation: Yes / No

Substance Use:
- Smoking: Current / Ex / Never (^ packs/day)
- Alcohol: ^ standard drinks per week
- Recreational Drugs: ^ Declines any
  - Marijuana: Yes / No  |  Cocaine: Yes / No  |  Opiates: Yes / No
  - Anabolic steroids (current or past): Yes / No

General Health:
- Diet and exercise: ^
- Recent high fevers: Yes / No
- Testicular heat exposure (e.g., saunas, hot tubs): Yes / No

Family History:
- Infertility (siblings, parents): Yes / No
- Genetic conditions (e.g., Cystic Fibrosis, Klinefelter): Yes / No`,
    objective: `Vitals:
- BMI: ^  |  Height: ^  |  Weight: ^

General appearance, secondary sexual characteristics (gynaecomastia, hair distribution, muscle mass): ^

Genital Examination:
- Penis: (e.g., meatal position) ^
- Testes (Scrotal Exam):
  - Volume (Orchidometer): Left: _____ mL  |  Right: _____ mL  (Normal >15 mL)
  - Consistency: Firm / Soft / Other
- Epididymis: Tender / Non-tender / Cysts
- Vas Deferens: Present bilaterally / Absent (unilateral/bilateral)
- Varicocele:
  - Palpable: Yes / No
  - Present on Valsalva: Yes / No
- Other: (e.g., hydrocele, surgical scars)`,
    assessment: `? Male factor sub-fertility
^ There are no obvious predispositions on history.
^ On examination, patient is well androgenised.`,
    plan: `Investigations to consider:

Semen Analysis (Initial):
- [ ] Request 2x Semen Analysis (6–12 weeks apart)
- Instructions given: 2–7 days of abstinence, deliver to lab within 1 hour, keep at body temp
  - https://www.snp.com.au/media/ghbjmts2/item-35170-semen-collection-202601.pdf

Hormonal Profile (if SA abnormal or clinical suspicion):
- FSH, LH, Testosterone (early morning 8–10am), Prolactin (if low T or low libido), SHBG

Genetic (if severe oligo- or azoospermia):
- Karyotype (Check for Klinefelter XXY)
- Y-chromosome microdeletions
- CFTR gene mutation (if vas deferens absent)

Imaging:
- Scrotal Ultrasound (if exam abnormal, varicocele suspected, or testicular mass)

Other:
- STI screen (if not recent)

Advice & Further Plan:
Education:
- Discussed fertile window and advised regular intercourse (e.g., every 2–3 days)
- Reassurance provided

Lifestyle Modifications:
- Advised smoking cessation, reduction of alcohol, cessation of illicit drugs (esp. marijuana, anabolic steroids)
- Weight management (if BMI high)
- Avoid testicular heat (e.g., loose underwear, avoid spas/saunas)

Medication Review:
- Reviewed current medications; advised to stop [e.g., anabolic steroids] if applicable

Supplements:
- Discussed limited evidence but low risk of antioxidants/folic acid

Follow-up & Referral:
- [ ] Follow up to review Semen Analysis results
- Consider referral to Fertility Specialist / Urologist if:
  - Abnormal Semen Analysis
  - Azoospermia or severe oligozoospermia
  - Suspected genetic cause
  - Significant examination finding (e.g., varicocele, absent vas)
  - Female partner factors also present`,
    patientResources: `1. https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/infertility-in-men
2. https://www.thewomens.org.au/health-information/fertility-information/fertility-problems/male-infertility
3. https://www.ivf.com.au/sites/ivfa/files/2023-03/MFC05%20Male%20Fertility%20eBook%2017.03.23-LR_3.pdf`,
    references: "RACGP; Fertility Society of Australia guidelines on male factor infertility.",
    followupNotes: "Review semen analysis results at 6–12 weeks. Refer to urologist/fertility specialist if abnormal.",
    sampleFields: [
      { name: "Duration Trying to Conceive", type: "Text Input", required: true, placeholder: "e.g. 18 months" },
      { name: "Semen Analysis Ordered", type: "Checkbox", required: false }
    ],
    versions: []
  },
  { 
    id: 12, 
    name: "Chronic Rhinosinusitis (CRS) Assessment", 
    category: "Chronic", 
    system: "Respiratory", 
    fields: 7, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "chronic-rhinosinusitis",
    description: "Structured assessment and management plan for Chronic Rhinosinusitis (CRS) with or without polyps, including VAS and SNOT-22 scoring.",
    tags: ["ENT", "Chronic Rhinosinusitis", "Sinusitis", "CRS", "Polyps"],
    subjective: `F2F — ^ presents with ^
^ New to me, presents for ^  |  ^ Planned review for ^

#? Chronic Rhinosinusitis
- Onset and duration (>12 weeks required): ^
- Cardinal symptoms (≥2 required):
  - Nasal obstruction/congestion: ^
  - Mucopurulent discharge / post-nasal drip: ^
  - Facial pain or pressure: ^
  - Reduction/loss of smell: ^
- Unilateral vs bilateral (unilateral = red flag): ^

Red flag screen:
- ^ Declines vision change
- ^ No periorbital swelling
- ^ Declines severe headache
- ^ Declines features suggestive of focal neurology
- ^ Declines hx of epistaxis
- ^ Declines hx of cacosmia

- Polyps known or suspected: ^
- Allergic rhinitis / asthma / atopy: ^
- Aspirin/NSAID sensitivity (especially if polyps): ^
- Smoking and environmental triggers: ^
- Decongestant overuse (rhinitis medicamentosa): ^
- Previous treatments — INCS, antihistamine, saline, adherence and technique: ^
- Impact on QoL (sleep, work, mood): ^`,
    objective: `Vitals — T ^ HR ^ BP ^ RR ^ SpO2 ^

Facial sinus tenderness: ^
Anterior rhinoscopy (mucosa, discharge, polyps, septum): ^
Oropharynx (cobblestone throat, mucus tracks, erythema): ^
Ear exam: ^
Chest auscultation if asthma suspected: ^

VAS (0–10): "Not at all troublesome" ————> "Worst possible troublesome"
^ /10  — mild 0–3, moderate >3–7, severe >7–10
(Escalate/refer if VAS ≥5 persists despite first-line care)

SNOT-22 total: ^ /110 (each item 0–5)
(Escalate/refer if SNOT-22 ≥40 persists despite first-line care)
Available: https://entcalculator.com/snot-22`,
    assessment: `#Chronic Rhinosinusitis (≥2 cardinal symptoms >12 weeks)
- ^ CRS without polyps (CRSsNP)
- ^ CRS with polyps (CRSwNP) — ENT referral, screen for asthma/AERD (adults), CF (children)
- ^ Severity: mild / moderate / severe

Differentials:
- ^ Acute rhinosinusitis (<4 weeks)
- ^ Allergic rhinitis (often coexists)
- ^ Rhinitis medicamentosa
- ^ Sinonasal neoplasm (unilateral, bleeding, crusting — urgent ENT)
- ^ Migraine / tension headache (facial pain only, no other criteria)`,
    plan: `Education and General Measures:
- Chronic inflammatory condition — long-term management, not antibiotics
- Allow ≥1 month before judging response
- Avoid triggers; stop decongestants if used >5–7 days
- Demonstrate crossover spray technique (right hand → left nostril, aim laterally)
- Saline irrigation BEFORE intranasal steroid

First-line (review at 1 month):
- Saline nasal irrigation 1–2x daily, ongoing
- INCS daily, long-term:
  - Mometasone (Nasonex Allergy)
  - Fluticasone furoate (Avamys)
  - Budesonide (Rhinocort)
- Counsel: 2–4 weeks for full effect
- If allergic features: add intranasal azelastine or oral non-sedating antihistamine (e.g., Dymista or Rialtris)

Second-line (no response after ≥1 month, or VAS ≥5 / SNOT-22 ≥40):
- Check adherence and technique FIRST
- Consider specific IgE (RAST) and CT sinuses (X-rays not recommended)
- CRSsNP: prednisolone 25 mg daily 5–10 days (limited evidence)
- CRSwNP medical polypectomy: prednisolone 25 mg daily 1 week → 12.5 mg daily 1 week → 12.5 mg alt days 1 week; continue INCS throughout
- Antibiotics not routinely indicated in primary care

Special populations:
- Children <12: refer; if polyps, test for CF
- Adults with polyps: screen asthma + aspirin sensitivity
- Pregnancy: saline safe; budesonide preferred INCS; avoid oral steroids in T1 if possible`,
    patientResources: "ENT Australia patient resources on CRS and nasal spray technique.",
    references: "RACGP; EPOS 2020 guidelines for Rhinosinusitis; ENT Australia.",
    followupNotes: "Review at 1 month. Refer to ENT if VAS ≥5 or SNOT-22 ≥40 persists after first-line treatment.",
    sampleFields: [
      { name: "VAS Score", type: "Numeric", required: true, placeholder: "0–10" },
      { name: "SNOT-22 Score", type: "Numeric", required: false, placeholder: "0–110" },
      { name: "Polyps Present", type: "Dropdown", required: false, options: ["Yes", "No", "Suspected"] }
    ],
    versions: []
  },
  { 
    id: 13, 
    name: "Wound Assessment & Review", 
    category: "Acute", 
    system: "Dermatology", 
    fields: 7, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "wound-assessment",
    description: "Structured wound assessment using the TIME framework with dressing plan and escalation criteria.",
    tags: ["Wound Care", "Ulcer", "Dressing", "TIME Framework"],
    subjective: `F2F — ^ presents with ^
^ New to me, presents for wound review  |  ^ Planned present for ^

- Progress: ^ Improving / Stalled / Deteriorating
- Pain: ^ Score /10, ^ Constant / During dressing changes only, ^ Overall Improving
- Interim events: <Fevers / Systemic symptoms / Antibiotics completed?>`,
    objective: `Wound Assessment (TIME Framework):
- Location: ^ Site
- Dimensions: (Length) × (Width) × (Depth) in mm

T — Tissue: ^ % Granulation / % Slough / % Eschar / % Epithelial. Colour of tissue bed: ^
I — Infection: ^ No signs / Signs of clinical infection? Odour / Heat / Swelling / Erythema
M — Moisture: ^ Exudate: Low / Med / High | ^ Serous / Haemoserous / Purulent. Bleeding: ^
E — Edge: ^ Advancing / Stalled / Rolled / Macerated

- Periwound: ^ Healthy / Eczematous / Cellulitic / Macerated
- Circulation: ^ Pulses present? / Capillary refill time: ^

Clinical Photography: Consent obtained; image uploaded to record.`,
    assessment: `- Diagnosis: ^ (e.g., Venous ulcer / Dehisced surgical wound / Traumatic tear)
- Healing Phase: ^ Inflammatory / Proliferative / Maturation
- Debridement needed: ^ None / Autolytic / Conservative Sharp / Mechanical / Biological`,
    plan: `- Debridement performed: <Type:> — <Result:>
- Cleansing: <Normal saline / Prontosan / Tap water>
- Primary Dressing: <e.g., Inadine / Aquacel Ag / Hydrogel / Foam>
- Secondary Dressing/Fixation: <e.g., Zetuvit / Hypafix / Compression bandage>
- Frequency: <Review in __ days / PRN if strike-through>
- Referral/Escalation: <Wound clinic / Vascular / Not required>

*If a wound is stalled, use the TIME framework assessment to guide escalation.*`,
    patientResources: "Wound care patient information via WoundsAustralia; Wound Specialist Society resources.",
    references: "WoundsAustralia; TIME Framework for wound management; AWMA Guidelines.",
    followupNotes: "Review in __ days or sooner if deterioration, systemic signs, or strike-through.",
    sampleFields: [
      { name: "Wound Location", type: "Text Input", required: true, placeholder: "e.g. Left lower leg" },
      { name: "Wound Dimensions (mm)", type: "Text Input", required: true, placeholder: "e.g. 30×20×5" },
      { name: "Healing Phase", type: "Dropdown", required: false, options: ["Inflammatory", "Proliferative", "Maturation"] }
    ],
    versions: []
  },
  { 
    id: 14, 
    name: "Hypertrophic Scar / Keloid Assessment", 
    category: "Acute", 
    system: "Dermatology", 
    fields: 7, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "hypertrophic-scar-keloid",
    description: "Assessment and tiered management plan for hypertrophic scars and keloids, including intralesional triamcinolone guidance.",
    tags: ["Keloid", "Hypertrophic Scar", "Triamcinolone", "Dermatology"],
    subjective: `F2F — ^ presents with ^
^ New to me, presents for ^  |  ^ Planned review for ^

#? Hypertrophic scar / Keloid
- Onset, duration, inciting event: ^
- Site(s) and growth pattern (within wound vs extending beyond): ^
- Symptoms — pruritus, pain, restricted ROM: ^
- Personal/family history of keloids; Fitzpatrick skin type: ^
- Treatments trialled: ^
- QoL/psychosocial impact; affecting sleep: ^
- Pregnancy/planning pregnancy: ^`,
    objective: `Site: ^
Dimensions (L×W×H mm): ^
Colour: ^
Texture: ^
Borders: ^
^ Tenderness  |  ^ Signs of infection
ROM if over joint: ^
Photograph with ruler: ^

*Hypertrophic — within wound borders
*Keloid — extends beyond wound borders`,
    assessment: `#Hypertrophic scar / Keloid
- ^ Hypertrophic — within wound, often improves conservatively
- ^ Keloid — extends beyond, high recurrence, needs active Rx
- ^ Mixed / indeterminate

Severity:
- ^ Mild — small, asymptomatic
- ^ Moderate — symptomatic or cosmetically significant
- ^ Severe — functionally limiting or major psychological impact

Differentials:
- ^ Dermatofibroma  |  ^ DFSP  |  ^ Foreign body granuloma  |  ^ Malignancy in old scar (biopsy if atypical)`,
    plan: `Education and General Measures:
- Set expectations — improvement not cure
- SPF 50+, avoid trauma/tension/piercings at site
- Photographic monitoring

Treatment Options:
- ^ Option A: Silicone gel/sheet + compression × 3–6 months (slow, no needles)
- ^ Option B: Intralesional triamcinolone 4–6 weekly × 2–3 sessions + silicone (faster)
- ^ Option C: Silicone + compression first; escalate to steroid if no response at 3 months

First-line — Conservative:
- Silicone gel/sheet 12–24 hr/day, min 2–3 months (Strataderm, Dermatix, Mepiform)
- Pressure therapy (post-burn, post-excision earlobe — 23 hr/day, 6–12 months)
- Massage 2–3x daily once wound healed

Second-line — Intralesional Triamcinolone (Kenacort-A 40):
- 10–40 mg/mL (face 5–10, moderate 10–20, thick keloid 20–40)
- Dilute with lignocaine 1% (e.g., 0.25 mL Kenacort + 0.75 mL lig 1% = 10 mg/mL)
- 27–30G needle, intradermal, blanching confirms correct plane
- 0.1–0.2 mL per cm²; max 40 mg/session
- Repeat 4–6 weekly × 3–6 sessions
- Cryotherapy 10–15 sec before injection softens dense keloids
- Counsel: atrophy, hypopigmentation (esp. skin of colour), telangiectasia

Third-line / Refractory — Refer:
- 5-FU intralesional, pulsed dye laser, fractional CO2, surgery + adjuvant Rx, superficial radiotherapy

Special Considerations:
- Skin of colour: lower steroid conc, avoid aggressive cryo, PDL > ablative laser
- Face: 5–10 mg/mL only, small volumes
- Earlobe keloid: refer for excision + intralesional steroid + pressure earring

Referrals and Follow-up:
- ^ Derm (refractory, large keloids, laser/5-FU)
- ^ Plastics (contracture, earlobe, large keloid)
- ^ Burns/OT (pressure garments)
- Biopsy if atypical
- Review in ^ weeks/months`,
    patientResources: `1. https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Keloids-PIL-April-2021-1.pdf
2. Caulibuds/Kelloidbuds/magnetic earrings available online for earlobe pressure`,
    doctorSummary: `Pathophysiology: Both = abnormal wound healing with excess collagen deposition (↑TGF-β1, ↑fibroblast activity, ↓collagenase).
Hypertrophic = within wound borders, regresses over 12–24 months.
Keloid = beyond wound borders, does NOT regress, genetic/ethnic predisposition (15× African, ↑ Fitzpatrick IV–VI).
High-risk sites: earlobes, sternum, shoulders, upper back, deltoid.

Treatment principles: Tiered and multi-modal. Goal = symptom relief + flattening, NOT cure. Early intervention (<6–12 months) more effective.
Tier 1: silicone, pressure, massage. Tier 2: intralesional triamcinolone. Tier 3: surgery+adjuvant, laser, 5-FU, radiotherapy.
Surgery alone for keloid = up to 100% recurrence — always combine with adjuvant Rx.

Triamcinolone key points:
- Kenacort-A 40 (40 mg/mL), dilute with lignocaine 1%
- Concentration by site: face 5–10, moderate 10–20, dense keloid 20–40 mg/mL
- 27–30G Luer-lock syringe, intradermal injection, blanching confirms plane
- Max 40 mg/session (1 mg/kg in children, max 40 mg)
- Cryo 10–15 sec pre-injection softens dense scars
⚠ Hypopigmentation and atrophy can be PERMANENT and highly visible in skin of colour. Start low, titrate up.
⚠ MUST counsel: atrophy, hypopigmentation, telangiectasia, menstrual irregularity (rare), pain, partial/no response.
⚠ Max 40 mg per session; exceeding risks HPA suppression with repeated dosing.

Pearls:
- Scar beyond wound margin = keloid (not hypertrophic) — drives management aggressiveness
- Photograph with ruler every visit — objective tracking
- Earlobe keloids: excision alone = ~100% recurrence
- Atypical features, rapid growth, no inciting injury → biopsy (DFSP, SCC in chronic scar are missed)
- Dense scar won't take injection? Cryo first, then inject`,
    references: "RACGP; Gold et al. Keloid and Hypertrophic Scar Treatment Guidelines; Dermatology Society of Australia.",
    followupNotes: "Review in 4–6 weeks after first intralesional steroid. Photograph at every visit for objective tracking.",
    sampleFields: [
      { name: "Lesion Site", type: "Text Input", required: true, placeholder: "e.g. Left earlobe" },
      { name: "Dimensions (mm)", type: "Text Input", required: true, placeholder: "e.g. 15×10×8" },
      { name: "Fitzpatrick Skin Type", type: "Dropdown", required: false, options: ["I", "II", "III", "IV", "V", "VI"] },
      { name: "Treatment Plan", type: "Dropdown", required: false, options: ["Option A – Silicone", "Option B – Triamcinolone", "Option C – Silicone then escalate"] }
    ],
    versions: []
  },
  { 
    id: 15, 
    name: "Implanon NXT Removal", 
    category: "Women's Health", 
    system: "Women's Health", 
    fields: 6, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "implanon-removal",
    description: "Structured procedural template for Implanon NXT removal including consent, technique, and post-care instructions.",
    tags: ["Implanon", "Contraception", "Procedural", "Women's Health"],
    subjective: `F2F — Presents alone / with partner
Planned present / Presents for Implanon NXT removal

#Issue 1: Implanon NXT Removal Discussion
Patient requests removal of Implanon NXT

Indications:
- ^ Multiple indications — arm discomfort, weight gain, patient has made a definite decision
- ^ Arm sore at implant site
- ^ Allergy to cleaning solutions / LA

Discussed future contraception: ^
Contraindications screen:
- Not on anticoagulants, no site infection, not planned to be a difficult removal

Discussion of procedure-specific risks:
- Local: Pain, bruising, swelling, or minor scarring at the site
- Procedure-related: Difficulty in locating or removing the implant, potentially requiring a larger incision or referral for ultrasound-guided removal if non-palpable
- Infection: Small risk of localised infection
- Device failure: Risks associated with not starting new contraception immediately

Patient verbalized understanding`,
    objective: `- Implant location confirmed via palpation on the inner aspect of the left arm
- ^ Already a pigmented & raised scar at the site — old scar, confirmed by patient
- Skin over site appears healthy with no signs of localised infection`,
    assessment: "Implanon NXT requiring removal.",
    plan: `Procedure:
- Aseptic technique maintained throughout
- Local anaesthetic: 1% xylocaine with adrenaline — ^ mL injected under the distal end of the implant
- ~ 4 mm longitudinal incision made at the distal tip
- Removed intact. Entire 4 cm rod removed and shown to patient

Closure: 1 × 4-0 Vicryl stitch / Steristrip
Waterproof dressing and pressure bandage applied

Post-care:
- Pressure bandage to remain for 24 hours to reduce bruising
- Waterproof dressing to remain for 3–5 days
- Advice given: Keep site clean and dry; monitor for signs of infection (increasing pain, redness, or discharge)
- Follow-up: 5–7 days for removal of sutures / wound review

Billing (as of May 2026): 30062 (removal of implanon) + BB loading (35501)`,
    patientResources: `- Insertion & Removal videos: https://www.nexplanonvideos.com/
- Fillable consent form for removal: https://shq.org.au/wp-content/uploads/2025/08/Implant-Removal-Consent-Form-5-August-2025-P0056V2_fillable.pdf`,
    references: "Organon Australia; SHQ Implanon clinical guidance; RACGP contraception guidelines.",
    followupNotes: "Review in 5–7 days for wound check and removal of suture if used.",
    sampleFields: [
      { name: "LA Volume (mL)", type: "Numeric", required: true, placeholder: "e.g. 2" },
      { name: "Closure Method", type: "Dropdown", required: true, options: ["Steristrip", "4-0 Vicryl suture", "Both"] },
      { name: "Future Contraception Discussed", type: "Checkbox", required: false }
    ],
    versions: []
  },
  { 
    id: 16, 
    name: "Lichen Sclerosus Assessment", 
    category: "Chronic", 
    system: "Women's Health", 
    fields: 7, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "lichen-sclerosus",
    description: "Assessment and management template for genital Lichen Sclerosus (LS) including surveillance and topical corticosteroid guidance.",
    tags: ["Lichen Sclerosus", "BXO", "Balanitis", "Vulval itch", "Lower Urinary Tract"],
    subjective: `F2F — ^ presents with ^
^ New to me, presents for ^  |  ^ Planned present for ^

#Issue 1 (Lichen Sclerosus Assessment)
- Itchiness in the anogenital area: ^
- Presence of pain or dyspareunia: ^
- History of constipation or dysuria (particularly if a child): ^
- Associated autoimmune history (thyroid disease, vitiligo, pernicious anaemia): ^
- Asymptomatic changes noted during routine screening: ^
- Aggravating factors (tight clothing, cycling): ^
- Current use of non-soap cleansers and emollients: ^`,
    objective: `Vitals: ^
Chaperone: ^

Pelvic Exam:
General Inspection:
- Well-defined white finely wrinkled plaques observed: ^
- Anatomical changes "figure of eight" vulval/perianal involvement: ^
- Purpuric areas or hyperkeratotic fissured areas noted: ^
- Ulceration from scratching observed: ^
- Evidence of scarring, fusion, or stenosis of the vaginal opening: ^
- Phimosis or involvement of the glans penis in males: ^
- No suspicious lesions or signs of Squamous Cell Carcinoma (SCC): ^`,
    assessment: `- ^ Lichen Sclerosus
- ^ Lichen sclerosus et atrophicus
- ^ Balanitis xerotica obliterans (BXO)

Refer to Gynaecologist or Urologist for biopsy if diagnosis unclear or to exclude malignancy/atypical changes.`,
    plan: `Potent topical corticosteroid:
- Betamethasone dipropionate 0.05% ointment ^
- Frequency: Apply daily or twice daily until symptoms abate (1–3 months) ^

Maintenance:
- Apply two to three times weekly long-term ^
- Adjunct topical oestrogen for co-existing menopausal vulval atrophy ^

Referral:
- ^ Referral to Dermatologist or Gynaecologist for confirmation of diagnosis

Advice:
- Wash gently once daily and use non-soap cleansers ^
- Avoid tight clothing and rubbing/scratching ^
- Routine 6–12 month follow-up indefinitely for carcinoma surveillance ^`,
    patientResources: `1. https://www.mshc.org.au/?ACT=613&path=factsheet/pdf/256
2. https://www.thewomens.org.au/health-information/vulva-vagina/vulva-vagina-problems/lichen-sclerosus`,
    doctorSummary: `Clinical Presentation: Often presents as white "parchment-like" skin. In females, vagina is strictly spared but "figure of eight" perianal involvement is classic.

The 5% Risk: Untreated or undertreated genital Lichen Sclerosus carries a 5% risk of malignant transformation into Squamous Cell Carcinoma (SCC).

Treatment Gold Standard: Potent corticosteroids (Betamethasone dipropionate 0.05% ointment) are first-line. Ointments preferred over creams as they sting less on fissured skin.

Maintenance: Remission is rare; 85% of patients require indefinite maintenance (2–3 times weekly) to prevent anatomical distortion and SCC.

Paediatrics: In children, LS can be mistaken for sexual abuse due to purpura/bruising; can also cause unexplained constipation or dysuria.`,
    references: "RACGP; British Association of Dermatologists LS Guidelines; Australian Menopause Society.",
    followupNotes: "6–12 monthly follow-up indefinitely. Refer for biopsy if any suspicious lesion or diagnostic uncertainty.",
    sampleFields: [
      { name: "Topical Steroid Prescribed", type: "Text Input", required: true, placeholder: "e.g. Betamethasone 0.05% ointment" },
      { name: "Biopsy Referral Required", type: "Dropdown", required: false, options: ["Yes", "No", "Uncertain"] }
    ],
    versions: []
  },
  { 
    id: 17, 
    name: "MASLD (Metabolic Fatty Liver Disease)", 
    category: "Chronic", 
    system: "Gastroenterology", 
    fields: 8, 
    usageCount: 0, 
    lastUsed: "Never", 
    status: "active", 
    author: "GP Edge Clinical Team", 
    version: "v1.0",
    slug: "masld-fatty-liver",
    description: "Assessment and management plan for Metabolic Associated Steatotic Liver Disease (MASLD), formerly NAFLD. Includes FIB-4 scoring, liver screen, and Fibroscan referral pathway.",
    tags: ["MASLD", "NAFLD", "Fatty Liver", "FIB-4", "Fibroscan", "Liver Disease"],
    subjective: `F2F — ^ presents with ^
^ New to me, presents for ^  |  ^ Planned present for ^

#Issue 1 (Metabolic/Liver Review)
- Review of recent LFTs showing derangement in ^
- Patient is currently asymptomatic of liver disease ^
- No history of pruritus, easy bruising, or abdominal distension ^
- Alcohol intake is ^ standard drinks per week ^
- History of recent rapid weight gain or sedentary lifestyle ^
- Known history of Type 2 Diabetes or Pre-diabetes ^
- Known history of hypertension or dyslipidaemia ^
- Family history of chronic liver disease or premature CVD ^
- Review of current medications and over-the-counter supplements ^`,
    objective: `BMI: ^ kg/m²
Waist circumference: ^ cm
BP: ^ mmHg

^ No evidence of scleral icterus or palmar erythema
^ No spider naevi or caput medusae observed
^ Abdomen soft and non-tender with no palpable hepatosplenomegaly
^ No shifting dullness or peripheral oedema noted
^ Acanthosis nigricans noted on neck or axilla`,
    assessment: `#Suspected Metabolic Associated Steatotic Liver Disease (MASLD)
- Pending elastography
- Pending liver screen

#Suspected MetALD (if patient meets metabolic criteria but drinks >30g/day men / >20g/day women up to 60g/day)

Note: If >50g/day women or >60g/day men → classify as Alcohol-Related Liver Disease (ArLD)`,
    plan: `1. FIB-4 Score Calculation:
   - Required: Age, AST, ALT, Platelets
   - FIB-4 result: ^
   - ^ Low risk (FIB-4 <1.3): Repeat LFTs and FIB-4 in 2 years
   - ^ Intermediate/High risk (FIB-4 >1.3): Refer for FibroScan (VCTE) or USS elastography

2. Order "Liver Screen":
   - Hep B & C serology
   - Serum Ig, ANA, AMA, ASMA (autoimmune)
   - Iron studies, alpha-1 antitrypsin
   - Coeliac antibodies
   - Consider copper studies & ceruloplasmin (younger patients / Wilson's disease)

3. Organise upper abdominal ultrasound to confirm steatosis ^

4. Lifestyle — Goal weight loss 7–10%:
   - Mediterranean-style diet; dietetics referral
   - 150–240 min moderate-vigorous aerobic exercise/week
   - Alcohol: advise cessation or strict adherence to NHMRC guidelines (<10/week)

5. Optimise management of T2DM, hypertension, and dyslipidaemia ^

6. Review in ^ weeks to discuss screening and ultrasound results

FibroScan results interpretation:
- <8.0 kPa: Low risk — manage in primary care
- ≥8.0 kPa: Concerning for significant fibrosis — refer for specialist management

Repeat FibroScan:
- No fibrosis on initial scan → repeat in 5 years
- Mild/moderate fibrosis → earlier follow-up
- Advanced fibrosis → specialist management, shorter follow-up`,
    patientResources: `1. https://liverwell.org.au/making-masld-an-australian-public-health-priority/
2. https://www.gesa.org.au/public/13/files/Education%20%26%20Resources/Patient%20Resources/Fatty%20Liver/GESA%20Fatty%20Liver%20Disease%202024.pdf`,
    doctorSummary: `Terminology: NAFLD → MASLD (2023 name change). MetALD is a new combined category.
Risk Factors: Excess weight, visceral fat, ultra-processed foods, dyslipidaemia, glucose intolerance/DM, HTN.

Diagnosis (3 Pillars):
1) Detection of Hepatic Steatosis — USS or FIB-4
2) Presence of Cardiometabolic Risk Factors:
   - Obesity: BMI >25 (Caucasian) or >23 (Asian) or WC ≥102/88 cm (men/women, Caucasian)
   - BP ≥130/85 mmHg or on antihypertensives
   - TG ≥1.50 mmol/L or on lipid-lowering therapy
   - HDL <1.0 mmol/L (men) or <1.3 mmol/L (women)
   - Pre-diabetes: HbA1c 5.7–6.4% or FBG 5.6–6.9 mmol/L
   - HOMA-IR ≥2.5 or hs-CRP >2 mg/L
3) Exclusion of other causes (Hep B/C, autoimmune, Wilson's)

FIB-4 Score:
- <1.3: Low risk — repeat in 2 years
- 1.3–2.0: Intermediate — secondary testing with FibroScan (USS elastography has MBS rebate for GPs)
- >2.0: High risk — FibroScan + consider specialist referral
- >3.25: Very likely significant fibrosis

Pharmacology:
- GLP-1 Agonists: Powerful for weight/metabolic improvement (not yet TGA-indicated specifically for liver fibrosis)
- Resmetirom: First FDA/internationally approved drug specifically for MASLD with fibrosis (check local PBS status 2025/2026)`,
    references: "GESA MASLD Guidelines 2024; Rinella et al. MASLD nomenclature 2023; RACGP; Australian MASLD Consensus.",
    followupNotes: "Review in 4–8 weeks with liver screen results and USS. FIB-4 and LFTs repeat in 2 years if low risk.",
    sampleFields: [
      { name: "FIB-4 Score", type: "Numeric", required: false, placeholder: "e.g. 1.5" },
      { name: "BMI", type: "Numeric", required: true, placeholder: "e.g. 31" },
      { name: "Waist Circumference (cm)", type: "Numeric", required: false, placeholder: "e.g. 104" },
      { name: "Alcohol (std drinks/week)", type: "Numeric", required: false, placeholder: "e.g. 8" }
    ],
    versions: []
  },
];

const AUTOFILL_TEMPLATES_STORAGE_KEY = "gpedge_admin_autofill_templates";

export function getAutofillTemplates(): AutofillTemplate[] {
  if (typeof window === "undefined") return DEFAULT_AUTOFILL_TEMPLATES;
  try {
    const raw = localStorage.getItem(AUTOFILL_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUTOFILL_TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_AUTOFILL_TEMPLATES));
      return DEFAULT_AUTOFILL_TEMPLATES;
    }
    const stored = JSON.parse(raw) as AutofillTemplate[];
    
    // Merge: add any default templates that are missing in stored (e.g. newly introduced templates)
    const missing = DEFAULT_AUTOFILL_TEMPLATES.filter((d) => !stored.some((t) => t.id === d.id));
    const all = [...stored, ...missing];
    
    // Merge: fill in missing SOAP fields from defaults for existing templates
    const merged = all.map((t) => {
      const def = DEFAULT_AUTOFILL_TEMPLATES.find((d) => d.id === t.id);
      if (!def) return t;
      
      // Force migration for old default template ID 3 to the new MHTP template
      if (t.id === 3 && (t.name === "Mental Health Assessment" || !t.subjective || t.subjective.includes("low mood and sleep disturbance"))) {
        return def;
      }
      
      // Force migration for old default template ID 2 to the new Diabetes template
      if (t.id === 2 && (t.name === "Type 2 Diabetes Review" || !t.subjective || !t.subjective.includes("DIABETES ANNUAL CYCLE OF CARE"))) {
        return def;
      }
      
      return {
        ...t,
        name:             t.name             || def.name,
        category:         t.category         || def.category,
        system:           t.system           || def.system,
        description:      t.description      || def.description,
        tags:             (t.tags && t.tags.length > 0) ? t.tags : def.tags,
        subjective:       t.subjective       || def.subjective,
        objective:        t.objective        || def.objective,
        assessment:       t.assessment       || def.assessment,
        plan:             t.plan             || def.plan,
        doctorSummary:    t.doctorSummary    || def.doctorSummary,
        patientResources: t.patientResources || def.patientResources,
        references:       t.references       || def.references,
        followupNotes:    t.followupNotes    || def.followupNotes,
        sampleFields:     (t.sampleFields && t.sampleFields.length > 0) ? t.sampleFields : def.sampleFields,
        content:          t.content          || def.content || [t.subjective, t.objective, t.assessment, t.plan, t.doctorSummary, t.patientResources].filter(Boolean).join("\n\n"),
      };
    });
    return merged;
  } catch {
    return DEFAULT_AUTOFILL_TEMPLATES;
  }
}

export function saveAutofillTemplates(templates: AutofillTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTOFILL_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

