const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateKftToKfp() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Starting migration from KFT to KFP...');

    // 1. Ensure KFP exists in exam_types
    await client.query(`
      INSERT INTO exam_types (code, name)
      VALUES ('KFP', 'Key Feature Problem')
      ON CONFLICT (code) DO UPDATE SET name = 'Key Feature Problem'
    `);
    console.log('✅ exam_types has KFP');

    // 2. Update questions exam_type_code and uqid
    const qRes = await client.query(`
      UPDATE questions
      SET uqid = REPLACE(uqid, 'KFT-', 'KFP-'),
          exam_type_code = 'KFP'
      WHERE exam_type_code = 'KFT' OR uqid LIKE 'KFT-%'
    `);
    console.log(`✅ Updated ${qRes.rowCount} questions`);

    // 3. Update quizzes
    const quizRes = await client.query(`
      UPDATE quizzes
      SET exam_type_code = 'KFP'
      WHERE exam_type_code = 'KFT'
    `);
    console.log(`✅ Updated ${quizRes.rowCount} quizzes`);

    // 4. Update mock_tests
    const mockRes = await client.query(`
      UPDATE mock_tests
      SET exam_type_code = 'KFP'
      WHERE exam_type_code = 'KFT'
    `);
    console.log(`✅ Updated ${mockRes.rowCount} mock tests`);

    // 5. Update user_preferences
    const prefRes = await client.query(`
      UPDATE user_preferences
      SET default_exam_type_code = 'KFP'
      WHERE default_exam_type_code = 'KFT'
    `);
    console.log(`✅ Updated ${prefRes.rowCount} user preferences`);

    // 6. Update quiz_configs
    const cfgRes = await client.query(`
      UPDATE quiz_configs
      SET exam_type_code = 'KFP'
      WHERE exam_type_code = 'KFT'
    `);
    console.log(`✅ Updated ${cfgRes.rowCount} quiz configs`);

    // 7. Update user_subject_mastery (handle upsert/merge if KFP row already exists)
    const masteryKft = await client.query(`SELECT * FROM user_subject_mastery WHERE exam_type_code = 'KFT'`);
    for (const row of masteryKft.rows) {
      const existingKfp = await client.query(
        `SELECT * FROM user_subject_mastery WHERE user_id = $1 AND subject_id = $2 AND exam_type_code = 'KFP'`,
        [row.user_id, row.subject_id]
      );
      if (existingKfp.rows.length > 0) {
        // Merge into existing KFP row
        const kfpRow = existingKfp.rows[0];
        const totalAnswered = kfpRow.total_answered + row.total_answered;
        const correctCount = kfpRow.correct_count + row.correct_count;
        const incorrectCount = kfpRow.incorrect_count + row.incorrect_count;
        const pct = totalAnswered > 0 ? ((correctCount / totalAnswered) * 100).toFixed(2) : 0;
        const strength = pct >= 80 ? 'strong' : pct >= 60 ? 'moderate' : 'weak';
        await client.query(
          `UPDATE user_subject_mastery
           SET total_answered = $1, correct_count = $2, incorrect_count = $3,
               mastery_percent = $4, strength = $5, updated_at = NOW()
           WHERE user_id = $6 AND subject_id = $7 AND exam_type_code = 'KFP'`,
          [totalAnswered, correctCount, incorrectCount, pct, strength, row.user_id, row.subject_id]
        );
        await client.query(
          `DELETE FROM user_subject_mastery WHERE user_id = $1 AND subject_id = $2 AND exam_type_code = 'KFT'`,
          [row.user_id, row.subject_id]
        );
      } else {
        await client.query(
          `UPDATE user_subject_mastery
           SET exam_type_code = 'KFP'
           WHERE user_id = $1 AND subject_id = $2 AND exam_type_code = 'KFT'`,
          [row.user_id, row.subject_id]
        );
      }
    }
    console.log(`✅ Processed ${masteryKft.rowCount} user_subject_mastery rows`);

    // 8. Sync kfp_seq sequence
    await client.query(`CREATE SEQUENCE IF NOT EXISTS kfp_seq START 1`);
    
    // Find max sequence number used across all KFP questions
    const maxSeqRes = await client.query(`
      SELECT COALESCE(MAX(SUBSTRING(uqid FROM '[0-9]+')::integer), 0) AS max_seq
      FROM questions
      WHERE uqid LIKE 'KFP-%'
    `);
    const maxKfpSeq = maxSeqRes.rows[0]?.max_seq || 0;

    // Check kft_seq last_value if exists
    let kftSeqVal = 0;
    try {
      const seqCheck = await client.query(`SELECT last_value FROM kft_seq`);
      if (seqCheck.rows.length > 0) {
        kftSeqVal = parseInt(seqCheck.rows[0].last_value, 10);
      }
    } catch {}

    const targetSeqVal = Math.max(maxKfpSeq, kftSeqVal, 1);
    await client.query(`SELECT setval('kfp_seq', $1, true)`, [targetSeqVal]);
    console.log(`✅ Set kfp_seq to ${targetSeqVal}`);

    // Drop kft_seq or keep it aligned
    try {
      await client.query(`DROP SEQUENCE IF EXISTS kft_seq`);
      console.log('✅ Dropped kft_seq sequence');
    } catch (e) {
      console.log('Note on dropping kft_seq:', e.message);
    }

    // 9. Delete KFT from exam_types
    const delRes = await client.query(`DELETE FROM exam_types WHERE code = 'KFT'`);
    console.log(`✅ Deleted 'KFT' row from exam_types: ${delRes.rowCount} rows`);

    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateKftToKfp().catch(console.error);
