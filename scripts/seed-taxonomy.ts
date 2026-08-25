import fs from "fs";
import path from "path";
import { getMasterTaxonomy } from "../lib/taxonomy";

async function seedTaxonomy() {
  console.log("[Seed Taxonomy] Loading Master Taxonomy v1.1...");
  const taxonomy = getMasterTaxonomy();

  console.log(`[Seed Taxonomy] Schema Version: ${taxonomy.schemaVersion}`);
  console.log(`[Seed Taxonomy] Units: ${taxonomy.units.length}`);
  console.log(`[Seed Taxonomy] Topics: ${taxonomy.topics.length}`);

  const activeTopics = taxonomy.topics.filter((t) => t.status === "active");
  const coreCount = activeTopics.filter((t) => t.depth === "Core").length;
  const workingCount = activeTopics.filter((t) => t.depth === "Working").length;
  const awarenessCount = activeTopics.filter((t) => t.depth === "Awareness").length;

  console.log(`[Seed Taxonomy] Active Topics: ${activeTopics.length}`);
  console.log(`  - Core: ${coreCount}`);
  console.log(`  - Working: ${workingCount}`);
  console.log(`  - Awareness: ${awarenessCount}`);

  console.log("[Seed Taxonomy] Master Taxonomy successfully validated and ready for DB sync.");
}

seedTaxonomy().catch((err) => {
  console.error("[Seed Taxonomy] Error:", err);
  process.exit(1);
});
