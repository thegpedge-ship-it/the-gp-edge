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
