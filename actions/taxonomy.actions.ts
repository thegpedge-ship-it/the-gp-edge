"use server";

import fs from "fs";
import path from "path";
import { query, queryOne, execute } from "@/lib/db";
import { recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";

export interface MasterUnit {
  code: string;
  name: string;
  kind: string;
  groups: { code: string; name: string }[];
  displayOrder: number;
}

export interface MasterTopic {
  code: string; // topicCode - permanent identifier
  label: string;
  topicType: string; // "Approach to a Presentation" | "Clinical Condition"
  homeUnit: string;
  crossRefs: string[];
  group: string | null;
  variants: string[];
  depth: "Core" | "Working" | "Awareness"; // depthTier
  status: "active" | "merged";
  mergedInto: string[];
  crossCuttingTags?: string[];
  taxonomyVersion?: string;
}

/**
 * Initializes DB tables and syncs GP-Edge-Master-Taxonomy-v1.1.json into PostgreSQL
 */
export async function syncMasterTaxonomyAction(adminUser?: PermissionUser) {
  try {
    // 1. Ensure DB tables exist
    await execute(`
      CREATE TABLE IF NOT EXISTS taxonomy_units (
        code VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kind VARCHAR(50) DEFAULT 'owner',
        groups JSONB,
        display_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS taxonomy_topics (
        code VARCHAR(20) PRIMARY KEY,
        label VARCHAR(500) NOT NULL,
        topic_type VARCHAR(100) NOT NULL,
        home_unit VARCHAR(20) NOT NULL,
        group_code VARCHAR(50),
        cross_refs JSONB DEFAULT '[]'::jsonb,
        variants JSONB DEFAULT '[]'::jsonb,
        depth VARCHAR(50) DEFAULT 'Core',
        status VARCHAR(50) DEFAULT 'active',
        merged_into JSONB DEFAULT '[]'::jsonb,
        cross_cutting_tags JSONB DEFAULT '[]'::jsonb,
        taxonomy_version VARCHAR(20) DEFAULT '1.1',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_home_unit ON taxonomy_topics(home_unit);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_depth ON taxonomy_topics(depth);`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_taxonomy_topics_status ON taxonomy_topics(status);`);

    // 2. Add classification columns to questions, medical_conditions, autofill_templates if absent
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);`);
    await execute(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';`);

    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);`);
    await execute(`ALTER TABLE medical_conditions ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';`);

    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20);`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20);`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50);`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb;`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100);`);
    await execute(`ALTER TABLE autofill_templates ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1';`);

    // 3. Load JSON master taxonomy file
    const filePath = path.join(process.cwd(), "GP-Edge-Master-Taxonomy-v1.1.json");
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "GP-Edge-Master-Taxonomy-v1.1.json not found on server." };
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonTaxonomy = JSON.parse(rawData);
    const units: MasterUnit[] = jsonTaxonomy.units || [];
    const topics: MasterTopic[] = jsonTaxonomy.topics || [];
    const version = jsonTaxonomy.schemaVersion || "1.1";

    // 4. Batch upsert Units
    for (const u of units) {
      await execute(
        `INSERT INTO taxonomy_units (code, name, kind, groups, display_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           kind = EXCLUDED.kind,
           groups = EXCLUDED.groups,
           display_order = EXCLUDED.display_order,
           updated_at = NOW()`,
        [u.code, u.name, u.kind || "owner", JSON.stringify(u.groups || []), u.displayOrder || 0]
      );
    }

    // 5. Batch upsert Topics (enforces topicCode permanence)
    for (const t of topics) {
      const crossCuttingTags = t.crossCuttingTags || [];
      await execute(
        `INSERT INTO taxonomy_topics 
           (code, label, topic_type, home_unit, group_code, cross_refs, variants, depth, status, merged_into, cross_cutting_tags, taxonomy_version, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (code) DO UPDATE SET
           label = EXCLUDED.label,
           topic_type = EXCLUDED.topic_type,
           home_unit = EXCLUDED.home_unit,
           group_code = EXCLUDED.group_code,
           cross_refs = EXCLUDED.cross_refs,
           variants = EXCLUDED.variants,
           depth = EXCLUDED.depth,
           status = EXCLUDED.status,
           merged_into = EXCLUDED.merged_into,
           cross_cutting_tags = EXCLUDED.cross_cutting_tags,
           taxonomy_version = EXCLUDED.taxonomy_version,
           updated_at = NOW()`,
        [
          t.code,
          t.label,
          t.topicType,
          t.homeUnit,
          t.group || null,
          JSON.stringify(t.crossRefs || []),
          JSON.stringify(t.variants || []),
          t.depth || "Core",
          t.status || "active",
          JSON.stringify(t.mergedInto || []),
          JSON.stringify(crossCuttingTags),
          version,
        ]
      );
    }

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "SYNC_MASTER_TAXONOMY",
        category: "TAXONOMY",
        entityType: "TAXONOMY",
        entityId: "SYSTEM",
        metadata: { unitsCount: units.length, topicsCount: topics.length, version },
      });
    }

    return {
      success: true,
      unitsCount: units.length,
      topicsCount: topics.length,
      version,
    };
  } catch (err: any) {
    console.error("syncMasterTaxonomyAction error:", err);
    return { success: false, error: err.message || "Failed to sync master taxonomy" };
  }
}

/**
 * Gets all taxonomy units ordered by display_order
 */
