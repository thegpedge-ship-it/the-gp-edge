const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Parse .env manually to extract DATABASE_URL
const envPath = path.join(__dirname, '../.env');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match) {
    databaseUrl = match[1];
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Running direct migrations on database...");
  
  await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_name text;");
  console.log("- Added plan_name to subscriptions (if not exists)");
  
  await pool.query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS purchased_package_type text;");
  console.log("- Added purchased_package_type to subscriptions (if not exists)");
  
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_package_type text;");
  console.log("- Added purchased_package_type to users (if not exists)");
  
  await pool.query("CREATE INDEX IF NOT EXISTS subscriptions_stripe_price_id_idx ON subscriptions (stripe_price_id);");
  console.log("- Created index on subscriptions.stripe_price_id");
  
  await pool.query("CREATE INDEX IF NOT EXISTS subscriptions_plan_name_idx ON subscriptions (plan_name);");
  console.log("- Created index on subscriptions.plan_name");
  
  console.log("Direct migrations completed successfully!");
  await pool.end();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
