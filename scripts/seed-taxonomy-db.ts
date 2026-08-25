import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function run() {
  console.log("--- SEEDING MASTER TAXONOMY TO NEON DB ---");

  const { query, queryOne, execute } = await import("../lib/db");

  const taxonomyPath = path.join(process.cwd(), "GP-Edge-Master-Taxonomy-v1.1.json");
  if (!fs.existsSync(taxonomyPath)) {
    console.error("Error: GP-Edge-Master-Taxonomy-v1.1.json not found!");
    process.exit(1);
  }

  const raw = fs.readFileSync(taxonomyPath, "utf-8");
  const taxonomy = JSON.parse(raw);

  // 1. Sync Units to "subjects"
  const unitToSubjectIdMap = new Map<string, string>();

  for (const unit of taxonomy.units) {
    const slug = unit.code.toLowerCase();
    const name = unit.name;
    const sortOrder = unit.displayOrder || 0;

    try {
      let subject = await queryOne("SELECT id FROM subjects WHERE slug = $1", [slug]);
      if (subject) {
        await execute(
          "UPDATE subjects SET name = $1, sort_order = $2, updated_at = NOW() WHERE id = $3",
          [name, sortOrder, subject.id]
        );
        unitToSubjectIdMap.set(unit.code, subject.id);
      } else {
        const insertRes = await queryOne(
          "INSERT INTO subjects (slug, name, sort_order, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id",
          [slug, name, sortOrder]
        );
        if (insertRes) {
          unitToSubjectIdMap.set(unit.code, insertRes.id);
        }
      }
    } catch (err: any) {
      console.error(`Error syncing Unit ${unit.code}:`, err.message);
      throw err;
    }
  }

  console.log(`Synced ${unitToSubjectIdMap.size} units to subjects table.`);

  // 2. Sync Topics
  let count = 0;
  let successCount = 0;
  let failCount = 0;

  for (const topic of taxonomy.topics) {
    const subjectId = unitToSubjectIdMap.get(topic.homeUnit);
    if (!subjectId) {
      continue;
    }

    const topicSlug = topic.code.toLowerCase();
    const topicLabel = topic.label.slice(0, 255);

    count++;

    // A. Sync to subtopics table
    try {
      let subtopic = await queryOne("SELECT id FROM subtopics WHERE slug = $1", [topicSlug]);
      if (subtopic) {
        await execute(
          "UPDATE subtopics SET name = $1, subject_id = $2, updated_at = NOW() WHERE id = $3",
          [topicLabel, subjectId, subtopic.id]
        );
      } else {
        await execute(
          "INSERT INTO subtopics (subject_id, slug, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
          [subjectId, topicSlug, topicLabel]
        );
      }
    } catch (err: any) {
      console.error(`FAIL at subtopics table for ${topic.code}:`, err.message);
      failCount++;
      continue;
    }

    // B. Sync to medical_conditions table
    const kind = topic.topicType.toLowerCase().includes("approach") ? "Approach" : "Condition";
    const status = topic.status === "active" ? "published" : "archived";
    const groupCode = topic.group || null;

    try {
      let condition = await queryOne("SELECT id FROM medical_conditions WHERE slug = $1", [topicSlug]);
      if (condition) {
        const queryStr = "UPDATE medical_conditions SET name = $1, subject_id = $2, category = $3, kind = $4, status = $5, updated_at = NOW() WHERE id = $6";
        const queryParams = [topicLabel, subjectId, groupCode, kind, status, condition.id];
        console.log(`[${count}] Executing UPDATE for ${topic.code}:`, queryParams);
        await execute(queryStr, queryParams);
      } else {
        const queryStr = "INSERT INTO medical_conditions (slug, name, subject_id, category, kind, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())";
        const queryParams = [topicSlug, topicLabel, subjectId, groupCode, kind, status];
        console.log(`[${count}] Executing INSERT for ${topic.code}:`, queryParams);
        await execute(queryStr, queryParams);
      }
      successCount++;
    } catch (err: any) {
      console.error(`FAIL at medical_conditions table for ${topic.code}:`, err.message);
      console.error("Error properties:", {
        code: err.code,
        table: err.table,
        column: err.column,
        constraint: err.constraint
      });
      failCount++;
    }
  }

  console.log("--- SEEDING COMPLETE ---");
  console.log(`Successfully synced: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal Seeder Error:", err.message);
  process.exit(1);
});
