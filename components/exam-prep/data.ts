/* ─── Medical Subjects & Subtopics ─────────────────────────────────────── */

export interface SubTopic {
  id: string;
  name: string;
  questionCount: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  subtopics: SubTopic[];
}

export const subjects: Subject[] = [
  {
    id: "cardio",
    name: "Cardiovascular",
    icon: "heart",
    color: "rose",
    subtopics: [
      { id: "cardio-1", name: "Ischaemic Heart Disease", questionCount: 45 },
      { id: "cardio-2", name: "Heart Failure", questionCount: 38 },
      { id: "cardio-3", name: "Arrhythmias", questionCount: 32 },
      { id: "cardio-4", name: "Valvular Heart Disease", questionCount: 28 },
      { id: "cardio-5", name: "Hypertension", questionCount: 52 },
    ],
  },
  {
    id: "resp",
    name: "Respiratory",
    icon: "wind",
    color: "sky",
    subtopics: [
      { id: "resp-1", name: "Asthma", questionCount: 48 },
      { id: "resp-2", name: "COPD", questionCount: 42 },
      { id: "resp-3", name: "Pneumonia", questionCount: 35 },
      { id: "resp-4", name: "Lung Cancer", questionCount: 26 },
      { id: "resp-5", name: "Pleural Diseases", questionCount: 20 },
    ],
  },
  {
    id: "gastro",
    name: "Gastroenterology",
    icon: "utensils",
    color: "amber",
    subtopics: [
      { id: "gastro-1", name: "GORD & Peptic Ulcer", questionCount: 40 },
      { id: "gastro-2", name: "Inflammatory Bowel Disease", questionCount: 35 },
      { id: "gastro-3", name: "Liver Disease", questionCount: 38 },
      { id: "gastro-4", name: "Irritable Bowel Syndrome", questionCount: 22 },
      { id: "gastro-5", name: "Colorectal Cancer", questionCount: 30 },
    ],
  },
  {
    id: "endo",
    name: "Endocrinology",
    icon: "flame",
    color: "violet",
    subtopics: [
      { id: "endo-1", name: "Diabetes Mellitus", questionCount: 55 },
      { id: "endo-2", name: "Thyroid Disorders", questionCount: 42 },
      { id: "endo-3", name: "Adrenal Disorders", questionCount: 24 },
      { id: "endo-4", name: "Pituitary Disorders", questionCount: 18 },
      { id: "endo-5", name: "Metabolic Syndrome", questionCount: 28 },
    ],
  },
  {
    id: "neuro",
    name: "Neurology",
    icon: "brain",
    color: "indigo",
    subtopics: [
      { id: "neuro-1", name: "Headache & Migraine", questionCount: 36 },
      { id: "neuro-2", name: "Stroke & TIA", questionCount: 40 },
      { id: "neuro-3", name: "Epilepsy", questionCount: 30 },
      { id: "neuro-4", name: "Dementia", questionCount: 32 },
      { id: "neuro-5", name: "Peripheral Neuropathy", questionCount: 22 },
    ],
  },
  {
    id: "msk",
    name: "Musculoskeletal",
    icon: "bone",
    color: "orange",
    subtopics: [
      { id: "msk-1", name: "Osteoarthritis", questionCount: 34 },
      { id: "msk-2", name: "Rheumatoid Arthritis", questionCount: 30 },
      { id: "msk-3", name: "Back Pain", questionCount: 38 },
      { id: "msk-4", name: "Gout", questionCount: 22 },
      { id: "msk-5", name: "Osteoporosis", questionCount: 28 },
    ],
  },
  {
    id: "derm",
    name: "Dermatology",
    icon: "scan",
    color: "pink",
    subtopics: [
      { id: "derm-1", name: "Eczema & Dermatitis", questionCount: 32 },
      { id: "derm-2", name: "Psoriasis", questionCount: 26 },
      { id: "derm-3", name: "Skin Cancer", questionCount: 38 },
      { id: "derm-4", name: "Acne", questionCount: 20 },
      { id: "derm-5", name: "Fungal Infections", questionCount: 18 },
    ],
  },
  {
    id: "mental",
    name: "Mental Health",
    icon: "brain-circuit",
    color: "teal",
    subtopics: [
      { id: "mental-1", name: "Depression", questionCount: 48 },
      { id: "mental-2", name: "Anxiety Disorders", questionCount: 42 },
      { id: "mental-3", name: "Substance Use", questionCount: 30 },
      { id: "mental-4", name: "Psychosis", questionCount: 24 },
      { id: "mental-5", name: "Eating Disorders", questionCount: 18 },
    ],
  },
  {
    id: "renal",
    name: "Renal Medicine",
    icon: "droplets",
    color: "cyan",
    subtopics: [
      { id: "renal-1", name: "Acute Kidney Injury", questionCount: 28 },
      { id: "renal-2", name: "Chronic Kidney Disease", questionCount: 36 },
      { id: "renal-3", name: "Urinary Tract Infections", questionCount: 32 },
      { id: "renal-4", name: "Electrolyte Disorders", questionCount: 26 },
      { id: "renal-5", name: "Nephrolithiasis", questionCount: 20 },
    ],
  },
  {
    id: "paeds",
    name: "Paediatrics",
    icon: "baby",
    color: "emerald",
    subtopics: [
      { id: "paeds-1", name: "Childhood Infections", questionCount: 40 },
      { id: "paeds-2", name: "Growth & Development", questionCount: 34 },
      { id: "paeds-3", name: "Immunisation", questionCount: 28 },
      { id: "paeds-4", name: "Neonatal Medicine", questionCount: 22 },
      { id: "paeds-5", name: "Childhood Asthma", questionCount: 26 },
    ],
  },
  {
    id: "obgyn",
    name: "Obstetrics & Gynaecology",
    icon: "heart-pulse",
    color: "fuchsia",
    subtopics: [
      { id: "obgyn-1", name: "Antenatal Care", questionCount: 38 },
      { id: "obgyn-2", name: "Contraception", questionCount: 34 },
      { id: "obgyn-3", name: "Menstrual Disorders", questionCount: 28 },
      { id: "obgyn-4", name: "Menopause", questionCount: 24 },
      { id: "obgyn-5", name: "Pregnancy Complications", questionCount: 32 },
    ],
  },
  {
    id: "ophth",
    name: "Ophthalmology",
    icon: "eye",
    color: "blue",
    subtopics: [
      { id: "ophth-1", name: "Glaucoma", questionCount: 24 },
      { id: "ophth-2", name: "Diabetic Retinopathy", questionCount: 22 },
      { id: "ophth-3", name: "Red Eye", questionCount: 28 },
      { id: "ophth-4", name: "Vision Loss", questionCount: 20 },
      { id: "ophth-5", name: "Cataracts", questionCount: 18 },
    ],
  },
];

