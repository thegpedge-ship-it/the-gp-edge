-- ============================================================================
--  GP EDGE — Dummy question-bank seed data (for backend build & testing)
--  Engine: PostgreSQL 15+   Run AFTER schema.sql has been applied.
--
--  Contents:
--    * 2 exam types (AKT, KFP)
--    * 6 subjects, each with 6 subtopics  (36 subtopics total)
--    * 12 published questions spread across all 6 subjects / 12 subtopics
--    * 4 options per question (exactly one correct — respects uq_question_one_correct)
--    * question_subjects / question_subtopics junction rows (many-to-many)
--
--  Fixed UUIDs are used so child rows map cleanly to parents.
--  Safe to re-run: every INSERT is ON CONFLICT DO NOTHING.
--  created_by is left NULL (no admin_user required).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXAM TYPES
-- ----------------------------------------------------------------------------
INSERT INTO exam_types (code, name) VALUES
    ('AKT', 'Applied Knowledge Test'),
    ('KFP', 'Key Feature Problem')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. SUBJECTS  (6)
-- ----------------------------------------------------------------------------
INSERT INTO subjects (id, slug, name, icon, color, sort_order) VALUES
    ('11111111-1111-1111-1111-000000000001', 'cardiovascular',   'Cardiovascular',   'heart',   '#ef4444', 1),
    ('11111111-1111-1111-1111-000000000002', 'respiratory',      'Respiratory',      'lungs',   '#3b82f6', 2),
    ('11111111-1111-1111-1111-000000000003', 'endocrinology',    'Endocrinology',    'gauge',   '#f59e0b', 3),
    ('11111111-1111-1111-1111-000000000004', 'gastroenterology', 'Gastroenterology', 'stomach', '#10b981', 4),
    ('11111111-1111-1111-1111-000000000005', 'mental-health',    'Mental Health',    'brain',   '#8b5cf6', 5),
    ('11111111-1111-1111-1111-000000000006', 'paediatrics',      'Paediatrics',      'baby',    '#ec4899', 6)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. SUBTOPICS  (6 per subject = 36)
