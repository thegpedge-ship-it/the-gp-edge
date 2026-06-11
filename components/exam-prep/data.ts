/* ─── Interfaces ───────────────────────────────────────────────────────── */

export interface Quiz {
  id: string;
  name: string;
  description: string;
  duration: string;
  questionCount: number;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface SubTopic {
  id: string;
  name: string;
  questionCount: number;
  quizzes: Quiz[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  subtopics: SubTopic[];
}

/* ─── Quiz Templates (reused per subtopic with unique IDs) ─────────────── */

function makeQuizzes(prefix: string, topic: string): Quiz[] {
  return [
    { id: `${prefix}-q1`, name: "Quick Review", description: `Rapid-fire MCQs covering key ${topic} concepts and definitions.`, duration: "10 min", questionCount: 15, difficulty: "Easy" },
    { id: `${prefix}-q2`, name: "Deep Dive", description: `Comprehensive questions testing in-depth ${topic} knowledge and guidelines.`, duration: "30 min", questionCount: 25, difficulty: "Hard" },
    { id: `${prefix}-q3`, name: "Case Studies", description: `Clinical scenario-based questions on ${topic} management and decision-making.`, duration: "20 min", questionCount: 10, difficulty: "Medium" },
    { id: `${prefix}-q4`, name: "Rapid Fire", description: `Timed recall challenge — short ${topic} questions under pressure.`, duration: "5 min", questionCount: 20, difficulty: "Easy" },
    { id: `${prefix}-q5`, name: "Mock Test", description: `Exam-style full mock on ${topic} covering diagnosis, treatment and follow-up.`, duration: "45 min", questionCount: 40, difficulty: "Hard" },
    { id: `${prefix}-q6`, name: "Diagnosis Drill", description: `Identify the correct diagnosis from clinical presentations related to ${topic}.`, duration: "15 min", questionCount: 20, difficulty: "Medium" },
    { id: `${prefix}-q7`, name: "Pharmacology Focus", description: `Drug choices, dosing, interactions and side effects for ${topic} medications.`, duration: "12 min", questionCount: 15, difficulty: "Medium" },
    { id: `${prefix}-q8`, name: "Investigation Picker", description: `Choose the right investigations and interpret results for ${topic} scenarios.`, duration: "18 min", questionCount: 12, difficulty: "Medium" },
    { id: `${prefix}-q9`, name: "Management Pathways", description: `Step-by-step management plans and referral decisions for ${topic}.`, duration: "25 min", questionCount: 18, difficulty: "Hard" },
    { id: `${prefix}-q10`, name: "Red Flags & Emergencies", description: `Identify red flag symptoms and emergency management in ${topic}.`, duration: "8 min", questionCount: 10, difficulty: "Hard" },
  ];
}

/* ─── Medical Subjects & Subtopics ─────────────────────────────────────── */

export const subjects: Subject[] = [
  {
    id: "cardio",
    name: "Cardiovascular",
    icon: "heart",
    color: "rose",
    subtopics: [
      { id: "cardio-1", name: "Ischaemic Heart Disease", questionCount: 45, quizzes: makeQuizzes("cardio-1", "IHD") },
      { id: "cardio-2", name: "Heart Failure", questionCount: 38, quizzes: makeQuizzes("cardio-2", "heart failure") },
      { id: "cardio-3", name: "Arrhythmias", questionCount: 32, quizzes: makeQuizzes("cardio-3", "arrhythmia") },
      { id: "cardio-4", name: "Valvular Heart Disease", questionCount: 28, quizzes: makeQuizzes("cardio-4", "valvular disease") },
      { id: "cardio-5", name: "Hypertension", questionCount: 52, quizzes: makeQuizzes("cardio-5", "hypertension") },
      { id: "cardio-6", name: "Peripheral Vascular Disease", questionCount: 24, quizzes: makeQuizzes("cardio-6", "PVD") },
      { id: "cardio-7", name: "Lipid Management", questionCount: 30, quizzes: makeQuizzes("cardio-7", "lipid management") },
      { id: "cardio-8", name: "Cardiac Rehabilitation", questionCount: 18, quizzes: makeQuizzes("cardio-8", "cardiac rehab") },
      { id: "cardio-9", name: "Aortic Aneurysm", questionCount: 20, quizzes: makeQuizzes("cardio-9", "aortic aneurysm") },
      { id: "cardio-10", name: "Infective Endocarditis", questionCount: 16, quizzes: makeQuizzes("cardio-10", "endocarditis") },
      { id: "cardio-11", name: "Pericardial Disease", questionCount: 14, quizzes: makeQuizzes("cardio-11", "pericardial disease") },
      { id: "cardio-12", name: "Syncope & Palpitations", questionCount: 26, quizzes: makeQuizzes("cardio-12", "syncope") },
      { id: "cardio-13", name: "Anticoagulation Therapy", questionCount: 34, quizzes: makeQuizzes("cardio-13", "anticoagulation") },
      { id: "cardio-14", name: "Cardiovascular Risk Assessment", questionCount: 22, quizzes: makeQuizzes("cardio-14", "CV risk") },
      { id: "cardio-15", name: "Congenital Heart Disease", questionCount: 18, quizzes: makeQuizzes("cardio-15", "congenital heart") },
    ],
  },
  {
    id: "resp",
    name: "Respiratory",
    icon: "wind",
    color: "sky",
    subtopics: [
      { id: "resp-1", name: "Asthma", questionCount: 48, quizzes: makeQuizzes("resp-1", "asthma") },
      { id: "resp-2", name: "COPD", questionCount: 42, quizzes: makeQuizzes("resp-2", "COPD") },
      { id: "resp-3", name: "Pneumonia", questionCount: 35, quizzes: makeQuizzes("resp-3", "pneumonia") },
      { id: "resp-4", name: "Lung Cancer", questionCount: 26, quizzes: makeQuizzes("resp-4", "lung cancer") },
      { id: "resp-5", name: "Pleural Diseases", questionCount: 20, quizzes: makeQuizzes("resp-5", "pleural disease") },
      { id: "resp-6", name: "Pulmonary Embolism", questionCount: 30, quizzes: makeQuizzes("resp-6", "PE") },
      { id: "resp-7", name: "Sleep Apnoea", questionCount: 22, quizzes: makeQuizzes("resp-7", "sleep apnoea") },
      { id: "resp-8", name: "Interstitial Lung Disease", questionCount: 18, quizzes: makeQuizzes("resp-8", "ILD") },
      { id: "resp-9", name: "Tuberculosis", questionCount: 24, quizzes: makeQuizzes("resp-9", "TB") },
      { id: "resp-10", name: "Bronchiectasis", questionCount: 16, quizzes: makeQuizzes("resp-10", "bronchiectasis") },
      { id: "resp-11", name: "Pneumothorax", questionCount: 18, quizzes: makeQuizzes("resp-11", "pneumothorax") },
      { id: "resp-12", name: "Cough Assessment", questionCount: 20, quizzes: makeQuizzes("resp-12", "chronic cough") },
      { id: "resp-13", name: "Pulmonary Function Tests", questionCount: 22, quizzes: makeQuizzes("resp-13", "spirometry") },
      { id: "resp-14", name: "Oxygen Therapy", questionCount: 14, quizzes: makeQuizzes("resp-14", "oxygen therapy") },
      { id: "resp-15", name: "Respiratory Failure", questionCount: 20, quizzes: makeQuizzes("resp-15", "respiratory failure") },
    ],
  },
  {
    id: "gastro",
    name: "Gastroenterology",
    icon: "utensils",
    color: "amber",
    subtopics: [
      { id: "gastro-1", name: "GORD & Peptic Ulcer", questionCount: 40, quizzes: makeQuizzes("gastro-1", "GORD") },
      { id: "gastro-2", name: "Inflammatory Bowel Disease", questionCount: 35, quizzes: makeQuizzes("gastro-2", "IBD") },
      { id: "gastro-3", name: "Liver Disease", questionCount: 38, quizzes: makeQuizzes("gastro-3", "liver disease") },
      { id: "gastro-4", name: "Irritable Bowel Syndrome", questionCount: 22, quizzes: makeQuizzes("gastro-4", "IBS") },
      { id: "gastro-5", name: "Colorectal Cancer", questionCount: 30, quizzes: makeQuizzes("gastro-5", "colorectal cancer") },
      { id: "gastro-6", name: "Coeliac Disease", questionCount: 20, quizzes: makeQuizzes("gastro-6", "coeliac disease") },
      { id: "gastro-7", name: "Pancreatitis", questionCount: 24, quizzes: makeQuizzes("gastro-7", "pancreatitis") },
      { id: "gastro-8", name: "GI Bleeding", questionCount: 28, quizzes: makeQuizzes("gastro-8", "GI bleeding") },
      { id: "gastro-9", name: "Gallstone Disease", questionCount: 22, quizzes: makeQuizzes("gastro-9", "gallstones") },
      { id: "gastro-10", name: "Dysphagia", questionCount: 16, quizzes: makeQuizzes("gastro-10", "dysphagia") },
      { id: "gastro-11", name: "Hepatitis B & C", questionCount: 26, quizzes: makeQuizzes("gastro-11", "viral hepatitis") },
      { id: "gastro-12", name: "Alcohol-Related Liver Disease", questionCount: 20, quizzes: makeQuizzes("gastro-12", "ALD") },
      { id: "gastro-13", name: "Hernias", questionCount: 18, quizzes: makeQuizzes("gastro-13", "hernia") },
      { id: "gastro-14", name: "Constipation & Diarrhoea", questionCount: 24, quizzes: makeQuizzes("gastro-14", "bowel habit") },
      { id: "gastro-15", name: "Diverticular Disease", questionCount: 16, quizzes: makeQuizzes("gastro-15", "diverticular disease") },
    ],
  },
  {
    id: "endo",
    name: "Endocrinology",
    icon: "flame",
    color: "violet",
    subtopics: [
      { id: "endo-1", name: "Diabetes Mellitus Type 2", questionCount: 55, quizzes: makeQuizzes("endo-1", "T2DM") },
      { id: "endo-2", name: "Diabetes Mellitus Type 1", questionCount: 34, quizzes: makeQuizzes("endo-2", "T1DM") },
      { id: "endo-3", name: "Thyroid Disorders", questionCount: 42, quizzes: makeQuizzes("endo-3", "thyroid") },
      { id: "endo-4", name: "Adrenal Disorders", questionCount: 24, quizzes: makeQuizzes("endo-4", "adrenal disorders") },
      { id: "endo-5", name: "Pituitary Disorders", questionCount: 18, quizzes: makeQuizzes("endo-5", "pituitary") },
      { id: "endo-6", name: "Metabolic Syndrome", questionCount: 28, quizzes: makeQuizzes("endo-6", "metabolic syndrome") },
      { id: "endo-7", name: "PCOS", questionCount: 26, quizzes: makeQuizzes("endo-7", "PCOS") },
      { id: "endo-8", name: "Calcium & Bone Metabolism", questionCount: 22, quizzes: makeQuizzes("endo-8", "calcium metabolism") },
      { id: "endo-9", name: "Diabetic Complications", questionCount: 36, quizzes: makeQuizzes("endo-9", "diabetic complications") },
      { id: "endo-10", name: "Insulin Management", questionCount: 30, quizzes: makeQuizzes("endo-10", "insulin therapy") },
      { id: "endo-11", name: "Gestational Diabetes", questionCount: 20, quizzes: makeQuizzes("endo-11", "GDM") },
      { id: "endo-12", name: "Obesity Management", questionCount: 24, quizzes: makeQuizzes("endo-12", "obesity") },
      { id: "endo-13", name: "Hypogonadism", questionCount: 16, quizzes: makeQuizzes("endo-13", "hypogonadism") },
      { id: "endo-14", name: "Thyroid Nodules & Cancer", questionCount: 18, quizzes: makeQuizzes("endo-14", "thyroid cancer") },
    ],
  },
  {
    id: "neuro",
    name: "Neurology",
    icon: "brain",
    color: "indigo",
    subtopics: [
      { id: "neuro-1", name: "Headache & Migraine", questionCount: 36, quizzes: makeQuizzes("neuro-1", "headache") },
      { id: "neuro-2", name: "Stroke & TIA", questionCount: 40, quizzes: makeQuizzes("neuro-2", "stroke") },
      { id: "neuro-3", name: "Epilepsy", questionCount: 30, quizzes: makeQuizzes("neuro-3", "epilepsy") },
      { id: "neuro-4", name: "Dementia", questionCount: 32, quizzes: makeQuizzes("neuro-4", "dementia") },
      { id: "neuro-5", name: "Peripheral Neuropathy", questionCount: 22, quizzes: makeQuizzes("neuro-5", "neuropathy") },
      { id: "neuro-6", name: "Multiple Sclerosis", questionCount: 24, quizzes: makeQuizzes("neuro-6", "MS") },
      { id: "neuro-7", name: "Parkinson's Disease", questionCount: 28, quizzes: makeQuizzes("neuro-7", "Parkinson's") },
      { id: "neuro-8", name: "Bell's Palsy & Cranial Nerves", questionCount: 18, quizzes: makeQuizzes("neuro-8", "cranial nerve") },
      { id: "neuro-9", name: "Dizziness & Vertigo", questionCount: 26, quizzes: makeQuizzes("neuro-9", "vertigo") },
      { id: "neuro-10", name: "Tremor & Movement Disorders", questionCount: 20, quizzes: makeQuizzes("neuro-10", "movement disorders") },
      { id: "neuro-11", name: "Motor Neurone Disease", questionCount: 14, quizzes: makeQuizzes("neuro-11", "MND") },
      { id: "neuro-12", name: "Meningitis & Encephalitis", questionCount: 22, quizzes: makeQuizzes("neuro-12", "CNS infection") },
      { id: "neuro-13", name: "Carpal Tunnel & Entrapments", questionCount: 16, quizzes: makeQuizzes("neuro-13", "nerve entrapment") },
      { id: "neuro-14", name: "Spinal Cord Disorders", questionCount: 18, quizzes: makeQuizzes("neuro-14", "spinal cord") },
      { id: "neuro-15", name: "Neurology Investigations", questionCount: 20, quizzes: makeQuizzes("neuro-15", "neuro investigations") },
    ],
  },
  {
    id: "msk",
    name: "Musculoskeletal",
    icon: "bone",
    color: "orange",
    subtopics: [
      { id: "msk-1", name: "Osteoarthritis", questionCount: 34, quizzes: makeQuizzes("msk-1", "OA") },
      { id: "msk-2", name: "Rheumatoid Arthritis", questionCount: 30, quizzes: makeQuizzes("msk-2", "RA") },
      { id: "msk-3", name: "Back Pain", questionCount: 38, quizzes: makeQuizzes("msk-3", "back pain") },
      { id: "msk-4", name: "Gout", questionCount: 22, quizzes: makeQuizzes("msk-4", "gout") },
      { id: "msk-5", name: "Osteoporosis", questionCount: 28, quizzes: makeQuizzes("msk-5", "osteoporosis") },
      { id: "msk-6", name: "Shoulder Disorders", questionCount: 20, quizzes: makeQuizzes("msk-6", "shoulder") },
      { id: "msk-7", name: "Knee Disorders", questionCount: 24, quizzes: makeQuizzes("msk-7", "knee") },
      { id: "msk-8", name: "Fibromyalgia", questionCount: 18, quizzes: makeQuizzes("msk-8", "fibromyalgia") },
      { id: "msk-9", name: "Neck Pain & Cervicalgia", questionCount: 22, quizzes: makeQuizzes("msk-9", "neck pain") },
      { id: "msk-10", name: "Hip Disorders", questionCount: 20, quizzes: makeQuizzes("msk-10", "hip") },
      { id: "msk-11", name: "Tendinopathy & Bursitis", questionCount: 18, quizzes: makeQuizzes("msk-11", "tendinopathy") },
      { id: "msk-12", name: "Lupus & Connective Tissue", questionCount: 24, quizzes: makeQuizzes("msk-12", "CTD") },
      { id: "msk-13", name: "Sports Injuries", questionCount: 20, quizzes: makeQuizzes("msk-13", "sports injury") },
      { id: "msk-14", name: "Hand & Wrist Disorders", questionCount: 16, quizzes: makeQuizzes("msk-14", "hand & wrist") },
      { id: "msk-15", name: "Vasculitis", questionCount: 14, quizzes: makeQuizzes("msk-15", "vasculitis") },
    ],
  },
  {
    id: "derm",
    name: "Dermatology",
    icon: "scan",
    color: "pink",
    subtopics: [
      { id: "derm-1", name: "Eczema & Dermatitis", questionCount: 32, quizzes: makeQuizzes("derm-1", "eczema") },
      { id: "derm-2", name: "Psoriasis", questionCount: 26, quizzes: makeQuizzes("derm-2", "psoriasis") },
      { id: "derm-3", name: "Skin Cancer", questionCount: 38, quizzes: makeQuizzes("derm-3", "skin cancer") },
      { id: "derm-4", name: "Acne", questionCount: 20, quizzes: makeQuizzes("derm-4", "acne") },
      { id: "derm-5", name: "Fungal Infections", questionCount: 18, quizzes: makeQuizzes("derm-5", "fungal infection") },
      { id: "derm-6", name: "Urticaria & Angioedema", questionCount: 22, quizzes: makeQuizzes("derm-6", "urticaria") },
      { id: "derm-7", name: "Wound Management", questionCount: 24, quizzes: makeQuizzes("derm-7", "wound care") },
      { id: "derm-8", name: "Moles & Naevi", questionCount: 20, quizzes: makeQuizzes("derm-8", "moles") },
      { id: "derm-9", name: "Rosacea", questionCount: 14, quizzes: makeQuizzes("derm-9", "rosacea") },
      { id: "derm-10", name: "Bacterial Skin Infections", questionCount: 22, quizzes: makeQuizzes("derm-10", "skin infections") },
      { id: "derm-11", name: "Viral Skin Infections", questionCount: 18, quizzes: makeQuizzes("derm-11", "viral skin") },
      { id: "derm-12", name: "Alopecia & Hair Loss", questionCount: 16, quizzes: makeQuizzes("derm-12", "alopecia") },
      { id: "derm-13", name: "Leg Ulcers", questionCount: 20, quizzes: makeQuizzes("derm-13", "leg ulcers") },
      { id: "derm-14", name: "Drug Reactions & Rashes", questionCount: 22, quizzes: makeQuizzes("derm-14", "drug rash") },
    ],
  },
  {
    id: "mental",
    name: "Mental Health",
    icon: "brain-circuit",
    color: "teal",
    subtopics: [
      { id: "mental-1", name: "Depression", questionCount: 48, quizzes: makeQuizzes("mental-1", "depression") },
      { id: "mental-2", name: "Anxiety Disorders", questionCount: 42, quizzes: makeQuizzes("mental-2", "anxiety") },
      { id: "mental-3", name: "Substance Use", questionCount: 30, quizzes: makeQuizzes("mental-3", "substance use") },
      { id: "mental-4", name: "Psychosis", questionCount: 24, quizzes: makeQuizzes("mental-4", "psychosis") },
      { id: "mental-5", name: "Eating Disorders", questionCount: 18, quizzes: makeQuizzes("mental-5", "eating disorders") },
      { id: "mental-6", name: "PTSD & Trauma", questionCount: 26, quizzes: makeQuizzes("mental-6", "PTSD") },
      { id: "mental-7", name: "ADHD", questionCount: 22, quizzes: makeQuizzes("mental-7", "ADHD") },
      { id: "mental-8", name: "Bipolar Disorder", questionCount: 20, quizzes: makeQuizzes("mental-8", "bipolar") },
      { id: "mental-9", name: "OCD", questionCount: 18, quizzes: makeQuizzes("mental-9", "OCD") },
      { id: "mental-10", name: "Personality Disorders", questionCount: 20, quizzes: makeQuizzes("mental-10", "personality disorders") },
      { id: "mental-11", name: "Self-Harm & Suicide Risk", questionCount: 28, quizzes: makeQuizzes("mental-11", "self-harm") },
      { id: "mental-12", name: "Sleep Disorders", questionCount: 22, quizzes: makeQuizzes("mental-12", "sleep disorders") },
      { id: "mental-13", name: "Autism Spectrum Disorder", questionCount: 16, quizzes: makeQuizzes("mental-13", "ASD") },
      { id: "mental-14", name: "Somatoform Disorders", questionCount: 14, quizzes: makeQuizzes("mental-14", "somatoform") },
      { id: "mental-15", name: "Mental Health Legislation", questionCount: 20, quizzes: makeQuizzes("mental-15", "MH law") },
    ],
  },
  {
    id: "renal",
    name: "Renal Medicine",
    icon: "droplets",
    color: "cyan",
    subtopics: [
      { id: "renal-1", name: "Acute Kidney Injury", questionCount: 28, quizzes: makeQuizzes("renal-1", "AKI") },
      { id: "renal-2", name: "Chronic Kidney Disease", questionCount: 36, quizzes: makeQuizzes("renal-2", "CKD") },
      { id: "renal-3", name: "Urinary Tract Infections", questionCount: 32, quizzes: makeQuizzes("renal-3", "UTI") },
      { id: "renal-4", name: "Electrolyte Disorders", questionCount: 26, quizzes: makeQuizzes("renal-4", "electrolytes") },
      { id: "renal-5", name: "Nephrolithiasis", questionCount: 20, quizzes: makeQuizzes("renal-5", "kidney stones") },
      { id: "renal-6", name: "Haematuria", questionCount: 22, quizzes: makeQuizzes("renal-6", "haematuria") },
      { id: "renal-7", name: "Proteinuria & Nephrotic Syndrome", questionCount: 18, quizzes: makeQuizzes("renal-7", "proteinuria") },
      { id: "renal-8", name: "Dialysis & Transplant", questionCount: 16, quizzes: makeQuizzes("renal-8", "dialysis") },
      { id: "renal-9", name: "Renal Artery Stenosis", questionCount: 14, quizzes: makeQuizzes("renal-9", "renal artery") },
      { id: "renal-10", name: "Polycystic Kidney Disease", questionCount: 16, quizzes: makeQuizzes("renal-10", "PKD") },
      { id: "renal-11", name: "Glomerulonephritis", questionCount: 18, quizzes: makeQuizzes("renal-11", "GN") },
      { id: "renal-12", name: "Drug Nephrotoxicity", questionCount: 20, quizzes: makeQuizzes("renal-12", "nephrotoxicity") },
      { id: "renal-13", name: "Urinary Incontinence", questionCount: 24, quizzes: makeQuizzes("renal-13", "incontinence") },
      { id: "renal-14", name: "Prostate & Bladder", questionCount: 26, quizzes: makeQuizzes("renal-14", "prostate") },
    ],
  },
  {
    id: "paeds",
    name: "Paediatrics",
    icon: "baby",
    color: "emerald",
    subtopics: [
      { id: "paeds-1", name: "Childhood Infections", questionCount: 40, quizzes: makeQuizzes("paeds-1", "childhood infection") },
      { id: "paeds-2", name: "Growth & Development", questionCount: 34, quizzes: makeQuizzes("paeds-2", "growth") },
      { id: "paeds-3", name: "Immunisation", questionCount: 28, quizzes: makeQuizzes("paeds-3", "immunisation") },
      { id: "paeds-4", name: "Neonatal Medicine", questionCount: 22, quizzes: makeQuizzes("paeds-4", "neonatal") },
      { id: "paeds-5", name: "Childhood Asthma", questionCount: 26, quizzes: makeQuizzes("paeds-5", "childhood asthma") },
      { id: "paeds-6", name: "Paediatric Emergencies", questionCount: 30, quizzes: makeQuizzes("paeds-6", "paediatric emergency") },
      { id: "paeds-7", name: "Child Safeguarding", questionCount: 24, quizzes: makeQuizzes("paeds-7", "safeguarding") },
      { id: "paeds-8", name: "Childhood Rashes", questionCount: 20, quizzes: makeQuizzes("paeds-8", "childhood rash") },
      { id: "paeds-9", name: "Fever in Children", questionCount: 26, quizzes: makeQuizzes("paeds-9", "paediatric fever") },
      { id: "paeds-10", name: "Failure to Thrive", questionCount: 18, quizzes: makeQuizzes("paeds-10", "FTT") },
      { id: "paeds-11", name: "Childhood Obesity", questionCount: 16, quizzes: makeQuizzes("paeds-11", "childhood obesity") },
      { id: "paeds-12", name: "Paediatric ENT", questionCount: 22, quizzes: makeQuizzes("paeds-12", "paediatric ENT") },
      { id: "paeds-13", name: "Behavioural Problems", questionCount: 20, quizzes: makeQuizzes("paeds-13", "behavioural") },
      { id: "paeds-14", name: "Congenital Abnormalities", questionCount: 18, quizzes: makeQuizzes("paeds-14", "congenital") },
      { id: "paeds-15", name: "Childhood Epilepsy", questionCount: 20, quizzes: makeQuizzes("paeds-15", "paediatric epilepsy") },
    ],
  },
  {
    id: "obgyn",
    name: "Obstetrics & Gynaecology",
    icon: "heart-pulse",
    color: "fuchsia",
    subtopics: [
      { id: "obgyn-1", name: "Antenatal Care", questionCount: 38, quizzes: makeQuizzes("obgyn-1", "antenatal care") },
      { id: "obgyn-2", name: "Contraception", questionCount: 34, quizzes: makeQuizzes("obgyn-2", "contraception") },
      { id: "obgyn-3", name: "Menstrual Disorders", questionCount: 28, quizzes: makeQuizzes("obgyn-3", "menstrual disorders") },
      { id: "obgyn-4", name: "Menopause", questionCount: 24, quizzes: makeQuizzes("obgyn-4", "menopause") },
      { id: "obgyn-5", name: "Pregnancy Complications", questionCount: 32, quizzes: makeQuizzes("obgyn-5", "pregnancy complications") },
      { id: "obgyn-6", name: "Fertility & Subfertility", questionCount: 22, quizzes: makeQuizzes("obgyn-6", "fertility") },
      { id: "obgyn-7", name: "Cervical Screening", questionCount: 20, quizzes: makeQuizzes("obgyn-7", "cervical screening") },
      { id: "obgyn-8", name: "Postnatal Care", questionCount: 26, quizzes: makeQuizzes("obgyn-8", "postnatal") },
      { id: "obgyn-9", name: "Ectopic Pregnancy", questionCount: 18, quizzes: makeQuizzes("obgyn-9", "ectopic") },
      { id: "obgyn-10", name: "Miscarriage", questionCount: 20, quizzes: makeQuizzes("obgyn-10", "miscarriage") },
      { id: "obgyn-11", name: "Pelvic Pain", questionCount: 22, quizzes: makeQuizzes("obgyn-11", "pelvic pain") },
      { id: "obgyn-12", name: "Endometriosis", questionCount: 24, quizzes: makeQuizzes("obgyn-12", "endometriosis") },
      { id: "obgyn-13", name: "Vaginal Discharge & STIs", questionCount: 26, quizzes: makeQuizzes("obgyn-13", "vaginal discharge") },
      { id: "obgyn-14", name: "Pre-eclampsia & Eclampsia", questionCount: 20, quizzes: makeQuizzes("obgyn-14", "pre-eclampsia") },
      { id: "obgyn-15", name: "Labour & Delivery", questionCount: 28, quizzes: makeQuizzes("obgyn-15", "labour") },
    ],
  },
  {
    id: "ophth",
    name: "Ophthalmology",
    icon: "eye",
    color: "blue",
    subtopics: [
      { id: "ophth-1", name: "Glaucoma", questionCount: 24, quizzes: makeQuizzes("ophth-1", "glaucoma") },
      { id: "ophth-2", name: "Diabetic Retinopathy", questionCount: 22, quizzes: makeQuizzes("ophth-2", "diabetic retinopathy") },
      { id: "ophth-3", name: "Red Eye", questionCount: 28, quizzes: makeQuizzes("ophth-3", "red eye") },
      { id: "ophth-4", name: "Vision Loss", questionCount: 20, quizzes: makeQuizzes("ophth-4", "vision loss") },
      { id: "ophth-5", name: "Cataracts", questionCount: 18, quizzes: makeQuizzes("ophth-5", "cataracts") },
      { id: "ophth-6", name: "Macular Degeneration", questionCount: 22, quizzes: makeQuizzes("ophth-6", "AMD") },
      { id: "ophth-7", name: "Eye Trauma", questionCount: 16, quizzes: makeQuizzes("ophth-7", "eye trauma") },
      { id: "ophth-8", name: "Conjunctivitis", questionCount: 20, quizzes: makeQuizzes("ophth-8", "conjunctivitis") },
      { id: "ophth-9", name: "Uveitis", questionCount: 14, quizzes: makeQuizzes("ophth-9", "uveitis") },
      { id: "ophth-10", name: "Refractive Errors", questionCount: 16, quizzes: makeQuizzes("ophth-10", "refractive errors") },
      { id: "ophth-11", name: "Eyelid Disorders", questionCount: 14, quizzes: makeQuizzes("ophth-11", "eyelid") },
      { id: "ophth-12", name: "Retinal Detachment", questionCount: 16, quizzes: makeQuizzes("ophth-12", "retinal detachment") },
      { id: "ophth-13", name: "Optic Neuritis", questionCount: 14, quizzes: makeQuizzes("ophth-13", "optic neuritis") },
      { id: "ophth-14", name: "Dry Eye & Tear Disorders", questionCount: 18, quizzes: makeQuizzes("ophth-14", "dry eye") },
    ],
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

/* ─── Mock Tests (full AKT simulations) ───────────────────────────────── */

export type MockTestStatus = "completed" | "in-progress" | "available" | "locked";

export interface MockTest {
  id: string;
  name: string;
  subtitle: string;
  questionCount: number;
  duration: string;
  status: MockTestStatus;
  bestScore?: number; // % — present when completed
  progress?: number;  // % — present when in-progress
  attempts?: number;
  /* Attempt analytics — present once the test has been attempted */
  accuracy?: number;       // your accuracy %
  cohortAccuracy?: number; // cohort average accuracy %
  yourMarks?: number;      // your marks
  avgMarks?: number;       // cohort average marks
}

export const mockTests: MockTest[] = [
  { id: "mock-1", name: "AKT Simulation 1", subtitle: "All topics · Foundation", questionCount: 150, duration: "3 hrs", status: "completed", bestScore: 78, attempts: 2, accuracy: 78, cohortAccuracy: 65, yourMarks: 117, avgMarks: 98 },
  { id: "mock-2", name: "AKT Simulation 2", subtitle: "All topics · Standard", questionCount: 150, duration: "3 hrs", status: "completed", bestScore: 71, attempts: 1, accuracy: 71, cohortAccuracy: 64, yourMarks: 107, avgMarks: 96 },
  { id: "mock-3", name: "AKT Simulation 3", subtitle: "All topics · Standard", questionCount: 150, duration: "3 hrs", status: "in-progress", progress: 42, attempts: 1 },
  { id: "mock-4", name: "AKT Simulation 4", subtitle: "All topics · Standard", questionCount: 150, duration: "3 hrs", status: "available" },
  { id: "mock-5", name: "AKT Simulation 5", subtitle: "All topics · Advanced", questionCount: 150, duration: "3 hrs", status: "available" },
  { id: "mock-6", name: "AKT Simulation 6", subtitle: "All topics · Advanced", questionCount: 150, duration: "3 hrs", status: "locked" },
  { id: "mock-7", name: "AKT Simulation 7", subtitle: "All topics · Advanced", questionCount: 150, duration: "3 hrs", status: "locked" },
  { id: "mock-8", name: "Final Mock Exam", subtitle: "All topics · Exam standard", questionCount: 200, duration: "4 hrs", status: "locked" },
];