/* ─── Test Types ──────────────────────────────────────────────────────── */

export interface TestType {
  id: string;
  name: string;
  description: string;
  duration: string;
  questionCount: number;
  icon: string;
}

export const testTypes: TestType[] = [
  {
    id: "akt",
    name: "AKT Practice",
    description: "Applied Knowledge Test — MCQs covering clinical knowledge, evidence interpretation & health informatics.",
    duration: "30 min",
    questionCount: 20,
    icon: "clipboard-check",
  },
  {
    id: "kfp",
    name: "KFP Scenario",
    description: "Key Feature Problems — Clinical case scenarios testing decision-making & management planning.",
    duration: "45 min",
    questionCount: 8,
    icon: "file-text",
  },
  {
    id: "rapid",
    name: "Rapid Fire",
    description: "Quick-fire revision — Short, timed questions designed to reinforce recall under pressure.",
    duration: "10 min",
    questionCount: 30,
    icon: "zap",
  },
];

/* ─── Upcoming Mock Exam ──────────────────────────────────────────────── */

export const upcomingMock = {
  title: "Full AKT Simulation",
  subtitle: "150 Questions · 3 Hours · All Topics",
  date: "2026-06-14T09:00:00",
  registeredCount: 234,
  totalSpots: 300,
};

/* ─── Mock Drill ──────────────────────────────────────────────────────── */

export const mockDrill = {
  title: "Mock Drill",
  description: "Jump into a randomised full-spectrum quiz. No topic selection — we cover everything so you can identify blind spots.",
  questionCount: 50,
  duration: "60 min",
  difficulty: "Mixed",
};
