require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SEQUENCE IF NOT EXISTS kfp_seq START 1');
    await client.query(`
      INSERT INTO exam_types (code, name) 
      VALUES ('KFP', 'Key Feature Problem') 
      ON CONFLICT (code) DO NOTHING
    `);
    const res = await client.query(`
      UPDATE questions 
      SET uqid = REPLACE(uqid, 'KFT-', 'KFP-'),
          exam_type_code = 'KFP'
      WHERE exam_type_code = 'KFT' OR uqid LIKE 'KFT-%'
    `);
    await client.query(`DELETE FROM exam_types WHERE code = 'KFT'`);
    await client.query('COMMIT');
    console.log(`✅ KFP sequence verified and ${res.rowCount} rows updated from KFT to KFP.`);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}
run();
