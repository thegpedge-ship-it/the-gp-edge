"use server";

import prisma from "@/lib/prisma";
import { ApproachCard } from "@/lib/quizData";

// Helper to convert string to a valid UUID format deterministically
function toUUID(str: string): string {
  // If it's already a valid UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }

  // Create a deterministic UUID-like string from the input string
  // Clean string to hexadecimal characters
  const clean = str.replace(/[^0-9a-f]/gi, "").toLowerCase();
  const pad = "00000000000000000000000000000000";
  const hex = (clean + pad).substring(0, 32);
  
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Map a DB medical condition to an ApproachCard
function mapDbToApproachCard(dbCond: any): ApproachCard {
  let extra: any = {};
  if (dbCond.clinical_notes) {
    try {
      extra = JSON.parse(dbCond.clinical_notes);
    } catch {
      // Fallback if not JSON
      extra = { overview: dbCond.clinical_notes };
    }
  }

  return {
    id: dbCond.id,
    title: dbCond.name,
    subtitle: extra.subtitle || "",
    system: extra.system || "Cardiology",
    category: dbCond.category || "",
    status: dbCond.status === "published" ? "published" : dbCond.status === "review" ? "review" : "draft",
    lastUpdated: dbCond.updated_at ? new Date(dbCond.updated_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    author: dbCond.author || "GP Edge Admin",
    isPremium: dbCond.is_premium || false,
    tags: extra.tags || [],
    overview: extra.overview || "",
    steps: extra.steps || [],
    keyPoints: extra.keyPoints || [],
    redFlags: extra.redFlags || [],
    references: extra.references || [],
  };
}

/**
 * Fetch all clinical approach cards from the Neon Postgres database.
 */
export async function getApproachCardsFromDbAction(): Promise<ApproachCard[]> {
  try {
    const dbConds = await prisma.medical_conditions.findMany({
      where: {
        kind: "Approach",
        deleted_at: null,
      },
      orderBy: {
        updated_at: "desc",
      },
    });
    return dbConds.map(mapDbToApproachCard);
  } catch (error) {
    console.error("Error fetching approach cards from Neon:", error);
    return [];
  }
}

/**
 * Save / Upsert an approach card in the Neon Postgres database.
 */
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

    await prisma.medical_conditions.upsert({
      where: { id: dbId },
      update: {
        slug,
        name: card.title,
        category: card.category,
        status: statusVal as any,
        is_premium: card.isPremium,
        clinical_notes: extraJson,
        author: card.author,
        updated_at: new Date(),
      },
      create: {
        id: dbId,
        slug,
        name: card.title,
        category: card.category,
        kind: "Approach",
        status: statusVal as any,
        is_premium: card.isPremium,
        clinical_notes: extraJson,
        author: card.author,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error saving approach card to Neon:", error);
    return false;
  }
}

/**
 * Delete an approach card from the Neon Postgres database.
 */
export async function deleteApproachCardFromDbAction(id: string): Promise<boolean> {
  try {
    const dbId = toUUID(id);
    await prisma.medical_conditions.update({
      where: { id: dbId },
      data: {
        deleted_at: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error deleting approach card from Neon:", error);
    return false;
  }
}

/**
 * Sync approach cards from local list to the Neon Postgres database.
 */
export async function syncApproachCardsToDbAction(cards: ApproachCard[]): Promise<boolean> {
  try {
    for (const card of cards) {
      await saveApproachCardToDbAction(card);
    }
    return true;
  } catch (error) {
    console.error("Error syncing approach cards to Neon:", error);
    return false;
  }
}

/**
 * Fetch all available tags from the database.
 */
export async function getTagsFromDbAction(): Promise<string[]> {
  try {
    const dbTags = await prisma.tags.findMany({
      orderBy: {
        label: "asc",
      },
    });
    return dbTags.map(t => t.label);
  } catch (error) {
    console.error("Error fetching tags from Neon:", error);
    return [];
  }
}

/**
 * Create a new tag in the database if it does not already exist.
 */
export async function addTagToDbAction(label: string): Promise<boolean> {
  try {
    const trimmed = label.trim();
    if (!trimmed) return false;
    const slugged = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    const existing = await prisma.tags.findUnique({
      where: { slug: slugged },
    });
    
    if (!existing) {
      await prisma.tags.create({
        data: {
          slug: slugged,
          label: trimmed,
        },
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating tag in database:", error);
    return false;
  }
}


