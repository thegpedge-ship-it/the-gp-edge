import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { recordAuditLog } from "@/lib/relationalPermissions";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

let tablesInitialized = false;
async function ensureTablesExist() {
  if (tablesInitialized) return;
  try {
    await execute(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_change_type') THEN
          CREATE TYPE edit_change_type AS ENUM ('added','deleted','modified','status_change','meta_change','restored');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS content_edit_history (
        id              BIGSERIAL PRIMARY KEY,
        entity_id       TEXT NOT NULL,
        entity_type     TEXT NOT NULL,
        field_name      TEXT NOT NULL,
        change_type     edit_change_type NOT NULL,
        old_content     TEXT,
        new_content     TEXT,
        admin_user_id   TEXT,
        admin_user_name TEXT,
        session_id      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS content_versions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_id       TEXT NOT NULL,
        entity_type     TEXT NOT NULL,
        version_number  INT NOT NULL,
        label           TEXT,
        full_html       TEXT,
        metadata        JSONB,
        created_by      TEXT,
        created_by_name TEXT,
        restored_from   UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    tablesInitialized = true;
  } catch (e) {
    console.error("Auto-init content history tables error:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content-history/[entityId]
// ?type=medical_condition|approach   (default: medical_condition)
// ?limit=50 (default 50, max 200)
// ?offset=0
// Returns: { success, history: EditHistoryEntry[], total }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    await ensureTablesExist();
    const { entityId } = await params;
    const { searchParams } = req.nextUrl;
    const entityType = searchParams.get("type") || "medical_condition";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const offset = Number(searchParams.get("offset") || 0);
    const resource = searchParams.get("resource") || "history"; // "history" | "versions"

    if (resource === "versions") {
      // ── Return version snapshots ────────────────────────────────────────
      const versions = await query<any>(
        `SELECT
            cv.id, cv.entity_id, cv.entity_type, cv.version_number, cv.label,
            cv.full_html, cv.metadata, cv.created_by, cv.created_by_name, cv.restored_from,
            cv.created_at,
            LENGTH(cv.full_html) AS html_size
          FROM content_versions cv
         WHERE cv.entity_id = $1 AND cv.entity_type = $2
         ORDER BY cv.version_number DESC
         LIMIT $3 OFFSET $4`,
        [entityId, entityType, limit, offset]
      );

      const total = await queryOne<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM content_versions WHERE entity_id = $1 AND entity_type = $2`,
        [entityId, entityType]
      );

      return NextResponse.json({
        success: true,
        versions: versions.map((v) => ({
          id: v.id,
          entityId: v.entity_id,
          entityType: v.entity_type,
          versionNumber: v.version_number,
          label: v.label,
          fullHtml: v.full_html,
          metadata: v.metadata,
          createdBy: v.created_by,
          createdByName: v.created_by_name,
          restoredFrom: v.restored_from,
          createdAt: v.created_at,
          htmlSize: v.html_size,
        })),
        total: total?.count ?? 0,
      });
    }

    // ── Default: Return edit history ─────────────────────────────────────
    const history = await query<any>(
      `SELECT
          ceh.id, ceh.entity_id, ceh.entity_type, ceh.field_name,
          ceh.change_type, ceh.old_content, ceh.new_content,
          ceh.admin_user_id, ceh.admin_user_name, ceh.session_id, ceh.created_at
        FROM content_edit_history ceh
       WHERE ceh.entity_id = $1 AND ceh.entity_type = $2
       ORDER BY ceh.created_at DESC
       LIMIT $3 OFFSET $4`,
      [entityId, entityType, limit, offset]
    );

    const total = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM content_edit_history WHERE entity_id = $1 AND entity_type = $2`,
      [entityId, entityType]
    );

    return NextResponse.json({
      success: true,
      history: history.map((h) => ({
        id: String(h.id),
        entityId: h.entity_id,
        entityType: h.entity_type,
        fieldName: h.field_name,
        changeType: h.change_type,
        oldContent: h.old_content,
        newContent: h.new_content,
        adminUserId: h.admin_user_id,
        adminUserName: h.admin_user_name || "Unknown",
        sessionId: h.session_id,
        createdAt: h.created_at,
      })),
      total: total?.count ?? 0,
    });
  } catch (err: any) {
    console.error("GET /api/content-history error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content-history/[entityId]
// Body: { resource?: "history"|"version"|"restore", ...payload }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    await ensureTablesExist();
    const { entityId } = await params;
    const body = await req.json();
    const { resource = "history" } = body;

    // ── Record a new edit history entry ──────────────────────────────────
    if (resource === "history") {
      const {
        entityType = "medical_condition",
        fieldName,
        changeType,
        oldContent,
        newContent,
        adminUserId,
        adminUserName,
        sessionId,
      } = body;

      if (!fieldName || !changeType) {
        return NextResponse.json(
          { success: false, error: "fieldName and changeType are required" },
          { status: 400 }
        );
      }

      const result = await queryOne<{ id: string }>(
        `INSERT INTO content_edit_history
            (entity_id, entity_type, field_name, change_type, old_content, new_content,
             admin_user_id, admin_user_name, session_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
        [
          entityId,
          entityType,
          fieldName,
          changeType,
          oldContent ?? null,
          newContent ?? null,
          adminUserId ?? null,
          adminUserName ?? null,
          sessionId ?? null,
        ]
      );

      return NextResponse.json({ success: true, id: result?.id });
    }

    // ── Create a new version snapshot ─────────────────────────────────────
    if (resource === "version") {
      const {
        entityType = "medical_condition",
        fullHtml,
        metadata,
        label,
        createdBy,
        createdByName,
      } = body;

      // Get the next version number for this entity
      const maxVersion = await queryOne<{ max: number }>(
        `SELECT COALESCE(MAX(version_number), 0) AS max FROM content_versions WHERE entity_id = $1`,
        [entityId]
      );
      const nextVersion = (maxVersion?.max ?? 0) + 1;

      const timeStr = new Date().toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const autoLabel = label || `v${nextVersion} – ${timeStr}`;

      const result = await queryOne<{ id: string }>(
        `INSERT INTO content_versions
            (entity_id, entity_type, version_number, label, full_html, metadata, created_by, created_by_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
        [
          entityId,
          entityType,
          nextVersion,
          autoLabel,
          fullHtml ?? null,
          metadata ? JSON.stringify(metadata) : null,
          createdBy ?? null,
          createdByName ?? null,
        ]
      );

      // Record audit log
      await recordAuditLog({
        adminUserId: createdBy,
        action: "version_saved",
        category: entityType,
        entityType,
        entityId,
        metadata: { versionNumber: nextVersion, label: autoLabel, savedBy: createdByName },
      });

      return NextResponse.json({
        success: true,
        id: result?.id,
        versionNumber: nextVersion,
        label: autoLabel,
      });
    }

    // ── Restore a previous version ────────────────────────────────────────
    if (resource === "restore") {
      const { versionId, adminUserId, adminUserName, entityType = "medical_condition" } = body;

      if (!versionId) {
        return NextResponse.json(
          { success: false, error: "versionId is required" },
          { status: 400 }
        );
      }

      // Fetch the version
      const version = await queryOne<any>(
        `SELECT * FROM content_versions WHERE id = $1 AND entity_id = $2`,
        [versionId, entityId]
      );

      if (!version) {
        return NextResponse.json(
          { success: false, error: "Version not found" },
          { status: 404 }
        );
      }

      // Fetch the current content before restoring (for history record)
      const currentHtml = await queryOne<{ content: string }>(
        `SELECT content FROM condition_items WHERE condition_id = $1 AND item_kind = 'full_html' LIMIT 1`,
        [entityId]
      );

      // Apply the restored HTML
      if (version.full_html !== null && version.full_html !== undefined) {
        const existingItem = await queryOne<{ id: string }>(
          `SELECT id FROM condition_items WHERE condition_id = $1 AND item_kind = 'full_html' LIMIT 1`,
          [entityId]
        );
        if (existingItem) {
          await execute(
            `UPDATE condition_items SET content = $1 WHERE id = $2`,
            [version.full_html, existingItem.id]
          );
        } else {
          await execute(
            `INSERT INTO condition_items (condition_id, item_kind, content, position) VALUES ($1, 'full_html', $2, 0)`,
            [entityId, version.full_html]
          );
        }
        await execute(
          `UPDATE medical_conditions SET updated_at = NOW() WHERE id = $1`,
          [entityId]
        );
      }

      // Also restore metadata if present
      if (version.metadata) {
        const meta = typeof version.metadata === "string"
          ? JSON.parse(version.metadata)
          : version.metadata;
        const metaUpdates: string[] = [];
        const metaVals: any[] = [];
        let mi = 1;
        if (meta.name)   { metaUpdates.push(`name = $${mi++}`);   metaVals.push(meta.name); }
        if (meta.status) { metaUpdates.push(`status = $${mi++}`); metaVals.push(meta.status); }
        if (meta.author) { metaUpdates.push(`author = $${mi++}`); metaVals.push(meta.author); }
        if (metaUpdates.length > 0) {
          metaVals.push(entityId);
          await execute(
            `UPDATE medical_conditions SET ${metaUpdates.join(", ")}, updated_at = NOW() WHERE id = $${mi}`,
            metaVals
          );
        }
      }

      // Record a history entry for this restore
      await execute(
        `INSERT INTO content_edit_history
            (entity_id, entity_type, field_name, change_type, old_content, new_content,
             admin_user_id, admin_user_name)
           VALUES ($1, $2, 'full_html', 'restored', $3, $4, $5, $6)`,
        [
          entityId,
          entityType,
          currentHtml?.content ?? null,
          version.full_html ?? null,
          adminUserId ?? null,
          adminUserName ?? null,
        ]
      );

      // Also create a version snapshot of what we're about to overwrite (safety net)
      const maxVersion = await queryOne<{ max: number }>(
        `SELECT COALESCE(MAX(version_number), 0) AS max FROM content_versions WHERE entity_id = $1`,
        [entityId]
      );
      await execute(
        `INSERT INTO content_versions
            (entity_id, entity_type, version_number, label, full_html, created_by, created_by_name, restored_from)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entityId,
          entityType,
          (maxVersion?.max ?? 0) + 1,
          `Restored from v${version.version_number} by ${adminUserName ?? "Admin"} – ${new Date().toLocaleDateString("en-AU")}`,
          version.full_html,
          adminUserId ?? null,
          adminUserName ?? null,
          versionId,
        ]
      );

      await recordAuditLog({
        adminUserId,
        action: "version_restored",
        category: entityType,
        entityType,
        entityId,
        metadata: {
          restoredVersionId: versionId,
          restoredVersionNumber: version.version_number,
          restoredBy: adminUserName,
        },
      });

      return NextResponse.json({
        success: true,
        restoredHtml: version.full_html,
        restoredMetadata: version.metadata,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown resource: ${resource}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/content-history error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content-history/[entityId]/full-version
// Returns the full HTML for a single version (separate to avoid large payloads in list)
// Query: ?versionId=<uuid>
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { searchParams } = req.nextUrl;
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json({ success: false, error: "versionId required" }, { status: 400 });
    }

    const version = await queryOne<any>(
      `SELECT id, version_number, label, full_html, metadata, created_by_name, created_at
         FROM content_versions WHERE id = $1 AND entity_id = $2`,
      [versionId, entityId]
    );

    if (!version) {
      return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        versionNumber: version.version_number,
        label: version.label,
        fullHtml: version.full_html,
        metadata: version.metadata,
        createdByName: version.created_by_name,
        createdAt: version.created_at,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/content-history error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
