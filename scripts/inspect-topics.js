const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("--- Inspecting Database Topics & Questions ---");
  
  // 1. Check questions table columns
  const qCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'");
  console.log("Questions columns:", qCols.rows.map(r => r.column_name));

  // 2. Check medical_conditions table columns
  const mcCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'medical_conditions'");
  console.log("Medical conditions columns:", mcCols.rows.map(r => r.column_name));

  // 3. Check subtopics table columns
  const stCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'subtopics'");
  console.log("Subtopics columns:", stCols.rows.map(r => r.column_name));

  // 4. Sample questions with subtopics and subjects
  const sampleQ = await pool.query(`
    SELECT q.id, q.stem, q.subtopic_id, st.name as subtopic_name, st.slug as subtopic_slug, s.name as subject_name
    FROM questions q
    LEFT JOIN subtopics st ON st.id = q.subtopic_id
    LEFT JOIN subjects s ON s.id = q.subject_id
    LIMIT 10
  `);
  console.log("Sample Questions joined with subtopics:", sampleQ.rows);

  // 5. Total count of questions with/without subtopics
  const qCounts = await pool.query(`
    SELECT 
      COUNT(*) as total_questions,
      COUNT(subtopic_id) as with_subtopic_id,
      COUNT(subject_id) as with_subject_id
    FROM questions
    WHERE deleted_at IS NULL
  `);
  console.log("Question counts:", qCounts.rows[0]);

  // 6. Medical conditions counts by kind
  const mcCounts = await pool.query(`
    SELECT kind, category, COUNT(*) as count
    FROM medical_conditions
    WHERE deleted_at IS NULL
    GROUP BY kind, category
  `);
  console.log("Medical conditions by kind/category:", mcCounts.rows);

  // 7. Check question_tags
  const qtCounts = await pool.query(`
    SELECT t.label, COUNT(qt.question_id) as q_count
    FROM tags t
    JOIN question_tags qt ON qt.tag_id = t.id
    GROUP BY t.label
    ORDER BY q_count DESC
    LIMIT 15
  `);
  console.log("Top question tags in database:", qtCounts.rows);

  await pool.end();
}

run().catch(console.error);
