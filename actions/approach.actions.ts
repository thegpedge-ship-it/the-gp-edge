"use server";

import { query, queryOne, execute } from "@/lib/db";
import { ApproachCard } from "@/lib/quizData";

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
    status: row.status === "published" ? "published" : row.status === "review" ? "review" : "draft",
    lastUpdated: row.updated_at
      ? new Date(row.updated_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    author: row.author || "GP Edge Admin",
    isPremium: row.is_premium || false,
    tags: extra.tags || [],
    overview: extra.overview || "",
    steps: extra.steps || [],
    keyPoints: extra.keyPoints || [],
    redFlags: extra.redFlags || [],
    references: extra.references || [],
  };
}

export async function getApproachCardsFromDbAction(): Promise<ApproachCard[]> {
  try {
    const rows = await query(
      `SELECT * FROM medical_conditions
        WHERE kind = 'Approach' AND deleted_at IS NULL
        ORDER BY updated_at DESC`
    );
    return rows.map(mapRowToApproachCard);
  } catch (error) {
    console.error("Error fetching approach cards from DB:", error);
    return [];
  }
}

export async function saveApproachCardToDbAction(card: ApproachCard): Promise<boolean> {
  try {
    const dbId = toUUID(card.id);
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
         (id, slug, name, category, kind, status, is_premium, clinical_notes, author, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'Approach',$5,$6,$7,$8,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         status = EXCLUDED.status,
         is_premium = EXCLUDED.is_premium,
         clinical_notes = EXCLUDED.clinical_notes,
         author = EXCLUDED.author,
         updated_at = NOW()`,
      [dbId, slug, card.title, card.category, statusVal, card.isPremium, extraJson, card.author]
    );
    return true;
  } catch (error) {
    console.error("Error saving approach card to DB:", error);
    return false;
  }
}

export async function deleteApproachCardFromDbAction(id: string): Promise<boolean> {
  try {
    const dbId = toUUID(id);
    await execute(
      `UPDATE medical_conditions SET deleted_at = NOW() WHERE id = $1`,
      [dbId]
    );
    return true;
  } catch (error) {
    console.error("Error deleting approach card from DB:", error);
    return false;
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
