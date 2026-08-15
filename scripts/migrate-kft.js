require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SEQUENCE IF NOT EXISTS kft_seq START 1');
    await client.query(`
      INSERT INTO exam_types (code, name) 
      VALUES ('KFT', 'Key Feature Test') 
      ON CONFLICT (code) DO NOTHING
    `);
    // Update any questions with KFP prefix or exam_type_code to KFT
    const res = await client.query(`
      UPDATE questions 
      SET uqid = REPLACE(uqid, 'KFP-', 'KFT-'),
          exam_type_code = 'KFT'
      WHERE exam_type_code = 'KFP' OR uqid LIKE 'KFP-%'
    `);
    await client.query('COMMIT');
    console.log(`✅ KFT sequence created and ${res.rowCount} rows updated from KFP to KFT.`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}
run();
