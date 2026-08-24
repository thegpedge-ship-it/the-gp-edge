"use server";

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

    // 3. Accept taxonomy data as parameter, or count from DB if not provided
    const units: MasterUnit[] = [];
    const topics: MasterTopic[] = [];
    const version = "1.1";

    // If no inline data provided, just ensure tables exist and return DB counts
    const dbUnitsCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM taxonomy_units`);
    const dbTopicsCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM taxonomy_topics`);

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "SYNC_MASTER_TAXONOMY",
        category: "TAXONOMY",
        entityType: "TAXONOMY",
        entityId: "SYSTEM",
        metadata: {
          unitsCount: parseInt(dbUnitsCount?.count || "0", 10),
          topicsCount: parseInt(dbTopicsCount?.count || "0", 10),
          version,
          note: "DB is source of truth — JSON file removed",
        },
      });
    }

    return {
      success: true,
      unitsCount: parseInt(dbUnitsCount?.count || "0", 10),
      topicsCount: parseInt(dbTopicsCount?.count || "0", 10),
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
    // Topics are backed by different tables depending on where they were created
    // (the standalone taxonomy_topics table if it exists, or the real subtopics /
    // medical_conditions tables whose "home unit" is their subject_id). Resolve the
    // destination subject/unit once, then move whichever table actually holds this topic.
    const targetSubject = await queryOne<{ id: string; slug: string }>(
      `SELECT id, slug FROM subjects WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [newHomeUnit]
    );

    let oldHomeUnit: string | null = null;
    let moved = false;

    try {
      const topic = await queryOne<{ code: string; home_unit: string }>(
        `SELECT code, home_unit FROM taxonomy_topics WHERE code = $1`,
        [topicCode]
      );
      if (topic) {
        oldHomeUnit = topic.home_unit;
        await execute(
          `UPDATE taxonomy_topics SET home_unit = $1, group_code = $2, updated_at = NOW() WHERE code = $3`,
          [newHomeUnit, newGroupCode || null, topicCode]
        );
        moved = true;
      }
    } catch {
      // taxonomy_topics table does not exist — fall through to the real tables below
    }

    if (targetSubject) {
      try {
        const subtopicRow = await queryOne<{ id: string; homeUnitSlug: string | null }>(
          `SELECT st.id, s.slug AS "homeUnitSlug" FROM subtopics st LEFT JOIN subjects s ON s.id = st.subject_id WHERE LOWER(st.slug) = LOWER($1)`,
          [topicCode]
        );
        if (subtopicRow) {
          oldHomeUnit = oldHomeUnit || subtopicRow.homeUnitSlug;
          await execute(`UPDATE subtopics SET subject_id = $1, updated_at = NOW() WHERE id = $2`, [
            targetSubject.id,
            subtopicRow.id,
          ]);
          moved = true;
        }
      } catch {}

      try {
        const conditionRow = await queryOne<{ id: string; homeUnitSlug: string | null }>(
          `SELECT mc.id, s.slug AS "homeUnitSlug" FROM medical_conditions mc LEFT JOIN subjects s ON s.id = mc.subject_id WHERE LOWER(mc.slug) = LOWER($1)`,
          [topicCode]
        );
        if (conditionRow) {
          oldHomeUnit = oldHomeUnit || conditionRow.homeUnitSlug;
          await execute(`UPDATE medical_conditions SET subject_id = $1, updated_at = NOW() WHERE id = $2`, [
            targetSubject.id,
            conditionRow.id,
          ]);
          moved = true;
        }
      } catch {}
    }

    if (!moved) {
      return {
        success: false,
        error: targetSubject ? `Topic ${topicCode} not found` : `Home unit "${newHomeUnit}" not found`,
      };
    }

    if (adminUser) {
      await recordAuditLog({
        adminUserId: adminUser.id,
        action: "MOVE_TOPIC_HOME_UNIT",
        category: "TAXONOMY",
        entityType: "TAXONOMY_TOPIC",
        entityId: topicCode,
        metadata: { oldHomeUnit, newHomeUnit, newGroupCode },
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
    let matched = false;

    // Rich classification fields (depth, crossRefs, crossCuttingTags, variants, topicType) only
    // have a home in the standalone taxonomy_topics table when it exists.
    try {
      const existing = await queryOne<{ code: string }>(`SELECT code FROM taxonomy_topics WHERE code = $1`, [topicCode]);
      if (existing) {
        let fields: string[] = [];
        let vals: any[] = [topicCode];
        let idx = 2;

        if (updates.label !== undefined) { fields.push(`label = $${idx}`); vals.push(updates.label); idx++; }
        if (updates.topicType !== undefined) { fields.push(`topic_type = $${idx}`); vals.push(updates.topicType); idx++; }
        if (updates.depth !== undefined) { fields.push(`depth = $${idx}`); vals.push(updates.depth); idx++; }
        if (updates.crossRefs !== undefined) { fields.push(`cross_refs = $${idx}::jsonb`); vals.push(JSON.stringify(updates.crossRefs)); idx++; }
        if (updates.crossCuttingTags !== undefined) { fields.push(`cross_cutting_tags = $${idx}::jsonb`); vals.push(JSON.stringify(updates.crossCuttingTags)); idx++; }
        if (updates.variants !== undefined) { fields.push(`variants = $${idx}::jsonb`); vals.push(JSON.stringify(updates.variants)); idx++; }

        if (fields.length > 0) {
          fields.push(`updated_at = NOW()`);
          await execute(`UPDATE taxonomy_topics SET ${fields.join(", ")} WHERE code = $1`, vals);
        }
        matched = true;
      }
    } catch {
      // taxonomy_topics table does not exist — fall through to the real tables below
    }

    // The real tables (subtopics / medical_conditions / tags) only carry a name/label —
    // keep that in sync with the topic's real backing row, wherever it lives.
    if (updates.label !== undefined && updates.label.trim()) {
      const newLabel = updates.label.trim();

      try {
        const n = await execute(`UPDATE subtopics SET name = $1, updated_at = NOW() WHERE LOWER(slug) = LOWER($2)`, [
          newLabel,
          topicCode,
        ]);
        if (n > 0) matched = true;
      } catch {}

      try {
        const n = await execute(`UPDATE medical_conditions SET name = $1, updated_at = NOW() WHERE LOWER(slug) = LOWER($2)`, [
          newLabel,
          topicCode,
        ]);
        if (n > 0) matched = true;
      } catch {}

      try {
        const n = await execute(`UPDATE tags SET label = $1 WHERE LOWER(slug) = LOWER($2)`, [newLabel, topicCode]);
        if (n > 0) matched = true;
      } catch {}
    }

    if (!matched) return { success: false, error: `Topic ${topicCode} not found` };

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
 * Bulk-imports/creates topics from a mass-uploaded JSON file. Each item is upserted via the same
 * logic as a single manual "Create Topic" (registerOrUpdateTopicWithCodeAction) so behavior — T-code
 * assignment, home unit creation, tag registration — stays identical between the single and bulk paths.
 */
export async function bulkImportTaxonomyTopicsAction(
  topics: {
    label: string;
    homeUnit?: string;
    topicType?: string;
    depth?: "Core" | "Working" | "Awareness";
    tags?: string[];
    variants?: string[];
  }[],
  adminUser?: PermissionUser
): Promise<{
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: { label: string; error: string }[];
}> {
  const errors: { label: string; error: string }[] = [];
  let importedCount = 0;

  if (!Array.isArray(topics) || topics.length === 0) {
    return { success: false, importedCount: 0, failedCount: 0, errors: [{ label: "", error: "No topics provided" }] };
  }

  for (const item of topics) {
    const label = (item?.label || "").trim();
    if (!label) {
      errors.push({ label: "(blank)", error: "Missing label" });
      continue;
    }
    try {
      const res = await registerOrUpdateTopicWithCodeAction({
        label,
        homeUnit: item.homeUnit,
        topicType: item.topicType,
        depth: item.depth,
        tags: item.tags,
        variants: item.variants,
      });
      if (res.success) {
        importedCount++;
      } else {
        errors.push({ label, error: res.error || "Unknown error" });
      }
    } catch (err: any) {
      errors.push({ label, error: err.message });
    }
  }

  if (adminUser && importedCount > 0) {
    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "BULK_IMPORT_TAXONOMY_TOPICS",
      category: "TAXONOMY",
      entityType: "TAXONOMY_TOPIC",
      entityId: "BULK",
      metadata: { importedCount, failedCount: errors.length },
    });
  }

  return {
    success: errors.length === 0,
    importedCount,
    failedCount: errors.length,
    errors,
  };
}

/**
 * Returns the full set of unit/topic codes currently in the DB, so the admin UI can compute
 * how many entries a master-taxonomy file upload would collide with before committing to
 * overwrite or skip them.
 */
export async function getExistingTaxonomyCodesAction(): Promise<{ unitCodes: string[]; topicCodes: string[] }> {
  try {
    const [unitRows, topicRows] = await Promise.all([
      query<{ code: string }>(`SELECT code FROM taxonomy_units`),
      query<{ code: string }>(`SELECT code FROM taxonomy_topics`),
    ]);
    return { unitCodes: unitRows.map((r) => r.code), topicCodes: topicRows.map((r) => r.code) };
  } catch {
    return { unitCodes: [], topicCodes: [] };
  }
}

/**
 * Imports a full master-taxonomy snapshot (units[] + topics[] with permanent, file-assigned
 * codes — e.g. the GP-Edge-Master-Taxonomy JSON). Unlike bulkImportTaxonomyTopicsAction, codes
 * here are never auto-assigned: each unit/topic is upserted by its own fixed `code`.
 */
export async function importMasterTaxonomyFileAction(
  data: {
    units?: { code: string; name: string; kind?: string; groups?: any[]; displayOrder?: number }[];
    topics?: {
      code: string; label: string; topicType?: string; homeUnit?: string; crossRefs?: string[];
      group?: string | null; variants?: string[]; depth?: "Core" | "Working" | "Awareness";
      status?: "active" | "merged" | "archived"; mergedInto?: string[]; crossCuttingTags?: string[];
      taxonomyVersion?: string;
    }[];
  },
  mode: "overwrite" | "skip-existing",
  adminUser?: PermissionUser
): Promise<{
  success: boolean;
  unitsImported: number;
  unitsSkipped: number;
  topicsImported: number;
  topicsSkipped: number;
  errors: { code: string; error: string }[];
}> {
  const errors: { code: string; error: string }[] = [];
  let unitsImported = 0, unitsSkipped = 0, topicsImported = 0, topicsSkipped = 0;

  await execute(`
    CREATE TABLE IF NOT EXISTS taxonomy_units (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      kind VARCHAR(50) DEFAULT 'owner',
      groups JSONB,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
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
    )
  `);

  const existingUnits = mode === "skip-existing"
    ? new Set((await query<{ code: string }>(`SELECT code FROM taxonomy_units`)).map((r) => r.code))
    : new Set<string>();
  const existingTopics = mode === "skip-existing"
    ? new Set((await query<{ code: string }>(`SELECT code FROM taxonomy_topics`)).map((r) => r.code))
    : new Set<string>();

  for (const unit of data.units || []) {
    const code = (unit.code || "").trim();
    if (!code) { errors.push({ code: "(blank)", error: "Missing unit code" }); continue; }
    if (mode === "skip-existing" && existingUnits.has(code)) { unitsSkipped++; continue; }
    try {
      await execute(
        `INSERT INTO taxonomy_units (code, name, kind, groups, display_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name, kind = EXCLUDED.kind, groups = EXCLUDED.groups,
           display_order = EXCLUDED.display_order, updated_at = NOW()`,
        [code, unit.name, unit.kind || "owner", JSON.stringify(unit.groups || []), unit.displayOrder || 0]
      );
      // Keep `subjects` in sync — questions/subtopics resolve units via subjects.slug.
      await execute(
        `INSERT INTO subjects (slug, name) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        [code.toLowerCase(), unit.name]
      );
      unitsImported++;
    } catch (err: any) {
      errors.push({ code, error: err.message });
    }
  }

  for (const topic of data.topics || []) {
    const code = (topic.code || "").trim();
    if (!code) { errors.push({ code: "(blank)", error: "Missing topic code" }); continue; }
    if (mode === "skip-existing" && existingTopics.has(code)) { topicsSkipped++; continue; }
    try {
      const homeUnit = (topic.homeUnit || "").toLowerCase();
      await execute(
        `INSERT INTO taxonomy_topics
           (code, label, topic_type, home_unit, group_code, cross_refs, variants, depth, status, merged_into, cross_cutting_tags, taxonomy_version, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         ON CONFLICT (code) DO UPDATE SET
           label = EXCLUDED.label, topic_type = EXCLUDED.topic_type, home_unit = EXCLUDED.home_unit,
           group_code = EXCLUDED.group_code, cross_refs = EXCLUDED.cross_refs, variants = EXCLUDED.variants,
           depth = EXCLUDED.depth, status = EXCLUDED.status, merged_into = EXCLUDED.merged_into,
           cross_cutting_tags = EXCLUDED.cross_cutting_tags, taxonomy_version = EXCLUDED.taxonomy_version, updated_at = NOW()`,
        [
          code, topic.label, topic.topicType || "Clinical Condition", homeUnit,
          topic.group || null, JSON.stringify(topic.crossRefs || []), JSON.stringify(topic.variants || []),
          topic.depth || "Core", topic.status || "active", JSON.stringify(topic.mergedInto || []),
          JSON.stringify(topic.crossCuttingTags || []), topic.taxonomyVersion || "1.1",
        ]
      );

      // Keep `subtopics` in sync (same dual-write as registerOrUpdateTopicWithCodeAction) so
      // question linking via subtopic.slug keeps working for topics uploaded this way.
      const subjectRow = await queryOne<{ id: string }>(
        `SELECT id FROM subjects WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
        [homeUnit]
      );
      if (subjectRow) {
        await execute(
          `INSERT INTO subtopics (subject_id, slug, name, sort_order)
           VALUES ($1, $2, $3, 0)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, subject_id = EXCLUDED.subject_id`,
          [subjectRow.id, code.toLowerCase(), topic.label]
        );
      }
      topicsImported++;
    } catch (err: any) {
      errors.push({ code, error: err.message });
    }
  }

  if (adminUser && (unitsImported > 0 || topicsImported > 0)) {
    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "IMPORT_MASTER_TAXONOMY_FILE",
      category: "TAXONOMY",
      entityType: "TAXONOMY",
      entityId: "BULK",
      metadata: { mode, unitsImported, unitsSkipped, topicsImported, topicsSkipped, failedCount: errors.length },
    });
  }

  return { success: errors.length === 0, unitsImported, unitsSkipped, topicsImported, topicsSkipped, errors };
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

    // 2. If topicMap is still empty (taxonomy_topics table is empty), skip — DB is source of truth.

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

    // 5b. Fetch all tags attached to questions (from question_tags & tags tables)
    try {
      const questionTagRows = await query<any>(`
        SELECT 
          t.id as tag_id,
          t.slug as tag_slug,
          t.label as tag_label,
          COALESCE(s.slug, 'general') as "homeUnit",
          COALESCE(s.name, 'General') as "homeUnitName",
          COUNT(DISTINCT qt.question_id) as count
        FROM question_tags qt
        JOIN tags t ON t.id = qt.tag_id
        JOIN questions q ON q.id = qt.question_id
        LEFT JOIN subjects s ON s.id = q.subject_id
        WHERE q.deleted_at IS NULL AND t.label IS NOT NULL
        GROUP BY t.id, t.slug, t.label, s.slug, s.name
      `);

      for (const row of questionTagRows) {
        if (!row.tag_label) continue;
        const key = row.tag_label.trim().toLowerCase();
        const existing = topicMap.get(key);
        if (existing) {
          existing.usageCount = (existing.usageCount || 0) + Number(row.count || 0);
          if (!existing.crossCuttingTags) existing.crossCuttingTags = [];
          if (!existing.crossCuttingTags.includes("question-bank")) {
            existing.crossCuttingTags.push("question-bank");
          }
          if (row.tag_slug && !existing.variants.includes(row.tag_slug)) {
            existing.variants.push(row.tag_slug);
          }
        } else {
          topicMap.set(key, {
            code: row.tag_slug || `QT-${row.tag_id.substring(0, 6)}`,
            label: row.tag_label.trim(),
            topicType: "Question Tag",
            homeUnit: row.homeUnit || "general",
            homeUnitName: row.homeUnitName || "General",
            crossRefs: [],
            group: null,
            variants: row.tag_slug ? [row.tag_slug] : [],
            depth: "Working",
            status: "active",
            mergedInto: [],
            crossCuttingTags: ["question-bank", row.tag_slug].filter(Boolean),
            source: "question",
            usageCount: Number(row.count || 0),
          });
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] question_tags query:", e);
    }

    // 5c. Fetch tags attached to medical conditions (from condition_tags & tags tables)
    try {
      const conditionTagRows = await query<any>(`
        SELECT 
          t.id as tag_id,
          t.slug as tag_slug,
          t.label as tag_label,
          COALESCE(s.slug, mc.category, 'general') as "homeUnit",
          COALESCE(s.name, mc.category, 'General') as "homeUnitName",
          mc.kind,
          COUNT(DISTINCT ct.condition_id) as count
        FROM condition_tags ct
        JOIN tags t ON t.id = ct.tag_id
        JOIN medical_conditions mc ON mc.id = ct.condition_id
        LEFT JOIN subjects s ON s.id = mc.subject_id
        WHERE mc.deleted_at IS NULL AND t.label IS NOT NULL
        GROUP BY t.id, t.slug, t.label, s.slug, s.name, mc.category, mc.kind
      `);

      for (const row of conditionTagRows) {
        if (!row.tag_label) continue;
        const key = row.tag_label.trim().toLowerCase();
        const isApproach = row.kind === "Approach" || row.tag_label.toLowerCase().startsWith("approach to");
        const existing = topicMap.get(key);
        if (existing) {
          existing.usageCount = (existing.usageCount || 0) + Number(row.count || 0);
          if (!existing.crossCuttingTags) existing.crossCuttingTags = [];
          if (row.tag_slug && !existing.crossCuttingTags.includes(row.tag_slug)) {
            existing.crossCuttingTags.push(row.tag_slug);
          }
          if (row.tag_slug && !existing.variants.includes(row.tag_slug)) {
            existing.variants.push(row.tag_slug);
          }
        } else {
          topicMap.set(key, {
            code: row.tag_slug || `CT-${row.tag_id.substring(0, 6)}`,
            label: row.tag_label.trim(),
            topicType: isApproach ? "Approach to a Presentation" : "Clinical Tag",
            homeUnit: row.homeUnit || "general",
            homeUnitName: row.homeUnitName || "General",
            crossRefs: [],
            group: row.homeUnitName || null,
            variants: row.tag_slug ? [row.tag_slug] : [],
            depth: "Working",
            status: "active",
            mergedInto: [],
            crossCuttingTags: [row.tag_slug, isApproach ? "approach" : "condition"].filter(Boolean),
            source: isApproach ? "approach" : "condition",
            usageCount: Number(row.count || 0),
          });
        }
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] condition_tags query:", e);
    }

    // 5d. Fetch tags stored in medical_conditions.clinical_notes JSON (approaches)
    try {
      const approachWithTags = await query<any>(`
        SELECT mc.id, mc.name, mc.kind, mc.category, mc.clinical_notes, s.slug as "homeUnit", s.name as "homeUnitName"
        FROM medical_conditions mc
        LEFT JOIN subjects s ON s.id = mc.subject_id
        WHERE mc.deleted_at IS NULL AND mc.clinical_notes IS NOT NULL AND mc.clinical_notes LIKE '%tags%'
      `);

      for (const row of approachWithTags) {
        try {
          const parsed = JSON.parse(row.clinical_notes);
          if (Array.isArray(parsed.tags)) {
            for (const tagStr of parsed.tags) {
              if (!tagStr || typeof tagStr !== "string") continue;
              const cleanTag = tagStr.trim();
              const key = cleanTag.toLowerCase();
              const tagSlug = key.replace(/[^a-z0-9]+/g, "-");
              const existing = topicMap.get(key);
              if (existing) {
                if (!existing.crossCuttingTags) existing.crossCuttingTags = [];
                if (!existing.crossCuttingTags.includes(tagSlug)) existing.crossCuttingTags.push(tagSlug);
              } else {
                topicMap.set(key, {
                  code: tagSlug || `TAG-${row.id.substring(0, 6)}`,
                  label: cleanTag,
                  topicType: "Approach Tag",
                  homeUnit: row.homeUnit || row.category || "general",
                  homeUnitName: row.homeUnitName || row.category || "General",
                  crossRefs: [],
                  group: row.category || null,
                  variants: [tagSlug],
                  depth: "Awareness",
                  status: "active",
                  mergedInto: [],
                  crossCuttingTags: [tagSlug, "approach"],
                  source: "approach",
                });
              }
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn("[getAllDatabaseTopicsAction] clinical_notes tags query:", e);
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
            homeUnitName: "General",
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

    // 7. Get distinct Units from taxonomy_units and subjects
    const unitMap = new Map<string, string>();

    try {
      const subjectUnits = await query<any>(`
        SELECT slug as code, name FROM subjects WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC
      `);
      subjectUnits.forEach((s) => {
        if (s.code && s.name) unitMap.set(s.code, s.name);
      });
    } catch {}

    try {
      const dbUnits = await query<any>(`
        SELECT code, name FROM taxonomy_units ORDER BY display_order ASC, code ASC
      `);
      dbUnits.forEach((u) => {
        if (u.code && u.name) unitMap.set(u.code, u.name);
      });
    } catch {}

    // Also collect units attached to any discovered topics
    for (const t of topicMap.values()) {
      if (t.homeUnit && t.homeUnitName && !unitMap.has(t.homeUnit)) {
        unitMap.set(t.homeUnit, t.homeUnitName);
      }
    }

    const units = Array.from(unitMap.entries()).map(([code, name]) => ({ code, name }));

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
    const topicTitles = Array.from(new Set(topics.map((t) => t.label)))
      .filter((label) => Boolean(label) && !label.includes("[Enter") && !label.includes("enter-"))
      .sort((a, b) => a.localeCompare(b));

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
