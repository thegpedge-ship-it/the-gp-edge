"use server";

import { query, queryOne, execute } from "@/lib/db";
import { ApproachCard } from "@/lib/quizData";

import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";

function toUUID(str: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();
  const clean = str.replace(/[^0-9a-f]/gi, "").toLowerCase();
  const pad = "00000000000000000000000000000000";
  const hex = (clean + pad).substring(0, 32);
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

function mapRowToApproachCard(row: any): ApproachCard {
  let extra: any = {};
  if (row.clinical_notes) {
    try { extra = JSON.parse(row.clinical_notes); } catch { extra = { overview: row.clinical_notes }; }
  }
  return {
    id: row.id,
    title: row.name,
    subtitle: extra.subtitle || "",
    system: extra.system || "Cardiology",
    category: row.category || "",
    status: row.deleted_at ? "archived" : row.status === "published" ? "published" : row.status === "review" ? "review" : "draft",
    lastUpdated: row.updated_at
      ? new Date(row.updated_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    author: row.author || "GP Edge Admin",
    isPremium: row.is_premium || false,
    isFree: row.is_free || false,
    tags: extra.tags || [],
    overview: extra.overview || "",
    steps: extra.steps || [],
    keyPoints: extra.keyPoints || [],
    redFlags: extra.redFlags || [],
    references: extra.references || [],
    fullHtml: row.full_html || "",
  };
}

export async function getApproachCardsFromDbAction(includeArchived: boolean = false): Promise<ApproachCard[]> {
  try {
    const whereClause = includeArchived
      ? `WHERE mc.kind = 'Approach'`
      : `WHERE mc.kind = 'Approach' AND mc.deleted_at IS NULL`;
    const rows = await query(
      `SELECT mc.*, ci.content AS full_html
         FROM medical_conditions mc
         LEFT JOIN condition_items ci
           ON ci.condition_id = mc.id AND ci.item_kind = 'full_html'
        ${whereClause}
        ORDER BY mc.is_free DESC, mc.updated_at DESC`
    );
    return rows.map(mapRowToApproachCard);
  } catch (error) {
    console.error("Error fetching approach cards from DB:", error);
    return [];
  }
}

export async function saveApproachCardToDbAction(card: ApproachCard, adminUser?: PermissionUser): Promise<{ success: boolean; error?: string }> {
  try {
    const dbId = toUUID(card.id);
    const existing = await queryOne<{ id: string; author: string }>(
      `SELECT id, author FROM medical_conditions WHERE id = $1 AND kind = 'Approach'`,
      [dbId]
    );

    if (adminUser) {
      const capability = card.status === "published" || card.status === "review" ? "review" : existing ? "edit" : "create";
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability,
        item: { id: dbId, type: "approach", author: card.author },
      });
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }
    }

    const slug = `approach-${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${dbId.substring(0, 8)}`;
    const extraJson = JSON.stringify({
      subtitle: card.subtitle,
      system: card.system,
      tags: card.tags,
      overview: card.overview,
      steps: card.steps,
      keyPoints: card.keyPoints,
      redFlags: card.redFlags,
      references: card.references,
    });
    const statusVal = card.status === "published" ? "published" : card.status === "review" ? "review" : "draft";

    await execute(
      `INSERT INTO medical_conditions
         (id, slug, name, category, kind, status, is_premium, is_free, clinical_notes, author, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'Approach',$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         status = EXCLUDED.status,
         is_premium = EXCLUDED.is_premium,
         is_free = EXCLUDED.is_free,
         clinical_notes = EXCLUDED.clinical_notes,
         author = EXCLUDED.author,
         updated_at = NOW()`,
      [dbId, slug, card.title, card.category || "Clinical Reference", statusVal, card.isPremium ?? false, card.isFree ?? false, extraJson, card.author || adminUser?.name || "GP Edge Admin"]
    );

    // Store fullHtml in condition_items
    if (card.fullHtml) {
      const existingItem = await queryOne<{ id: string }>(
        `SELECT id FROM condition_items WHERE condition_id = $1 AND item_kind = 'full_html' LIMIT 1`,
        [dbId]
      );
      if (existingItem) {
        await execute(
          `UPDATE condition_items SET content = $1 WHERE id = $2`,
          [card.fullHtml, existingItem.id]
        );
      } else {
        await execute(
          `INSERT INTO condition_items (condition_id, item_kind, content, position)
           VALUES ($1, 'full_html', $2, 0)
           ON CONFLICT DO NOTHING`,
          [dbId, card.fullHtml]
        );
      }
    }

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: existing ? "update" : "create",
      category: "approach",
      entityType: "approach",
      entityId: dbId,
      metadata: { title: card.title, author: card.author || adminUser?.name || adminUser?.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error saving approach card to DB:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteApproachCardFromDbAction(id: string, adminUser?: PermissionUser): Promise<{ success: boolean; error?: string }> {
  try {
    const dbId = toUUID(id);

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: "archive_item",
        item: { id: dbId, type: "approach" },
      });
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }
    }

    await execute(
      `UPDATE medical_conditions SET deleted_at = NOW() WHERE id = $1`,
      [dbId]
    );

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: "archive",
      category: "approach",
      entityType: "approach",
      entityId: dbId,
      metadata: { archivedBy: adminUser?.name || adminUser?.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error archiving approach card from DB:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restores an archived approach card.
 * SA-ONLY (Super Admin)!
 */
export async function restoreApproachCardFromDbAction(id: string, adminUser: PermissionUser): Promise<{ success: boolean; error?: string }> {
  try {
    const dbId = toUUID(id);

    const permCheck = await evaluateRelationalPermission({
      user: adminUser,
      capability: "restore_item",
      item: { id: dbId, type: "approach" },
    });

    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason };
    }

    await execute(
      `UPDATE medical_conditions SET deleted_at = NULL, updated_at = NOW() WHERE id = $1`,
      [dbId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "restore",
      category: "approach",
      entityType: "approach",
      entityId: dbId,
      metadata: { restoredBy: adminUser.name || adminUser.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error restoring approach card from DB:", error);
    return { success: false, error: error.message };
  }
}



export async function syncApproachCardsToDbAction(cards: ApproachCard[]): Promise<boolean> {
  try {
    for (const card of cards) await saveApproachCardToDbAction(card);
    return true;
  } catch (error) {
    console.error("Error syncing approach cards to DB:", error);
    return false;
  }
}

export async function getTagsFromDbAction(): Promise<string[]> {
  try {
    const rows = await query<{ label: string }>(
      `SELECT label FROM tags ORDER BY label ASC`
    );
    return rows.map((r) => r.label);
  } catch (error) {
    console.error("Error fetching tags from DB:", error);
    return [];
  }
}

import { revalidatePath } from "next/cache";

export async function addTagToDbAction(label: string): Promise<boolean> {
  try {
    const trimmed = label.trim();
    if (!trimmed) return false;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const result = await execute(
      `INSERT INTO tags (slug, label) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [slug, trimmed]
    );
    return result > 0;
  } catch (error) {
    console.error("Error creating tag in database:", error);
    return false;
  }
}

/**
 * Light, dedicated mutation Server Action to toggle the is_free status of a Medical Content / Library item.
 */
export async function toggleLibraryItemFreeStatus(
  id: string,
  is_free: boolean
): Promise<{ success: boolean; item?: any; error?: string }> {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let dbId = id;
    if (id.startsWith("CUSTOM-APPROACH-") || id.startsWith("CUSTOM-")) {
      dbId = id.replace("CUSTOM-APPROACH-", "").replace("CUSTOM-", "");
    }

    let rows: any[] = [];
    if (uuidRegex.test(dbId)) {
      rows = await query<any>(
        `UPDATE medical_conditions SET is_free = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
        [is_free, dbId]
      );
    } else {
      rows = await query<any>(
        `UPDATE medical_conditions SET is_free = $1, updated_at = NOW() WHERE (name = $2 OR slug = $2) AND deleted_at IS NULL RETURNING *`,
        [is_free, id]
      );
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/medical-library");
    revalidatePath("/dashboard");

    return { success: true, item: rows[0] ?? null };
  } catch (error: any) {
    console.error("Error toggling library item free status:", error);
    return { success: false, error: error.message || "Failed to update item free status in database." };
  }
}
