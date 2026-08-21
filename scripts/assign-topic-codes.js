const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL not found in .env.local.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('--- Assigning Standardized Topic Codes (T0001+) across Database & Taxonomy ---');

    // 1. Delete placeholder rows
    await pool.query(`DELETE FROM subtopics WHERE name ILIKE '%[enter%' OR slug ILIKE '%enter-%'`);
    await pool.query(`DELETE FROM medical_conditions WHERE name ILIKE '%[enter%' OR slug ILIKE '%enter-%'`);

    // 2. Fetch all subtopics
    const subtopicsRes = await pool.query(
      `SELECT id, slug, name, subject_id FROM subtopics WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`
    );

    const usedCodes = new Set();
    let maxNumber = 0;

    // Pass 1: Identify existing valid t-codes
    for (const row of subtopicsRes.rows) {
      const match = (row.slug || "").trim().match(/^t(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const formatted = `T${String(num).padStart(4, "0")}`;
        if (!usedCodes.has(formatted)) {
          usedCodes.add(formatted);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    console.log(`Found ${usedCodes.size} existing T-codes (Max code: T${String(maxNumber).padStart(4, "0")})`);

    // Pass 2: Calculate target codes
    let nextCounter = maxNumber + 1;
    const updates = [];

    for (const row of subtopicsRes.rows) {
      let targetCode = "";
      const match = (row.slug || "").trim().match(/^t(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        targetCode = `T${String(num).padStart(4, "0")}`;
      } else {
        while (usedCodes.has(`T${String(nextCounter).padStart(4, "0")}`)) {
          nextCounter++;
        }
        targetCode = `T${String(nextCounter).padStart(4, "0")}`;
        usedCodes.add(targetCode);
        nextCounter++;
      }

      if (row.slug !== targetCode) {
        updates.push({ id: row.id, slug: targetCode });
      }
    }

    console.log(`Applying ${updates.length} updates...`);

    // Batch update in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const values = chunk.map((_, idx) => `($${idx * 2 + 1}::uuid, $${idx * 2 + 2})`).join(', ');
      const params = chunk.flatMap(c => [c.id, c.slug]);
      await pool.query(
        `UPDATE subtopics AS s 
         SET slug = c.slug 
         FROM (VALUES ${values}) AS c(id, slug) 
         WHERE s.id = c.id`,
        params
      );
    }

    console.log(`Successfully updated ${updates.length} subtopics with standardized T-codes in PostgreSQL.`);

    // 3. Fetch subjects and medical conditions to regenerate JSON
    const subjectsRes = await pool.query(
      `SELECT id, slug, name, sort_order FROM subjects WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`
    );
    const subtopicsUpdated = await pool.query(
      `SELECT id, subject_id, slug, name, sort_order FROM subtopics WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`
    );
    const medicalRes = await pool.query(
      `SELECT id, subject_id, slug, name, kind, category FROM medical_conditions WHERE deleted_at IS NULL ORDER BY name ASC`
    );

    const subjectMap = new Map();
    const units = subjectsRes.rows.map(row => {
      subjectMap.set(row.id, row.slug);
      return {
        code: row.slug,
        name: row.name,
        kind: "owner",
        groups: [],
        displayOrder: row.sort_order || 0
      };
    });

    const topicMap = new Map();
    for (const row of subtopicsUpdated.rows) {
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

    for (const row of medicalRes.rows) {
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
      }
    }

    // Pass 2: Ensure any remaining topics get clean T-codes
    for (const topic of topicMap.values()) {
      if (!topic.code || !/^T\d{4,}$/.test(topic.code)) {
        const originalSlug = topic.code;
        while (usedCodes.has(`T${String(nextCounter).padStart(4, "0")}`)) {
          nextCounter++;
        }
        const assigned = `T${String(nextCounter).padStart(4, "0")}`;
        usedCodes.add(assigned);
        nextCounter++;

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
    console.log(`Generated taxonomy JSON with ${units.length} units and ${topics.length} topics. (Max code: T${String(nextCounter - 1).padStart(4, "0")}).`);
    console.log('--- Finished Successfully ---');
  } catch (err) {
    console.error('Error in assign-topic-codes:', err);
  } finally {
    await pool.end();
  }
}

run();
