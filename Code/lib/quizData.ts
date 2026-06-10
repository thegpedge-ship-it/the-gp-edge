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
  { id: 1, name: "Dr. Sarah Chen", email: "sarah.chen@gmail.com", plan: "premium", lastActive: "2 mins ago", status: "active", joined: "12 Jan 2026", notes: [] },
  { id: 2, name: "Dr. James Wilson", email: "j.wilson@outlook.com", plan: "premium", lastActive: "1 hour ago", status: "active", joined: "3 Feb 2026", notes: ["VIP user — supervisor referral"] },
  { id: 3, name: "Dr. Priya Sharma", email: "priya.sharma@hotmail.com", plan: "free", lastActive: "3 hours ago", status: "active", joined: "18 Feb 2026", notes: [] },
  { id: 4, name: "Dr. Michael Torres", email: "m.torres@gmail.com", plan: "premium", lastActive: "5 hours ago", status: "active", joined: "7 Dec 2025", notes: [] },
  { id: 5, name: "Dr. Emily Watson", email: "emily.w@yahoo.com", plan: "free", lastActive: "1 day ago", status: "active", joined: "28 Mar 2026", notes: [] },
  { id: 6, name: "Dr. Alex Kumar", email: "alex.kumar@gmail.com", plan: "free", lastActive: "3 days ago", status: "suspended", joined: "15 Apr 2026", notes: ["Flagged for ToS violation"] },
  { id: 7, name: "Dr. Rachel Green", email: "r.green@outlook.com", plan: "premium", lastActive: "30 mins ago", status: "active", joined: "20 Jan 2026", notes: [] },
  { id: 8, name: "Dr. Tom Baker", email: "tom.baker@gmail.com", plan: "free", lastActive: "2 days ago", status: "active", joined: "9 Mar 2026", notes: [] },
  { id: 9, name: "Dr. Nina Patel", email: "nina.p@hotmail.com", plan: "premium", lastActive: "6 hours ago", status: "active", joined: "14 Feb 2026", notes: [] },
  { id: 10, name: "Dr. David Kim", email: "d.kim@gmail.com", plan: "free", lastActive: "5 days ago", status: "active", joined: "2 May 2026", notes: [] },
  { id: 11, name: "Dr. Laura Simmons", email: "laura.s@yahoo.com", plan: "premium", lastActive: "15 mins ago", status: "active", joined: "1 Nov 2025", notes: ["Top performer"] },
  { id: 12, name: "Dr. Chris Martin", email: "c.martin@outlook.com", plan: "free", lastActive: "1 week ago", status: "suspended", joined: "22 Apr 2026", notes: ["Inactive — possible churn risk"] },
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
  usedInQuestions: number;
}

const DEFAULT_MEDICAL_CONTENT: MedicalContent[] = [
  { id: 1, name: "Type 2 Diabetes Management", category: "Chronic Disease", system: "Endocrine", type: "Guideline", status: "published", lastUpdated: "28 May 2026", author: "Dr. Arun Mehta", references: 12, usedInQuestions: 34 },
  { id: 2, name: "Acute Coronary Syndrome", category: "Emergency", system: "Cardiovascular", type: "Protocol", status: "published", lastUpdated: "25 May 2026", author: "Siddhant Udavant", references: 18, usedInQuestions: 47 },
  { id: 3, name: "Childhood Immunisation Schedule", category: "Preventive", system: "Paediatrics", type: "Guideline", status: "published", lastUpdated: "22 May 2026", author: "Dr. Arun Mehta", references: 8, usedInQuestions: 21 },
  { id: 4, name: "Depression Screening & Management", category: "Mental Health", system: "Psychiatry", type: "Pathway", status: "review", lastUpdated: "20 May 2026", author: "Jessica Park", references: 15, usedInQuestions: 28 },
  { id: 5, name: "Asthma Action Plan", category: "Chronic Disease", system: "Respiratory", type: "Protocol", status: "published", lastUpdated: "18 May 2026", author: "Dr. Arun Mehta", references: 9, usedInQuestions: 19 },
  { id: 6, name: "Melanoma Detection & Referral", category: "Skin Cancer", system: "Dermatology", type: "Pathway", status: "draft", lastUpdated: "15 May 2026", author: "Jessica Park", references: 6, usedInQuestions: 8 },
  { id: 7, name: "Antenatal Care Schedule", category: "Obstetrics", system: "Women's Health", type: "Guideline", status: "published", lastUpdated: "12 May 2026", author: "Siddhant Udavant", references: 14, usedInQuestions: 16 },
  { id: 8, name: "GORD Management Algorithm", category: "GI", system: "Gastroenterology", type: "Pathway", status: "review", lastUpdated: "10 May 2026", author: "Dr. Arun Mehta", references: 7, usedInQuestions: 12 },
  { id: 9, name: "Red Flags in Back Pain", category: "MSK", system: "Musculoskeletal", type: "Protocol", status: "published", lastUpdated: "8 May 2026", author: "Siddhant Udavant", references: 11, usedInQuestions: 23 },
  { id: 10, name: "MBS Item 721 — GPMP Guide", category: "Billing", system: "MBS", type: "Guideline", status: "draft", lastUpdated: "5 May 2026", author: "Jessica Park", references: 4, usedInQuestions: 9 },
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
  status: "active" | "draft" | "suspended";
  author: string;
  version: string;
  sampleFields: { name: string; type: string; required: boolean; placeholder?: string; options?: string[] }[];
}

