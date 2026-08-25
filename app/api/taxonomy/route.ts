import { NextRequest, NextResponse } from "next/server";
import {
  getUnits,
  auditQuotaAdherence,
  TaxonomyTopic,
} from "@/lib/taxonomy";
import {
  preloadTaxonomy,
  moveTopicUnitDb,
  updateTopicDb,
} from "@/lib/taxonomyDb.server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * GET /api/taxonomy
 * Returns units, topics, and taxonomy schema with optional filter parameters.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const unitCode = searchParams.get("unit");
    const queryStr = searchParams.get("search")?.toLowerCase();
    const depthTier = searchParams.get("depth");
    const topicType = searchParams.get("type");
    const tag = searchParams.get("tag");

    // Load from DB first
    const taxonomy = await preloadTaxonomy();
    let filteredTopics: TaxonomyTopic[] = taxonomy.topics;

    if (unitCode) {
      filteredTopics = filteredTopics.filter(
        (t) => t.homeUnit === unitCode || (t.crossRefs && t.crossRefs.includes(unitCode))
      );
    }

    if (depthTier) {
      filteredTopics = filteredTopics.filter((t) => t.depth === depthTier);
    }

    if (topicType) {
      filteredTopics = filteredTopics.filter((t) => t.topicType === topicType);
    }

    if (tag) {
      filteredTopics = filteredTopics.filter((t) => t.crossCuttingTags && t.crossCuttingTags.includes(tag));
    }

    if (queryStr) {
      filteredTopics = filteredTopics.filter(
        (t) =>
          t.code.toLowerCase().includes(queryStr) ||
          t.label.toLowerCase().includes(queryStr) ||
          (t.variants && t.variants.some((v) => v.toLowerCase().includes(queryStr)))
      );
    }

    const units = getUnits();
    const auditStats = auditQuotaAdherence();

    return NextResponse.json({
      success: true,
      schemaVersion: taxonomy.schemaVersion,
      generated: taxonomy.generated,
      unitsCount: units.length,
      topicsCount: filteredTopics.length,
      auditStats,
      units,
      topics: filteredTopics,
    });
  } catch (error: any) {
    console.error("[GET /api/taxonomy] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/taxonomy
 * Handles actions: 'move_unit', 'update_topic', or 'sync_schema'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topicCode, newHomeUnit, newGroupCode, updates } = body;

    // Load from DB first
    await preloadTaxonomy();

    if (action === "move_unit") {
      if (!topicCode || !newHomeUnit) {
        return NextResponse.json({ success: false, error: "topicCode and newHomeUnit required." }, { status: 400 });
      }

      const success = await moveTopicUnitDb(topicCode, newHomeUnit, newGroupCode || null);
      if (!success) {
        return NextResponse.json({ success: false, error: `Topic code ${topicCode} not found.` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Topic ${topicCode} successfully moved to unit ${newHomeUnit}`,
        topicCode,
        newHomeUnit,
      });
    }

    if (action === "update_topic") {
      if (!topicCode || !updates) {
        return NextResponse.json({ success: false, error: "topicCode and updates object required." }, { status: 400 });
      }

      const success = await updateTopicDb(topicCode, updates);
      if (!success) {
        return NextResponse.json({ success: false, error: `Topic code ${topicCode} not found.` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Topic ${topicCode} successfully updated`,
        topicCode,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/taxonomy] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
