export interface TaxonomyGroup {
  code: string;
  name: string;
}

export interface TaxonomyUnit {
  code: string;
  name: string;
  kind: "owner" | "context" | string;
  groups: TaxonomyGroup[];
  displayOrder: number;
}

export type DepthTier = "Core" | "Working" | "Awareness";
export type TopicType = "Approach to a Presentation" | "Condition" | "Approach" | string;

export interface TaxonomyTopic {
  code: string; // Permanent immutable code (e.g. T0142)
  label: string; // Name (can change)
  topicType: TopicType;
  homeUnit: string; // Unit code (e.g. U01) - can move to another unit
  crossRefs: string[]; // Secondary unit codes
  group?: string | null; // Group code under homeUnit
  variants?: string[];
  depth: DepthTier; // Core | Working | Awareness
  status: "active" | "merged";
  mergedInto?: string[];
  crossCuttingTags?: string[]; // e.g. ["atsi-relevant", "emergency"]
}

export interface MasterTaxonomySchema {
  schemaVersion: string;
  generated: string;
  notes: string[];
  units: TaxonomyUnit[];
  topics: TaxonomyTopic[];
}

export const CONTROLLED_CROSS_CUTTING_TAGS = ["atsi-relevant", "emergency", "pediatric-alert", "palliative-care"];

const TAXONOMY_VERSION = "1.1";
const STORAGE_KEY = "gpedge_master_taxonomy_v1_1";

// Cache in memory
let cachedTaxonomy: MasterTaxonomySchema | null = null;

export function getMasterTaxonomy(): MasterTaxonomySchema {
  if (cachedTaxonomy) return cachedTaxonomy;

  // Browser environment
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedTaxonomy = JSON.parse(stored);
        return cachedTaxonomy!;
      }
    } catch {
      // ignore
    }
  }

  return {
    schemaVersion: TAXONOMY_VERSION,
    generated: new Date().toISOString(),
    notes: [],
    units: [],
    topics: [],
  };
}

export function saveMasterTaxonomy(taxonomy: MasterTaxonomySchema): void {
  cachedTaxonomy = taxonomy;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taxonomy));
    } catch (e) {
      console.error("[Taxonomy] Failed to persist to localStorage:", e);
    }
  }
}

/**
 * Get all 37 clinical units sorted by displayOrder
 */
export function getUnits(): TaxonomyUnit[] {
  const tax = getMasterTaxonomy();
  return [...tax.units].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get active topics belonging to a unit
 */
export function getTopicsByUnit(unitCode: string): TaxonomyTopic[] {
  const tax = getMasterTaxonomy();
  return tax.topics.filter((t) => t.homeUnit === unitCode && t.status === "active");
}

/**
 * Client-side / fallback moveTopicUnit
 */
export function moveTopicUnit(topicCode: string, newHomeUnit: string, newGroupCode: string | null = null): boolean {
  const tax = getMasterTaxonomy();
  const index = tax.topics.findIndex((t) => t.code === topicCode);
  if (index === -1) return false;

  const topic = tax.topics[index];
  topic.homeUnit = newHomeUnit;
  topic.group = newGroupCode;
  tax.topics[index] = topic;

  saveMasterTaxonomy(tax);
  return true;
}

/**
 * Client-side / fallback updateTopic
 */
export function updateTopic(topicCode: string, updates: Partial<Omit<TaxonomyTopic, "code">>): boolean {
  const tax = getMasterTaxonomy();
  const index = tax.topics.findIndex((t) => t.code === topicCode);
  if (index === -1) return false;

  const current = tax.topics[index];
  tax.topics[index] = {
    ...current,
    ...updates,
    code: current.code, // Code never changes
  };

  saveMasterTaxonomy(tax);
  return true;
}

/**
 * Stamp function for write-time denormalization (image requirement)
 */
export function stampTaxonomyClassification(topicCode: string) {
  const tax = getMasterTaxonomy();
  const topic = tax.topics.find((t) => t.code === topicCode || t.label.toLowerCase() === topicCode.toLowerCase());

  if (!topic) {
    return {
      topicCode: topicCode,
      homeUnit: "U00",
      group: null,
      taxonomyVersion: TAXONOMY_VERSION,
      depthTier: "Working" as DepthTier,
      crossRefUnits: [],
      crossCuttingTags: [],
      topicType: "Condition",
    };
  }

  const unit = tax.units.find((u) => u.code === topic.homeUnit);

  return {
    topicCode: topic.code,
    homeUnit: topic.homeUnit,
    unitName: unit ? unit.name : "",
    group: topic.group || null,
    taxonomyVersion: TAXONOMY_VERSION,
    depthTier: topic.depth,
    crossRefUnits: topic.crossRefs || [],
    crossCuttingTags: topic.crossCuttingTags || [],
    topicType: topic.topicType,
  };
}

/**
 * Quota audit adherence helper:
 */
export function auditQuotaAdherence() {
  const tax = getMasterTaxonomy();
  const activeTopics = tax.topics.filter((t) => t.status === "active");

  const coreCount = activeTopics.filter((t) => t.depth === "Core").length;
  const workingCount = activeTopics.filter((t) => t.depth === "Working").length;
  const awarenessCount = activeTopics.filter((t) => t.depth === "Awareness").length;

  return {
    totalActive: activeTopics.length,
    coreCount,
    workingCount,
    awarenessCount,
    schemaVersion: tax.schemaVersion,
    generated: tax.generated,
  };
}
