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

    const topics = subtopicsResult.rows.map(row => {
      const homeUnit = subjectMap.get(row.subject_id) || "general";
      const isApproach = row.name.toLowerCase().startsWith('approach to');
      const topicType = isApproach ? "Approach to a Presentation" : "Clinical Condition";
      
      return {
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
        crossCuttingTags: [],
        taxonomyVersion: "1.1"
      };
    });

    const taxonomy = {
      schemaVersion: "1.1",
      units,
      topics
    };

    const outPath = path.join(__dirname, '../GP-Edge-Master-Taxonomy-v1.1.json');
    fs.writeFileSync(outPath, JSON.stringify(taxonomy, null, 2), 'utf-8');
    console.log(`Successfully generated taxonomy JSON with ${units.length} units and ${topics.length} topics from database subjects/subtopics.`);
  } catch (err) {
    console.error('Error generating taxonomy from subjects/subtopics:', err);
  } finally {
    await pool.end();
  }
}

run();
