import { NextRequest, NextResponse } from "next/server";
import { evaluateRelationalPermission, PermissionUser, Capability, PermissionTargetItem } from "@/lib/relationalPermissions";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/check-permission
 * Central endpoint for evaluating relational permissions per request.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, capability, item } = body as {
      user: PermissionUser;
      capability: Capability;
      item?: PermissionTargetItem;
    };

    if (!user || !capability) {
      return NextResponse.json(
        { success: false, allowed: false, error: "Missing required fields: user and capability are required." },
        { status: 400 }
      );
    }

    const result = await evaluateRelationalPermission({ user, capability, item });

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          code: result.code,
          error: result.reason || "Permission denied.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      code: "ALLOWED",
    });
  } catch (err: any) {
    console.error("POST /api/admin/check-permission error:", err);
    return NextResponse.json(
      { success: false, allowed: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