export async function getTaxonomyUnitsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const rows = await query(
      `SELECT code, name, kind, groups, display_order AS "displayOrder" FROM taxonomy_units ORDER BY display_order ASC, code ASC`
    );
    return { success: true, data: rows };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Searches and fetches taxonomy topics
 */
export async function getTaxonomyTopicsAction(params?: {
  homeUnit?: string;
  depthTier?: string;
  topicType?: string;
  crossCuttingTag?: string;
  queryStr?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
  try {
    let whereClauses: string[] = ["1=1"];
    let values: any[] = [];
    let idx = 1;

    if (params?.homeUnit && params.homeUnit !== "all") {
      whereClauses.push(`(home_unit = $${idx} OR cross_refs @> $${idx + 1}::jsonb)`);
      values.push(params.homeUnit, JSON.stringify([params.homeUnit]));
      idx += 2;
    }

    if (params?.depthTier && params.depthTier !== "all") {
      whereClauses.push(`depth = $${idx}`);
      values.push(params.depthTier);
      idx++;
    }

    if (params?.topicType && params.topicType !== "all") {
      whereClauses.push(`topic_type ILIKE $${idx}`);
      values.push(`%${params.topicType}%`);
      idx++;
    }

    if (params?.crossCuttingTag && params.crossCuttingTag !== "all") {
      whereClauses.push(`cross_cutting_tags @> $${idx}::jsonb`);
      values.push(JSON.stringify([params.crossCuttingTag]));
      idx++;
    }

    if (params?.queryStr && params.queryStr.trim().length > 0) {
      const q = `%${params.queryStr.trim().toLowerCase()}%`;
      whereClauses.push(`(LOWER(code) LIKE $${idx} OR LOWER(label) LIKE $${idx} OR LOWER(COALESCE(group_code, '')) LIKE $${idx})`);
      values.push(q);
      idx++;
    }

    const whereSql = whereClauses.join(" AND ");

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM taxonomy_topics WHERE ${whereSql}`,
      values
    );
    const total = parseInt(countRow?.count || "0", 10);

    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    const rows = await query(
      `SELECT 
         code, 
         label, 
         topic_type AS "topicType", 
         home_unit AS "homeUnit", 
         group_code AS "group", 
         cross_refs AS "crossRefs", 
         variants, 
         depth, 
         status, 
         merged_into AS "mergedInto", 
         cross_cutting_tags AS "crossCuttingTags", 
         taxonomy_version AS "taxonomyVersion"
       FROM taxonomy_topics 
       WHERE ${whereSql} 
       ORDER BY code ASC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return { success: true, data: rows, total };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Moves a topic to a new home unit / group while PRESERVING permanent topicCode
 */
export async function moveTopicHomeUnitAction(
  topicCode: string,
  newHomeUnit: string,
  newGroupCode?: string | null,
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    const topic = await queryOne<{ code: string; home_unit: string }>(
      `SELECT code, home_unit FROM taxonomy_topics WHERE code = $1`,
      [topicCode]
    );
    if (!topic) return { success: false, error: `Topic ${topicCode} not found` };

    await execute(
      `UPDATE taxonomy_topics SET home_unit = $1, group_code = $2, updated_at = NOW() WHERE code = $3`,
      [newHomeUnit, newGroupCode || null, topicCode]
    );

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "MOVE_TOPIC_HOME_UNIT",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
        metadata: { oldHomeUnit: topic.home_unit, newHomeUnit, newGroupCode },
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Updates a topic's taxonomy classification properties
 */
export async function updateTopicClassificationAction(
  topicCode: string,
  updates: {
    label?: string;
    topicType?: string;
    depth?: string;
    crossRefs?: string[];
    crossCuttingTags?: string[];
    variants?: string[];
  },
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await queryOne<{ code: string }>(`SELECT code FROM taxonomy_topics WHERE code = $1`, [topicCode]);
    if (!existing) return { success: false, error: `Topic ${topicCode} not found` };

    let fields: string[] = [];
    let vals: any[] = [topicCode];
    let idx = 2;

    if (updates.label !== undefined) {
      fields.push(`label = $${idx}`);
      vals.push(updates.label);
      idx++;
    }
    if (updates.topicType !== undefined) {
      fields.push(`topic_type = $${idx}`);
      vals.push(updates.topicType);
      idx++;
    }
    if (updates.depth !== undefined) {
      fields.push(`depth = $${idx}`);
      vals.push(updates.depth);
      idx++;
    }
    if (updates.crossRefs !== undefined) {
      fields.push(`cross_refs = $${idx}::jsonb`);
      vals.push(JSON.stringify(updates.crossRefs));
      idx++;
    }
    if (updates.crossCuttingTags !== undefined) {
      fields.push(`cross_cutting_tags = $${idx}::jsonb`);
      vals.push(JSON.stringify(updates.crossCuttingTags));
      idx++;
    }
    if (updates.variants !== undefined) {
      fields.push(`variants = $${idx}::jsonb`);
      vals.push(JSON.stringify(updates.variants));
      idx++;
    }

    if (fields.length === 0) return { success: true };

    fields.push(`updated_at = NOW()`);

    await execute(`UPDATE taxonomy_topics SET ${fields.join(", ")} WHERE code = $1`, vals);

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "UPDATE_TOPIC_CLASSIFICATION",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
        metadata: { updates },
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
