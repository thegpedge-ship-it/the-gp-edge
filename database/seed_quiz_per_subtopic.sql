-- ============================================================================
--  GP EDGE — 5 EASY questions per subtopic, one quiz per subtopic
--  Run AFTER schema.sql AND seed_dummy_questions.sql (needs the 36 subtopics).
--
--  For EACH subtopic this produces:
--    * 1 quiz  (status 'active', name "<Subject> — <Subtopic> (Easy)")
--    * 5 questions  (difficulty 'easy', status 'published')
--    * 4 options per question  (position 0 = correct, respects one-correct index)
--    * quiz_questions rows so those 5 questions belong to that ONE quiz only
--    * question_subjects / question_subtopics junction rows
--
--  Totals (with the 36 seeded subtopics): 36 quizzes, 180 questions, 720 options.
--  Re-runnable: skips any subtopic whose quiz already exists (guarded by name).
--  created_by left NULL (no admin_user required).
-- ============================================================================

DO $$
DECLARE
    st        RECORD;
    v_quiz_id UUID;
    v_q_id    UUID;
    i         INT;
    v_name    TEXT;
BEGIN
    FOR st IN
        SELECT t.id          AS subtopic_id,
               t.name        AS subtopic_name,
               t.subject_id  AS subject_id,
               s.name        AS subject_name
        FROM   subtopics t
        JOIN   subjects  s ON s.id = t.subject_id
        WHERE  t.deleted_at IS NULL
        ORDER  BY s.sort_order, t.sort_order
    LOOP
        v_name := st.subject_name || ' — ' || st.subtopic_name || ' (Easy)';

        -- one quiz per subtopic; skip if it already exists (idempotent)
        IF EXISTS (SELECT 1 FROM quizzes WHERE name = v_name) THEN
            CONTINUE;
        END IF;

        INSERT INTO quizzes (name, description, exam_type_code,
                             time_limit_min, passing_score, randomize, status)
        VALUES (v_name,
                'Easy practice quiz — 5 questions on ' || st.subtopic_name || '.',
                'AKT', 10, 60, true, 'active')
        RETURNING id INTO v_quiz_id;

        FOR i IN 1..5 LOOP
            INSERT INTO questions (stem, rationale, subject_id, subtopic_id,
                                   exam_type_code, difficulty, status)
            VALUES (
                '[' || st.subtopic_name || '] Easy practice question ' || i
                    || ': which of the following statements is most correct?',
                'Option A is the correct answer for easy practice question '
                    || i || ' on ' || st.subtopic_name || '.',
                st.subject_id, st.subtopic_id, 'AKT', 'easy', 'published')
            RETURNING id INTO v_q_id;

            -- 4 options, position 0 (Option A) is the single correct one
            INSERT INTO question_options (question_id, label, position, is_correct) VALUES
                (v_q_id, 'Option A — correct answer', 0, true),
                (v_q_id, 'Option B — distractor',     1, false),
                (v_q_id, 'Option C — distractor',     2, false),
                (v_q_id, 'Option D — distractor',     3, false);

            -- many-to-many junctions (mirror the primary subject/subtopic)
            INSERT INTO question_subjects  (question_id, subject_id)
                VALUES (v_q_id, st.subject_id)  ON CONFLICT DO NOTHING;
            INSERT INTO question_subtopics (question_id, subtopic_id)
                VALUES (v_q_id, st.subtopic_id) ON CONFLICT DO NOTHING;

            -- this question belongs to exactly ONE quiz (positions 0..4)
            INSERT INTO quiz_questions (quiz_id, question_id, position)
                VALUES (v_quiz_id, v_q_id, i - 1);
        END LOOP;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Quick verification (optional):
--   SELECT q.name AS quiz, count(*) AS questions
--   FROM quizzes q
--   JOIN quiz_questions qq ON qq.quiz_id = q.id
--   WHERE q.name LIKE '%(Easy)'
--   GROUP BY q.name
--   ORDER BY q.name;          -- expect 36 rows, each with 5
-- ----------------------------------------------------------------------------
