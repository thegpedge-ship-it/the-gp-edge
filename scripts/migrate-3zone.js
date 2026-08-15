require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add columns to questions
    await client.query(`
      ALTER TABLE questions
        ADD COLUMN IF NOT EXISTS uqid           TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS lead_in        TEXT,
        ADD COLUMN IF NOT EXISTS why_correct    TEXT,
        ADD COLUMN IF NOT EXISTS knowledge_bank TEXT,
        ADD COLUMN IF NOT EXISTS pearl          TEXT,
        ADD COLUMN IF NOT EXISTS version        INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS parent_id      UUID REFERENCES questions(id),
        ADD COLUMN IF NOT EXISTS batch_id       TEXT
    `);
    console.log('✓ questions columns added');

    // 2. Add distractor_rationale to question_options
    await client.query(`
      ALTER TABLE question_options
        ADD COLUMN IF NOT EXISTS distractor_rationale TEXT
    `);
    console.log('✓ question_options column added');

    // 3. Create question_versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_versions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id    UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        uqid           TEXT NOT NULL,
        version        INTEGER NOT NULL,
        stem           TEXT,
        lead_in        TEXT,
        why_correct    TEXT,
        knowledge_bank TEXT,
        pearl          TEXT,
        options_json   JSONB,
        changed_by     TEXT,
        change_note    TEXT,
        changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_qv_question ON question_versions(question_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_qv_uqid ON question_versions(uqid)`);
    console.log('✓ question_versions table created');

    // 4. Create AKT and KFP sequences
    await client.query(`CREATE SEQUENCE IF NOT EXISTS akt_seq START 1`);
    await client.query(`CREATE SEQUENCE IF NOT EXISTS kfp_seq START 1`);
    console.log('✓ sequences created');

    // 5. Back-fill UQIDs for existing questions
    const existing = await client.query(`SELECT id, exam_type_code FROM questions WHERE uqid IS NULL ORDER BY created_at ASC`);
    console.log('Back-filling', existing.rows.length, 'existing questions...');
    for (const row of existing.rows) {
      const isKfp = (row.exam_type_code || 'AKT').toUpperCase() === 'KFP';
      const seqName = isKfp ? 'kfp_seq' : 'akt_seq';
      const prefix = isKfp ? 'KFP' : 'AKT';
      const seqVal = await client.query(`SELECT nextval('${seqName}') AS n`);
      const num = String(seqVal.rows[0].n).padStart(6, '0');
      const uqid = `${prefix}-${num}`;
      await client.query(`UPDATE questions SET uqid = $1 WHERE id = $2`, [uqid, row.id]);
    }
    console.log('✓ Back-fill complete');

    await client.query('COMMIT');
    console.log('\n✅ Migration complete!');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}
migrate();
