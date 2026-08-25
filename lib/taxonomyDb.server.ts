import "server-only";
import fs from "fs";
import path from "path";
import {
  MasterTaxonomySchema,
  TaxonomyTopic,
  getMasterTaxonomy,
  saveMasterTaxonomy,
} from "@/lib/taxonomy";

function loadTaxonomyFromDisk(): MasterTaxonomySchema | null {
  try {
    const possiblePaths = [
      path.join(process.cwd(), "GP-Edge-Master-Taxonomy-v1.1.json"),
      path.join(process.cwd(), "..", "GP EDGE - 3", "GP-Edge-Master-Taxonomy-v1.1.json"),
      path.join(process.cwd(), "public", "GP-Edge-Master-Taxonomy-v1.1.json"),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as MasterTaxonomySchema;
      }
    }
  } catch (err) {
    console.error("[Taxonomy] Error reading taxonomy JSON file:", err);
  }
  return null;
}

// Preloads master taxonomy JSON from the database
export async function preloadTaxonomy(): Promise<MasterTaxonomySchema> {
  try {
    const { queryOne } = await import("./db");
    const res = await queryOne("SELECT value FROM app_settings WHERE key = 'master_taxonomy'");
    if (res && res.value) {
      const taxonomy = (typeof res.value === "string" ? JSON.parse(res.value) : res.value) as MasterTaxonomySchema;
      saveMasterTaxonomy(taxonomy);
      return taxonomy;
    }
  } catch (err) {
    console.error("[Taxonomy] Failed to preload from database:", err);
  }

  const diskData = loadTaxonomyFromDisk();
  if (diskData) {
    saveMasterTaxonomy(diskData);
    return diskData;
  }

  return getMasterTaxonomy();
}

// Save back to Neon DB app_settings
export async function saveMasterTaxonomyDb(taxonomy: MasterTaxonomySchema): Promise<void> {
  saveMasterTaxonomy(taxonomy);
  try {
    const { execute } = await import("./db");
    await execute(
      "INSERT INTO app_settings (key, value, updated_at) VALUES ('master_taxonomy', $1, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
      [JSON.stringify(taxonomy)]
    );
  } catch (err) {
    console.error("[Taxonomy] Failed to save master taxonomy to database:", err);
  }
}

/**
 * Server-side moveTopicUnit with database synchronization
 */
export async function moveTopicUnitDb(topicCode: string, newHomeUnit: string, newGroupCode: string | null = null): Promise<boolean> {
  const tax = await preloadTaxonomy();
  const index = tax.topics.findIndex((t) => t.code === topicCode);
  if (index === -1) return false;

  const topic = tax.topics[index];
  topic.homeUnit = newHomeUnit;
  topic.group = newGroupCode;
  tax.topics[index] = topic;

  await saveMasterTaxonomyDb(tax);

  try {
    const { queryOne, execute } = await import("./db");
    const subject = await queryOne("SELECT id FROM subjects WHERE slug = $1", [newHomeUnit.toLowerCase()]);
    if (subject) {
      await execute(
        "UPDATE medical_conditions SET subject_id = $1, category = $2, updated_at = NOW() WHERE slug = $3",
        [subject.id, newGroupCode, topicCode.toLowerCase()]
      );
      await execute(
        "UPDATE subtopics SET subject_id = $1, updated_at = NOW() WHERE slug = $2",
        [subject.id, topicCode.toLowerCase()]
      );
    }
  } catch (err) {
    console.error("[Taxonomy] Error syncing move unit to DB:", err);
  }

  return true;
}

/**
 * Server-side updateTopic with database synchronization
 */
export async function updateTopicDb(topicCode: string, updates: Partial<Omit<TaxonomyTopic, "code">>): Promise<boolean> {
  const tax = await preloadTaxonomy();
  const index = tax.topics.findIndex((t) => t.code === topicCode);
  if (index === -1) return false;

  const current = tax.topics[index];
  tax.topics[index] = {
    ...current,
    ...updates,
    code: current.code,
  };

  await saveMasterTaxonomyDb(tax);

  try {
    const { execute } = await import("./db");
    const topicSlug = topicCode.toLowerCase();
    const topicLabel = (updates.label || current.label).slice(0, 255);
    const kind = (updates.topicType || current.topicType).toLowerCase().includes("approach") ? "Approach" : "Condition";
    const status = (updates.status || current.status) === "active" ? "published" : "archived";
    const groupCode = updates.group !== undefined ? updates.group : current.group;

    await execute(
      "UPDATE subtopics SET name = $1, updated_at = NOW() WHERE slug = $2",
      [topicLabel, topicSlug]
    );
    await execute(
      "UPDATE medical_conditions SET name = $1, category = $2, kind = $3, status = $4, updated_at = NOW() WHERE slug = $5",
      [topicLabel, groupCode, kind, status, topicSlug]
    );
  } catch (err) {
    console.error("[Taxonomy] Error syncing update topic to DB:", err);
  }

  return true;
}
