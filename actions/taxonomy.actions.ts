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

/**
 * Soft-archives a topic (sets status = 'archived' and deleted_at = NOW())
 */
export async function archiveTaxonomyTopicAction(
  topicCode: string,
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await execute(`UPDATE taxonomy_topics SET status = 'archived', updated_at = NOW() WHERE code = $1`, [topicCode]);
    } catch {}
    try {
      await execute(`UPDATE subtopics SET deleted_at = NOW(), updated_at = NOW() WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}
    try {
      await execute(`UPDATE medical_conditions SET deleted_at = NOW(), updated_at = NOW() WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "ARCHIVE_TAXONOMY_TOPIC",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Permanently deletes a topic from the database
 */
export async function deleteTaxonomyTopicAction(
  topicCode: string,
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await execute(`DELETE FROM taxonomy_topics WHERE code = $1`, [topicCode]);
    } catch {}
    try {
      await execute(`DELETE FROM subtopics WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}
    try {
      await execute(`DELETE FROM medical_conditions WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "DELETE_TAXONOMY_TOPIC_PERMANENT",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
        metadata: { deletedPermanentlyBy: adminUser.name || adminUser.email },
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Restores an archived topic back to active status
 */
export async function restoreTaxonomyTopicAction(
  topicCode: string,
  adminUser?: PermissionUser
): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await execute(`UPDATE taxonomy_topics SET status = 'active', updated_at = NOW() WHERE code = $1`, [topicCode]);
    } catch {}
    try {
      await execute(`UPDATE subtopics SET deleted_at = NULL, updated_at = NOW() WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}
    try {
      await execute(`UPDATE medical_conditions SET deleted_at = NULL, updated_at = NOW() WHERE slug = $1 OR id::text = $1`, [topicCode.toLowerCase()]);
    } catch {}

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "RESTORE_TAXONOMY_TOPIC",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Automatically registers or assigns a standardized T#### Topic Code and Unit
 * whenever new Content, Approaches, Questions, or Tags are created in the database.
 */
export async function registerOrUpdateTopicWithCodeAction(params: {
  label: string;
  homeUnit?: string;
  topicType?: string; // "Approach to a Presentation" | "Clinical Condition" | "Question Topic" | "Autofill Template"
  depth?: "Core" | "Working" | "Awareness";
  tags?: string[];
  variants?: string[];
  adminUser?: PermissionUser;
}): Promise<{
  success: boolean;
  topicCode: string;
  homeUnit: string;
  error?: string;
}> {
  try {
    const cleanLabel = params.label.trim();
    if (!cleanLabel) return { success: false, error: "Topic label is required", topicCode: "", homeUnit: "" };

    const cleanUnit = (params.homeUnit || "general").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const isApproach = params.topicType === "Approach to a Presentation" || cleanLabel.toLowerCase().startsWith("approach to");
    const topicTypeVal = isApproach ? "Approach to a Presentation" : params.topicType || "Clinical Condition";

    // 1. Ensure subject/unit exists in subjects table
    let subjectRow = await queryOne<{ id: string; slug: string }>(
      `SELECT id, slug FROM subjects WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1`,
      [cleanUnit]
    );
    if (!subjectRow) {
      const unitName = params.homeUnit || "General";
      subjectRow = await queryOne<{ id: string; slug: string }>(
        `INSERT INTO subjects (slug, name) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [cleanUnit, unitName]
      );
    }

    // 2. Store all tags in tags table
    const allTags = params.tags || [];
    for (const tag of allTags) {
      const cleanTag = tag.trim();
      if (!cleanTag) continue;
      const tagSlug = cleanTag.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      try {
        await execute(
          `INSERT INTO tags (slug, label) VALUES ($1, $2)
           ON CONFLICT (slug) DO NOTHING`,
          [tagSlug, cleanTag]
        );
      } catch {}
    }

    // 3. Find if topic already exists in subtopics or taxonomy_topics
    let existingCode: string | null = null;

    // Check subtopics
    const existingSubtopic = await queryOne<{ slug: string }>(
      `SELECT slug FROM subtopics WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [cleanLabel]
    );
    if (existingSubtopic && /^t\d+$/i.test(existingSubtopic.slug)) {
      existingCode = `T${existingSubtopic.slug.replace(/^t/i, "").padStart(4, "0")}`;
    }

    // Check taxonomy_topics
    if (!existingCode) {
      try {
        const existingTaxonomy = await queryOne<{ code: string }>(
          `SELECT code FROM taxonomy_topics WHERE LOWER(label) = LOWER($1) LIMIT 1`,
          [cleanLabel]
        );
        if (existingTaxonomy) {
          existingCode = existingTaxonomy.code;
        }
      } catch {}
    }

    // 4. If no existing topicCode, calculate the next available T####
    let finalTopicCode = existingCode;
    if (!finalTopicCode) {
      // Find max number from subtopics and taxonomy_topics
      let maxNum = 1267;
      try {
        const subtopicCodes = await query<{ slug: string }>(`SELECT slug FROM subtopics WHERE slug ~* '^t[0-9]+$'`);
        for (const r of subtopicCodes) {
          const m = r.slug.match(/^t(\d+)$/i);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        }
      } catch {}

      try {
        const taxonomyCodes = await query<{ code: string }>(`SELECT code FROM taxonomy_topics WHERE code ~* '^T[0-9]+$'`);
        for (const r of taxonomyCodes) {
          const m = r.code.match(/^T(\d+)$/i);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        }
      } catch {}

      finalTopicCode = `T${String(maxNum + 1).padStart(4, "0")}`;
    }

    // 5. Upsert into subtopics
    const subtopicSlug = finalTopicCode.toLowerCase();
    if (subjectRow) {
      try {
        await execute(
          `INSERT INTO subtopics (subject_id, slug, name, sort_order)
           VALUES ($1, $2, $3, 0)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, subject_id = EXCLUDED.subject_id`,
          [subjectRow.id, subtopicSlug, cleanLabel]
        );
      } catch {}
    }

    // 6. Upsert into taxonomy_topics if table exists
    try {
      const variantsArr = Array.from(new Set([...(params.variants || []), ...(params.tags || [])]));
      await execute(
        `INSERT INTO taxonomy_topics
           (code, label, topic_type, home_unit, depth, status, variants, cross_cutting_tags, taxonomy_version, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, '1.1', NOW())
         ON CONFLICT (code) DO UPDATE SET
           label = EXCLUDED.label,
           topic_type = EXCLUDED.topic_type,
           home_unit = EXCLUDED.home_unit,
           variants = EXCLUDED.variants,
           updated_at = NOW()`,
        [
          finalTopicCode,
          cleanLabel,
          topicTypeVal,
          cleanUnit,
          params.depth || "Core",
          JSON.stringify(variantsArr),
          JSON.stringify(allTags),
        ]
      );
    } catch {}

    return {
      success: true,
      topicCode: finalTopicCode,
      homeUnit: cleanUnit,
    };
  } catch (err: any) {
    console.error("registerOrUpdateTopicWithCodeAction error:", err);
    return {
      success: false,
      topicCode: "T0000",
      homeUnit: params.homeUnit || "general",
      error: err.message,
    };
  }
}

export interface UnifiedTopicItem {
  code: string;
  label: string;
  topicType: string;
  homeUnit: string;
  homeUnitName?: string;
  crossRefs: string[];
  group: string | null;
  variants: string[];
  depth: "Core" | "Working" | "Awareness";
  status: "active" | "merged" | "draft" | "published" | "archived";
  mergedInto: string[];
  crossCuttingTags?: string[];
  taxonomyVersion?: string;
  source: "taxonomy" | "approach" | "condition" | "question" | "autofill" | "subtopic";
  usageCount?: number;
}

/**
 * Fetches all topic titles and topics across the entire database:
 * - taxonomy_topics table
 * - subtopics & subjects tables
 * - medical_conditions (both Approaches and Conditions)
 * - questions (topics and subtopics attached to questions)
 * - autofill_templates
 */
export async function getAllDatabaseTopicsAction(): Promise<{
  success: boolean;
  topics: UnifiedTopicItem[];
  topicTitles: string[];
  units: { code: string; name: string }[];
  error?: string;
}> {
  try {
    const topicMap = new Map<string, UnifiedTopicItem>();

    // 1. Fetch from taxonomy_topics table if exists
    try {
      const taxonomyRows = await query<any>(`
        SELECT 
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
        ORDER BY code ASC
      `);

      for (const row of taxonomyRows) {
        if (!row.code || !row.label) continue;
        const key = row.label.trim().toLowerCase();
        topicMap.set(key, {
          code: row.code,
          label: row.label.trim(),
          topicType: row.topicType || "Clinical Condition",
          homeUnit: row.homeUnit || "general",
          crossRefs: Array.isArray(row.crossRefs) ? row.crossRefs : [],
          group: row.group || null,
          variants: Array.isArray(row.variants) ? row.variants : [],
          depth: (row.depth as any) || "Core",
          status: (row.status as any) || "active",
          mergedInto: Array.isArray(row.mergedInto) ? row.mergedInto : [],
          crossCuttingTags: Array.isArray(row.crossCuttingTags) ? row.crossCuttingTags : [],
          taxonomyVersion: row.taxonomyVersion || "1.1",
          source: "taxonomy",
        });
      }
    } catch (e) {
      // taxonomy_topics table does not exist yet; gracefully fallback to JSON taxonomy & database tables
    }

    // 2. Load fallback Master JSON taxonomy if topicMap is empty
    if (topicMap.size === 0) {
      try {
        const filePath = path.join(process.cwd(), "GP-Edge-Master-Taxonomy-v1.1.json");
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, "utf-8");
          const jsonTaxonomy = JSON.parse(rawData);
          const topics = jsonTaxonomy.topics || [];
          for (const t of topics) {
            const key = t.label.trim().toLowerCase();
            topicMap.set(key, {
              code: t.code,
              label: t.label.trim(),
              topicType: t.topicType || "Clinical Condition",
              homeUnit: t.homeUnit || "general",
              crossRefs: t.crossRefs || [],
              group: t.group || null,
              variants: t.variants || [],
              depth: t.depth || "Core",
              status: t.status || "active",
              mergedInto: t.mergedInto || [],
              crossCuttingTags: t.crossCuttingTags || [],
              taxonomyVersion: t.taxonomyVersion || "1.1",
              source: "taxonomy",
            });
          }
        }
      } catch (err) {
        console.warn("[getAllDatabaseTopicsAction] JSON taxonomy fallback error:", err);
      }
    }

    // 3. Fetch from subtopics & subjects in database
    try {
      const subtopicRows = await query<any>(`
        SELECT 
          st.id, 
          st.slug as code, 
          st.name as label, 
          s.slug as "homeUnit", 
          s.name as "homeUnitName"
        FROM subtopics st
        LEFT JOIN subjects s ON s.id = st.subject_id
        WHERE st.deleted_at IS NULL
        ORDER BY st.name ASC
      `);

      for (const row of subtopicRows) {
        if (!row.label) continue;
        const key = row.label.trim().toLowerCase();
        const isApproach = row.label.toLowerCase().startsWith("approach to");
        const existing = topicMap.get(key);
        if (!existing) {
          topicMap.set(key, {
            code: row.code || `SUB-${row.id.substring(0, 6)}`,
            label: row.label.trim(),
            topicType: isApproach ? "Approach to a Presentation" : "Clinical Condition",
            homeUnit: row.homeUnit || "general",
            homeUnitName: row.homeUnitName,
            crossRefs: [],
            group: null,
            variants: [],
            depth: "Core",
            status: "active",
            mergedInto: [],
            crossCuttingTags: [],
            source: "subtopic",
          });
        } else if (row.homeUnitName && !existing.homeUnitName) {
          existing.homeUnitName = row.homeUnitName;
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] subtopics query:", e);
    }

    // 4. Fetch Approaches and Conditions from medical_conditions in database
    try {
      const medicalRows = await query<any>(`
        SELECT 
          mc.id, 
          mc.slug as code, 
          mc.name as label, 
          mc.kind, 
          mc.category, 
          s.slug as "homeUnit", 
          s.name as "homeUnitName"
        FROM medical_conditions mc
        LEFT JOIN subjects s ON s.id = mc.subject_id
        WHERE mc.deleted_at IS NULL
        ORDER BY mc.name ASC
      `);

      for (const row of medicalRows) {
        if (!row.label) continue;
        const key = row.label.trim().toLowerCase();
        const isApproach = row.kind === "Approach" || row.label.toLowerCase().startsWith("approach to");
        const existing = topicMap.get(key);
        if (!existing) {
          topicMap.set(key, {
            code: row.code || `MC-${row.id.substring(0, 6)}`,
            label: row.label.trim(),
            topicType: isApproach ? "Approach to a Presentation" : "Clinical Condition",
            homeUnit: row.homeUnit || row.category || "general",
            homeUnitName: row.homeUnitName || row.category,
            crossRefs: [],
            group: row.category || null,
            variants: [],
            depth: "Core",
            status: "active",
            mergedInto: [],
            crossCuttingTags: isApproach ? ["approach"] : [],
            source: isApproach ? "approach" : "condition",
          });
        } else {
          if (isApproach && existing.topicType !== "Approach to a Presentation") {
            existing.topicType = "Approach to a Presentation";
          }
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] medical_conditions query:", e);
    }

    // 5. Fetch distinct topics from questions in database
    try {
      const questionTopicRows = await query<any>(`
        SELECT DISTINCT 
          COALESCE(st.slug, s.slug) as code,
          COALESCE(st.name, s.name) as label,
          s.slug as "homeUnit",
          s.name as "homeUnitName",
          COUNT(q.id) as count
        FROM questions q
        LEFT JOIN subjects s ON s.id = q.subject_id
        LEFT JOIN subtopics st ON st.id = q.subtopic_id
        WHERE q.deleted_at IS NULL AND (st.name IS NOT NULL OR s.name IS NOT NULL)
        GROUP BY st.slug, s.slug, st.name, s.name
      `);

      for (const row of questionTopicRows) {
        if (!row.label) continue;
        const key = row.label.trim().toLowerCase();
        const existing = topicMap.get(key);
        if (existing) {
          existing.usageCount = (existing.usageCount || 0) + Number(row.count || 0);
        } else {
          topicMap.set(key, {
            code: row.code || `Q-${row.label.substring(0, 6)}`,
            label: row.label.trim(),
            topicType: "Clinical Condition",
            homeUnit: row.homeUnit || "general",
            homeUnitName: row.homeUnitName,
            crossRefs: [],
            group: null,
            variants: [],
            depth: "Core",
            status: "active",
            mergedInto: [],
            crossCuttingTags: ["question-bank"],
            source: "question",
            usageCount: Number(row.count || 0),
          });
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] questions query:", e);
    }

    // 6. Fetch from autofill_templates in database
    try {
      const autofillRows = await query<any>(`
        SELECT 
          at.id, 
          at.slug as code, 
          at.name as label, 
          at.category, 
          s.slug as "homeUnit", 
          s.name as "homeUnitName"
        FROM autofill_templates at
        LEFT JOIN subjects s ON s.id = at.subject_id
        WHERE at.deleted_at IS NULL
      `);

      for (const row of autofillRows) {
        if (!row.label) continue;
        const key = row.label.trim().toLowerCase();
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            code: row.code || `AF-${row.id.substring(0, 6)}`,
            label: row.label.trim(),
            topicType: "Autofill Template",
            homeUnit: row.homeUnit || row.category || "general",
            homeUnitName: row.homeUnitName || row.category,
            crossRefs: [],
            group: row.category || null,
            variants: [],
            depth: "Working",
            status: "active",
            mergedInto: [],
            crossCuttingTags: ["autofill"],
            source: "autofill",
          });
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] autofill_templates query:", e);
    }

    // 6b. Fetch distinct tags from tags table in database
    try {
      const tagRows = await query<any>(`
        SELECT id, slug, label FROM tags WHERE label IS NOT NULL ORDER BY label ASC
      `);
      for (const row of tagRows) {
        if (!row.label) continue;
        const key = row.label.trim().toLowerCase();
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            code: row.slug || `TAG-${row.id.substring(0, 6)}`,
            label: row.label.trim(),
            topicType: "Clinical Tag",
            homeUnit: "general",
            crossRefs: [],
            group: null,
            variants: [row.slug],
            depth: "Awareness",
            status: "active",
            mergedInto: [],
            crossCuttingTags: [row.slug],
            source: "subtopic",
          });
        }
      }
    } catch (e) {
      // tags table query fallback
    }

    // 7. Get distinct Units from taxonomy_units or subjects
    let units: { code: string; name: string }[] = [];
    try {
      const dbUnits = await query<any>(`
        SELECT code, name FROM taxonomy_units ORDER BY display_order ASC, code ASC
      `);
      if (dbUnits.length > 0) {
        units = dbUnits;
      }
    } catch {}

    if (units.length === 0) {
      try {
        const subjectUnits = await query<any>(`
          SELECT slug as code, name FROM subjects WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC
        `);
        if (subjectUnits.length > 0) {
          units = subjectUnits;
        }
      } catch {}
    }

    // 8. Define and normalize topic codes (ensure all have uppercase T0001+ format)
    const usedCodes = new Set<string>();
    let maxNumber = 0;

    // Pass 1: Normalize existing valid T-codes
    for (const t of topicMap.values()) {
      if (t.code && typeof t.code === "string") {
        const match = t.code.trim().match(/^t(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const formatted = `T${String(num).padStart(4, "0")}`;
          if (!usedCodes.has(formatted)) {
            usedCodes.add(formatted);
            t.code = formatted;
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
    }

    // Pass 2: Define and assign clean T-codes for any topic without a valid T-code
    let nextCounter = maxNumber + 1;
    for (const t of topicMap.values()) {
      if (!t.code || !/^T\d{4,}$/.test(t.code)) {
        const originalSlug = t.code;
        while (usedCodes.has(`T${String(nextCounter).padStart(4, "0")}`)) {
          nextCounter++;
        }
        const assigned = `T${String(nextCounter).padStart(4, "0")}`;
        usedCodes.add(assigned);
        nextCounter++;

        if (originalSlug && originalSlug !== assigned && !t.variants.includes(originalSlug)) {
          t.variants.push(originalSlug);
        }
        t.code = assigned;
      }
    }

    const topics = Array.from(topicMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    const topicTitles = Array.from(new Set(topics.map((t) => t.label))).filter(Boolean);

    return {
      success: true,
      topics,
      topicTitles,
      units,
    };
  } catch (err: any) {
    console.error("getAllDatabaseTopicsAction error:", err);
    return {
      success: false,
      topics: [],
      topicTitles: [],
      units: [],
      error: err.message,
    };
  }
}
