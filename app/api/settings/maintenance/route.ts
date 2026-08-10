import { NextResponse } from "next/server";
import { getMaintenanceSettingsAction } from "@/actions/settings.actions";

export const revalidate = 0; // Dynamic route, no caching

export async function GET() {
  try {
    const settings = await getMaintenanceSettingsAction();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch maintenance status" },
      { status: 500 }
    );
  }
}
