import jsonTaxonomy from "../GP-Edge-Master-Taxonomy-v1.1.json";

export interface UnitGroup {
  code: string;
  name: string;
}

export interface UnitItem {
  code: string;
  name: string;
  kind: "context" | "owner";
  groups: UnitGroup[];
  displayOrder: number;
}

export interface TopicItem {
  code: string; // Permanent topicCode (e.g. T0001, T0142)
  label: string;
  topicType: string; // "Approach to a Presentation" | "Clinical Condition"
  homeUnit: string;
  crossRefs: string[];
  group: string | null;
  variants: string[];
  depth: "Core" | "Working" | "Awareness"; // depthTier
  status: "active" | "merged";
  mergedInto: string[];
  crossCuttingTags?: string[];
  taxonomyVersion?: string;
}

// Master Taxonomy units and topics loaded from GP-Edge-Master-Taxonomy-v1.1.json
export const MASTER_UNITS: UnitItem[] = (jsonTaxonomy.units || []) as UnitItem[];
export const MASTER_TOPICS: TopicItem[] = (jsonTaxonomy.topics || []) as TopicItem[];
export const TAXONOMY_VERSION: string = jsonTaxonomy.schemaVersion || "1.1";

// Maps unit code -> UnitItem for O(1) lookup
export const UNIT_MAP: Record<string, UnitItem> = MASTER_UNITS.reduce((acc, u) => {
  acc[u.code] = u;
  return acc;
}, {} as Record<string, UnitItem>);

// Maps topic code -> TopicItem for O(1) lookup
export const TOPIC_MAP: Record<string, TopicItem> = MASTER_TOPICS.reduce((acc, t) => {
  acc[t.code] = t;
  return acc;
}, {} as Record<string, TopicItem>);

/**
 * Gets unit name by unit code (e.g., U01 -> "Abuse and Violence")
 */
export function getUnitName(unitCode: string): string {
  return UNIT_MAP[unitCode]?.name || unitCode;
}

/**
 * Formats or defines topic code ensuring standard format (e.g. T0142)
 */
export function formatTopicCode(code: string | undefined | null, fallbackIndex?: number): string {
  if (!code) {
    if (fallbackIndex !== undefined) {
      return `T${String(fallbackIndex).padStart(4, "0")}`;
    }
    return "T0000";
  }
  const match = code.trim().match(/^t(\d+)$/i);
  if (match) {
    return `T${match[1].padStart(4, "0")}`;
  }
  if (fallbackIndex !== undefined) {
    return `T${String(fallbackIndex).padStart(4, "0")}`;
  }
  return code.toUpperCase();
}

/**
 * Gets group name by group code (e.g., U05.G01 -> "Bacterial skin infection")
 */
export function getGroupName(unitCode: string, groupCode?: string | null): string | null {
  if (!groupCode) return null;
  const unit = UNIT_MAP[unitCode];
  if (!unit || !unit.groups) return groupCode;
  const grp = unit.groups.find((g) => g.code === groupCode);
  return grp ? grp.name : groupCode;
}

/**
 * Helper to search topics by query string, unit, depth, and tag
 */
export function filterMasterTopics(params: {
  query?: string;
  unitCode?: string;
  depthTier?: string;
  topicType?: string;
  crossCuttingTag?: string;
  status?: string;
}): TopicItem[] {
  let list = MASTER_TOPICS;

  if (params.unitCode && params.unitCode !== "all") {
    list = list.filter(
      (t) => t.homeUnit === params.unitCode || (t.crossRefs && t.crossRefs.includes(params.unitCode!))
    );
  }

  if (params.depthTier && params.depthTier !== "all") {
    list = list.filter((t) => t.depth === params.depthTier);
  }

  if (params.topicType && params.topicType !== "all") {
    const filter = params.topicType.toLowerCase();
    list = list.filter((t) => t.topicType.toLowerCase().includes(filter));
  }

  if (params.crossCuttingTag && params.crossCuttingTag !== "all") {
    list = list.filter(
      (t) => t.crossCuttingTags && t.crossCuttingTags.includes(params.crossCuttingTag!)
    );
  }

  if (params.status && params.status !== "all") {
    list = list.filter((t) => t.status === params.status);
  }

  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        (t.group && t.group.toLowerCase().includes(q)) ||
        (t.variants && t.variants.some((v) => v.toLowerCase().includes(q)))
    );
  }

  return list;
}

/**
 * Audit metrics helper: returns breakdown by depth tier & quota adherence
 */
export function getTaxonomyAuditMetrics() {
  const depthCounts = { Core: 0, Working: 0, Awareness: 0 };
  const typeCounts: Record<string, number> = {};
  const statusCounts = { active: 0, merged: 0 };
  const tagCounts: Record<string, number> = {};

  MASTER_TOPICS.forEach((t) => {
    if (t.depth in depthCounts) depthCounts[t.depth]++;
    if (t.status in statusCounts) statusCounts[t.status]++;

    const type = t.topicType || "Condition";
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    if (t.crossCuttingTags) {
      t.crossCuttingTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return {
    totalTopics: MASTER_TOPICS.length,
    totalUnits: MASTER_UNITS.length,
    depthCounts,
    typeCounts,
    statusCounts,
    tagCounts,
    version: TAXONOMY_VERSION,
  };
}
