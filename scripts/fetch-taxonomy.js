const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL not found in .env.local, skipping taxonomy fetch.');
  process.exit(0);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Fetching subjects and subtopics from database to build taxonomy...');
    
    // 1. Fetch subjects
    const subjectsResult = await pool.query(
      `SELECT id, slug, name, sort_order FROM subjects WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`
    );
    
    // 2. Fetch subtopics
    const subtopicsResult = await pool.query(
      `SELECT id, subject_id, slug, name, sort_order FROM subtopics WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`
    );

    // Create a mapping of subject UUID -> subject slug/code
    const subjectMap = new Map();
    const units = subjectsResult.rows.map(row => {
      subjectMap.set(row.id, row.slug);
      return {
        code: row.slug,
        name: row.name,
        kind: "owner",
        groups: [],
        displayOrder: row.sort_order || 0
      };
    });

    // 3. Fetch medical_conditions (Approaches and Clinical Conditions)
    const medicalResult = await pool.query(
      `SELECT id, subject_id, slug, name, kind, category FROM medical_conditions WHERE deleted_at IS NULL ORDER BY name ASC`
    );

    const topicMap = new Map();
    for (const row of subtopicsResult.rows) {
      const homeUnit = subjectMap.get(row.subject_id) || "general";
      const isApproach = row.name.toLowerCase().startsWith('approach to');
      const topicType = isApproach ? "Approach to a Presentation" : "Clinical Condition";
      const key = row.name.trim().toLowerCase();
      
      topicMap.set(key, {
        code: row.slug,
        label: row.name,
        topicType: topicType,
        homeUnit: homeUnit,
        group: null,
        crossRefs: [],
        variants: [],
        depth: "Core",
        status: "active",
        mergedInto: [],
        crossCuttingTags: isApproach ? ["approach"] : [],
        taxonomyVersion: "1.1"
      });
    }

    for (const row of medicalResult.rows) {
      const homeUnit = subjectMap.get(row.subject_id) || row.category || "general";
      const isApproach = row.kind === 'Approach' || row.name.toLowerCase().startsWith('approach to');
      const topicType = isApproach ? "Approach to a Presentation" : "Clinical Condition";
      const key = row.name.trim().toLowerCase();

      if (!topicMap.has(key)) {
        topicMap.set(key, {
          code: row.slug || `MC-${row.id.substring(0, 6)}`,
          label: row.name,
          topicType: topicType,
          homeUnit: homeUnit,
          group: row.category || null,
          crossRefs: [],
          variants: [],
          depth: "Core",
          status: "active",
          mergedInto: [],
          crossCuttingTags: isApproach ? ["approach"] : [],
          taxonomyVersion: "1.1"
        });
      } else {
        const existing = topicMap.get(key);
        if (isApproach && existing.topicType !== "Approach to a Presentation") {
          existing.topicType = "Approach to a Presentation";
        }
      }
    }

    // 4. Define and normalize topic codes (T0001+)
    const usedCodes = new Set();
    const nextCounter = { val: 1 };

    // Pass 1: Register and normalize existing T-codes
    for (const topic of topicMap.values()) {
      if (topic.code && typeof topic.code === "string") {
        const match = topic.code.trim().match(/^t(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const formatted = `T${String(num).padStart(4, "0")}`;
          if (!usedCodes.has(formatted)) {
            usedCodes.add(formatted);
            topic.code = formatted;
            if (num >= nextCounter.val) {
              nextCounter.val = num + 1;
            }
          }
        }
      }
    }

    // Pass 2: Assign clean permanent T-codes to any topics without a T-code
    for (const topic of topicMap.values()) {
      if (!topic.code || !/^T\d{4,}$/.test(topic.code)) {
        const originalSlug = topic.code;
        while (usedCodes.has(`T${String(nextCounter.val).padStart(4, "0")}`)) {
          nextCounter.val++;
        }
        const assigned = `T${String(nextCounter.val).padStart(4, "0")}`;
        usedCodes.add(assigned);
        nextCounter.val++;

        // Preserve original slug in variants if not empty
        if (originalSlug && originalSlug !== assigned && !topic.variants.includes(originalSlug)) {
          topic.variants.push(originalSlug);
        }
        topic.code = assigned;
      }
    }

    const topics = Array.from(topicMap.values()).sort((a, b) => a.code.localeCompare(b.code));

    const taxonomy = {
      schemaVersion: "1.1",
      units,
      topics
    };

    const outPath = path.join(__dirname, '../GP-Edge-Master-Taxonomy-v1.1.json');
    fs.writeFileSync(outPath, JSON.stringify(taxonomy, null, 2), 'utf-8');
    console.log(`Successfully generated taxonomy JSON with ${units.length} units and ${topics.length} topics. All topic codes standardized (T0001 to T${String(nextCounter.val - 1).padStart(4, "0")}).`);
  } catch (err) {
    console.error('Error generating taxonomy from subjects/subtopics:', err);
  } finally {
    await pool.end();
  }
}

run();
