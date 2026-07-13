import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GET /api/medical-content/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const condition = await queryOne<any>(
      `SELECT mc.*, s.name AS subject_name
         FROM medical_conditions mc
         LEFT JOIN subjects s ON s.id = mc.subject_id
        WHERE mc.id = $1 AND mc.deleted_at IS NULL`,
      [id]
    );

    if (!condition) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const items = await query<any>(
      `SELECT item_kind, content FROM condition_items WHERE condition_id = $1 ORDER BY position ASC`,
      [id]
    );
    const refs = await query<any>(
      `SELECT id, text, url FROM condition_references WHERE condition_id = $1 ORDER BY position ASC`,
      [id]
    );
    const tagRows = await query<any>(
      `SELECT t.label FROM condition_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.condition_id = $1`,
      [id]
    );
    const docRow = await queryOne<any>(
      `SELECT f.object_key FROM condition_documents cd
         JOIN files f ON f.id = cd.file_id
        WHERE cd.condition_id = $1 LIMIT 1`,
      [id]
    );

    const sections: Record<string, string> = {};
    let fullHtml = "";
    for (const item of items) {
      if (item.item_kind === "full_html") {
        fullHtml = item.content;
      } else {
        sections[item.item_kind] = item.content;
      }
    }

    const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    return NextResponse.json({
      success: true,
      data: {
        id: condition.id,
        name: condition.name,
        system: condition.subject_name ?? "General",
        category: condition.category ?? "Clinical Reference",
        type: condition.kind,
        status: condition.status,
        author: condition.author ?? "GP Edge Admin",
        lastUpdated: new Date(condition.updated_at).toISOString().split("T")[0],
        tags: tagRows.map((r: any) => r.label),
        references: refs.map((r: any) => ({ id: r.id, text: r.text, url: r.url ?? "#" })),
        pdfUrl: docRow?.object_key ? `${publicBase}/${docRow.object_key}` : "",
        fullHtml,
        sections,
      },
    });
  } catch (err: any) {
    console.error("GET /api/medical-content/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/medical-content/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, category, type, status, author, fullHtml, sections } = body;

    // Update metadata fields that were provided
    const updates: string[] = ["updated_at = NOW()"];
    const vals: any[] = [];
    let idx = 1;
    if (name)   { updates.push(`name = $${idx++}`);     vals.push(name); }
    if (category) { updates.push(`category = $${idx++}`); vals.push(category); }
    if (type)   { updates.push(`kind = $${idx++}`);     vals.push(type); }
    if (status) { updates.push(`status = $${idx++}`);   vals.push(status); }
    if (author) { updates.push(`author = $${idx++}`);   vals.push(author); }
    vals.push(id);
    await execute(
      `UPDATE medical_conditions SET ${updates.join(", ")} WHERE id = $${idx}`,
      vals
    );

    // Upsert full_html
    if (fullHtml !== undefined) {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM condition_items WHERE condition_id = $1 AND item_kind = 'full_html' LIMIT 1`,
        [id]
      );
      if (existing) {
        await execute(
          `UPDATE condition_items SET content = $1 WHERE id = $2`,
          [fullHtml, existing.id]
        );
      } else {
        const maxPos = await queryOne<{ max: number }>(
          `SELECT COALESCE(MAX(position), 0) AS max FROM condition_items WHERE condition_id = $1`,
          [id]
        );
        await execute(
          `INSERT INTO condition_items (condition_id, item_kind, content, position) VALUES ($1,'full_html',$2,$3)`,
          [id, fullHtml, (maxPos?.max ?? 0) + 1]
        );
      }
    }

    // Upsert section items
    if (sections) {
      const sectionKindMap: Record<string, string> = {
        overview: "overview",
        pathophysiology: "pathophysiology",
        clinicalFeatures: "clinical_features",
        diagnosis: "diagnosis",
        management: "management",
        complications: "complications",
        whenToRefer: "when_to_refer",
        prognosis: "prognosis",
        resources: "resources",
      };
      for (const [jsKey, dbKind] of Object.entries(sectionKindMap)) {
        if (sections[jsKey] === undefined) continue;
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM condition_items WHERE condition_id = $1 AND item_kind = $2 LIMIT 1`,
          [id, dbKind]
        );
        if (existing) {
          await execute(
            `UPDATE condition_items SET content = $1 WHERE id = $2`,
            [sections[jsKey], existing.id]
          );
        } else {
          const maxPos = await queryOne<{ max: number }>(
            `SELECT COALESCE(MAX(position), 0) AS max FROM condition_items WHERE condition_id = $1`,
            [id]
          );
          await execute(
            `INSERT INTO condition_items (condition_id, item_kind, content, position) VALUES ($1,$2,$3,$4)`,
            [id, dbKind, sections[jsKey], (maxPos?.max ?? 0) + 1]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/medical-content/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/medical-content/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await execute(
      `UPDATE medical_conditions SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/medical-content/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
