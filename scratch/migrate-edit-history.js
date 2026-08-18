require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const statements = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_change_type') THEN
       CREATE TYPE edit_change_type AS ENUM ('added','deleted','modified','status_change','meta_change','restored');
     END IF;
   END $$`,

  `CREATE TABLE IF NOT EXISTS content_edit_history (
     id              BIGSERIAL PRIMARY KEY,
     entity_id       UUID NOT NULL,
     entity_type     TEXT NOT NULL,
     field_name      TEXT NOT NULL,
     change_type     edit_change_type NOT NULL,
     old_content     TEXT,
     new_content     TEXT,
     admin_user_id   UUID REFERENCES admin_users(id) ON UPDATE NO ACTION,
     admin_user_name TEXT,
     session_id      TEXT,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE INDEX IF NOT EXISTS idx_edit_history_entity
     ON content_edit_history (entity_id, created_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_edit_history_admin
     ON content_edit_history (admin_user_id)`,

  `CREATE TABLE IF NOT EXISTS content_versions (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     entity_id       UUID NOT NULL,
     entity_type     TEXT NOT NULL,
     version_number  INT NOT NULL,
     label           TEXT,
     full_html       TEXT,
     metadata        JSONB,
     created_by      UUID REFERENCES admin_users(id) ON UPDATE NO ACTION,
     created_by_name TEXT,
     restored_from   UUID,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (entity_id, version_number)
   )`,

  `CREATE INDEX IF NOT EXISTS idx_versions_entity
     ON content_versions (entity_id, created_at DESC)`,
];

(async () => {
  const client = await pool.connect();
  try {
    for (const stmt of statements) {
      await client.query(stmt);
      console.log('OK:', stmt.trim().substring(0, 60).replace(/\n/g, ' ') + '...');
    }
    console.log('\nMigration complete!');
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();
