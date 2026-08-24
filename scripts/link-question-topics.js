const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("--- Linking & Storing Question & Content Topics in Database ---");

  // 1. Get all subjects
  const subjectsRes = await pool.query(`SELECT id, slug, name FROM subjects WHERE deleted_at IS NULL`);
  const subjectMap = new Map(); // id -> subject, slug -> id, name.toLowerCase() -> id
  subjectsRes.rows.forEach(s => {
    subjectMap.set(s.id, s);
    subjectMap.set(s.slug.toLowerCase(), s.id);
    subjectMap.set(s.name.toLowerCase(), s.id);
  });

  // 2. Get existing subtopics and highest T-code
  const subtopicsRes = await pool.query(`SELECT id, subject_id, slug, name FROM subtopics WHERE deleted_at IS NULL`);
  const subtopicMap = new Map(); // name.toLowerCase() -> subtopic
  const usedCodes = new Set();
  let maxCode = 0;

  subtopicsRes.rows.forEach(st => {
    if (st.name) subtopicMap.set(st.name.trim().toLowerCase(), st);
    if (st.slug) {
      const match = st.slug.trim().match(/^t(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        maxCode = Math.max(maxCode, num);
        usedCodes.add(`T${String(num).padStart(4, "0")}`);
      }
    }
  });

  console.log(`Found ${subtopicsRes.rows.length} existing subtopics. Max T-code: T${String(maxCode).padStart(4, "0")}`);

  let nextCodeNum = maxCode + 1;
  function getNextTopicCode() {
    while (usedCodes.has(`T${String(nextCodeNum).padStart(4, "0")}`)) {
      nextCodeNum++;
    }
    const code = `T${String(nextCodeNum).padStart(4, "0")}`;
    usedCodes.add(code);
    nextCodeNum++;
    return code;
  }

  // 3. For each question without subtopic_id, resolve from question_tags or stem/topic
  const questionsRes = await pool.query(`
    SELECT q.id, q.subject_id, q.stem,
           COALESCE(
             (SELECT t.label FROM question_tags qt JOIN tags t ON t.id = qt.tag_id WHERE qt.question_id = q.id AND t.label NOT IN ('General', 'AKT', 'KFP') ORDER BY length(t.label) DESC LIMIT 1),
             (SELECT t.label FROM question_tags qt JOIN tags t ON t.id = qt.tag_id WHERE qt.question_id = q.id LIMIT 1)
           ) as tag_label
    FROM questions q
    WHERE q.deleted_at IS NULL AND q.subtopic_id IS NULL
  `);

  console.log(`Found ${questionsRes.rows.length} questions without subtopic_id`);
  let linkedQuestions = 0;

  for (const q of questionsRes.rows) {
    const topicName = q.tag_label || "General Clinical Practice";
    const key = topicName.trim().toLowerCase();
    let subtopic = subtopicMap.get(key);

    if (!subtopic) {
      const topicCode = getNextTopicCode();
      const subjectId = q.subject_id || subjectMap.get("general") || subjectsRes.rows[0]?.id;
      
      const insertRes = await pool.query(`
        INSERT INTO subtopics (subject_id, slug, name)
        VALUES ($1, $2, $3)
        RETURNING id, subject_id, slug, name
      `, [subjectId, topicCode, topicName.trim()]);

      subtopic = insertRes.rows[0];
      subtopicMap.set(key, subtopic);
    }

    if (subtopic) {
      await pool.query(`UPDATE questions SET subtopic_id = $1 WHERE id = $2`, [subtopic.id, q.id]);
      linkedQuestions++;
    }
  }

  console.log(`Successfully linked ${linkedQuestions} questions to subtopics with T-codes!`);

  // 4. Ensure all medical_conditions (Approaches and Conditions) have corresponding subtopics with T-codes
  const mcRes = await pool.query(`
    SELECT id, name, kind, category, subject_id, slug
    FROM medical_conditions
    WHERE deleted_at IS NULL
  `);

  let mcLinked = 0;
  for (const mc of mcRes.rows) {
    if (!mc.name || mc.name.includes("[Enter")) continue;
    const key = mc.name.trim().toLowerCase();
    let subtopic = subtopicMap.get(key);

    if (!subtopic) {
      const topicCode = getNextTopicCode();
      const subjectId = mc.subject_id || subjectsRes.rows[0]?.id;

      const insertRes = await pool.query(`
        INSERT INTO subtopics (subject_id, slug, name)
        VALUES ($1, $2, $3)
        RETURNING id, subject_id, slug, name
      `, [subjectId, topicCode, mc.name.trim()]);

      subtopic = insertRes.rows[0];
      subtopicMap.set(key, subtopic);
      mcLinked++;
    }
  }

  console.log(`Created/linked ${mcLinked} new subtopics for medical content & approaches.`);

  // 5. Total counts verification
  const totalSubtopics = await pool.query(`SELECT count(*) FROM subtopics WHERE deleted_at IS NULL`);
  const totalQWithSubtopics = await pool.query(`SELECT count(*) FROM questions WHERE deleted_at IS NULL AND subtopic_id IS NOT NULL`);
  console.log(`Database Subtopics count: ${totalSubtopics.rows[0].count}`);
  console.log(`Questions with Subtopics: ${totalQWithSubtopics.rows[0].count} / 341`);

  await pool.end();
}

run().catch(console.error);