export const DEFAULT_AUTOFILL_TEMPLATES: AutofillTemplate[] = [
  { 
    id: 1, 
    name: "URTI Assessment", 
    category: "Acute", 
    system: "Respiratory", 
    fields: 12, 
    usageCount: 2340, 
    lastUsed: "2 mins ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v3.1",
    sampleFields: [
      { name: "Presenting Symptoms (Cough/Sore Throat)", type: "Textarea", required: true },
      { name: "Symptom Duration (Days)", type: "Dropdown", required: true },
      { name: "Vitals (Temp, HR, SpO2)", type: "Numeric", required: true },
      { name: "Tonsillar Exudate / Swelling", type: "Checkbox", required: false },
      { name: "Management Plan & Rest Guide", type: "Textarea", required: true },
      { name: "Prescription Plan (Amoxicillin/Symptomatic)", type: "Text Input", required: false }
    ]
  },
  { 
    id: 2, 
    name: "Type 2 Diabetes Review", 
    category: "Chronic", 
    system: "Endocrine", 
    fields: 18, 
    usageCount: 1876, 
    lastUsed: "15 mins ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v2.4",
    sampleFields: [
      { name: "Last HbA1c Results (mmol/mol)", type: "Numeric", required: true },
      { name: "Foot Sensation (Monofilament Test)", type: "Checkbox", required: true },
      { name: "Eye Screening Referral Status", type: "Dropdown", required: false },
      { name: "Metformin Adherence & Side Effects", type: "Textarea", required: true },
      { name: "Exercise & Diet Compliance Logs", type: "Checkbox", required: false },
      { name: "Lipid Panel (LDL, HDL, Triglycerides)", type: "Text Input", required: false }
    ]
  },
  { 
    id: 3, 
    name: "Mental Health Assessment", 
    category: "Mental Health", 
    system: "Psychiatry", 
    fields: 22, 
    usageCount: 1543, 
    lastUsed: "1 hour ago", 
    status: "active", 
    author: "Jessica Park", 
    version: "v4.0",
    sampleFields: [
      { name: "K10 Score (Distress Level)", type: "Numeric", required: true },
      { name: "Sleep Patterns & Insomnia Rating", type: "Dropdown", required: true },
      { name: "Suicide Risk Assessment Profile", type: "Textarea", required: true },
      { name: "Major Life Stressors / Triggers", type: "Textarea", required: false },
      { name: "Coping Strategies Identified", type: "Checkbox", required: false },
      { name: "Mental Health Care Plan Activation", type: "Checkbox", required: true }
    ]
  },
  { 
    id: 4, 
    name: "Skin Check Template", 
    category: "Screening", 
    system: "Dermatology", 
    fields: 8, 
    usageCount: 987, 
    lastUsed: "3 hours ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v1.2",
    sampleFields: [
      { name: "Anatomical Location of Lesion", type: "Dropdown", required: true },
      { name: "Size & Dimensions (mm)", type: "Numeric", required: true },
      { name: "Border Regularity & Symmetry", type: "Checkbox", required: true },
      { name: "Evolution / Growth Speed", type: "Dropdown", required: false },
      { name: "Biopsy Plan & Patient Consent", type: "Textarea", required: false },
      { name: "Dermoscopic Photos Uploaded", type: "Checkbox", required: true }
    ]
  },
  { 
    id: 5, 
    name: "Antenatal Visit", 
    category: "Obstetrics", 
    system: "Women's Health", 
    fields: 24, 
    usageCount: 654, 
    lastUsed: "5 hours ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v2.0",
    sampleFields: [
      { name: "Gestation Age (Weeks/Days)", type: "Numeric", required: true },
      { name: "Maternal Blood Pressure (BP)", type: "Numeric", required: true },
      { name: "Fetal Heart Rate (bpm)", type: "Numeric", required: true },
      { name: "Symphyseal Fundal Height (cm)", type: "Numeric", required: false },
      { name: "Fetal Movement Status", type: "Dropdown", required: true },
      { name: "Urine Protein Dipstick Result", type: "Dropdown", required: false }
    ]
  },
  { 
    id: 6, 
    name: "Paediatric Well Child Check", 
    category: "Screening", 
    system: "Paediatrics", 
    fields: 16, 
    usageCount: 432, 
    lastUsed: "1 day ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v1.8",
    sampleFields: [
      { name: "Weight & Length Percentiles", type: "Numeric", required: true },
      { name: "Gross Motor Milestones Rating", type: "Dropdown", required: true },
      { name: "Language / Social Development Status", type: "Dropdown", required: true },
      { name: "Vision & Hearing Screening Result", type: "Checkbox", required: false },
      { name: "Immunisation Status Check", type: "Checkbox", required: true },
      { name: "Parent Concerns / Nutrition Log", type: "Textarea", required: false }
    ]
  },
  { 
    id: 7, 
    name: "Hypertension Review", 
    category: "Chronic", 
    system: "Cardiovascular", 
    fields: 14, 
    usageCount: 876, 
    lastUsed: "2 hours ago", 
    status: "active", 
    author: "Siddhant Udavant", 
    version: "v3.2",
    sampleFields: [
      { name: "Home Blood Pressure Readings Log", type: "Textarea", required: true },
      { name: "Kidney Function (eGFR & ACR)", type: "Numeric", required: true },
      { name: "Cardiovascular Risk Score", type: "Numeric", required: false },
      { name: "Compliance with Antihypertensives", type: "Dropdown", required: true },
      { name: "Salt Intake & Weight Management Goals", type: "Textarea", required: false },
      { name: "ECG Findings & Heart Sounds", type: "Text Input", required: false }
    ]
  },
  { 
    id: 8, 
    name: "GORD Assessment", 
    category: "GI", 
    system: "Gastroenterology", 
    fields: 10, 
    usageCount: 345, 
    lastUsed: "1 day ago", 
    status: "draft", 
    author: "Jessica Park", 
    version: "v1.0",
    sampleFields: [
      { name: "Heartburn Frequency (Weekly)", type: "Numeric", required: true },
      { name: "Severity & Nocturnal Symptoms", type: "Dropdown", required: true },
      { name: "Dysphagia / Odynophagia (Alarm Flags)", type: "Checkbox", required: true },
      { name: "PPI Trial Plan & Dose", type: "Text Input", required: false },
      { name: "Weight Loss / Appetite Check", type: "Checkbox", required: false },
      { name: "Endoscopy Referral Details", type: "Textarea", required: false }
    ]
  },
  { 
    id: 9, 
    name: "Lower Back Pain", 
    category: "MSK", 
    system: "Musculoskeletal", 
    fields: 15, 
    usageCount: 567, 
    lastUsed: "6 hours ago", 
    status: "active", 
    author: "Dr. Arun Mehta", 
    version: "v2.1",
    sampleFields: [
      { name: "Onset, Trigger & Location of Pain", type: "Textarea", required: true },
      { name: "Radiation (Sciatica) & Sensory Loss", type: "Checkbox", required: true },
      { name: "Red Flags (Bowels/Bladder Retention)", type: "Checkbox", required: true },
      { name: "Straight Leg Raise (SLR) Angle", type: "Numeric", required: false },
      { name: "Analgesia Regimen (NSAIDs/Paracetamol)", type: "Text Input", required: false },
      { name: "Physiotherapy Referral Plan", type: "Textarea", required: false }
    ]
  },
  { 
    id: 10, 
    name: "MBS 721 — GPMP Template", 
    category: "Billing", 
    system: "MBS", 
    fields: 20, 
    usageCount: 198, 
    lastUsed: "2 days ago", 
    status: "draft", 
    author: "Jessica Park", 
    version: "v0.9",
    sampleFields: [
      { name: "Primary Chronic Medical Conditions", type: "Textarea", required: true },
      { name: "Patient Co-designed Care Goals", type: "Textarea", required: true },
      { name: "Allied Health Referrals Scheduled", type: "Checkbox", required: true },
      { name: "Care Team Members & Contact info", type: "Textarea", required: false },
      { name: "GPMP Consent Form Signed", type: "Checkbox", required: true },
      { name: "Review Date Scheduled (6 months)", type: "Date Picker", required: true }
    ]
  }
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
    return JSON.parse(raw) as AutofillTemplate[];
  } catch {
    return DEFAULT_AUTOFILL_TEMPLATES;
  }
}

export function saveAutofillTemplates(templates: AutofillTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTOFILL_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}
