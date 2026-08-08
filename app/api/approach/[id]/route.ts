import { NextRequest, NextResponse } from "next/server";
import { queryOne, query, execute } from "@/lib/db";
import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";


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

// PATCH /api/approach/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, author, adminUser } = body;

    const row = await queryOne<any>(
      `SELECT mc.id, mc.author, mc.status FROM medical_conditions mc WHERE mc.id = $1 AND mc.kind = 'Approach'`,
      [id]
    );

    if (!row) {
      return NextResponse.json({ success: false, error: "Approach not found" }, { status: 404 });
    }

    const userContext: PermissionUser = adminUser || {
      id: "admin-system",
      name: author || "GP Edge Admin",
      role: "Admin",
    };

    const isReview = status === "published" || status === "review";
    const permCheck = await evaluateRelationalPermission({
      user: userContext,
      capability: isReview ? "review" : "edit",
      item: { id, type: "approach", author: row.author },
    });

    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason, code: permCheck.code },
        { status: 403 }
      );
    }

    if (status) {
      await execute(`UPDATE medical_conditions SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
    }

    await recordAuditLog({
      adminUserId: userContext.id,
      action: isReview ? "review" : "update",
      category: "approach",
      entityType: "approach",
      entityId: id,
      metadata: { status, reviewer: userContext.name },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/approach/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/approach/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let adminUser: PermissionUser | undefined;
    try {
      const body = await req.json();
      adminUser = body?.adminUser;
    } catch {
      // Body may be empty
    }

    const userContext: PermissionUser = adminUser || {
      id: "admin-system",
      name: "GP Edge Admin",
      role: "Admin",
    };

    const permCheck = await evaluateRelationalPermission({
      user: userContext,
      capability: "delete",
      item: { id, type: "approach" },
    });

    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason, code: permCheck.code },
        { status: 403 }
      );
    }

    await execute(`UPDATE medical_conditions SET deleted_at = NOW() WHERE id = $1`, [id]);

    await recordAuditLog({
      adminUserId: userContext.id,
      action: "delete",
      category: "approach",
      entityType: "approach",
      entityId: id,
      metadata: { deletedBy: userContext.name },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/approach/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

