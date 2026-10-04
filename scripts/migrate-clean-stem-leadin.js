require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

function extractStemAndLeadIn(rawStem, rawLeadIn) {
  let stem = (rawStem || "").trim();
  let leadIn = (rawLeadIn || "").trim();

  if (leadIn) {
    const normStem = stem.replace(/\r\n/g, "\n").trim();
    const normLeadIn = leadIn.replace(/\r\n/g, "\n").trim();
    if (normStem.endsWith(normLeadIn)) {
      stem = normStem.slice(0, normStem.length - normLeadIn.length).trim();
    } else {
      const escaped = normLeadIn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      const endRegex = new RegExp(`[\\s\\n]*${escaped}[\\s\\n]*$`, "i");
      if (endRegex.test(normStem)) {
        stem = normStem.replace(endRegex, "").trim();
      }
    }
    return { stem, leadIn };
  }

  if (!stem) return { stem: "", leadIn: "" };
  const normStem = stem.replace(/\r\n/g, "\n").trim();

  const lastQMark = normStem.lastIndexOf("?");
  if (lastQMark !== -1) {
    const beforeQ = normStem.substring(0, lastQMark);
    const lastDoubleNewline = beforeQ.lastIndexOf("\n\n");
    const lastSingleNewline = beforeQ.lastIndexOf("\n");

    let splitIdx = -1;
    if (lastDoubleNewline !== -1) {
      splitIdx = lastDoubleNewline + 2;
    } else if (lastSingleNewline !== -1) {
      const lineAfter = beforeQ.substring(lastSingleNewline + 1).trim();
      if (/^(what|which|who|how|when|where|select|under|regarding|with|in|to|for|given|assuming)\b/i.test(lineAfter)) {
        splitIdx = lastSingleNewline + 1;
      }
    }

    if (splitIdx === -1) {
      const lastPeriod = Math.max(beforeQ.lastIndexOf(". "), beforeQ.lastIndexOf(".\n"));
      if (lastPeriod !== -1) {
        splitIdx = lastPeriod + 2;
      }
    }

    if (splitIdx > 0 && splitIdx < normStem.length) {
      const candidateStem = normStem.substring(0, splitIdx).trim();
      const candidateLeadIn = normStem.substring(splitIdx).trim();
      if (candidateStem && candidateLeadIn) {
        return { stem: candidateStem, leadIn: candidateLeadIn };
      }
    }
  }

  return { stem: normStem, leadIn: "" };
}

async function migrate() {
  try {
    console.log("Fetching questions via Direct connection...");
    const res = await pool.query("SELECT id, uqid, stem, lead_in FROM questions ORDER BY created_at ASC");
    console.log(`Found ${res.rows.length} questions.`);

    const updates = [];
    for (const r of res.rows) {
      const { stem: cleanStem, leadIn: cleanLeadIn } = extractStemAndLeadIn(r.stem, r.lead_in);
      const oldStem = (r.stem || "").trim();
      const oldLead = (r.lead_in || "").trim();

      if (cleanStem !== oldStem || cleanLeadIn !== oldLead) {
        updates.push({ id: r.id, uqid: r.uqid, stem: cleanStem, leadIn: cleanLeadIn || null });
      }
    }

    console.log(`Found ${updates.length} questions that need stem/lead_in separation.`);

    // Run updates concurrently in batches of 10
    const concurrency = 10;
    let completed = 0;

    for (let i = 0; i < updates.length; i += concurrency) {
      const chunk = updates.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (u) => {
          await pool.query(
            "UPDATE questions SET stem = $1, lead_in = $2, updated_at = NOW() WHERE id = $3",
            [u.stem, u.leadIn, u.id]
          );
        })
      );
      completed += chunk.length;
      process.stdout.write(`Updated ${completed}/${updates.length} questions...\r`);
    }

    console.log(`\nSuccessfully updated all ${updates.length} questions in the database!`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

migrate();