-- ----------------------------------------------------------------------------
INSERT INTO subtopics (id, subject_id, slug, name, sort_order) VALUES
    -- Cardiovascular
    ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001', 'hypertension',            'Hypertension',             1),
    ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000001', 'heart-failure',           'Heart Failure',            2),
    ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000001', 'arrhythmias',             'Arrhythmias',              3),
    ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000001', 'ischaemic-heart-disease', 'Ischaemic Heart Disease',  4),
    ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000001', 'dyslipidaemia',           'Dyslipidaemia',            5),
    ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000001', 'valvular-disease',        'Valvular Disease',         6),
    -- Respiratory
    ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000002', 'asthma',                  'Asthma',                   1),
    ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000002', 'copd',                    'COPD',                     2),
    ('22222222-2222-2222-2222-000000000009', '11111111-1111-1111-1111-000000000002', 'pneumonia',               'Pneumonia',                3),
    ('22222222-2222-2222-2222-000000000010', '11111111-1111-1111-1111-000000000002', 'pulmonary-embolism',      'Pulmonary Embolism',       4),
    ('22222222-2222-2222-2222-000000000011', '11111111-1111-1111-1111-000000000002', 'lung-cancer',             'Lung Cancer',              5),
    ('22222222-2222-2222-2222-000000000012', '11111111-1111-1111-1111-000000000002', 'sleep-apnoea',            'Sleep Apnoea',             6),
    -- Endocrinology
    ('22222222-2222-2222-2222-000000000013', '11111111-1111-1111-1111-000000000003', 'type-2-diabetes',         'Type 2 Diabetes',          1),
    ('22222222-2222-2222-2222-000000000014', '11111111-1111-1111-1111-000000000003', 'thyroid-disorders',       'Thyroid Disorders',        2),
    ('22222222-2222-2222-2222-000000000015', '11111111-1111-1111-1111-000000000003', 'adrenal-disorders',       'Adrenal Disorders',        3),
    ('22222222-2222-2222-2222-000000000016', '11111111-1111-1111-1111-000000000003', 'osteoporosis',            'Osteoporosis',             4),
    ('22222222-2222-2222-2222-000000000017', '11111111-1111-1111-1111-000000000003', 'obesity',                 'Obesity',                  5),
    ('22222222-2222-2222-2222-000000000018', '11111111-1111-1111-1111-000000000003', 'pcos',                    'PCOS',                     6),
    -- Gastroenterology
    ('22222222-2222-2222-2222-000000000019', '11111111-1111-1111-1111-000000000004', 'gord',                    'GORD',                     1),
    ('22222222-2222-2222-2222-000000000020', '11111111-1111-1111-1111-000000000004', 'ibs',                     'Irritable Bowel Syndrome', 2),
    ('22222222-2222-2222-2222-000000000021', '11111111-1111-1111-1111-000000000004', 'ibd',                     'Inflammatory Bowel Disease', 3),
    ('22222222-2222-2222-2222-000000000022', '11111111-1111-1111-1111-000000000004', 'coeliac-disease',         'Coeliac Disease',          4),
    ('22222222-2222-2222-2222-000000000023', '11111111-1111-1111-1111-000000000004', 'liver-disease',           'Liver Disease',            5),
    ('22222222-2222-2222-2222-000000000024', '11111111-1111-1111-1111-000000000004', 'peptic-ulcer',            'Peptic Ulcer Disease',     6),
    -- Mental Health
    ('22222222-2222-2222-2222-000000000025', '11111111-1111-1111-1111-000000000005', 'depression',              'Depression',               1),
    ('22222222-2222-2222-2222-000000000026', '11111111-1111-1111-1111-000000000005', 'anxiety',                 'Anxiety Disorders',        2),
    ('22222222-2222-2222-2222-000000000027', '11111111-1111-1111-1111-000000000005', 'bipolar',                 'Bipolar Disorder',         3),
    ('22222222-2222-2222-2222-000000000028', '11111111-1111-1111-1111-000000000005', 'schizophrenia',           'Schizophrenia',            4),
    ('22222222-2222-2222-2222-000000000029', '11111111-1111-1111-1111-000000000005', 'substance-use',           'Substance Use Disorders',  5),
    ('22222222-2222-2222-2222-000000000030', '11111111-1111-1111-1111-000000000005', 'adhd',                    'ADHD',                     6),
    -- Paediatrics
    ('22222222-2222-2222-2222-000000000031', '11111111-1111-1111-1111-000000000006', 'immunisation',            'Immunisation',             1),
    ('22222222-2222-2222-2222-000000000032', '11111111-1111-1111-1111-000000000006', 'childhood-asthma',        'Childhood Asthma',         2),
    ('22222222-2222-2222-2222-000000000033', '11111111-1111-1111-1111-000000000006', 'otitis-media',            'Otitis Media',             3),
    ('22222222-2222-2222-2222-000000000034', '11111111-1111-1111-1111-000000000006', 'developmental-delay',     'Developmental Delay',      4),
    ('22222222-2222-2222-2222-000000000035', '11111111-1111-1111-1111-000000000006', 'fever-in-children',       'Fever in Children',        5),
    ('22222222-2222-2222-2222-000000000036', '11111111-1111-1111-1111-000000000006', 'gastroenteritis',         'Gastroenteritis',          6)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. QUESTIONS  (12 — primary subject_id + subtopic_id set)
