import { generatedConditions } from "./generatedConditions";

export interface Reference {
  id: number;
  text: string;
  url?: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  system: "Cardiology" | "Respiratory" | "Endocrine" | "Gastrointestinal" | "Psychiatry" | "Dermatology" | "Women's Health" | "Paediatrics" | "Neurology" | "Musculoskeletal" | "MBS";
  category: string;
  type: "Condition" | "Guideline" | "Document" | "Note";
  isPremium?: boolean;
  lastUpdated: string;
  author: string;
  
  // Detail Fields
  symptoms: string[];
  diagnosisCriteria: string[];
  treatmentOptions: string[];
  clinicalNotes: string;
  references: Reference[];
  
  // Document attachments
  document?: {
    filename: string;
    fileSize: string;
    totalPages: number;
    downloadUrl?: string;
    summary: string;
  };
}

export const bodySystems = [
  { id: "Cardiology", name: "Cardiology", iconName: "Heart", color: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50 dark:bg-emerald-950/20", textColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "Respiratory", name: "Respiratory", iconName: "Activity", color: "from-teal-500 to-teal-600", lightBg: "bg-teal-50 dark:bg-teal-950/20", textColor: "text-teal-600 dark:text-teal-400" },
  { id: "Endocrine", name: "Endocrine", iconName: "Droplet", color: "from-green-500 to-green-600", lightBg: "bg-green-50 dark:bg-green-950/20", textColor: "text-green-600 dark:text-green-400" },
  { id: "Gastrointestinal", name: "Gastrointestinal", iconName: "Apple", color: "from-emerald-600 to-emerald-700", lightBg: "bg-emerald-100/50 dark:bg-emerald-950/10", textColor: "text-emerald-700 dark:text-emerald-400" },
  { id: "Psychiatry", name: "Psychiatry", iconName: "Brain", color: "from-teal-600 to-teal-700", lightBg: "bg-teal-100/50 dark:bg-teal-950/10", textColor: "text-teal-700 dark:text-teal-400" },
  { id: "Dermatology", name: "Dermatology", iconName: "Sparkles", color: "from-green-600 to-green-700", lightBg: "bg-green-100/50 dark:bg-green-950/10", textColor: "text-green-700 dark:text-green-400" },
  { id: "Women's Health", name: "Women's Health", iconName: "User", color: "from-slate-500 to-slate-600", lightBg: "bg-slate-100 dark:bg-slate-900/60", textColor: "text-slate-600 dark:text-slate-300" },
  { id: "Paediatrics", name: "Paediatrics", iconName: "Baby", color: "from-emerald-400 to-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/20", textColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "Neurology", name: "Neurology", iconName: "Brain", color: "from-blue-500 to-blue-600", lightBg: "bg-blue-50 dark:bg-blue-955/20", textColor: "text-blue-600 dark:text-blue-400" },
  { id: "Musculoskeletal", name: "Musculoskeletal", iconName: "Bone", color: "from-indigo-550 to-indigo-650", lightBg: "bg-indigo-50 dark:bg-indigo-950/20", textColor: "text-indigo-600 dark:text-indigo-400" },
  { id: "MBS", name: "MBS Billing", iconName: "FileText", color: "from-amber-500 to-amber-600", lightBg: "bg-amber-50 dark:bg-amber-950/20", textColor: "text-amber-600 dark:text-amber-400" },
];

const initialMockConditions: MedicalCondition[] = [
  {
    id: "COND-001",
    name: "Type 2 Diabetes Mellitus",
    system: "Endocrine",
    category: "Chronic Disease Management",
    type: "Guideline",
    isPremium: false,
    lastUpdated: "28 May 2026",
    author: "Dr. Arun Mehta",
    symptoms: [
      "Polyuria (excessive urination)",
      "Polydipsia (excessive thirst)",
      "Lethargy or extreme fatigue",
      "Unexplained weight loss",
      "Blurred vision",
      "Slow-healing cuts or frequent infections"
    ],
    diagnosisCriteria: [
      "Fasting plasma glucose ≥ 7.0 mmol/L (126 mg/dL)",
      "2-hour plasma glucose ≥ 11.1 mmol/L (200 mg/dL) during oral glucose tolerance test (OGTT)",
      "HbA1c ≥ 6.5% (48 mmol/mol) confirmed on two separate occasions if asymptomatic",
      "Random plasma glucose ≥ 11.1 mmol/L in presence of classic hyperosmolar symptoms"
    ],
    treatmentOptions: [
      "First-line lifestyle optimization: Diet (low glycemic load/Mediterranean) and exercise (150+ min/week)",
      "First-line pharmacotherapy: Metformin 500mg daily, titrate to 1000mg BD as tolerated",
      "Second-line add-ons: SGLT2 inhibitors (e.g., Dapagliflozin) especially if renal/cardiovascular disease is present",
      "GLP-1 receptor agonists (e.g., Semaglutide) for high cardiovascular risk and weight control needs",
      "DPP-4 inhibitors (e.g., Sitagliptin) when weight neutrality is critical and renal function prevents Metformin titration"
    ],
    clinicalNotes: "Always conduct comprehensive vascular and nerve assessments on feet at diagnosis and annually. Target HbA1c is generally < 7.0%, but loosen to < 8.0% for frail elderly patients with high hypoglycemic risk. Ensure MBS Item 721 (GPMP) and Item 723 (TCA) are set up to support multidisciplinary allied health access.",
    references: [
      { id: 1, text: "RACGP. Management of type 2 diabetes: A handbook for general practice. 2020.", url: "https://www.racgp.org.au/clinical-resources/clinical-guidelines" },
      { id: 2, text: "Diabetes Australia. Clinical guidelines for Type 2 Diabetes Management. 2023." }
    ],
    document: {
      filename: "RACGP_Diabetes_Handbook_v3.pdf",
      fileSize: "2.4 MB",
      totalPages: 18,
      downloadUrl: "#",
      summary: "This comprehensive summary covers RACGP/Diabetes Australia's combined guidelines for patient assessment, pharmacological flowchart updates, HbA1c target tables, and MBS billing code recommendations for Type 2 Diabetes."
    }
  },
  {
    id: "COND-002",
    name: "Acute Coronary Syndrome (ACS)",
    system: "Cardiology",
    category: "Emergency Medicine",
    type: "Guideline",
    isPremium: true,
    lastUpdated: "25 May 2026",
    author: "Siddhant Udavant",
    symptoms: [
      "Retrosternal chest pressure, tightness or heavy pain, radiating to left arm, neck, or jaw",
      "Shortness of breath (dyspnoea)",
      "Diaphoresis (profuse sweating)",
      "Nausea, vomiting or indigestion-like symptoms",
      "Lightheadedness, dizziness, or syncope"
    ],
    diagnosisCriteria: [
      "12-Lead ECG: ST-segment elevation or depression, T-wave inversion, or new LBBB within 10 minutes of presentation",
      "Cardiac Troponin (I or T): Elevation above the 99th percentile with a rising/falling pattern",
      "Clinical history indicating cardiac ischemic symptoms"
    ],
    treatmentOptions: [
      "Immediate management: Call emergency services (000). Administer Aspirin 300mg chewed.",
      "Oxygen: Only if SaO2 < 93% or in respiratory distress",
      "Glyceryl Trinitrate (GTN): 300-600mcg sublingual. Repeat every 5 mins as needed (max 3 doses), monitor BP.",
      "Dual Antiplatelet Therapy (DAPT): Clopidogrel, Ticagrelor, or Prasugrel in consultation with cardiology",
      "Intravenous Morphine: 2.5-5mg slowly for severe pain and anxiety"
    ],
    clinicalNotes: "STEMI requires immediate reperfusion (PCI within 90 minutes or thrombolysis if PCI unavailable within 120 mins). NSTEMI requires risk stratification (GRACE score) and early invasive strategy within 24-72 hours. Ensure secondary prevention is initiated post-discharge (Dual antiplatelets, beta blocker, ACE inhibitor, high-intensity statin).",
    references: [
      { id: 1, text: "National Heart Foundation of Australia. Clinical guidelines for the management of ACS. 2022." },
      { id: 2, text: "Cardiac Society of Australia and New Zealand (CSANZ) ACS Consensus Statement. 2021." }
    ],
    document: {
      filename: "Heart_Foundation_ACS_Flowchart.pdf",
      fileSize: "1.8 MB",
      totalPages: 8,
      downloadUrl: "#",
      summary: "A step-by-step emergency checklist for diagnosing and treating STEMI and NSTEMI, including medication dosages, ECG indicators, and cardiac enzyme monitoring intervals."
    }
  },
  {
    id: "COND-003",
    name: "Asthma Action Plan",
    system: "Respiratory",
    category: "Chronic Disease Management",
    type: "Document",
    isPremium: false,
    lastUpdated: "18 May 2026",
    author: "Dr. Arun Mehta",
    symptoms: [
      "Wheezing on expiration",
      "Persistent dry cough, worse at night or early morning",
      "Shortness of breath or chest tightness",
      "Decreased exercise tolerance"
    ],
    diagnosisCriteria: [
      "Spirometry: Demonstration of variable airflow limitation (FEV1 increase of ≥12% and ≥200mL after 4 puffs of Salbutamol)",
      "Peak Expiratory Flow (PEF): Diurnal variability of >10%",
      "Clinical history matching trigger-induced bronchial hyper-responsiveness"
    ],
    treatmentOptions: [
      "Reliever: Short-acting beta2-agonist (SABA), e.g., Salbutamol 2-4 puffs via spacer when symptomatic",
      "Controller: Inhaled Corticosteroid (ICS), e.g., Fluticasone or Budesonide daily as maintenance",
      "Combination (ICS/LABA): Budesonide/Formoterol (Symbicort) for maintenance and reliever therapy (SMART regimen)",
      "Systemic Corticosteroids: Short course of oral prednisolone (e.g., 37.5-50mg for 5 days) for acute moderate/severe flare-ups"
    ],
    clinicalNotes: "Every asthma patient must have a written, updated Asthma Action Plan. Monitor device technique at every review. Check adherence and trigger factors before stepping up pharmacological treatment.",
    references: [
      { id: 1, text: "National Asthma Council Australia. Australian Asthma Handbook, Version 2.2. 2022.", url: "https://www.asthmahandbook.org.au" },
      { id: 2, text: "Global Initiative for Asthma (GINA) Guidelines. 2023." }
    ],
    document: {
      filename: "National_Asthma_Action_Plan_Template.pdf",
      fileSize: "950 KB",
      totalPages: 3,
      downloadUrl: "#",
      summary: "The official National Asthma Council Australia action plan template, detailing the green, amber, and red warning zones, rescue medication dosage steps, and emergency protocol guide."
    }
  },
  {
    id: "COND-004",
    name: "Depression in Adults",
    system: "Psychiatry",
    category: "Mental Health",
    type: "Note",
    isPremium: false,
    lastUpdated: "20 May 2026",
    author: "Jessica Park",
    symptoms: [
      "Depressed mood or persistent sadness",
      "Anhedonia (diminished interest or pleasure in activities)",
      "Fatigue or loss of energy",
      "Sleep disturbances (insomnia or hypersomnia)",
      "Feelings of worthlessness or excessive/inappropriate guilt",
      "Difficulty concentrating or indecisiveness",
      "Recurrent thoughts of death or suicidal ideation"
    ],
    diagnosisCriteria: [
      "DSM-5 Criteria: 5 or more of the classic symptoms present during the same 2-week period, representing a change from previous functioning, with at least one symptom being depressed mood or loss of interest/pleasure.",
      "Use PHQ-9 questionnaire to quantify severity (Mild 5-9, Moderate 10-14, Severe >19)",
      "Ensure symptoms cause clinically significant distress or impairment, and are not due to substance abuse or another medical condition"
    ],
    treatmentOptions: [
      "Mild depression: Psychological therapy (CBT, ACT, or IPT) and lifestyle counseling (sleep, exercise)",
      "Moderate depression: CBT/psychological therapy, consider trial of SSRI (e.g., Sertraline 50mg daily, titrate to 100-200mg)",
      "Severe depression: Direct initiation of SSRI/SNRI combined with intensive psychological care, psychiatrist referral",
      "Regular physical exercise: Proven efficacy as an adjunctive treatment for mild-to-moderate depression"
    ],
    clinicalNotes: "Always assess and document safety/suicide risk at every consultation. Allow 4-6 weeks of therapy before assessing antidepressant response. Continue pharmacotherapy for at least 6-12 months post-remission to prevent relapse. Create a GP Mental Health Care Plan (MBS Item 2715/2717) for Medicare subsidised psychology sessions.",
    references: [
      { id: 1, text: "Royal Australian and New Zealand College of Psychiatrists (RANZCP) Mood Disorders Clinical Practice Guidelines. 2020." },
      { id: 2, text: "Beyond Blue GP Clinical Toolkit for Depression. 2023." }
    ],
    document: {
      filename: "RANZCP_Mood_Disorders_Summary.pdf",
      fileSize: "1.2 MB",
      totalPages: 12,
      downloadUrl: "#",
      summary: "Executive summary of the RANZCP mood disorders guidelines, outlining stepped-care models, antidepressant selection guides, side-effect profiles, and suicide risk evaluation steps."
    }
  },
  {
    id: "COND-005",
    name: "Melanoma & Skin Cancer Detection",
    system: "Dermatology",
    category: "Oncology & Skin Diseases",
    type: "Document",
    isPremium: true,
    lastUpdated: "15 May 2026",
    author: "Jessica Park",
    symptoms: [
      "New, enlarging, or changing pigmented skin lesion",
      "Lesion exhibiting asymmetry or irregular borders",
      "Color variation (multiple shades of brown, black, blue, red, or white)",
      "Diameter > 6mm, or an evolving/bleeding/itchy spot"
    ],
    diagnosisCriteria: [
      "Dermoscopy: Analysis for atypical pigment network, regression structures, blue-white veil, or irregular streaks",
      "Biopsy: Excisional biopsy with 2mm lateral margin down to subcutaneous fat is gold standard (incisional biopsy only in select large lesions)",
      "Pathology Report: Breslow thickness, mitotic rate, ulceration, margins, and regression indicators"
    ],
    treatmentOptions: [
      "Primary treatment: Wide Local Excision (WLE) with safety margins based on Breslow thickness (In situ: 5mm; <1mm Breslow: 10mm; 1-2mm Breslow: 1-2cm; >2mm Breslow: 2cm)",
      "Sentinel Lymph Node Biopsy (SLNB): Consider for stage IB or II melanomas (Breslow >1.0mm, or >0.8mm with ulceration)",
      "Adjuvant systemic therapy: Immunotherapy (e.g., Pembrolizumab, Nivolumab) or targeted therapy (e.g., Dabrafenib + Trametinib) for stage III/IV disease"
    ],
    clinicalNotes: "Use the ABCDE guide. Conduct a full body skin check in good lighting. Advise high-risk patients (Fitzpatrick Skin Type I/II, high nevus count, family history) to undergo professional examinations every 6 to 12 months.",
    references: [
      { id: 1, text: "Cancer Council Australia. Clinical practice guidelines for the diagnosis and management of melanoma. 2021.", url: "https://www.cancer.org.au" },
      { id: 2, text: "Australasian College of Dermatologists Melanoma Consensus Statement. 2022." }
    ],
    document: {
      filename: "Cancer_Council_Melanoma_Margins_Guide.pdf",
      fileSize: "1.1 MB",
      totalPages: 4,
      downloadUrl: "#",
      summary: "Quick-reference pocket guide detailing biopsy protocols, excision margin dimensions based on Breslow depth, and sentinel lymph node biopsy referral criteria."
    }
  },
  {
    id: "COND-006",
    name: "Gastro-Oesophageal Reflux Disease (GORD)",
    system: "Gastrointestinal",
    category: "Gastroenterology",
    type: "Guideline",
    isPremium: false,
    lastUpdated: "10 May 2026",
    author: "Dr. Arun Mehta",
    symptoms: [
      "Heartburn (retrosternal burning sensation, usually postprandial)",
      "Acid regurgitation",
      "Dysphagia (difficulty swallowing) - Red Flag symptom",
      "Chronic cough, sore throat, or hoarseness (extra-oesophageal symptoms)",
      "Epigastric discomfort or bloating"
    ],
    diagnosisCriteria: [
      "Clinical Diagnosis: Based on response to empirical Proton Pump Inhibitor (PPI) trial in patients with typical symptoms and no red flags.",
      "Endoscopy (Gastroscopy): Indicated if red flags present (dysphagia, weight loss, persistent vomiting, iron deficiency anaemia, onset >55 years) or if refractory to PPI treatment",
      "24-Hour pH Monitoring: Conducted if symptoms persist despite normal endoscopy and PPI therapy"
    ],
    treatmentOptions: [
      "Lifestyle modifications: Weight loss, elevating head of bed, avoiding trigger foods (caffeine, chocolate, fatty meals), eating 3 hours before sleep, smoking cessation.",
      "Antacids & Alginates (e.g., Gaviscon): Good for immediate episodic symptom relief",
      "H2-Receptor Antagonists (e.g., Famotidine): Used for mild-to-moderate symptoms",
      "Proton Pump Inhibitors (PPIs): Standard course (e.g., Esomeprazole 20mg daily for 4-8 weeks). Aims to step-down to lowest effective dose or 'on-demand' therapy once symptoms are controlled."
    ],
    clinicalNotes: "Long-term PPI use has potential risks (osteoporosis, hypomagnesaemia, B12 deficiency, risk of C. difficile). Screen for Barrett's Oesophagus in patients with long-standing (>5 years) reflux, particularly males >50 years with multiple risk factors.",
    references: [
      { id: 1, text: "Gastroenterological Society of Australia (GESA). Clinical guidelines for GORD management. 2020.", url: "https://www.gesa.org.au" },
      { id: 2, text: "NPS MedicineWise. PPIs: Step-down and management strategies. 2021." }
    ],
    document: {
      filename: "GESA_GORD_Stepdown_Flowchart.pdf",
      fileSize: "780 KB",
      totalPages: 2,
      downloadUrl: "#",
      summary: "A clinical guideline flowchart demonstrating empirical PPI trialing timelines, red flag referral checklists, and progressive step-down strategies to avoid rebound hyperacidity."
    }
  },
  {
    id: "COND-007",
    name: "Antenatal Care Schedule",
    system: "Women's Health",
    category: "Obstetrics & Gynecology",
    type: "Document",
    isPremium: true,
    lastUpdated: "12 May 2026",
    author: "Siddhant Udavant",
    symptoms: [
      "Amenorrhoea",
      "Nausea and vomiting (morning sickness)",
      "Breast tenderness and enlargement",
      "Fatigue"
    ],
    diagnosisCriteria: [
      "Urine beta-hCG positive",
      "Serum quantitative beta-hCG doubling every 48 hours in early pregnancy",
      "Ultrasound: Confirmation of intrauterine gestational sac, fetal pole, and cardiac activity"
    ],
    treatmentOptions: [
      "Pre-conception / First trimester supplement: Folic acid 0.5mg daily (5mg if high risk, e.g. diabetic, anticonvulsant therapy) + Iodine 150mcg daily",
      "First trimester screening: Combined first trimester screening (ultrasound nuchal translucency + blood free beta-hCG/PAPP-A) at 11-13+6 weeks, or Non-Invasive Prenatal Testing (NIPT) from 10 weeks",
      "Anatomy scan: Morphology ultrasound at 18-20 weeks",
      "Gestational Diabetes screening: Oral Glucose Tolerance Test (OGTT) at 24-28 weeks",
      "Anti-D Immunoglobulin: Administer to Rh-negative mothers at 28 and 34 weeks (or as guided by local protocol)"
    ],
    clinicalNotes: "Antenatal visits occur every 4 weeks until 28 weeks, fortnightly until 36 weeks, and weekly thereafter. Check blood pressure, urinalysis, and fundal height at every visit. Maintain a supportive, collaborative relationship with obstetricians and midwives under a Shared Care model.",
    references: [
      { id: 1, text: "RANZCOG. Standards of Maternity Care & Antenatal Care Guidelines. 2021.", url: "https://www.ranzcog.edu.au" },
      { id: 2, text: "Australian Department of Health. Pregnancy Care Guidelines. 2020." }
    ],
    document: {
      filename: "RANZCOG_Antenatal_Schedule_Matrix.pdf",
      fileSize: "1.4 MB",
      totalPages: 10,
      downloadUrl: "#",
      summary: "A calendar grid matrix showing mandatory and optional pathology screens, ultrasound scans, immunisation (Pertussis, Influenza) timelines, and billing codes for antenatal checkups."
    }
  },
  {
    id: "COND-008",
    name: "Acute Otitis Media in Children",
    system: "Paediatrics",
    category: "Infectious Diseases / ENT",
    type: "Guideline",
    isPremium: false,
    lastUpdated: "22 May 2026",
    author: "Dr. Arun Mehta",
    symptoms: [
      "Otalgia (ear pain, often presenting as ear tugging in infants)",
      "Fever and irritability",
      "Poor feeding or disrupted sleep",
      "Otorrhoea (discharge from ear if tympanic membrane perforates)"
    ],
    diagnosisCriteria: [
      "Otoscopic Examination: Bulging of the tympanic membrane (strongest predictor)",
      "Opacification or loss of light reflex, erythema (note: erythema alone is insufficient)",
      "Impaired mobility of the tympanic membrane on pneumatic otoscopy"
    ],
    treatmentOptions: [
      "Analgesia: Paracetamol (15mg/kg/dose) or Ibuprofen (10mg/kg/dose) scheduled for first 24-48 hours",
      "Wait-and-see approach: In children ≥2 years with mild unilateral AOM, delay antibiotics for 24-48 hours and reassess",
      "First-line Antibiotics: Amoxicillin 15mg/kg (up to 500mg) TDS, or high-dose Amoxicillin (80-90mg/kg/day in divided doses) for 5 days in children under 2 years or in severe cases",
      "Second-line Antibiotics: Amoxicillin-Clavulanate (Co-amoxiclav) if clinical failure after 48-72 hours"
    ],
    clinicalNotes: "Avoid decongestants and antihistamines. Routine follow-up at 8-12 weeks is recommended to assess for Otitis Media with Effusion (Glue Ear) and document resolution of middle ear effusion.",
    references: [
      { id: 1, text: "Therapeutic Guidelines (eTG) Australia. Otitis Media Guideline. 2022.", url: "https://www.tg.org.au" },
      { id: 2, text: "Royal Children's Hospital Melbourne. Clinical Practice Guidelines: Acute Otitis Media. 2023." }
    ],
    document: {
      filename: "RCH_Acute_Otitis_Media_Protocol.pdf",
      fileSize: "680 KB",
      totalPages: 2,
      downloadUrl: "#",
      summary: "The Royal Children's Hospital clinical algorithm for managing ear pain, identifying high-risk criteria (Indigenous children, under 6 months) for immediate antibiotic treatment, and pain control regimens."
    }
  }
];

export const mockConditions: MedicalCondition[] = [...initialMockConditions, ...generatedConditions];
