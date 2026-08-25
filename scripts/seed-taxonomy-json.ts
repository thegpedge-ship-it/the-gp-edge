import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function seedTaxonomyJson() {
  console.log("--- SEEDING MASTER TAXONOMY JSON TO APP_SETTINGS ---");
  const { execute } = await import("../lib/db");

  const taxonomyPath = path.join(process.cwd(), "GP-Edge-Master-Taxonomy-v1.1.json");
  if (!fs.existsSync(taxonomyPath)) {
    console.error("Error: GP-Edge-Master-Taxonomy-v1.1.json not found!");
    process.exit(1);
  }

  const raw = fs.readFileSync(taxonomyPath, "utf-8");
  const taxonomy = JSON.parse(raw);

  // Sync to app_settings
  await execute(
    "INSERT INTO app_settings (key, value, updated_at) VALUES ('master_taxonomy', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
    [JSON.stringify(taxonomy)]
  );

  console.log("Successfully seeded master taxonomy JSON to app_settings table.");
  process.exit(0);
}

seedTaxonomyJson().catch(console.error);
