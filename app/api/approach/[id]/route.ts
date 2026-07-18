import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GET /api/approach/[id]
// Returns a single Approach with its fullHtml from condition_items
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const row = await queryOne<any>(
      `SELECT mc.*
         FROM medical_conditions mc
        WHERE mc.id = $1 AND mc.kind = 'Approach' AND mc.deleted_at IS NULL`,
      [id]
    );

    if (!row) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // fullHtml stored in condition_items
    const htmlRow = await queryOne<any>(
      `SELECT content FROM condition_items
        WHERE condition_id = $1 AND item_kind = 'full_html' LIMIT 1`,
      [id]
    );

    // Parse extra JSON (steps, overview, keyPoints, redFlags, etc.)
    let extra: any = {};
    if (row.clinical_notes) {
      try { extra = JSON.parse(row.clinical_notes); } catch { extra = {}; }
    }

    // Tags
    const tagRows = await query<any>(
      `SELECT t.label FROM condition_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.condition_id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        title: row.name,
        subtitle: extra.subtitle || "",
        system: extra.system || "Cardiology",
        category: row.category || "",
        status: row.status,
        author: row.author || "GP Edge Admin",
        lastUpdated: new Date(row.updated_at).toISOString().split("T")[0],
        isPremium: row.is_premium || false,
        tags: tagRows.map((r: any) => r.label),
        overview: extra.overview || "",
        steps: extra.steps || [],
        keyPoints: extra.keyPoints || [],
        redFlags: extra.redFlags || [],
        references: extra.references || [],
        fullHtml: htmlRow?.content || "",
      },
    });
  } catch (err: any) {
    console.error("GET /api/approach/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
