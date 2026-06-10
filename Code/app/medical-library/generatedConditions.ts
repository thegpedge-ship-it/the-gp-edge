import { MedicalCondition } from "./libraryData";

export const generatedConditions: MedicalCondition[] = [
  {
    "id": "EXTR-100",
    "name": "Acute Coronary Syndrome",
    "system": "Cardiology",
    "category": "A spectrum of life-threatening coronary events — STEMI, NSTEMI, and unstable angina — requiring urgent risk stratification and time-critical management.",
    "type": "Condition",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "ACS may present with classic ischaemic symptoms or, in high-risk groups, with atypical or subtle features. A high degree of clinical suspicion is essential.",
      "Typical Features",
      "Atypical / Anginal Equivalents",
      "Substernal chest pain — pressure, tightness, or heaviness",
      "Dyspnoea / shortness of breath alone",
      "Radiation to left arm, jaw, or neck"
    ],
    "diagnosisCriteria": [
      "Perform a 12-lead ECG within 10 minutes of presentation — this is the critical first step",
      "STEMI: ST-elevation in two or more contiguous leads, or new left bundle branch block (LBBB).",
      "NSTEMI / Unstable Angina: ST-depression, T-wave inversion, Wellens criteria, or even a normal ECG.",
      "A single normal ECG does NOT exclude ACS — serial ECGs are required.",
      "Look for complicating features such as evidence of conduction abnormality,"
    ],
    "treatmentOptions": [
      "5a. Non-Pharmacological",
      "Call 000 / activate emergency services immediately on clinical suspicion of ACS",
      "Rest, reassurance, continuous cardiac monitoring for arrhythmia",
      "Supplemental oxygen only if SpO₂ < 93–94% — routine oxygen is not indicated",
      "IV access, 12-lead ECG, bloods drawn simultaneously to minimise time to treatment"
    ],
    "clinicalNotes": "Acute Coronary Syndrome (ACS) refers to a group of conditions in which blood flow to the heart is acutely reduced, encompassing ST-elevation myocardial infarction (STEMI or STEACS), non-ST elevation myocardial infarction (NSTEMI or NSTEACS), and unstable angina (UA). It is a manifestation of coronary artery disease (CAD), which remains a leading ca...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "LITFL — Acute Coronary Syndromes"
      },
      {
        "id": 3,
        "text": "Heart Foundation — ACS Clinical Guideline (2025)"
      }
    ],
    "document": {
      "filename": "ACS_Synapse.docx",
      "fileSize": "30 KB",
      "totalPages": 5,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Acute Coronary Syndrome."
    }
  },
  {
    "id": "EXTR-101",
    "name": "Atrial Fibrillation & Atrial Flutter",
    "system": "Endocrine",
    "category": "Diagnosis, stroke risk assessment, rate and rhythm control, and anticoagulation management in general practice.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "The following features may be present on history and examination:",
      "Symptoms",
      "Palpitations (most common)",
      "Irregular pulse / heart rate",
      "Shortness of breath / dyspnoea",
      "Rapid ventricular rate (often 160–180 bpm untreated)"
    ],
    "diagnosisCriteria": [
      "Diagnosis requires ECG documentation showing absolutely irregular RR intervals with no discernible P waves. By convention, an episode lasting at least 30 seconds is diagnostic.",
      "First-line investigations",
      "12-lead ECG — confirms diagnosis; identifies conduction defects, ischaemia, or structural heart disease.",
      "Transthoracic echocardiogram (TTE) — recommended in all patients with newly diagnosed AF; assesses valvular disease, LV function, atrial size, and mitral stenosis.",
      "Thyroid stimulating hormone (TSH) — should be checked in all newly diagnosed AF patients (defer in acute illness)."
    ],
    "treatmentOptions": [
      "Management of AF consists of three major components:",
      "(1) identification and treatment of comorbidities and precipitating factors;",
      "(2) prevention of thromboembolic events; and",
      "(3) management of the arrhythmia (rate or rhythm control).",
      "5a. Non-Pharmacological Management"
    ],
    "clinicalNotes": "Atrial fibrillation (AF) is a recurrent atrial tachyarrhythmia estimated to have a prevalence of 2–4% in developed countries such as Australia and is the most common sustained cardiac arrhythmia in adults worldwide. Atrial flutter is less common but shares a similar management framework. Both conditions are often asymptomatic and carry significant ...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Cardiovascular (Atrial Fibrillation)"
      },
      {
        "id": 3,
        "text": "Life in the Fast Lane (LITFL) — Atrial Fibrillation"
      }
    ],
    "document": {
      "filename": "AF_Synapse_v1.docx",
      "fileSize": "24 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Atrial Fibrillation & Atrial Flutter."
    }
  },
  {
    "id": "EXTR-102",
    "name": "Aortic Stenosis",
    "system": "Cardiology",
    "category": "Progressive narrowing of the aortic valve causing left ventricular outflow obstruction — the most common valvular heart disease seen in general practice, with a poor prognosis once symptoms develop.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Most patients with AS remain asymptomatic for many years. Once symptoms appear, they typically indicate severe AS and warrant urgent investigation. Symptoms in mild–moderate AS are unlikely to be due to the valve and alternative explanations should be sought.",
      "Category",
      "Features",
      "Symptoms (late)",
      "Dyspnoea on exertion / decreased exercise tolerance (most common); exertional dizziness or syncope; exertional angina. The classic triad of heart failure, syncope, and angina reflects end-stage disease.",
      "Carotid pulse"
    ],
    "diagnosisCriteria": [
      "AS is usually diagnosed when it is detected on echocardiography performed for another indication, when physical examination suggests it, or when it is picked up on point-of-care ultrasound. Symptoms may or may not be present even when AS is severe, so a high index of suspicion is required.",
      "First-line",
      "Transthoracic echocardiography (TTE) — the primary diagnostic test. It assesses valve anatomy and structure, haemodynamics (transaortic velocity, mean gradient, valve area), hemodynamic consequences (LV size and function, pulmonary artery pressure), and concomitant aortic regurgitation or other valve disease.",
      "Electrocardiogram — not diagnostic for AS, but useful to detect concomitant atrial fibrillation, conduction abnormalities, ischaemia, and LV hypertrophy.",
      "Chest radiograph — not routinely required. May be obtained in patients presenting with heart failure or dyspnoea; the lateral view may reveal aortic valve calcification."
    ],
    "treatmentOptions": [
      "The cornerstone of management for severe symptomatic AS is valve replacement — either surgical aortic valve replacement (SAVR) or transcatheter aortic valve implantation (TAVI). No medical therapy has been shown to alter the natural history of AS. The GP role is early recognition, appropriate investigation, risk-factor management, monitoring of asymptomatic patients, and timely specialist referral.",
      "5a. Non-Pharmacological",
      "Patient education — explain the importance of regular follow-up and prompt reporting of new symptoms (particularly exertional dyspnoea, chest pain, syncope/presyncope).",
      "Cardiovascular risk factor optimisation — smoking cessation, lipid management, diabetes control, and a heart-healthy diet, consistent with general cardiovascular preventive care.",
      "Hypertension — should be treated to avoid additional afterload. Renin–angiotensin system blockers are preferred, with careful titration to avoid symptomatic hypotension."
    ],
    "clinicalNotes": "Aortic stenosis (AS) is the most common cause of left ventricular (LV) outflow obstruction in adults and the most prevalent primary valve lesion requiring intervention in the Western countries including Europe, North America and Australia. Despite this, underdiagnosis and undertreatment remain common concerns. In high-income settings, degenerative ...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "UpToDate — Clinical manifestations and diagnosis of aortic stenosis in adults — https://www.uptodate.com/contents/clinical-manifestations-and-diagnosis-of-aortic-stenosis-in-adults"
      },
      {
        "id": 3,
        "text": "ESC/EACTS 2025 Guidelines for the Management of Valvular Heart Disease (PDF) — https://inavalverhd.inaheart.org/wp-content/uploads/2025/09/2025-ESC-EACTS-Guidelines-for-the-Management-of-Valvular-Heart-Disease.pdf"
      }
    ],
    "document": {
      "filename": "Aortic Stenosis.docx",
      "fileSize": "30 KB",
      "totalPages": 5,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Aortic Stenosis."
    }
  },
  {
    "id": "EXTR-103",
    "name": "Approach to Tremor",
    "system": "Neurology",
    "category": "A structured GP framework for characterising, investigating, and managing the most common tremor syndromes — with a focus on distinguishing essential tremor, Parkinson&apos;s disease, drug-induced, and enhanced physiologic tremor.",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Tremor is defined by the International Parkinson and Movement Disorder Society as an involuntary, rhythmic, oscillatory movement of a body part. It is the most common of all movement disorders and a frequent presentation in general practice. Tremor is a common, physically and psychosocially debilitating symptom that has a diverse range of aetiologies. Due to its broad causes and manifestations, accurate characterisation of a patient&apos;s tremor is essential to guide initial investigations, management, and appropriate referral.",
      "Action tremor is the most common type encountered in general practice. Of these, enhanced physiologic tremor and essential tremor (ET) are the most frequent causes. A medical rather than primary neurologic cause for action tremor should be considered first in most cases — particularly medications, thyroid disease, and metabolic disturbance. Parkinson&apos;s disease (PD) is the most common cause of rest tremor.",
      "GPs are pivotal in the diagnostic process — recognising common treatable conditions, identifying diagnostic masquerades, and flagging red flags for urgent neurological evaluation."
    ],
    "diagnosisCriteria": [
      "First-Line (All Patients with Tremor)",
      "Thyroid function tests (TFTs / TSH): thyrotoxicosis is a common reversible cause of enhanced physiologic tremor",
      "Fasting glucose / HbA1c: hypoglycaemia causes tremor; diabetes is a risk factor for peripheral neuropathy",
      "Full blood count (FBC): anaemia, infection",
      "Electrolytes, urea, creatinine (EUC): metabolic disturbance, renal failure"
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Tremor is defined by the International Parkinson and Movement Disorder Society as an involuntary, rhythmic, oscillatory movement of a body part. It is the most common of all movement disorders and a frequent presentation in general practice. Tremor is a common, physically and psychosocially debilitating symptom that has a diverse range of aetiologi...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "UpToDate — Overview of Tremor (Spindler, 2025)"
      },
      {
        "id": 3,
        "text": "AJGP — Tremor: A Systematic Approach (Lim, Newgreen, Kopanidis, Dec 2024)"
      }
    ],
    "document": {
      "filename": "ApproachToTremor_Synapse.docx",
      "fileSize": "33 KB",
      "totalPages": 5,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Approach to Tremor."
    }
  },
  {
    "id": "EXTR-104",
    "name": "Approach to Headache",
    "system": "Neurology",
    "category": "A structured GP framework for the assessment, classification, and initial management of headache — with a focus on identifying red flags, differentiating primary from secondary headache, and guiding appropriate investigation and referral.",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Headache is one of the most common presentations in general practice and a leading cause of disability worldwide. The GP&apos;s primary role in the assessment of a new or changed headache is to distinguish primary headache disorders (migraine, tension-type, cluster, others) from secondary headaches caused by an underlying structural, vascular, infectious, or metabolic condition. A systematic approach to history, examination, and targeted investigation is essential.",
      "The International Classification of Headache Disorders, 3rd edition (ICHD-3) classifies headaches into three broad groups: primary headaches, secondary headaches, and painful cranial neuropathies. Most headaches seen in general practice are primary — but secondary causes must be actively excluded, particularly in any new or changed headache pattern.",
      "A headache diary is an invaluable tool — it establishes frequency, identifies triggers, quantifies analgesic use, and is essential before specialist referral. Recommend completing it from the first consultation."
    ],
    "diagnosisCriteria": [
      "Neuroimaging is generally NOT indicated for new-onset headache unless a neurological abnormality is detected on examination or a red flag is present. Over-investigation with CT scanning exposes patients to unnecessary radiation and false positives. Investigations should be targeted.",
      "First-Line Blood Tests (Guided by History)",
      "ESR and CRP: mandatory in any new headache in a patient >50 years — to exclude giant cell arteritis; if GCA suspected, start steroids before imaging results",
      "Full blood count, EUC, LFTs, glucose: systemic illness, metabolic cause, or baseline before starting prophylaxis",
      "Thyroid function: hypothyroidism and hyperthyroidism can cause headache"
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Headache is one of the most common presentations in general practice and a leading cause of disability worldwide. The GP&apos;s primary role in the assessment of a new or changed headache is to distinguish primary headache disorders (migraine, tension-type, cluster, others) from secondary headaches caused by an underlying structural, vascular, infe...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Neurology (eTG, December 2025)"
      },
      {
        "id": 3,
        "text": "UpToDate — Headache (uptodate.com)"
      }
    ],
    "document": {
      "filename": "Headache1_ApproachToHeadache_Synapse.docx",
      "fileSize": "28 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Approach to Headache."
    }
  },
  {
    "id": "EXTR-105",
    "name": "Migraine",
    "system": "Neurology",
    "category": "The most common disabling primary headache disorder — a neurovascular condition managed in general practice through accurate diagnosis, acute treatment, prophylaxis, and lifestyle optimisation.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Feature",
      "Details",
      "Headache characteristics",
      "Unilateral (not side-locked; may be bilateral); pulsating/throbbing quality; moderate to severe intensity; aggravated by routine physical activity",
      "Associated symptoms",
      "Nausea (most diagnostically useful); photophobia; phonophobia; osmophobia; mild cognitive dysfunction (&apos;brain fog&apos;) during attacks"
    ],
    "diagnosisCriteria": [
      "Migraine is a clinical diagnosis based on the ICHD-3 criteria. Neuroimaging is NOT required for a classic presentation of episodic or chronic migraine. Investigations should be targeted to exclude secondary causes when red flags are present.",
      "ICHD-3 Diagnostic Criteria — Migraine Without Aura",
      "At least 5 attacks lasting 4–72 hours",
      "At least 2 of: unilateral location; pulsating quality; moderate/severe intensity; aggravated by or causes avoidance of routine physical activity",
      "During headache, at least 1 of: nausea and/or vomiting; photophobia AND phonophobia"
    ],
    "treatmentOptions": [
      "Management of migraine has three pillars: lifestyle and non-pharmacological measures; acute drug treatment; and prophylaxis. All three are complementary and should be addressed at every consultation. Avoidance of medication overuse is a critical fourth principle — address at every visit.",
      "5a. Non-Pharmacological",
      "Regular sleep schedule and good sleep hygiene — disrupted sleep is a major trigger",
      "Adequate hydration: 1.5–2 litres of water daily",
      "Stable blood glucose: regular meals, avoid skipping meals, reduce simple carbohydrates"
    ],
    "clinicalNotes": "Migraine is a recurrent, episodic primary headache disorder characterised by moderate to severe unilateral headache with associated nausea, photophobia, and phonophobia, lasting 4–72 hours. It is one of the most prevalent and disabling neurological conditions worldwide, disproportionately affecting women and those of working age. In general practic...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Neurology (eTG, December 2025)"
      },
      {
        "id": 3,
        "text": "UpToDate — Migraine (uptodate.com)"
      }
    ],
    "document": {
      "filename": "Headache2_Migraine_Synapse.docx",
      "fileSize": "29 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Migraine."
    }
  },
  {
    "id": "EXTR-106",
    "name": "Tension-Type & Other Primary Headaches",
    "system": "Neurology",
    "category": "Tension-type headache, cervicogenic headache, medication overuse headache, and primary headaches associated with exertion or sexual activity — a GP-focused guide to diagnosis and management.",
    "type": "Condition",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Headache Type",
      "Duration",
      "Character & Location",
      "Key Distinguishing Features",
      "Tension-type headache (infrequent/frequent episodic)",
      "30 minutes to 7 days"
    ],
    "diagnosisCriteria": [
      "Tension-Type Headache",
      "The diagnosis of TTH is clinical. A diagnosis of TTH can generally be made if the diagnostic criteria for other headache types (especially migraine) do not fit better. It is a diagnosis of exclusion relative to migraine — ensure migraine diagnostic criteria are not met before labelling as TTH.",
      "No nausea is required (may have photophobia OR phonophobia, but not both in episodic TTH)",
      "Not aggravated by routine physical activity — this differentiates from migraine",
      "Pericranial tenderness: the most characteristic physical finding — manual palpation of frontalis, temporalis, masseter, sternocleidomastoid, and trapezius muscles"
    ],
    "treatmentOptions": [
      "All drug doses below are sourced from Therapeutic Guidelines (eTG) Neurology (December 2025), which is the authoritative source for all management content.",
      "5a. Tension-Type Headache — Non-Pharmacological",
      "Non-pharmacological strategies are important for all TTH and become first-line for frequent or chronic TTH. Address contributing factors at every consultation.",
      "Same lifestyle measures as for migraine: regular sleep, adequate hydration, stable blood glucose, caffeine reduction, regular exercise",
      "Stress management and treatment of depression — refer to expert if needed"
    ],
    "clinicalNotes": "This note covers the primary headache disorders managed in general practice beyond migraine: tension-type headache (the most common headache type overall), cervicogenic headache, medication overuse headache (a secondary headache arising from a primary headache disorder), and primary headaches associated with exertion or sexual activity. These condi...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Neurology (eTG, December 2025)"
      },
      {
        "id": 3,
        "text": "UpToDate — Headache (uptodate.com)"
      }
    ],
    "document": {
      "filename": "Headache3_TTH_OtherPrimary_Synapse.docx",
      "fileSize": "27 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Tension-Type & Other Primary Headaches."
    }
  },
  {
    "id": "EXTR-107",
    "name": "Trigeminal Autonomic Cephalgias (TACs)",
    "system": "Cardiology",
    "category": "Cluster headache, paroxysmal hemicrania, hemicrania continua, and SUNCT — primary headaches sharing side-locked unilateral pain with ipsilateral autonomic features, differentiated by attack duration, frequency, and treatment response.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Trigeminal autonomic cephalgias (TACs) are a group of primary headache disorders sharing the following core features: unilateral and side-locked pain (always the same side — does not change sides between or during attacks); pain distribution in the first division of the trigeminal nerve (periorbital, forehead, temporal); associated ipsilateral autonomic features; and patient agitation/restlessness during attacks. This last feature is a key differentiator from migraine, where the patient typically wants to lie still in a dark room.",
      "TACs are differentiated by attack duration, frequency, and treatment response. The four main TAC subtypes are cluster headache (most common), paroxysmal hemicrania, hemicrania continua, and SUNCT (Short-lasting Unilateral Neuralgiform headache attacks with Conjunctival injection and Tearing).",
      "Shared Autonomic Features (Ipsilateral to Pain)",
      "Autonomic Feature Type",
      "Examples",
      "Ocular"
    ],
    "diagnosisCriteria": [
      "Cluster Headache",
      "Extremely severe periorbital or temporal pain; unilateral, side-locked",
      "Individual attacks last <2 hours (typically 15–180 minutes)",
      "Episodic: cluster periods of weeks to months, then periods of remission. Attacks often occur at a similar time each day and recur at a similar time each year.",
      "Chronic cluster headache: attacks without remission (less common)"
    ],
    "treatmentOptions": [
      "All drug doses below are sourced from Therapeutic Guidelines (eTG) Neurology (December 2025), which is the authoritative source for all management content.",
      "5a. Cluster Headache — Acute Treatment",
      "Subcutaneous sumatriptan is the most effective acute treatment. High-flow oxygen is also first-line and should be considered in addition to SC sumatriptan where accessible.",
      "Treatment",
      "Details"
    ],
    "clinicalNotes": "Trigeminal autonomic cephalgias (TACs) are a group of primary headache disorders sharing the following core features: unilateral and side-locked pain (always the same side — does not change sides between or during attacks); pain distribution in the first division of the trigeminal nerve (periorbital, forehead, temporal); associated ipsilateral auto...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Neurology (eTG, December 2025)"
      },
      {
        "id": 3,
        "text": "UpToDate — Headache (uptodate.com)"
      }
    ],
    "document": {
      "filename": "Headache4_TACs_Synapse.docx",
      "fileSize": "22 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Trigeminal Autonomic Cephalgias (TACs)."
    }
  },
  {
    "id": "EXTR-108",
    "name": "Secondary Headaches & Painful Cranial Neuropathies",
    "system": "Neurology",
    "category": "Secondary headache syndromes and painful cranial neuropathies — including IIH, RCVS, low CSF pressure headache, giant cell arteritis, trigeminal neuralgia, glossopharyngeal neuralgia, and greater occipital neuralgia.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Condition",
      "Key Clinical Features",
      "IIH (Idiopathic Intracranial Hypertension)",
      "Headache worse lying down; improved upright. Aggravated by cough, straining, Valsalva. Visual obscuration or visual loss = marker of severity and medical emergency. Papilloedema on fundoscopy. Pulsatile tinnitus. Typically young overweight female.",
      "RCVS (Reversible Cerebral Vasoconstriction Syndrome)",
      "Thunderclap headache — severe, explosive, peak intensity within seconds. Headaches recur over 1–2 weeks. Triggered by exertion, Valsalva, sexual activity, serotonergic or sympathomimetic drugs. May be complicated by stroke or SAH."
    ],
    "diagnosisCriteria": [
      "MRI brain + MR venography: exclude venous sinus thrombosis and structural cause; MRI may show empty sella, flattening of posterior globe, tortuous optic nerve sheaths",
      "Lumbar puncture: opening pressure >25 cmH₂O (in lateral decubitus); normal CSF composition",
      "Formal visual field testing: essential for monitoring — visual obscuration or field loss requires urgent ophthalmological assessment",
      "Fundoscopy: papilloedema — if cannot be assessed adequately, refer urgently to ophthalmologist for OCT",
      "CT head: immediately for any thunderclap headache — exclude SAH and intracranial haemorrhage"
    ],
    "treatmentOptions": [
      "All drug doses below are sourced from Therapeutic Guidelines (eTG) Neurology (December 2025), which is the authoritative source for all management content.",
      "IIH — Management",
      "Weight loss: the most effective intervention for IIH in obese patients — even modest weight reduction (5–10%) can significantly reduce ICP and resolve papilloedema",
      "Cease offending medications: review for tetracyclines, isotretinoin, excess vitamin A, corticosteroid withdrawal",
      "Acetazolamide: first-line drug — reduces CSF production; starting dose 250–500 mg twice daily, titrate to effect. Monitor for metabolic acidosis, renal stones, hypokalaemia."
    ],
    "clinicalNotes": "Secondary headaches are caused by an underlying structural, vascular, metabolic, or other medical condition. Identifying and treating the underlying cause is the primary approach. This note covers the most clinically important secondary headache conditions encountered or initiated in general practice: idiopathic intracranial hypertension (IIH), rev...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Neurology (eTG, December 2025)"
      },
      {
        "id": 3,
        "text": "UpToDate — Headache (uptodate.com)"
      }
    ],
    "document": {
      "filename": "Headache5_SecondaryHeadaches_Synapse.docx",
      "fileSize": "26 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Secondary Headaches & Painful Cranial Neuropathies."
    }
  },
  {
    "id": "EXTR-109",
    "name": "Heavy Menstrual Bleeding (HMB) & Abnormal Uterine Bleeding (Reproductive Age)",
    "system": "Women's Health",
    "category": "A structured approach to assessing and managing heavy or abnormal uterine bleeding in non-pregnant reproductive-age patients.",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Heavy menstrual bleeding (HMB, menorrhagia) is excessive menstrual bleeding that interferes with physical, emotional, social, or material quality of life; it can occur alone or with other symptoms. HMB refers to heavy cyclical bleeding and does not include intermenstrual or postcoital bleeding, which require separate investigation and management.",
      "Abnormal uterine bleeding (AUB) is a broader term referring to menstrual bleeding of abnormal quantity, duration, or schedule. Causes are classified by the FIGO PALM-COEIN system (Polyp, Adenomyosis, Leiomyoma, Malignancy and hyperplasia, Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not otherwise classified).",
      "Pregnancy-related bleeding must be excluded before considering other causes. Fibroids are the most common uterine pathology, affecting 30% of individuals with HMB. Abnormal endometrial haemostasis is the most common functional cause but is a diagnosis of exclusion. Other causes include coagulopathy (e.g., von Willebrand disease), ovulatory dysfunction (most commonly PCOS, also hypothyroidism), and iatrogenic factors (IUCDs, anticoagulants, tamoxifen, exogenous estrogens, some herbal supplements)."
    ],
    "diagnosisCriteria": [
      "First-Line",
      "Pregnancy test (β-hCG) — exclude pregnancy before all other investigation.",
      "Full blood examination (FBE).",
      "Serum ferritin — assess for iron deficiency in all individuals with HMB.",
      "Cervical screening test — if due."
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Heavy menstrual bleeding (HMB, menorrhagia) is excessive menstrual bleeding that interferes with physical, emotional, social, or material quality of life; it can occur alone or with other symptoms. HMB refers to heavy cyclical bleeding and does not include intermenstrual or postcoital bleeding, which require separate investigation and management. A...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "UpToDate: Abnormal uterine bleeding in nonpregnant reproductive-age patients — Management — https://www.uptodate.com/contents/abnormal-uterine-bleeding-in-nonpregnant-reproductive-age-patients-management?search=heavy%20menstrual%20bleeding&source=search_result&selectedTitle=2~150&usage_type=default&display_rank=2"
      },
      {
        "id": 3,
        "text": "Therapeutic Guidelines: Heavy menstrual bleeding — https://app.tg.org.au/viewTopic?etgAccess=true&guidelinePage=Sexual%20and%20Reproductive%20Health&topicfile=heavy-menstrual-bleeding&guidelinename=Sexual%20and%20Reproductive%20Health&sectionId=toc_d1e131#toc_d1e131"
      }
    ],
    "document": {
      "filename": "Heavy Menstrual Bleeding.docx",
      "fileSize": "27 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Heavy Menstrual Bleeding (HMB) & Abnormal Uterine Bleeding (Reproductive Age)."
    }
  },
  {
    "id": "EXTR-110",
    "name": "Heart Failure with Preserved & Mildly Reduced Ejection Fraction (HFpEF & HFmrEF)",
    "system": "Cardiology",
    "category": "Diastolic heart failure and the mid-range phenotype — diagnosis depends on symptoms, preserved LVEF, and objective evidence of diastolic dysfunction; treatment centres on SGLT2 inhibitors, symptom relief, and comorbidity management.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "The clinical presentation of HFpEF and HFmrEF is similar to HFrEF. Symptoms and signs reflect elevated filling pressures and congestion. HFpEF cannot be distinguished from HFrEF on clinical grounds alone — echocardiography is required.",
      "Symptoms",
      "Signs of Congestion",
      "Typical Patient Profile (HFpEF)",
      "Dyspnoea on exertion (most common)",
      "Elevated JVP"
    ],
    "diagnosisCriteria": [
      "The diagnostic approach follows the same structured pathway as for all heart failure subtypes. Classification by LVEF on echocardiography distinguishes HFpEF and HFmrEF from HFrEF and guides management.",
      "Formal Diagnostic Criteria — NHF/CSANZ 2018 (Table 3)",
      "The table below reproduces the formal diagnostic criteria for HFrEF and HFpEF from the NHF/CSANZ 2018 Guidelines (Table 3). This is the most commonly used reference framework in Australian practice. The key distinction for GPs: HFrEF has only two requirements (symptoms + LVEF <50%). HFpEF has three — and the third is where diagnostic confusion arises.",
      "Symptoms ± signs of heart failure",
      "Note: If LVEF is mildly reduced (41–49%), additional criteria are required (e.g. signs of HF; diastolic dysfunction with high filling pressure demonstrated by invasive means, echocardiography, or biomarker testing). These patients are classified as HFmrEF."
    ],
    "treatmentOptions": [
      "Management of HFpEF and HFmrEF differs importantly from HFrEF. The evidence base is less robust, and the approach is more focused on treating the underlying cause, managing precipitating factors, relieving symptoms, and controlling comorbidities. SGLT2 inhibitors are the only drug class with clear evidence for reducing cardiovascular death and HF hospitalisation in both HFpEF and HFmrEF.",
      "5a. Non-Pharmacological",
      "Treat the underlying cause: hypertension is the most important — optimise BP control. Treat coronary artery disease, atrial fibrillation, valvular disease, and infiltrative cardiomyopathy as appropriate",
      "Weight loss: obesity is a key driver of HFpEF — weight reduction reduces symptoms and filling pressures. Consider referral for structured weight management if BMI >35 kg/m²",
      "Exercise training: supervised exercise or cardiac rehabilitation — improves functional capacity and quality of life"
    ],
    "clinicalNotes": "Heart failure (HF) is a clinical syndrome characterised by symptoms (typically dyspnoea) and signs secondary to an abnormality of cardiac structure or function that impairs the ability of the heart to fill with blood at normal pressure or to eject blood sufficient to meet metabolic demands. Once HF is diagnosed, it is classified by left ventricular...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "NHF — Diagnostic Work-up of Suspected Heart Failure (flowchart)"
      },
      {
        "id": 3,
        "text": "NHF/CSANZ 2018 Guidelines — Causes of Heart Failure (table)"
      }
    ],
    "document": {
      "filename": "HFpEF_HFmrEF_Synapse_v2.docx",
      "fileSize": "32 KB",
      "totalPages": 5,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Heart Failure with Preserved & Mildly Reduced Ejection Fraction (HFpEF & HFmrEF)."
    }
  },
  {
    "id": "EXTR-111",
    "name": "Heart Failure with Reduced Ejection Fraction (HFrEF)",
    "system": "Cardiology",
    "category": "Systolic heart failure (LVEF <50%) — a high-mortality syndrome requiring early initiation of four evidence-based drug classes and ongoing multidisciplinary GP-led care.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "HF is a clinical diagnosis, initially supported by history and physical examination. Symptoms and signs reflect the haemodynamic consequences of reduced cardiac output and elevated filling pressures (congestion).",
      "Symptoms",
      "Signs of Congestion",
      "Signs of Low Cardiac Output",
      "Dyspnoea on exertion (most common)",
      "Elevated JVP"
    ],
    "diagnosisCriteria": [
      "HF is a clinical diagnosis supported by investigations. The diagnostic approach follows a structured pathway: initial assessment, confirmation with BNP/NTproBNP or echocardiography, classification by LVEF, investigation for underlying cause, and identification of comorbidities and precipitating factors.",
      "Diagnostic Criteria — NHF/CSANZ 2018 (Table 3)",
      "The formal diagnostic criteria for HF subtypes are reproduced below from the NHF/CSANZ 2018 Guidelines (Table 3). For HFrEF, the criteria are straightforward. The complexity lies in HFpEF — see the HFpEF & HFmrEF Synapse note for a detailed discussion.",
      "Symptoms ± signs of heart failure",
      "Note: If LVEF mildly reduced (41–49%), additional criteria required — see HFmrEF note."
    ],
    "treatmentOptions": [
      "The management of HFrEF aims to reduce mortality, decrease hospitalisation, and improve symptoms and quality of life. Four drug classes have strong evidence for improving survival and should be started at diagnosis or within 2–4 weeks: ARNI or ACEI (or ARB if these are not tolerated), a heart failure-specific beta blocker, a mineralocorticoid receptor antagonist (MRA), and an SGLT2 inhibitor.",
      "5a. Non-Pharmacological",
      "Patient education: self-monitoring of daily weight (report gain >2 kg over 2 days), fluid restriction if required, sodium restriction, recognition of worsening symptoms",
      "Exercise training: supervised exercise or cardiac rehabilitation — improves symptoms, exercise capacity, and quality of life",
      "Multidisciplinary HF disease management: collaboration between GP, cardiologist, HF nurse, pharmacist, dietitian, physiotherapist — reduces hospitalisation and improves outcomes"
    ],
    "clinicalNotes": "Heart failure (HF) is a clinical syndrome characterised by symptoms (typically dyspnoea) and signs secondary to an abnormality of cardiac structure or function that impairs the ability of the heart to fill with blood at normal pressure or to eject blood sufficient to meet the metabolic needs of the body. Heart failure with reduced ejection fraction...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "NHF — Diagnostic Work-up of Suspected Heart Failure (flowchart)"
      },
      {
        "id": 3,
        "text": "NHF — HFrEF Management Algorithm (flowchart)"
      }
    ],
    "document": {
      "filename": "HFrEF_Synapse_v2.docx",
      "fileSize": "34 KB",
      "totalPages": 6,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Heart Failure with Reduced Ejection Fraction (HFrEF)."
    }
  },
  {
    "id": "EXTR-112",
    "name": "Hidradenitis Suppurativa",
    "system": "Dermatology",
    "category": "A chronic inflammatory disorder of apocrine gland–bearing skin characterised by recurrent nodules, abscesses, sinus tracts and scarring.",
    "type": "Condition",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "HS typically affects intertriginous areas and can involve one or multiple sites. The disease follows a chronic, relapsing-remitting course. The following table summarises key clinical features:",
      "Category",
      "Clinical Features",
      "Symptoms",
      "Recurrent painful nodules and abscesses in apocrine-bearing areas",
      "Purulent or seropurulent discharge from lesions or sinus tracts"
    ],
    "diagnosisCriteria": [
      "The diagnosis of HS is clinical, requiring fulfilment of three criteria:",
      "Typical lesions — deep-seated, painful nodules and/or abscesses",
      "Typical anatomical predilection — axillae, groins, perineal and perianal regions, buttocks, infra-mammary and inter-mammary folds",
      "Chronicity and recurrence of lesions",
      "Clinical assessment should include a full patient examination to determine the Hurley stage, comorbidity assessment and investigation of inflammatory markers. Although HS lesions are often large inflammatory cysts with purulent discharge, results from swabs can be negative or show only commensal bacteria. Growth of a pathogen on culture (e.g. Staphylococcus aureus, Staphylococcus lugdunensis, Actinomyces species, Streptococcus anginosus, anaerobic bacteria) may indicate HS with secondary infection, or an infected boil."
    ],
    "treatmentOptions": [
      "HS is commonly misdiagnosed and can greatly impact quality of life. Refer early to a dermatologist for confirmation of diagnosis, counselling and long-term management. Treatment can be initiated while waiting for dermatologist assessment.",
      "5a. Non-Pharmacological Management",
      "The following general measures should be discussed with all patients, in addition to drug therapy:",
      "Wearing loose clothing to reduce friction and mechanical stress on affected areas",
      "Weight loss through healthy eating and exercise, if appropriate (obesity is a significant disease modifier)"
    ],
    "clinicalNotes": "Hidradenitis suppurativa (HS) is a chronic inflammatory skin disorder affecting apocrine gland–bearing skin, typically the axillae, groin, perianal region, buttocks and inframammary folds. It is characterised by persistent, deep-seated, painful nodules and abscesses that can progress to sinus tract formation, purulent discharge and scarring. HS is ...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines — Hidradenitis Suppurativa (eTG)"
      },
      {
        "id": 3,
        "text": "DermNet NZ — Hidradenitis Suppurativa"
      }
    ],
    "document": {
      "filename": "Hidradenitis_Suppurativa_Synapse.docx",
      "fileSize": "27 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Hidradenitis Suppurativa."
    }
  },
  {
    "id": "EXTR-113",
    "name": "MASLD",
    "system": "Gastrointestinal",
    "category": "Metabolic Dysfunction-Associated Steatotic Liver Disease — a common, underdiagnosed cause of progressive liver disease in general practice.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "MASLD is typically asymptomatic, particularly in early stages. Patients are most commonly identified through incidental elevated liver enzymes on routine bloods or hepatic steatosis on abdominal imaging obtained for another reason.",
      "Symptoms",
      "Most patients: asymptomatic",
      "Fatigue or malaise (may occur with MASH)",
      "Vague right upper quadrant discomfort",
      "Symptoms of decompensated cirrhosis if advanced:"
    ],
    "diagnosisCriteria": [
      "The diagnosis of MASLD is established by demonstrating hepatic steatosis on imaging (or biopsy) in a patient with at least one cardiometabolic risk factor, after excluding other primary causes of liver steatosis.",
      "Who to Assess",
      "Consider MASLD in patients with any of the following:",
      "Obesity or overweight (BMI ≥25 kg/m², or ≥23 kg/m² in Asian individuals)",
      "Type 2 diabetes or prediabetes"
    ],
    "treatmentOptions": [
      "There is no pharmacological therapy currently approved for MASLD in Australia. The cornerstone of management is lifestyle modification targeting diet, physical activity and behavioural change, ideally with multidisciplinary team support. Management also requires control of cardiometabolic risk factors, monitoring for fibrosis progression, and HCC surveillance in those with cirrhosis.",
      "Figure 1. Assessment algorithm for a person presenting with MAFLD (adapted from Australian Prescriber 2026, Figure 1; originally reproduced from Adams LA et al. Med J Aust 2025).",
      "5a. Non-Pharmacological Management",
      "Lifestyle modification is the cornerstone of management for all patients with MASLD, regardless of fibrosis stage.",
      "Weight Loss and Diet"
    ],
    "clinicalNotes": "MASLD (Metabolic Dysfunction-Associated Steatotic Liver Disease), previously known as non-alcoholic fatty liver disease (NAFLD) or metabolic dysfunction-associated fatty liver disease (MAFLD), is defined as hepatic steatosis (fat accumulation in hepatocytes, >5% of liver cells) on imaging or liver biopsy, in association with at least one cardiometa...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Therapeutic Guidelines: NAFLD/MASLD"
      },
      {
        "id": 3,
        "text": "UpToDate: Clinical Features and Diagnosis of MASLD"
      }
    ],
    "document": {
      "filename": "MASLD_Synapse_Note.docx",
      "fileSize": "28 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for MASLD."
    }
  },
  {
    "id": "EXTR-114",
    "name": "Pelvic Inflammatory Disease (PID)",
    "system": "Women's Health",
    "category": "Polymicrobial upper genital tract infection requiring prompt empirical antibiotic therapy to prevent long-term sequelae.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Clinical presentation varies widely in both severity and symptomatology, ranging from asymptomatic to severe systemic illness.",
      "Feature",
      "Details",
      "Pelvic / abdominal pain",
      "Typically bilateral lower abdominal pain; may worsen with movement; may localise to one side; may refer to the right upper quadrant (Fitz-Hugh-Curtis syndrome); peritonism may be present",
      "Dyspareunia"
    ],
    "diagnosisCriteria": [
      "Diagnosis is clinical. A low threshold of suspicion is necessary given the wide clinical spectrum. New-onset pelvic pain in a sexually active person under 30 years is highly predictive of PID, with exclusion of surgical emergencies.",
      "Risk factors include: new sexual partner, partner with STI or STI symptoms, recent uterine instrumentation (e.g. IUD insertion, surgical abortion).",
      "Important",
      "Begin empirical treatment immediately on provisional clinical diagnosis — do not wait for investigation results.",
      "Bimanual examination should be performed where possible. However, inability to examine should not prevent provisional diagnosis and treatment."
    ],
    "treatmentOptions": [
      "5a. Non-Pharmacological",
      "Advise abstinence from sexual intercourse for at least one week following treatment or until symptomatically better.",
      "Rest and simple analgesia (NSAIDs, paracetamol) for mild pain; consider stronger analgesia and admission if pain is severe.",
      "Contact tracing: counsel patient; provide PID factsheet; trace and treat sexual partners from the preceding 60 days regardless of STI test results.",
      "Partner management: examine and treat partners with antibiotics active against N. gonorrhoeae and C. trachomatis; refer to specific STI guidelines depending on isolated organism."
    ],
    "clinicalNotes": "Pelvic inflammatory disease (PID) is a syndrome comprising a spectrum of inflammatory disorders of the upper female genital tract, including any combination of endometritis, salpingitis, tubo-ovarian abscess, and pelvic peritonitis. It is a common and important presentation in general practice, particularly among sexually active people under 30. Pr...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Australian STI Management Guidelines — Pelvic Inflammatory Diseases (PID)"
      },
      {
        "id": 3,
        "text": "Therapeutic Guidelines (eTG) — Antibiotic: Pelvic Inflammatory Disease"
      }
    ],
    "document": {
      "filename": "PID_GPPrep.docx",
      "fileSize": "22 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Pelvic Inflammatory Disease (PID)."
    }
  },
  {
    "id": "EXTR-115",
    "name": "Approach to Postmenopausal Bleeding",
    "system": "Women's Health",
    "category": "Any uterine bleeding in a menopausal patient (beyond expected cyclic bleeding on cyclic MHT) warrants evaluation to exclude endometrial carcinoma.",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Postmenopausal bleeding (PMB) refers to any uterine bleeding in a menopausal patient, other than expected cyclic bleeding in patients taking combined (oestrogen–progestin) cyclic postmenopausal hormone therapy. PMB is defined clinically as vaginal bleeding after more than 12 months of amenorrhoea.",
      "PMB accounts for approximately 5% of office gynaecology visits and occurs in approximately 4–11% of postmenopausal patients. The incidence is inversely related to time since menopause — bleeding is more common soon after menopause and decreases over time.",
      "PMB is the cardinal sign of endometrial carcinoma. Although the most common causes are benign (endometrial atrophy and polyps), cancer must be excluded in every case. In a pooled meta-analysis of over 31,000 patients with PMB, the overall risk of endometrial cancer was approximately 9%; in patients not taking menopausal hormone therapy, the risk was approximately 12%. Where PMB is combined with an endometrial thickness ≥4–5 mm on ultrasound, the risk rises to approximately 19%."
    ],
    "diagnosisCriteria": [
      "The primary goal is to exclude endometrial malignancy. A secondary goal is to exclude other intra-abdominal processes and non-uterine sources of bleeding.",
      "First-Line Investigations",
      "Cervical co-test (HPV + LBC): all patients with PMB require a co-test, performed regardless of the timing of the last cervical screening test. Use a clinician-collected sample (self-collected samples cannot be co-tested). If the patient has had a total hysterectomy, take a vaginal vault sample. Label the pathology request clearly as \"non-screening\" with the reason.",
      "Transvaginal ultrasound (TVUS): first-line imaging in PMB to assess endometrial thickness and morphology and to identify focal lesions, polyps, or intracavitary abnormalities. Offer transabdominal ultrasound as an alternative if TVUS is inappropriate (e.g. history of sexual assault, patient preference). Indicate menopausal status on the request.",
      "Full blood count and ferritin: if signs of anaemia or heavy bleeding."
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Postmenopausal bleeding (PMB) refers to any uterine bleeding in a menopausal patient, other than expected cyclic bleeding in patients taking combined (oestrogen–progestin) cyclic postmenopausal hormone therapy. PMB is defined clinically as vaginal bleeding after more than 12 months of amenorrhoea. PMB accounts for approximately 5% of office gynaeco...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "Australian Commission on Safety and Quality in Health Care — Heavy Menstrual Bleeding Clinical Care Standard"
      },
      {
        "id": 3,
        "text": "Patient.info — Intermenstrual and Postcoital Bleeding"
      }
    ],
    "document": {
      "filename": "PMB_Approach.docx",
      "fileSize": "25 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Approach to Postmenopausal Bleeding."
    }
  },
  {
    "id": "EXTR-116",
    "name": "Pruritus Ani",
    "system": "Gastrointestinal",
    "category": "A systematic approach to assessment, investigation, and management of anal pruritus in general practice.",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Pruritus ani is intense, chronic itching of the perianal skin, affecting up to 5% of the general population. It is four times more common in males, is most prevalent in those aged 40–60 years, and is often persistent and distressing. In general practice it is important not to trivialise the symptom, as it ranges from benign and self-limiting to a presentation of serious dermatosis, anorectal neoplasia, or systemic disease. Up to 25% of cases are idiopathic, most commonly driven by faecal soiling and an itch–scratch cycle."
    ],
    "diagnosisCriteria": [
      "Investigation may not be necessary after a thorough history and examination. Target investigations to suspected aetiology and clinical findings.",
      "First-Line (Based on Clinical Suspicion)",
      "Fasting blood glucose or HbA1c — exclude diabetes",
      "Skin swabs (bacterial, fungal) — if weeping, ulcerated, or blistered perianal skin",
      "Skin scrapings — if tinea is suspected"
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Pruritus ani is intense, chronic itching of the perianal skin, affecting up to 5% of the general population. It is four times more common in males, is most prevalent in those aged 40–60 years, and is often persistent and distressing. In general practice it is important not to trivialise the symptom, as it ranges from benign and self-limiting to a p...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "UpToDate — Approach to the patient with anal pruritus"
      },
      {
        "id": 3,
        "text": "Therapeutic Guidelines (eTG) — Pruritus Ani"
      }
    ],
    "document": {
      "filename": "Pruritus_Ani_Synapse.docx",
      "fileSize": "21 KB",
      "totalPages": 2,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Pruritus Ani."
    }
  },
  {
    "id": "EXTR-117",
    "name": "Stable Angina / Stable IHD",
    "system": "Cardiology",
    "category": "Chronic, predictable exertional chest pain due to fixed coronary obstruction — a common and highly GP-manageable condition requiring symptom relief and cardiovascular risk reduction.",
    "type": "Condition",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "The Canadian Cardiovascular Society (CCS) classification grades angina by functional limitation. The diagnosis requires appropriate investigations to exclude other causes of chest pain before being established.",
      "Typical Features",
      "Features Against the Diagnosis",
      "Retrosternal pressure, tightness, or heaviness",
      "Sharp, stabbing, or pleuritic pain",
      "Triggered by exertion, emotional stress, cold weather, or heavy meals"
    ],
    "diagnosisCriteria": [
      "Chest pain must be appropriately investigated before a diagnosis of stable angina is made. The diagnosis is primarily clinical but supported by investigations to confirm ischaemia and exclude other causes.",
      "First-Line Investigations (GP)",
      "Resting 12-lead ECG: often normal; may show previous MI, LVH, or LBBB",
      "FBC: exclude anaemia as precipitant",
      "Fasting lipids, glucose / HbA1c, U&E, eGFR: cardiovascular risk assessment and baseline"
    ],
    "treatmentOptions": [
      "Treatment of stable angina has two goals: (1) symptom relief — treatment of episodes and prevention of angina; and (2) cardiovascular event prevention — optimising management of underlying coronary artery disease and modifiable risk factors.",
      "5a. Non-Pharmacological",
      "Risk factor modification: manage hypertension, dyslipidaemia, diabetes, smoking, and excess body weight — these are the cornerstone of secondary prevention",
      "Regular moderate-intensity exercise: graded exercise program — advise patients to avoid heavy, sudden, or unaccustomed exertion and acute emotional stress",
      "Mediterranean-style diet and healthy eating"
    ],
    "clinicalNotes": "Stable angina is defined as retrosternal chest discomfort (pain or tightness) lasting 10 minutes or less that subsides promptly with rest. It occurs when myocardial oxygen demand exceeds supply, which is usually restricted by atherosclerotic obstruction. Angina is considered stable if the symptom pattern has not changed during the past month. Condi...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "LITFL — Acute Coronary Syndromes"
      },
      {
        "id": 3,
        "text": "Heart Foundation — ACS Clinical Guideline (2025)"
      }
    ],
    "document": {
      "filename": "StableAngina_Synapse.docx",
      "fileSize": "24 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Stable Angina / Stable IHD."
    }
  },
  {
    "id": "EXTR-118",
    "name": "Strongyloidiasis",
    "system": "Gastrointestinal",
    "category": "Strongyloides stercoralis infection — diagnosis, treatment and prevention in general practice",
    "type": "Condition",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Clinical features vary by immune status and duration of infection. Many patients — particularly those in endemic areas — are asymptomatic.",
      "Symptoms & Signs",
      "Acute infection",
      "Local pruritus/rash at skin penetration site",
      "Dry cough within ~1 week",
      "GI symptoms (diarrhoea, abdominal pain, anorexia) from ~3 weeks"
    ],
    "diagnosisCriteria": [
      "Who to screen: Consider strongyloidiasis in any patient with relevant epidemiological exposure (skin contact with soil in tropical/subtropical regions) including Aboriginal and Torres Strait Islander peoples from tropical Australia, refugees, migrants, returned travellers, military veterans — with or without eosinophilia.",
      "Stool Testing",
      "Three fresh faecal samples should be sent for culture, microscopy, and NAAT/PCR. Multiple samples are needed due to intermittent larval shedding.",
      "Stool microscopy: Low sensitivity (<50%); direct identification of rhabditiform larvae; sensitivity improves with more samples (up to 7)",
      "Stool PCR/NAAT: Preferred where available — higher sensitivity and specificity than microscopy (sensitivity ~72%, specificity ~93% vs. stool testing)"
    ],
    "treatmentOptions": [
      "5a. Non-Pharmacological",
      "Reduce or cease immunosuppressive therapy where clinically feasible in patients with hyperinfection or disseminated disease",
      "Prevent re-infection: advise wearing shoes in endemic areas and avoiding skin contact with potentially contaminated soil",
      "Hygiene measures: handwashing, sanitation improvements in endemic communities",
      "Empiric treatment before results available in patients requiring prompt immunosuppression with relevant epidemiological exposure"
    ],
    "clinicalNotes": "Strongyloidiasis is caused by the faecal soil-transmitted roundworm Strongyloides stercoralis. Unlike other soil-transmitted helminths, S. stercoralis is unique in its ability to complete its life cycle entirely within the human host (autoinfection), meaning chronic asymptomatic infection can persist for decades and clinical manifestations can occu...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "UpToDate — Strongyloidiasis"
      },
      {
        "id": 3,
        "text": "Therapeutic Guidelines (eTG) — Strongyloidiasis"
      }
    ],
    "document": {
      "filename": "Strongyloidiasis_Synapse.docx",
      "fileSize": "25 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Strongyloidiasis."
    }
  },
  {
    "id": "EXTR-119",
    "name": "Approach to Abnormal Liver Biochemistry",
    "system": "Gastrointestinal",
    "category": "A structured approach to investigating incidentally or clinically detected abnormal liver biochemistry in general practice.",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Abnormal liver biochemistry is common in general practice and can result from a broad range of hepatic and non-hepatic causes. The predominant pattern of abnormal liver biochemistry — together with clinical assessment — helps direct further investigation and management. Significant acute changes require urgent assessment; minor persistent changes require systematic evaluation to exclude significant liver fibrosis or cirrhosis."
    ],
    "diagnosisCriteria": [
      "First-Line (All Patients)",
      "Initial blood tests should be obtained for all patients with abnormal liver biochemistry (as per eTG Figure 21.1 initial assessment framework):",
      "Liver biochemistry (ALT, AST, ALP, GGT, bilirubin)",
      "Full blood count",
      "International normalised ratio (INR)"
    ],
    "treatmentOptions": [
      "First-line non-pharmacological lifestyle advice",
      "Standard pharmacological step-up therapy",
      "Schedule follow-up review in 4-6 weeks"
    ],
    "clinicalNotes": "Abnormal liver biochemistry is common in general practice and can result from a broad range of hepatic and non-hepatic causes. The predominant pattern of abnormal liver biochemistry — together with clinical assessment — helps direct further investigation and management. Significant acute changes require urgent assessment; minor persistent changes r...",
    "references": [
      {
        "id": 1,
        "text": "For Health Professionals"
      },
      {
        "id": 2,
        "text": "ACR Appropriateness Criteria / PMC — Evaluation of Abnormal Liver Function Tests"
      },
      {
        "id": 3,
        "text": "UpToDate — Approach to the Patient with Abnormal Liver Tests"
      }
    ],
    "document": {
      "filename": "Synapse_Approach_Abnormal_Liver_Biochemistry (2).docx",
      "fileSize": "25 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "This extracted clinical content outlines the guidelines, pathophysiology, and management flowchart for Approach to Abnormal Liver Biochemistry."
    }
  },
  {
    "id": "EXTR-200",
    "name": "Acne",
    "system": "Dermatology",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Past Medical History:Childhood:   -^declines hx of cryptorchidism    -^declines hx of scrotal surgery    -^declines hx of hernia repair    -^declines hx of mumps Genitourinary:   -^Declines hx of STIs (Chlamydia, Gonorrhoea)    -^declines hx of Epididymo-orchitis / Prostatitis    -^declines hx of Testicular/scrotal trauma    -^declines vasectomy Systemic Illness:   -^no known hx of Diabetes Mellitus    -^declines hx of chemotherapy / radiotherapy",
      "Medications & Allergies (mention if on TRT, 5-ARIs, spironolactone or sulfasalasine)",
      "Social History:Occupation:   -Exposure to: Heat / Pesticides / Solvents / Heavy metals / Radiation: Yes / No   -Details:Substance Use:   -Smoking:Current / Ex / Never. (^ packs/day)   -Alcohol:^ standard drinks per week.   -Recreational Drugs: ^Declines any       Marijuana: Yes / No, Cocaine: Yes / No      Opiates: Yes / No      Anabolic steroids (current or past): Yes / NoGeneral Health:   -Diet and exercise:   -Recent high fevers: Yes / No   -Testicular heat exposure (e.g., saunas, hot tubs): Yes / No",
      "Family History:   -Infertility (siblings, parents): Yes / No   -Genetic conditions (e.g., Cystic Fibrosis, Klinefelter): Yes / No"
    ],
    "diagnosisCriteria": [
      "Check vital signs.",
      "Perform targeted physical examination of affected system.",
      "Order relevant diagnostic imaging or pathology."
    ],
    "treatmentOptions": [
      "Patient information sheets: 1. https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/infertility-in-men2. https://www.thewomens.org.au/health-information/fertility-information/fertility-problems/male-infertility3. https://www.ivf.com.au/sites/ivfa/files/2023-03/MFC05%20Male%20Fertility%20eBook%2017.03.23-LR_3.pdf",
      "----------------------------------------------------------------------------------------------------------------------------",
      "FINAL Male Fertility Issues  Sunday, 9 November 20259:23 am"
    ],
    "clinicalNotes": "Clinical SOAP Note template for Acne assessment.",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Acne."
      }
    ],
    "document": {
      "filename": "Acne .pdf",
      "fileSize": "14 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Acne including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-201",
    "name": "Chronic Rhinosinusitis (CRS)",
    "system": "Respiratory",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Patient presents for clinical evaluation and review.",
      "Collect onset and duration history.",
      "Identify any symptoms or triggers."
    ],
    "diagnosisCriteria": [
      "VAS (0–10):      -\"Not at all troublesome\"     ----------->     \"Worst possible troublesome\"      -^/10 —mild 0–3, moderate >3–7, severe >7–10     -Escalate / refer if VAS ≥5 persists despite first-line care",
      "SNOT-22 total: ^/110 (each item 0–5)     -Escalate / refer if SNOT-22 ≥40 persists despite first-line care     -Availabe: https://entcalculator.com/snot-22"
    ],
    "treatmentOptions": [
      "First-line (review at 1 month):   -Saline nasal irrigation 1–2x daily, ongoing   -INCS daily, long-term:         -mometasone (Nasonex Allergy)         -fluticasone furoate (Avamys)         -budesonide (Rhinocort)    -Counsel: 2–4 weeks for full effect   -If allergic features: add intranasal azelastine or oral non-sedating antihistamine (e.g. Dymista or Rialtris).",
      "Second-line (no response after ≥1 month, or VAS ≥5 / SNOT-22 ≥40):   -Check adherence and technique FIRST   -Consider specific IgE (RAST) and CT sinuses (X-rays not recommended)   -CRSsNP: prednisolone 25 mg daily 5–10 days (limited evidence)   -CRSwNP medical polypectomy: prednisolone 25 mg daily 1 week → 12.5 mg daily 1 week → 12.5 mg alt days 1 week;     continue INCS throughout   -Antibiotics not routinely indicated in primary care",
      "Special populations:   -Children <12: refer; if polyps, test for CF   -Adults with polyps: screen asthma + aspirin sensitivity   -Pregnancy: saline safe; budesonide preferred INCS; avoid oral steroids in T1 if possible   -Specialist-led: biologics (dupilumab, omalizumab, mepolizumab), FESS (Functional endoscopic sinus surgery)",
      "Referrals and Follow-up:Refer ENT as:      -no response at 1 month, polyps, suspected fungal, unilateral/progressive symptoms, anatomical obstructionRefer to allergist as:      -allergy suspectedRefer to respiratory physician as:      -asthma/AERD with polyps URGENT (same-day ED/ENT):      -periorbital oedema, vision change, severe headache, neuro signs, frontal swelling, sepsisReview in:      -^ weeks/months ^ —re-measure VAS / SNOT-22Post-polypectomy: long-term INCS to prevent recurrence",
      "Patient Resources:    -https://allergyfacts.org.au/__interest/sinusitis/   -https://www.allergy.org.au/images/pc/ASCIA_PC_Sinusitis_and_Allergy_FAQ_2024.pdf"
    ],
    "clinicalNotes": "Differentials:-^Acute rhinosinusitis (<4 weeks)-^Allergic rhinitis (often coexists)-^Rhinitis medicamentosa-^Sinonasal neoplasm (unilateral, bleeding, crusting —urgent ENT)-^Migraine / tension headache (facial pain only, no other criteria) Differentials:-^Acute rhinosinusitis (<4 weeks)-^Allergic rhinitis (often coexists)-^Rhinitis medicamentosa-^S...",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Chronic Rhinosinusitis (CRS)."
      }
    ],
    "document": {
      "filename": "Chronic Rhinosinusitis (CRS) .pdf",
      "fileSize": "26 KB",
      "totalPages": 7,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Chronic Rhinosinusitis (CRS) including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-202",
    "name": "FINAL Wound Review",
    "system": "Dermatology",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Patient presents for clinical evaluation and review.",
      "Collect onset and duration history.",
      "Identify any symptoms or triggers."
    ],
    "diagnosisCriteria": [
      "Clinical Photography: Consent obtained for clinical photography; image uploaded to gallery/record."
    ],
    "treatmentOptions": [
      "Review medication and dosage.",
      "Provide patient education sheet.",
      "Schedule review or specialist referral as needed."
    ],
    "clinicalNotes": "FINAL Wound Review  Tuesday, 3 February 20265:18 pm",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for FINAL Wound Review."
      }
    ],
    "document": {
      "filename": "FINAL Wound Review  .pdf",
      "fileSize": "6 KB",
      "totalPages": 1,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for FINAL Wound Review including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-203",
    "name": "Hypertrophic Scarring",
    "system": "Dermatology",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Patient presents for clinical evaluation and review.",
      "Collect onset and duration history.",
      "Identify any symptoms or triggers."
    ],
    "diagnosisCriteria": [
      "*Hypertrophic —within wound borders; Keloid —extends beyond",
      "Special populations:-Pregnancy: silicone/pressure/massage safe; defer intralesional steroid; 5-FU contraindicated-Paediatrics: pressure + silicone mainstay; steroid 1 mg/kg max 40 mg-Elderly: lower steroid conc (thinner dermis)-Skin of colour: lower conc, avoid aggressive cryo, PDL preferred over ablative laser",
      "FINAL Hypertrophic Scarring Wednesday, 13 May 20265:59 pm",
      "TAGS:#kelloid #hypertrophicscar #earring ------------------------------------------------------------------"
    ],
    "treatmentOptions": [
      "Patient Information: https://www.skinhealthinfo.org.uk/wp-content/uploads/2018/11/Keloids-PIL-April-2021-1.pdf1)Caulibuds/Kelloidbuds/magnetic earrings can be bought online 2)",
      "============================================",
      "Pathophysiology:Both = abnormal wound healing with excess collagen deposition (↑TGF-β1, ↑fibroblast activity, ↓collagenase).Hypertrophic = within wound borders, regresses over 12–24 months.Keloid = beyond wound borders, does NOT regress, genetic/ethnic predisposition (15× African, ↑ Fitzpatrick IV–VI).High-risk sites: earlobes, sternum, shoulders, upper back, deltoid.",
      "Treatment principles:Tiered and multi-modal. Goal = symptom relief + flattening, NOT cure. Early intervention (<6–12 months) more effective.Tier 1: silicone, pressure, massage. Tier 2: intralesional triamcinolone. Tier 3: surgery+adjuvant, laser, 5-FU, radiotherapy.Surgery alone for keloid = up to 100% recurrence —always combine with adjuvant Rx.",
      "*WARNING —Hypopigmentation and atrophy can be permanent and highly visible in skin of colour. Start low, titrate up.*MUST counsel: atrophy, hypopigmentation, telangiectasia, menstrual irregularity (rare), pain, partial/no response.*WARNING —Max 40 mg per session; exceeding risks HPA suppression with repeated dosing."
    ],
    "clinicalNotes": "Severity:-^Mild —small, asymptomatic-^Moderate —symptomatic or cosmetically significant-^Severe —functionally limiting or major psychological impact Differentials:-^Dermatofibroma; ^DFSP; ^Foreign body granuloma; ^Malignancy in old scar (biopsy if atypical) Severity:-^Mild —small, asymptomatic-^Moderate —symptomatic or cosmetically significant-^Sev...",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Hypertrophic Scarring."
      }
    ],
    "document": {
      "filename": "Hypertrophic Scarring .pdf",
      "fileSize": "15 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Hypertrophic Scarring including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-204",
    "name": "Implanon Removal",
    "system": "Women's Health",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Discussed future contraception:     -"
    ],
    "diagnosisCriteria": [
      "Check vital signs.",
      "Perform targeted physical examination of affected system.",
      "Order relevant diagnostic imaging or pathology."
    ],
    "treatmentOptions": [
      "Patient verbalized understanding",
      "---------------------------------------------------------------------------------For info only, DELETE upon finalizing"
    ],
    "clinicalNotes": "Clinical SOAP Note template for Implanon Removal assessment.",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Implanon Removal."
      }
    ],
    "document": {
      "filename": "Implanon Removal .pdf",
      "fileSize": "9 KB",
      "totalPages": 1,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Implanon Removal including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-205",
    "name": "Lichen Sclerosis",
    "system": "Dermatology",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "#Issue 2 (General/Other)^"
    ],
    "diagnosisCriteria": [
      "Check vital signs.",
      "Perform targeted physical examination of affected system.",
      "Order relevant diagnostic imaging or pathology."
    ],
    "treatmentOptions": [
      "Patient information: https://www.mshc.org.au/?ACT=63&path=factsheet/pdf/2561)https://www.thewomens.org.au/health-information/vulva-vagina/vulva-vagina-problems/lichen-sclerosus2)",
      "--------------------------------------------------------------------------------------------------------DOCTOR REVISION SUMMARYClinical Presentation:Often presents as white \"parchment-like\" skin. In females, the vagina is strictly spared, but the \"figure of eight\" perianal involvement is classic.•",
      "The 5% Risk:Untreated or undertreated genital Lichen Sclerosus carries a 5% risk of malignant transformation into Squamous Cell Carcinoma (SCC).•",
      "Treatment Gold Standard:Potent corticosteroids (Betamethasone dipropionate 0.05% ointment) are first-line. Ointments are preferred over creams as they sting less on fissured skin.•",
      "Maintenance:Remission is rare; 85% of patients require indefinite maintenance (2-3 times weekly) to prevent anatomical distortion and SCC.•"
    ],
    "clinicalNotes": "Clinical SOAP Note template for Lichen Sclerosis assessment.",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Lichen Sclerosis."
      }
    ],
    "document": {
      "filename": "Lichen Sclerosis .pdf",
      "fileSize": "10 KB",
      "totalPages": 2,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Lichen Sclerosis including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-206",
    "name": "Male Fertility Issues",
    "system": "Women's Health",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": true,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "Past Medical History:Childhood:   -^declines hx of cryptorchidism    -^declines hx of scrotal surgery    -^declines hx of hernia repair    -^declines hx of mumps Genitourinary:   -^Declines hx of STIs (Chlamydia, Gonorrhoea)    -^declines hx of Epididymo-orchitis / Prostatitis    -^declines hx of Testicular/scrotal trauma    -^declines vasectomy Systemic Illness:   -^no known hx of Diabetes Mellitus    -^declines hx of chemotherapy / radiotherapy",
      "Medications & Allergies (mention if on TRT, 5-ARIs, spironolactone or sulfasalasine)",
      "Social History:Occupation:   -Exposure to: Heat / Pesticides / Solvents / Heavy metals / Radiation: Yes / No   -Details:Substance Use:   -Smoking:Current / Ex / Never. (^ packs/day)   -Alcohol:^ standard drinks per week.   -Recreational Drugs: ^Declines any       Marijuana: Yes / No, Cocaine: Yes / No      Opiates: Yes / No      Anabolic steroids (current or past): Yes / NoGeneral Health:   -Diet and exercise:   -Recent high fevers: Yes / No   -Testicular heat exposure (e.g., saunas, hot tubs): Yes / No",
      "Family History:   -Infertility (siblings, parents): Yes / No   -Genetic conditions (e.g., Cystic Fibrosis, Klinefelter): Yes / No"
    ],
    "diagnosisCriteria": [
      "Check vital signs.",
      "Perform targeted physical examination of affected system.",
      "Order relevant diagnostic imaging or pathology."
    ],
    "treatmentOptions": [
      "Patient information sheets: 1. https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/infertility-in-men2. https://www.thewomens.org.au/health-information/fertility-information/fertility-problems/male-infertility3. https://www.ivf.com.au/sites/ivfa/files/2023-03/MFC05%20Male%20Fertility%20eBook%2017.03.23-LR_3.pdf",
      "----------------------------------------------------------------------------------------------------------------------------",
      "FINAL Male Fertility Issues  Sunday, 9 November 20259:23 am"
    ],
    "clinicalNotes": "Clinical SOAP Note template for Male Fertility Issues assessment.",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for Male Fertility Issues."
      }
    ],
    "document": {
      "filename": "Male Fertility Issues  .pdf",
      "fileSize": "14 KB",
      "totalPages": 3,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for Male Fertility Issues including subjective intake checklists, examination fields, and management plans."
    }
  },
  {
    "id": "EXTR-207",
    "name": "MASLD",
    "system": "Gastrointestinal",
    "category": "SOAP Template",
    "type": "Note",
    "isPremium": false,
    "lastUpdated": "09 Jun 2026",
    "author": "Siddhant Udavant",
    "symptoms": [
      "History of recent rapid weight gain or sedentary lifestyle ^Known history of Type 2 Diabetes or Pre-diabetes ^Known history of hypertension or dyslipidaemia ^Family history of chronic liver disease or premature CVD ^",
      "Review of current medications and over-the-counter supplements ^",
      "Always look for other co-existing causes of liver disease, especially in young people      -Minimum panel: Hep B & C serology, Serum Ig, ANA, AMA, AsMAb, Iron studies, a-1 antitrypsin, Coeliac Abs                                      Copper studies & ceruloplasmin in the right patient                                      Looking for Look for Hep B, Hep C, Autoimmune Liver Disease, Wilson's disease",
      "Reaching the diagnosis Dx is built on 3 pillars:    1) Detection of Hepatic Steatosis         -Abdominal USS or Fib-4    2) Presence of Cardiometabolic Risk Factors         -Obesity: BMI >25 in Caucasian or >23 in Asian                           or WC >=102/88 cm (Men/Women) in Caucasians and >=90/80 cm in Asians).        -BP: >=130/85 mmHg or on antihypertensive treatment.        -Triglycerides: >=1.50 mmol/L or on lipid-lowering therapy        -HDL cholesterol: < 1.0 mmol/L (Men) or < 1.3 mmol/L (Women).        -Pre-diabetes: HbA1c 5.7% to 6.4% or FBG 5.6 to 6.9 mmol/L.        -Insulin Resistance: HOMA-IR score >=2.5.        -Inflammation: High-sensitivity C-reactive protein (hs-CRP) > 2 mg/L.   3) Exclusion of other causes         -What if the patient also drinks?            If they meet metabolic criteria but drink more than 30g/day for men and 20g/day for women (up to 60g/day),            they fall into the new MetALDcategory."
    ],
    "diagnosisCriteria": [
      "Check vital signs.",
      "Perform targeted physical examination of affected system.",
      "Order relevant diagnostic imaging or pathology."
    ],
    "treatmentOptions": [
      "Patient resources:    -https://liverwell.org.au/making-masld-an-australian-public-health-priority/   -https://www.gesa.org.au/public/13/files/Education%20%26%20Resources/Patient%20Resources/Fatty%20Liver/GESA%20Fatty%20Liver%20Disease%202024.pdf",
      "---------------------------------------------------------------------------------------------------------------------------------------------DOCTOR REVISION SUMMARYBasics -Change in terminology, used to be called NAFLD -A lot of people were drinking alcohol, then changed to metabolic associated fatty liver disease -Now termed \"Metabolic Associated Steatotic Liver Disease\" or MASLD -Presence of the disease is a single risk factor for other chronic diseases (HTN, DM) -\"Lean\" MASLD -Combined with Alcoholic liver disease -Risk Factors:      -Access weight      -Visceral fat      -Ultra processed foods      -Dyslipidaemia      -Glucose intolerance or DM      -HTN"
    ],
    "clinicalNotes": "Management     -  Lifestyle change           -Dietetics referral (generally, Mediterranean style diet)           -Weight loss >= Weight Loss for fibrosis regression & 5–7% for steatosis resolution.          -Exercise: 150–240 minutes of moderate-to-vigorous aerobic exercise per week.          -Alcohol: Advise total cessation or strict adherence to ...",
    "references": [
      {
        "id": 1,
        "text": "GP Edge Clinical Templates Directory for MASLD."
      }
    ],
    "document": {
      "filename": "MASLD.pdf",
      "fileSize": "18 KB",
      "totalPages": 4,
      "downloadUrl": "#",
      "summary": "SOAP clinical note template for MASLD including subjective intake checklists, examination fields, and management plans."
    }
  }
];
