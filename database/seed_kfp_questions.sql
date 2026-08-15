-- ============================================================================
--  GP EDGE — KFP mock question seed data (for testing KFP multi-select flow)
--  Engine: PostgreSQL 15+   Run AFTER seed_dummy_questions.sql
--
--  Contents:
--    * 12 KFP questions across 6 subjects (2 per subject)
--    * 5–7 options per question, with 2–3 correct (multi-select)
--    * kfp_correct_count set to match the number of correct options
--    * lead_in, why_correct, knowledge_bank, pearl fields populated
--
--  Safe to re-run: every INSERT is ON CONFLICT DO NOTHING.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- KFP QUESTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- ─── Cardiovascular (subject 01) ────────────────────────────────────────────

-- Q1: Hypertension initial workup
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000001',
  'A 52-year-old male presents with a blood pressure of 168/98 mmHg recorded on three separate occasions over six weeks. He has no prior medical history. BMI is 31. He is a non-smoker who drinks 4 standard drinks per day.',
  'Initial workup for newly diagnosed hypertension should include assessment of end-organ damage, secondary causes, and cardiovascular risk factors.',
  '22222222-2222-2222-2222-000000000001',
  '11111111-1111-1111-1111-000000000001',
  'KFP', 'medium', 'published', 3,
  'Select the THREE most appropriate initial investigations for this patient.',
  'UEC reveals renal function and electrolytes (secondary cause screen + end-organ). Fasting lipids and HbA1c assess cardiovascular risk. ECG screens for left ventricular hypertrophy.',
  'RACGP Hypertension Guidelines recommend: UEC, fasting lipids, HbA1c/fasting glucose, urinalysis, ECG at baseline.',
  'Always check renal function before starting an ACE inhibitor or ARB.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0001-000000000001', 'aef00001-0001-0001-0001-000000000001', 'Urea, electrolytes and creatinine (UEC)', 0, true),
  ('bef00e01-0001-0001-0001-000000000002', 'aef00001-0001-0001-0001-000000000001', 'Fasting lipid profile', 1, true),
  ('bef00e01-0001-0001-0001-000000000003', 'aef00001-0001-0001-0001-000000000001', '12-lead ECG', 2, true),
  ('bef00e01-0001-0001-0001-000000000004', 'aef00001-0001-0001-0001-000000000001', 'CT coronary angiogram', 3, false),
  ('bef00e01-0001-0001-0001-000000000005', 'aef00001-0001-0001-0001-000000000001', 'Renal artery duplex ultrasound', 4, false),
  ('bef00e01-0001-0001-0001-000000000006', 'aef00001-0001-0001-0001-000000000001', 'Transthoracic echocardiogram', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q2: Acute chest pain management
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000002',
  'A 65-year-old female presents to your GP clinic with central crushing chest pain radiating to her left arm for 20 minutes. She is diaphoretic and nauseous. BP 145/90, HR 100, SpO2 96%. She has a history of type 2 diabetes and dyslipidaemia.',
  'Suspected ACS in general practice requires immediate first aid, antiplatelet therapy, and urgent transfer.',
  '22222222-2222-2222-2222-000000000004',
  '11111111-1111-1111-1111-000000000001',
  'KFP', 'hard', 'published', 3,
  'Select the THREE most important immediate actions in your GP clinic.',
  'Aspirin 300 mg is the cornerstone antiplatelet for suspected ACS. GTN provides symptom relief if no contraindications. Calling 000 ensures timely transfer for definitive management.',
  'NHFA/CSANZ ACS Guidelines: immediate aspirin, GTN, call ambulance. Do not delay transfer for investigations.',
  'Do not give GTN if the patient has taken a PDE5 inhibitor (e.g. sildenafil) in the last 24–48 hours.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0002-000000000001', 'aef00001-0001-0001-0001-000000000002', 'Administer aspirin 300 mg orally', 0, true),
  ('bef00e01-0001-0001-0002-000000000002', 'aef00001-0001-0001-0001-000000000002', 'Call 000 for ambulance transfer', 1, true),
  ('bef00e01-0001-0001-0002-000000000003', 'aef00001-0001-0001-0001-000000000002', 'Administer sublingual GTN', 2, true),
  ('bef00e01-0001-0001-0002-000000000004', 'aef00001-0001-0001-0001-000000000002', 'Perform a 12-lead ECG and wait for result before acting', 3, false),
  ('bef00e01-0001-0001-0002-000000000005', 'aef00001-0001-0001-0001-000000000002', 'Administer IV morphine 10 mg', 4, false),
  ('bef00e01-0001-0001-0002-000000000006', 'aef00001-0001-0001-0001-000000000002', 'Start IV heparin infusion', 5, false),
  ('bef00e01-0001-0001-0002-000000000007', 'aef00001-0001-0001-0001-000000000002', 'Arrange outpatient stress test within 48 hours', 6, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ─── Respiratory (subject 02) ───────────────────────────────────────────────

-- Q3: Acute asthma exacerbation
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000003',
  'A 28-year-old female presents to your clinic with acute wheeze, cough, and breathlessness for 6 hours. She can speak in short sentences. RR 28, SpO2 92% on room air, HR 110. She uses salbutamol PRN but has no preventer. She had two ED presentations for asthma in the past 12 months.',
  'Moderate-to-severe acute asthma requires bronchodilator therapy, systemic corticosteroids, and assessment for hospital transfer.',
  '22222222-2222-2222-2222-000000000007',
  '11111111-1111-1111-1111-000000000002',
  'KFP', 'medium', 'published', 3,
  'Select the THREE most appropriate immediate management steps.',
  'Salbutamol via spacer is first-line bronchodilator. Oral prednisolone reduces airway inflammation. Supplemental oxygen targets SpO2 94–98%.',
  'National Asthma Council Australia Acute Management Guidelines 2024.',
  'Speaking in short sentences = moderate-severe. Inability to speak = life-threatening — call ambulance immediately.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0003-000000000001', 'aef00001-0001-0001-0001-000000000003', 'Salbutamol 8–12 puffs via spacer, repeat every 20 minutes', 0, true),
  ('bef00e01-0001-0001-0003-000000000002', 'aef00001-0001-0001-0001-000000000003', 'Oral prednisolone 40–50 mg stat', 1, true),
  ('bef00e01-0001-0001-0003-000000000003', 'aef00001-0001-0001-0001-000000000003', 'Supplemental oxygen to target SpO2 94–98%', 2, true),
  ('bef00e01-0001-0001-0003-000000000004', 'aef00001-0001-0001-0001-000000000003', 'IV aminophylline loading dose', 3, false),
  ('bef00e01-0001-0001-0003-000000000005', 'aef00001-0001-0001-0001-000000000003', 'Commence inhaled budesonide 800 mcg BD as preventer', 4, false),
  ('bef00e01-0001-0001-0003-000000000006', 'aef00001-0001-0001-0001-000000000003', 'Chest X-ray before any treatment', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q4: COPD management
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000004',
  'A 67-year-old male ex-smoker (40 pack-years, quit 2 years ago) has stable COPD with FEV1 45% predicted. He uses tiotropium daily and salbutamol PRN. He has had 3 exacerbations requiring oral steroids in the past year. He is breathless on minimal exertion (mMRC 3).',
  'Frequent exacerbator with significant symptoms despite LAMA monotherapy warrants therapy escalation per GOLD guidelines.',
  '22222222-2222-2222-2222-000000000008',
  '11111111-1111-1111-1111-000000000002',
  'KFP', 'hard', 'published', 2,
  'Select the TWO most appropriate additions to his current management.',
  'Adding ICS is indicated for frequent exacerbators (≥2/year) already on LAMA. Pulmonary rehabilitation improves exercise tolerance and reduces hospitalisations with strong evidence.',
  'COPD-X Australian Guidelines: step up to LAMA + LABA + ICS (triple therapy) for frequent exacerbators. Pulmonary rehab is Level A evidence.',
  'Blood eosinophils >300 predict better ICS response in COPD. Always check before adding ICS.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0004-000000000001', 'aef00001-0001-0001-0001-000000000004', 'Add inhaled corticosteroid (e.g. fluticasone) + LABA combination', 0, true),
  ('bef00e01-0001-0001-0004-000000000002', 'aef00001-0001-0001-0001-000000000004', 'Refer for pulmonary rehabilitation', 1, true),
  ('bef00e01-0001-0001-0004-000000000003', 'aef00001-0001-0001-0001-000000000004', 'Start prophylactic azithromycin 250 mg daily', 2, false),
  ('bef00e01-0001-0001-0004-000000000004', 'aef00001-0001-0001-0001-000000000004', 'Switch tiotropium to umeclidinium', 3, false),
  ('bef00e01-0001-0001-0004-000000000005', 'aef00001-0001-0001-0001-000000000004', 'Start long-term oral prednisolone 5 mg daily', 4, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ─── Endocrinology (subject 03) ─────────────────────────────────────────────

-- Q5: Type 2 diabetes targets
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000005',
  'A 55-year-old female is diagnosed with type 2 diabetes. HbA1c is 7.8%. BMI 34. BP 142/88. She has no complications. eGFR 85 mL/min. She is motivated to make lifestyle changes.',
  'Newly diagnosed T2DM management should address glycaemia, cardiovascular risk, and weight.',
  '22222222-2222-2222-2222-000000000013',
  '11111111-1111-1111-1111-000000000003',
  'KFP', 'medium', 'published', 3,
  'Select the THREE most appropriate initial management steps.',
  'Metformin is first-line pharmacotherapy. Lifestyle modification (diet + exercise) is foundational. SGLT2 inhibitors provide cardiovascular and renal protection with weight loss benefit in overweight patients.',
  'RACGP Diabetes Management Guidelines 2024. ADS Position Statement on SGLT2 inhibitors.',
  'SGLT2 inhibitors reduce cardiovascular events independent of glucose lowering — consider early in patients with CV risk factors.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0005-000000000001', 'aef00001-0001-0001-0001-000000000005', 'Start metformin 500 mg BD, titrate to 1 g BD', 0, true),
  ('bef00e01-0001-0001-0005-000000000002', 'aef00001-0001-0001-0001-000000000005', 'Structured lifestyle intervention (diet and exercise program)', 1, true),
  ('bef00e01-0001-0001-0005-000000000003', 'aef00001-0001-0001-0001-000000000005', 'Add an SGLT2 inhibitor (e.g. empagliflozin)', 2, true),
  ('bef00e01-0001-0001-0005-000000000004', 'aef00001-0001-0001-0001-000000000005', 'Start basal insulin (glargine) immediately', 3, false),
  ('bef00e01-0001-0001-0005-000000000005', 'aef00001-0001-0001-0001-000000000005', 'Start a sulfonylurea (e.g. gliclazide) as first-line', 4, false),
  ('bef00e01-0001-0001-0005-000000000006', 'aef00001-0001-0001-0001-000000000005', 'Refer for bariatric surgery as initial management', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q6: Thyroid disorder workup
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000006',
  'A 38-year-old female presents with fatigue, weight gain of 5 kg over 3 months, constipation, and cold intolerance. She has a family history of autoimmune thyroid disease. On examination, her thyroid is diffusely enlarged and non-tender.',
  'Clinical features suggest hypothyroidism; workup should confirm the diagnosis and identify the aetiology.',
  '22222222-2222-2222-2222-000000000014',
  '11111111-1111-1111-1111-000000000003',
  'KFP', 'easy', 'published', 2,
  'Select the TWO most appropriate initial investigations.',
  'TSH is the first-line screening test for thyroid dysfunction. Anti-TPO antibodies confirm autoimmune (Hashimoto''s) thyroiditis, the most likely cause given her presentation and family history.',
  'RACGP Guidelines for Thyroid Testing. Thyroid antibodies are not needed for every patient with abnormal TSH, but are indicated when autoimmune aetiology is suspected.',
  'Always request TSH first — free T4 is reflexed by most labs only if TSH is abnormal, saving the patient money.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0006-000000000001', 'aef00001-0001-0001-0001-000000000006', 'TSH and free T4', 0, true),
  ('bef00e01-0001-0001-0006-000000000002', 'aef00001-0001-0001-0001-000000000006', 'Anti-TPO antibodies', 1, true),
  ('bef00e01-0001-0001-0006-000000000003', 'aef00001-0001-0001-0001-000000000006', 'Thyroid ultrasound', 2, false),
  ('bef00e01-0001-0001-0006-000000000004', 'aef00001-0001-0001-0001-000000000006', 'Radioactive iodine uptake scan', 3, false),
  ('bef00e01-0001-0001-0006-000000000005', 'aef00001-0001-0001-0001-000000000006', 'Fine needle aspiration biopsy', 4, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ─── Gastroenterology (subject 04) ──────────────────────────────────────────

-- Q7: Iron deficiency anaemia workup
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000007',
  'A 58-year-old male presents with fatigue. FBE shows Hb 105 g/L, MCV 72 fL. Iron studies confirm iron deficiency (ferritin 8 µg/L, transferrin saturation 10%). He has no overt bleeding. He takes no NSAIDs. Coeliac serology is negative.',
  'Iron deficiency anaemia in a male over 50 requires exclusion of GI malignancy.',
  '22222222-2222-2222-2222-000000000019',
  '11111111-1111-1111-1111-000000000004',
  'KFP', 'medium', 'published', 2,
  'Select the TWO most important investigations to arrange.',
  'Colonoscopy is essential to exclude colorectal malignancy — the most important cause of IDA in men over 50. Gastroscopy excludes upper GI causes including gastric cancer, peptic ulcer, and coeliac disease (histology).',
  'GESA Guidelines: Bidirectional endoscopy is recommended for unexplained IDA in all men and postmenopausal women.',
  'Even with negative coeliac serology, duodenal biopsies at gastroscopy can detect seronegative coeliac disease.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0007-000000000001', 'aef00001-0001-0001-0001-000000000007', 'Colonoscopy', 0, true),
  ('bef00e01-0001-0001-0007-000000000002', 'aef00001-0001-0001-0001-000000000007', 'Gastroscopy', 1, true),
  ('bef00e01-0001-0001-0007-000000000003', 'aef00001-0001-0001-0001-000000000007', 'Faecal occult blood test (iFOBT)', 2, false),
  ('bef00e01-0001-0001-0007-000000000004', 'aef00001-0001-0001-0001-000000000007', 'CT abdomen and pelvis with contrast', 3, false),
  ('bef00e01-0001-0001-0007-000000000005', 'aef00001-0001-0001-0001-000000000007', 'Repeat iron studies in 3 months after oral iron', 4, false),
  ('bef00e01-0001-0001-0007-000000000006', 'aef00001-0001-0001-0001-000000000007', 'Bone marrow biopsy', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q8: Acute hepatitis workup
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000008',
  'A 32-year-old male presents with jaundice, dark urine, and right upper quadrant discomfort for 5 days. He returned from backpacking in Southeast Asia 4 weeks ago. He drinks alcohol socially. LFTs: ALT 1200 U/L, AST 980 U/L, ALP 180 U/L, bilirubin 85 µmol/L.',
  'Acute hepatitis in a returned traveller requires viral serology and hepatitis A/B/E assessment.',
  '22222222-2222-2222-2222-000000000023',
  '11111111-1111-1111-1111-000000000004',
  'KFP', 'medium', 'published', 3,
  'Select the THREE most appropriate initial investigations.',
  'Hepatitis A IgM is the most likely cause given travel history. Hepatitis B surface antigen and core IgM screen for acute HBV. Hepatitis E IgM should be tested in returned travellers from endemic areas.',
  'GESA Clinical Update: Acute Hepatitis. Hepatitis E is underdiagnosed in Australia — always test in returned travellers.',
  'ALT >1000 U/L narrows the differential to viral hepatitis, drug-induced liver injury, ischaemic hepatitis, or acute autoimmune hepatitis.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0008-000000000001', 'aef00001-0001-0001-0001-000000000008', 'Hepatitis A IgM', 0, true),
  ('bef00e01-0001-0001-0008-000000000002', 'aef00001-0001-0001-0001-000000000008', 'Hepatitis B surface antigen and core IgM', 1, true),
  ('bef00e01-0001-0001-0008-000000000003', 'aef00001-0001-0001-0001-000000000008', 'Hepatitis E IgM', 2, true),
  ('bef00e01-0001-0001-0008-000000000004', 'aef00001-0001-0001-0001-000000000008', 'MRCP (magnetic resonance cholangiopancreatography)', 3, false),
  ('bef00e01-0001-0001-0008-000000000005', 'aef00001-0001-0001-0001-000000000008', 'Liver biopsy', 4, false),
  ('bef00e01-0001-0001-0008-000000000006', 'aef00001-0001-0001-0001-000000000008', 'Anti-smooth muscle antibodies and ANA', 5, false),
  ('bef00e01-0001-0001-0008-000000000007', 'aef00001-0001-0001-0001-000000000008', 'Serum paracetamol level', 6, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ─── Mental Health (subject 05) ─────────────────────────────────────────────

-- Q9: Depression — non-pharmacological interventions
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000009',
  'A 34-year-old female teacher presents with low mood, anhedonia, poor concentration, and disturbed sleep for 8 weeks. PHQ-9 score is 14 (moderate depression). She has no suicidal ideation. She prefers to try non-medication options first. She has no prior mental health history.',
  'For moderate depression, psychological therapies are first-line and can be combined with lifestyle interventions.',
  '22222222-2222-2222-2222-000000000025',
  '11111111-1111-1111-1111-000000000005',
  'KFP', 'easy', 'published', 3,
  'Select the THREE most appropriate non-pharmacological interventions to recommend.',
  'CBT has the strongest evidence for moderate depression. A structured exercise program has Level A evidence. A Mental Health Treatment Plan enables Medicare-subsidised sessions with a psychologist.',
  'RANZCP Clinical Practice Guidelines for Mood Disorders 2020. RACGP: Mental Health Treatment Plans under Better Access.',
  'PHQ-9 score 10–14 = moderate depression. Psychological therapy is first-line; medication is an alternative if patient prefers or therapy is insufficient.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0009-000000000001', 'aef00001-0001-0001-0001-000000000009', 'Cognitive behavioural therapy (CBT)', 0, true),
  ('bef00e01-0001-0001-0009-000000000002', 'aef00001-0001-0001-0001-000000000009', 'Structured exercise program (30 min, 5 days/week)', 1, true),
  ('bef00e01-0001-0001-0009-000000000003', 'aef00001-0001-0001-0001-000000000009', 'Mental Health Treatment Plan for subsidised psychology sessions', 2, true),
  ('bef00e01-0001-0001-0009-000000000004', 'aef00001-0001-0001-0001-000000000009', 'Start sertraline 50 mg daily', 3, false),
  ('bef00e01-0001-0001-0009-000000000005', 'aef00001-0001-0001-0001-000000000009', 'Refer to psychiatrist for ECT assessment', 4, false),
  ('bef00e01-0001-0001-0009-000000000006', 'aef00001-0001-0001-0001-000000000009', 'Prescribe diazepam 5 mg PRN for anxiety symptoms', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q10: Substance use — alcohol screening
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000010',
  'A 45-year-old male accountant presents for a health check. AUDIT-C score is 8 (suggestive of hazardous drinking). He reports drinking 6 standard drinks daily, mostly wine with dinner. He denies withdrawal symptoms. GGT is 95 U/L, MCV 98 fL. He wants to cut down.',
  'Hazardous alcohol use requires brief intervention, screening for complications, and assessment of dependence severity.',
  '22222222-2222-2222-2222-000000000029',
  '11111111-1111-1111-1111-000000000005',
  'KFP', 'medium', 'published', 2,
  'Select the TWO most appropriate next steps.',
  'Brief intervention (FRAMES model) is the evidence-based GP approach for hazardous drinking and is effective at reducing consumption. LFTs including a full liver panel assess for alcohol-related liver injury.',
  'RACGP SNAP Guide: Brief intervention for alcohol. NHMRC Alcohol Guidelines 2020.',
  'AUDIT-C ≥5 in men warrants a full AUDIT. Score ≥8 on full AUDIT suggests alcohol dependence — consider pharmacotherapy (naltrexone/acamprosate).'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0010-000000000001', 'aef00001-0001-0001-0001-000000000010', 'Deliver a brief intervention using the FRAMES model', 0, true),
  ('bef00e01-0001-0001-0010-000000000002', 'aef00001-0001-0001-0001-000000000010', 'Order full liver function panel including ALT, AST, and albumin', 1, true),
  ('bef00e01-0001-0001-0010-000000000003', 'aef00001-0001-0001-0001-000000000010', 'Start naltrexone 50 mg daily immediately', 2, false),
  ('bef00e01-0001-0001-0010-000000000004', 'aef00001-0001-0001-0001-000000000010', 'Advise complete abstinence and admit for supervised detox', 3, false),
  ('bef00e01-0001-0001-0010-000000000005', 'aef00001-0001-0001-0001-000000000010', 'Prescribe diazepam for home detoxification', 4, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ─── Paediatrics (subject 06) ───────────────────────────────────────────────

-- Q11: Febrile child assessment
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000011',
  'An 18-month-old boy is brought in by his mother with a temperature of 39.5°C for 2 days. He is irritable but consolable. He has a runny nose but no rash, neck stiffness, or bulging fontanelle. His immunisations are up to date. He is drinking reduced amounts of fluid. Urine output has been reduced over 12 hours.',
  'A febrile child with reduced oral intake and urine output requires assessment for serious bacterial infection and hydration status.',
  '22222222-2222-2222-2222-000000000031',
  '11111111-1111-1111-1111-000000000006',
  'KFP', 'medium', 'published', 3,
  'Select the THREE most appropriate initial actions.',
  'Urine collection (bag or clean catch) is essential to exclude UTI — the most common occult serious bacterial infection in febrile children under 2. Weight and hydration assessment guide fluid management. Appropriate dose paracetamol provides symptomatic relief and aids assessment.',
  'RCH Melbourne Clinical Practice Guideline: Febrile Child. NICE NG143 Fever in under 5s.',
  'UTI is the most common cause of fever without a source in children under 2 — always collect urine.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0011-000000000001', 'aef00001-0001-0001-0001-000000000011', 'Collect urine for urinalysis and culture', 0, true),
  ('bef00e01-0001-0001-0011-000000000002', 'aef00001-0001-0001-0001-000000000011', 'Assess weight and hydration status (skin turgor, CRT, mucous membranes)', 1, true),
  ('bef00e01-0001-0001-0011-000000000003', 'aef00001-0001-0001-0001-000000000011', 'Administer weight-based dose of paracetamol (15 mg/kg)', 2, true),
  ('bef00e01-0001-0001-0011-000000000004', 'aef00001-0001-0001-0001-000000000011', 'Blood cultures and empirical IV ceftriaxone', 3, false),
  ('bef00e01-0001-0001-0011-000000000005', 'aef00001-0001-0001-0001-000000000011', 'Lumbar puncture', 4, false),
  ('bef00e01-0001-0001-0011-000000000006', 'aef00001-0001-0001-0001-000000000011', 'Prescribe amoxicillin for presumed otitis media', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- Q12: Childhood eczema management
INSERT INTO questions (id, stem, rationale, subtopic_id, subject_id, exam_type_code, difficulty, status, kfp_correct_count, lead_in, why_correct, knowledge_bank, pearl)
VALUES (
  'aef00001-0001-0001-0001-000000000012',
  'A 3-year-old girl presents with a 12-month history of itchy, dry, erythematous patches on her flexural areas (antecubital and popliteal fossae, neck). She has a family history of asthma. Her sleep is disturbed by itch. Current treatment is soap-free wash only.',
  'Moderate atopic dermatitis requires a stepped approach with emollients, topical corticosteroids, and trigger avoidance.',
  '22222222-2222-2222-2222-000000000032',
  '11111111-1111-1111-1111-000000000006',
  'KFP', 'easy', 'published', 3,
  'Select the THREE key management recommendations.',
  'Regular emollients are the cornerstone of eczema management. A mild-moderate topical corticosteroid (e.g. methylprednisolone aceponate) controls active flares. Education about bathing practices (lukewarm, short, pat dry, apply emollient within 3 minutes) improves outcomes.',
  'Australasian Society of Clinical Immunology and Allergy (ASCIA) Eczema Action Plan. TGA: topical corticosteroid potency classification for paediatric use.',
  'Apply topical corticosteroid BEFORE emollient — steroid first ensures skin penetration. Wait 15 minutes between the two.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, label, position, is_correct) VALUES
  ('bef00e01-0001-0001-0012-000000000001', 'aef00001-0001-0001-0001-000000000012', 'Regular emollient application (thick moisturiser at least twice daily)', 0, true),
  ('bef00e01-0001-0001-0012-000000000002', 'aef00001-0001-0001-0001-000000000012', 'Mild-to-moderate topical corticosteroid for active flares (e.g. methylprednisolone aceponate 0.1%)', 1, true),
  ('bef00e01-0001-0001-0012-000000000003', 'aef00001-0001-0001-0001-000000000012', 'Education: lukewarm baths, pat dry, apply emollient within 3 minutes', 2, true),
  ('bef00e01-0001-0001-0012-000000000004', 'aef00001-0001-0001-0001-000000000012', 'Oral antihistamine (cetirizine) as primary itch treatment', 3, false),
  ('bef00e01-0001-0001-0012-000000000005', 'aef00001-0001-0001-0001-000000000012', 'Potent topical corticosteroid (betamethasone dipropionate) daily to face and flexures', 4, false),
  ('bef00e01-0001-0001-0012-000000000006', 'aef00001-0001-0001-0001-000000000012', 'Strict elimination diet (remove dairy, egg, and gluten)', 5, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- JUNCTION ROWS (question_subjects + question_subtopics)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO question_subjects (question_id, subject_id) VALUES
  ('aef00001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-000000000001'),
  ('aef00001-0001-0001-0001-000000000002', '11111111-1111-1111-1111-000000000001'),
  ('aef00001-0001-0001-0001-000000000003', '11111111-1111-1111-1111-000000000002'),
  ('aef00001-0001-0001-0001-000000000004', '11111111-1111-1111-1111-000000000002'),
  ('aef00001-0001-0001-0001-000000000005', '11111111-1111-1111-1111-000000000003'),
  ('aef00001-0001-0001-0001-000000000006', '11111111-1111-1111-1111-000000000003'),
  ('aef00001-0001-0001-0001-000000000007', '11111111-1111-1111-1111-000000000004'),
  ('aef00001-0001-0001-0001-000000000008', '11111111-1111-1111-1111-000000000004'),
  ('aef00001-0001-0001-0001-000000000009', '11111111-1111-1111-1111-000000000005'),
  ('aef00001-0001-0001-0001-000000000010', '11111111-1111-1111-1111-000000000005'),
  ('aef00001-0001-0001-0001-000000000011', '11111111-1111-1111-1111-000000000006'),
  ('aef00001-0001-0001-0001-000000000012', '11111111-1111-1111-1111-000000000006')
ON CONFLICT (question_id, subject_id) DO NOTHING;

INSERT INTO question_subtopics (question_id, subtopic_id) VALUES
  ('aef00001-0001-0001-0001-000000000001', '22222222-2222-2222-2222-000000000001'),
  ('aef00001-0001-0001-0001-000000000002', '22222222-2222-2222-2222-000000000004'),
  ('aef00001-0001-0001-0001-000000000003', '22222222-2222-2222-2222-000000000007'),
  ('aef00001-0001-0001-0001-000000000004', '22222222-2222-2222-2222-000000000008'),
  ('aef00001-0001-0001-0001-000000000005', '22222222-2222-2222-2222-000000000013'),
  ('aef00001-0001-0001-0001-000000000006', '22222222-2222-2222-2222-000000000014'),
  ('aef00001-0001-0001-0001-000000000007', '22222222-2222-2222-2222-000000000019'),
  ('aef00001-0001-0001-0001-000000000008', '22222222-2222-2222-2222-000000000023'),
  ('aef00001-0001-0001-0001-000000000009', '22222222-2222-2222-2222-000000000025'),
  ('aef00001-0001-0001-0001-000000000010', '22222222-2222-2222-2222-000000000029'),
  ('aef00001-0001-0001-0001-000000000011', '22222222-2222-2222-2222-000000000031'),
  ('aef00001-0001-0001-0001-000000000012', '22222222-2222-2222-2222-000000000032')
ON CONFLICT (question_id, subtopic_id) DO NOTHING;

COMMIT;
