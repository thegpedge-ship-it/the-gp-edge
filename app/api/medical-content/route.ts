import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

// Increase body size limit to handle large HTML payloads with embedded images
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GET /api/medical-content — list all conditions
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search")?.trim() || "";

    let sql = `SELECT
         mc.id, mc.name, mc.category, mc.kind, mc.status, mc.author, mc.is_free, mc.updated_at,
         s.name AS subject_name,
         (
           SELECT ARRAY_AGG(t.label)
           FROM condition_tags ct JOIN tags t ON t.id = ct.tag_id
           WHERE ct.condition_id = mc.id
         ) AS tags,
         (
           SELECT COUNT(*)::int FROM condition_references cr WHERE cr.condition_id = mc.id
         ) AS reference_count,
         f.object_key AS file_key,
         f.size_bytes AS file_size_bytes
       FROM medical_conditions mc
       LEFT JOIN subjects s ON s.id = mc.subject_id
       LEFT JOIN condition_documents cd ON cd.condition_id = mc.id
       LEFT JOIN files f ON f.id = cd.file_id
       WHERE mc.deleted_at IS NULL AND mc.kind != 'Approach'`;

    const params: any[] = [];
    if (search) {
      sql += ` AND (mc.name ILIKE $1 OR mc.category ILIKE $1 OR s.name ILIKE $1)`;
      params.push(`%${search}%`);
      sql += ` ORDER BY mc.name ASC`;
    } else {
      sql += ` ORDER BY mc.is_free DESC, mc.created_at DESC`;
    }

    const rows = await query<any>(sql, params);

    const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

    const result = rows.map((c) => ({
      id: c.id,
      name: c.name,
      system: c.subject_name ?? "General",
      category: c.category ?? "Clinical Reference",
      type: c.kind,
      status: c.status,
      author: c.author ?? "GP Edge Admin",
      isFree: c.is_free ?? false,
      lastUpdated: new Date(c.updated_at).toISOString().split("T")[0],
      tags: c.tags?.filter(Boolean) ?? [],
      references: c.reference_count ?? 0,
      usedInQuestions: 0,
      pdfUrl: c.file_key ? `${publicBase}/${c.file_key}` : "",
      pdfSize: c.file_size_bytes
        ? `${(Number(c.file_size_bytes) / 1048576).toFixed(2)} MB`
        : "",
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("GET /api/medical-content error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/medical-content — create a new condition
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, system, category, type, status, author, isFree, is_free, tags, references, fullHtml, sections, pdfUrl, pdfSize } = body;
    const isFreeVal = Boolean(isFree ?? is_free ?? false);

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
      "-" + Date.now();

    // Find or create subject
    let subject = await queryOne<{ id: string }>(
      `SELECT id FROM subjects WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [system ?? "General"]
    );
    if (!subject) {
      const subjectSlug = (system ?? "general").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      subject = await queryOne<{ id: string }>(
        `INSERT INTO subjects (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [system ?? "General", subjectSlug]
      );
    }

    // Create condition
    const condition = await queryOne<{ id: string; slug: string }>(
      `INSERT INTO medical_conditions
         (slug, name, subject_id, category, kind, status, author, is_free, clinical_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'')
       RETURNING id, slug`,
      [slug, name, subject!.id, category ?? "Clinical Reference", type ?? "Document", status ?? "draft", author ?? "GP Edge Admin", isFreeVal]
    );
    const conditionId = condition!.id;

    // Store full_html first — always insert it so the viewer always has content to show.
    // We insert even when the string is empty so that a later PATCH can update it in-place.
    const fullHtmlValue = sanitizeHtml((fullHtml ?? "").trim());
    await execute(
      `INSERT INTO condition_items (condition_id, item_kind, content, position)
       VALUES ($1, 'full_html', $2, 0)`,
      [conditionId, fullHtmlValue]
    );

    // Store individual section items (skip genuinely empty ones)
    const sectionMap: Record<string, { kind: string; value: string }> = {
      overview:         { kind: "overview",         value: sections?.overview ?? "" },
      pathophysiology:  { kind: "pathophysiology",  value: sections?.pathophysiology ?? "" },
      clinicalFeatures: { kind: "clinical_features", value: sections?.clinicalFeatures ?? "" },
      diagnosis:        { kind: "diagnosis",         value: sections?.diagnosis ?? "" },
      management:       { kind: "management",        value: sections?.management ?? "" },
      complications:    { kind: "complications",     value: sections?.complications ?? "" },
      whenToRefer:      { kind: "when_to_refer",     value: sections?.whenToRefer ?? "" },
      prognosis:        { kind: "prognosis",          value: sections?.prognosis ?? "" },
      resources:        { kind: "resources",          value: sections?.resources ?? "" },
    };
    let position = 1;
    for (const { kind, value } of Object.values(sectionMap)) {
      if (value.trim()) {
        await execute(
          `INSERT INTO condition_items (condition_id, item_kind, content, position)
           VALUES ($1, $2, $3, $4)`,
          [conditionId, kind, value, position++]
        );
      }
    }

    // Store references
    if (references?.length > 0) {
      for (let i = 0; i < references.length; i++) {
        const ref = typeof references[i] === "string" ? references[i] : references[i].text;
        const url = typeof references[i] === "string" ? "#" : references[i].url ?? "#";
        await execute(
          `INSERT INTO condition_references (condition_id, text, url, position) VALUES ($1,$2,$3,$4)`,
          [conditionId, ref, url, i]
        );
      }
    }

    // Store tags
    if (tags?.length > 0) {
      for (const tagLabel of tags) {
        const tagSlug = tagLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let tag = await queryOne<{ id: string }>(
          `SELECT id FROM tags WHERE slug = $1 LIMIT 1`,
          [tagSlug]
        );
        if (!tag) {
          tag = await queryOne<{ id: string }>(
            `INSERT INTO tags (slug, label) VALUES ($1, $2)
             ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
             RETURNING id`,
            [tagSlug, tagLabel]
          );
        }
        await execute(
          `INSERT INTO condition_tags (condition_id, tag_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [conditionId, tag!.id]
        );
      }
    }

    // Store PDF R2 reference in files + condition_documents
    if (pdfUrl) {
      const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
      const objectKey = pdfUrl.startsWith(publicBase)
        ? pdfUrl.slice(publicBase.length).replace(/^\//, "")
        : pdfUrl;
      const sizeBytes = pdfSize ? Math.round(parseFloat(pdfSize) * 1048576) : 0;
      const file = await queryOne<{ id: string }>(
        `INSERT INTO files (bucket, object_key, original_name, mime_type, size_bytes)
         VALUES ($1,$2,$3,'application/pdf',$4)
         RETURNING id`,
        [process.env.R2_BUCKET_NAME ?? "thegpedge1234", objectKey, name + ".pdf", sizeBytes]
      );
      await execute(
        `INSERT INTO condition_documents (condition_id, file_id, summary)
         VALUES ($1,$2,'')`,
        [conditionId, file!.id]
      );
    }

    return NextResponse.json({ success: true, id: conditionId, slug: condition!.slug });
  } catch (err: any) {
    console.error("POST /api/medical-content error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
