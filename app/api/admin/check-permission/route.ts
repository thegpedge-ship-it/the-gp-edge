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
    const {
      user,
      capability,
      item,
      targetAssignee,
      targetRoleToAssign,
      targetAccountRole,
      findingRaiserId,
    } = body as {
      user: PermissionUser;
      capability: Capability;
      item?: PermissionTargetItem;
      targetAssignee?: PermissionUser;
      targetRoleToAssign?: string;
      targetAccountRole?: string;
      findingRaiserId?: string;
    };

    if (!user || !capability) {
      return NextResponse.json(
        { success: false, allowed: false, error: "Missing required fields: user and capability are required." },
        { status: 400 }
      );
    }

    const result = await evaluateRelationalPermission({
      user,
      capability,
      item,
      targetAssignee,
      targetRoleToAssign,
      targetAccountRole,
      findingRaiserId,
    });

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