-- ----------------------------------------------------------------------------
INSERT INTO questions (id, stem, rationale, subject_id, subtopic_id, exam_type_code, difficulty, status) VALUES
    ('33333333-3333-3333-3333-000000000001',
     'A 58-year-old man has an average clinic BP of 152/94 mmHg over three visits with no end-organ damage and a low absolute CV risk. According to current Australian guidelines, what is the most appropriate first-line management?',
     'For grade 1 hypertension with low absolute CV risk, lifestyle modification for 3-6 months is recommended before considering pharmacotherapy.',
     '11111111-1111-1111-1111-000000000001', '22222222-2222-2222-2222-000000000001', 'AKT', 'medium', 'published'),

    ('33333333-3333-3333-3333-000000000002',
     'A 72-year-old woman with HFrEF (LVEF 30%) remains symptomatic (NYHA II) on maximal ramipril and bisoprolol. Which medication provides the greatest additional mortality benefit?',
     'A mineralocorticoid receptor antagonist (e.g. spironolactone) reduces mortality in HFrEF patients who remain symptomatic on an ACE inhibitor and beta-blocker.',
     '11111111-1111-1111-1111-000000000001', '22222222-2222-2222-2222-000000000002', 'AKT', 'hard', 'published'),

    ('33333333-3333-3333-3333-000000000003',
     'A 24-year-old with asthma uses her salbutamol inhaler 4-5 times per week and wakes once a week with symptoms. She is on no preventer. What is the most appropriate next step?',
     'Symptoms more than twice a week indicate the need for a regular inhaled corticosteroid preventer rather than reliever-only therapy.',
     '11111111-1111-1111-1111-000000000002', '22222222-2222-2222-2222-000000000007', 'AKT', 'easy', 'published'),

    ('33333333-3333-3333-3333-000000000004',
     'A 66-year-old smoker with COPD has had two exacerbations in the past year despite a LAMA. Which add-on therapy is most appropriate to reduce future exacerbations?',
     'Adding a LABA (dual bronchodilation LAMA/LABA) is the recommended next step to reduce exacerbations before considering inhaled corticosteroids.',
     '11111111-1111-1111-1111-000000000002', '22222222-2222-2222-2222-000000000008', 'AKT', 'medium', 'published'),

    ('33333333-3333-3333-3333-000000000005',
     'A 54-year-old with newly diagnosed type 2 diabetes (HbA1c 7.8%) and established cardiovascular disease. After metformin, which agent is preferred for its cardiovascular benefit?',
     'An SGLT2 inhibitor (or GLP-1 receptor agonist) is preferred as add-on therapy in type 2 diabetes with established cardiovascular disease due to proven CV outcome benefits.',
     '11111111-1111-1111-1111-000000000003', '22222222-2222-2222-2222-000000000013', 'AKT', 'hard', 'published'),

    ('33333333-3333-3333-3333-000000000006',
     'A 39-year-old woman is tired and gaining weight. TSH is 8.5 mIU/L (raised) and free T4 is normal. What does this pattern indicate?',
     'A raised TSH with a normal free T4 is consistent with subclinical hypothyroidism.',
     '11111111-1111-1111-1111-000000000003', '22222222-2222-2222-2222-000000000014', 'AKT', 'easy', 'published'),

    ('33333333-3333-3333-3333-000000000007',
     'A 45-year-old man has typical reflux symptoms 3 times a week with no alarm features. What is the most appropriate initial management?',
     'For typical GORD without alarm features, an 4-8 week trial of a proton pump inhibitor with lifestyle advice is first-line; endoscopy is reserved for alarm features.',
     '11111111-1111-1111-1111-000000000004', '22222222-2222-2222-2222-000000000019', 'AKT', 'easy', 'published'),

    ('33333333-3333-3333-3333-000000000008',
     'A 30-year-old woman has chronic diarrhoea, bloating and iron-deficiency anaemia. Which is the most appropriate first investigation for coeliac disease?',
     'Anti-tissue transglutaminase (anti-tTG) IgG/IgA serology is the recommended first-line test, performed while the patient is still on a gluten-containing diet.',
     '11111111-1111-1111-1111-000000000004', '22222222-2222-2222-2222-000000000022', 'KFP', 'medium', 'published'),

    ('33333333-3333-3333-3333-000000000009',
     'A 28-year-old presents with low mood, anhedonia and poor sleep for 6 weeks. He has mild-to-moderate major depression and prefers a non-drug option. What is the most appropriate first-line treatment?',
     'For mild-to-moderate depression, structured psychological therapy (e.g. CBT) is recommended first-line, particularly when the patient prefers a non-pharmacological approach.',
     '11111111-1111-1111-1111-000000000005', '22222222-2222-2222-2222-000000000025', 'AKT', 'medium', 'published'),

    ('33333333-3333-3333-3333-000000000010',
     'A 35-year-old woman with generalised anxiety disorder has not responded to psychological therapy. Which medication is the most appropriate first-line pharmacotherapy?',
     'An SSRI is first-line pharmacotherapy for generalised anxiety disorder; benzodiazepines are avoided for ongoing management due to dependence risk.',
     '11111111-1111-1111-1111-000000000005', '22222222-2222-2222-2222-000000000026', 'AKT', 'medium', 'published'),

    ('33333333-3333-3333-3333-000000000011',
     'According to the Australian National Immunisation Program, at what age is the first dose of the MMR vaccine routinely scheduled?',
     'The first MMR-containing dose (as MMR) is scheduled at 12 months of age under the NIP.',
     '11111111-1111-1111-1111-000000000006', '22222222-2222-2222-2222-000000000031', 'AKT', 'easy', 'published'),

    ('33333333-3333-3333-3333-000000000012',
     'A healthy 3-year-old has acute otitis media with mild symptoms and no perforation. He is otherwise well. What is the most appropriate initial management?',
     'For a well child over 2 years with mild acute otitis media, analgesia and watchful waiting for 48-72 hours is appropriate before considering antibiotics.',
     '11111111-1111-1111-1111-000000000006', '22222222-2222-2222-2222-000000000033', 'AKT', 'medium', 'published')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. QUESTION OPTIONS  (4 per question, exactly one is_correct = true)
