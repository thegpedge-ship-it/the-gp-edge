"use client";

import { useState, useEffect } from "react";
import { getAllDatabaseTopicsAction } from "@/actions/taxonomy.actions";
import type { UnitItem, TopicItem } from "@/lib/taxonomyData";

interface TaxonomyData {
  units: UnitItem[];
  topics: TopicItem[];
  loading: boolean;
}

const CACHE_KEY = "gp_taxonomy_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  units: UnitItem[];
  topics: TopicItem[];
  fetchedAt: number;
}

function getCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function setCache(units: UnitItem[], topics: TopicItem[]) {
  try {
    const entry: CacheEntry = { units, topics, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage may be unavailable in SSR or restricted contexts
  }
}

/**
 * Fetches taxonomy units and topics from the database.
 * Results are cached in sessionStorage for 5 minutes to avoid repeated DB calls.
 *
 * Usage:
 *   const { units, topics, loading } = useTaxonomy();
 */
export function useTaxonomy(): TaxonomyData {
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Try cache first
      const cached = getCache();
      if (cached) {
        if (isMounted) {
          setUnits(cached.units);
          setTopics(cached.topics);
          setLoading(false);
        }
        return;
      }

      try {
        // getTaxonomyUnitsAction/getTaxonomyTopicsAction queried a standalone taxonomy_units /
        // taxonomy_topics pair that was never created in the live DB. getAllDatabaseTopicsAction
        // is the working aggregator (subjects, subtopics, medical_conditions, tags, autofill_templates)
        // already proven to surface every real topic/tag/subtopic — use it here so every page that
        // consumes useTaxonomy() gets live DB-backed filter options instead of an always-empty list.
        const res = await getAllDatabaseTopicsAction();

        const fetchedUnits: UnitItem[] = (res.units || []).map((u: any) => ({
          code: u.code,
          name: u.name,
          kind: "owner",
          groups: [],
          displayOrder: 0,
        }));

        const fetchedTopics: TopicItem[] = (res.topics || []).map((t: any) => ({
          code: t.code,
          label: t.label,
          topicType: t.topicType,
          homeUnit: t.homeUnit,
          crossRefs: t.crossRefs || [],
          group: t.group || null,
          variants: t.variants || [],
          depth: t.depth || "Core",
          status: t.status || "active",
          mergedInto: t.mergedInto || [],
          crossCuttingTags: t.crossCuttingTags || [],
          taxonomyVersion: t.taxonomyVersion || "1.1",
        }));

        setCache(fetchedUnits, fetchedTopics);

        if (isMounted) {
          setUnits(fetchedUnits);
          setTopics(fetchedTopics);
        }
      } catch (err) {
        console.error("[useTaxonomy] Failed to fetch taxonomy from DB:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  return { units, topics, loading };
}