-- ----------------------------------------------------------------------------
INSERT INTO question_options (question_id, label, position, is_correct) VALUES
    -- Q1 Hypertension
    ('33333333-3333-3333-3333-000000000001', 'Lifestyle modification with review in 3-6 months', 0, true),
    ('33333333-3333-3333-3333-000000000001', 'Start an ACE inhibitor immediately',              1, false),
    ('33333333-3333-3333-3333-000000000001', 'Start a thiazide diuretic immediately',           2, false),
    ('33333333-3333-3333-3333-000000000001', 'Refer urgently to a cardiologist',                3, false),
    -- Q2 Heart Failure
    ('33333333-3333-3333-3333-000000000002', 'Add spironolactone',                              0, true),
    ('33333333-3333-3333-3333-000000000002', 'Add amlodipine',                                  1, false),
    ('33333333-3333-3333-3333-000000000002', 'Add digoxin',                                     2, false),
    ('33333333-3333-3333-3333-000000000002', 'Increase the bisoprolol dose only',               3, false),
    -- Q3 Asthma
    ('33333333-3333-3333-3333-000000000003', 'Start a regular low-dose inhaled corticosteroid', 0, true),
    ('33333333-3333-3333-3333-000000000003', 'Continue salbutamol as needed only',              1, false),
    ('33333333-3333-3333-3333-000000000003', 'Start oral prednisolone',                         2, false),
    ('33333333-3333-3333-3333-000000000003', 'Start a long-acting beta-agonist alone',          3, false),
    -- Q4 COPD
    ('33333333-3333-3333-3333-000000000004', 'Add a long-acting beta-agonist (LABA)',           0, true),
    ('33333333-3333-3333-3333-000000000004', 'Add oral theophylline',                           1, false),
    ('33333333-3333-3333-3333-000000000004', 'Add maintenance oral corticosteroids',            2, false),
    ('33333333-3333-3333-3333-000000000004', 'Add a leukotriene receptor antagonist',           3, false),
    -- Q5 Type 2 Diabetes
    ('33333333-3333-3333-3333-000000000005', 'An SGLT2 inhibitor',                              0, true),
    ('33333333-3333-3333-3333-000000000005', 'A sulfonylurea',                                  1, false),
    ('33333333-3333-3333-3333-000000000005', 'A DPP-4 inhibitor',                               2, false),
    ('33333333-3333-3333-3333-000000000005', 'Basal insulin',                                   3, false),
    -- Q6 Thyroid
    ('33333333-3333-3333-3333-000000000006', 'Subclinical hypothyroidism',                      0, true),
    ('33333333-3333-3333-3333-000000000006', 'Overt hypothyroidism',                            1, false),
    ('33333333-3333-3333-3333-000000000006', 'Subclinical hyperthyroidism',                     2, false),
    ('33333333-3333-3333-3333-000000000006', 'Sick euthyroid syndrome',                         3, false),
    -- Q7 GORD
    ('33333333-3333-3333-3333-000000000007', 'Trial of a proton pump inhibitor with lifestyle advice', 0, true),
    ('33333333-3333-3333-3333-000000000007', 'Urgent gastroscopy',                              1, false),
    ('33333333-3333-3333-3333-000000000007', 'Helicobacter pylori eradication therapy',         2, false),
    ('33333333-3333-3333-3333-000000000007', 'CT abdomen',                                      3, false),
    -- Q8 Coeliac
    ('33333333-3333-3333-3333-000000000008', 'Anti-tissue transglutaminase (anti-tTG) serology', 0, true),
    ('33333333-3333-3333-3333-000000000008', 'Small bowel biopsy after starting a gluten-free diet', 1, false),
    ('33333333-3333-3333-3333-000000000008', 'Faecal calprotectin',                             2, false),
    ('33333333-3333-3333-3333-000000000008', 'HLA-DQ2/DQ8 genotyping as the sole test',         3, false),
    -- Q9 Depression
    ('33333333-3333-3333-3333-000000000009', 'Structured psychological therapy (CBT)',          0, true),
    ('33333333-3333-3333-3333-000000000009', 'Start an SSRI immediately',                       1, false),
    ('33333333-3333-3333-3333-000000000009', 'Start a benzodiazepine',                          2, false),
    ('33333333-3333-3333-3333-000000000009', 'Reassure and review in 6 months',                 3, false),
    -- Q10 Anxiety
    ('33333333-3333-3333-3333-000000000010', 'An SSRI',                                         0, true),
    ('33333333-3333-3333-3333-000000000010', 'A benzodiazepine for ongoing use',                1, false),
    ('33333333-3333-3333-3333-000000000010', 'A beta-blocker',                                  2, false),
    ('33333333-3333-3333-3333-000000000010', 'An antipsychotic',                                3, false),
    -- Q11 Immunisation
    ('33333333-3333-3333-3333-000000000011', '12 months',                                       0, true),
    ('33333333-3333-3333-3333-000000000011', '6 months',                                        1, false),
    ('33333333-3333-3333-3333-000000000011', '4 months',                                        2, false),
    ('33333333-3333-3333-3333-000000000011', '18 months',                                       3, false),
    -- Q12 Otitis Media
    ('33333333-3333-3333-3333-000000000012', 'Analgesia and watchful waiting for 48-72 hours',  0, true),
    ('33333333-3333-3333-3333-000000000012', 'Immediate oral amoxicillin',                      1, false),
    ('33333333-3333-3333-3333-000000000012', 'Immediate referral to ENT',                       2, false),
    ('33333333-3333-3333-3333-000000000012', 'Topical antibiotic ear drops',                    3, false)
ON CONFLICT (question_id, position) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. MANY-TO-MANY JUNCTIONS  (mirror each question's primary subject/subtopic)
-- ----------------------------------------------------------------------------
INSERT INTO question_subjects (question_id, subject_id)
SELECT id, subject_id FROM questions
WHERE id::text LIKE '33333333-%' AND subject_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO question_subtopics (question_id, subtopic_id)
SELECT id, subtopic_id FROM questions
WHERE id::text LIKE '33333333-%' AND subtopic_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;

-- ----------------------------------------------------------------------------
-- Quick verification (optional):
--   SELECT s.name AS subject, st.name AS subtopic, q.stem
--   FROM questions q
--   JOIN subjects  s  ON s.id  = q.subject_id
--   JOIN subtopics st ON st.id = q.subtopic_id
--   ORDER BY s.sort_order, st.sort_order;
-- ----------------------------------------------------------------------------
