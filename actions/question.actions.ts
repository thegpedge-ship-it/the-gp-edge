"use server";

import { query, queryOne, execute } from "@/lib/db";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

/**
 * Syncs a list of questions to the Neon PostgreSQL database via raw pg.
 * If a question with the exact same stem exists it updates it,
 * otherwise it creates a new row.
 */
export async function importQuestionsAction(questionsList: any[]) {
  try {
    for (const q of questionsList) {
      if (!q.text || !q.text.trim()) continue;

      const difficulty = (q.difficulty?.toLowerCase() || "medium") as string;
      const status = (q.status?.toLowerCase() || "published") as string;
      const examTypeCode: string = q.examType || "AKT";

      // 1. Ensure exam_type row exists
      const existingExamType = await queryOne(
        `SELECT code FROM exam_types WHERE code = $1`,
        [examTypeCode]
      );
      if (!existingExamType) {
        const examName =
          examTypeCode === "AKT"
            ? "Applied Knowledge Test"
            : examTypeCode === "KFP"
            ? "Key Feature Problem"
            : examTypeCode;
        await execute(
          `INSERT INTO exam_types (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
          [examTypeCode, examName]
        );
      }

      // 2. Resolve subject / subtopic IDs
      let subjectId: string | null = null;
      let subtopicId: string | null = null;

      const rawTopic = q.topic ? q.topic.split(",")[0].trim() : "General";
      const rawSubtopic = q.subtopic ? q.subtopic.split(",")[0].trim() : "";

      if (rawSubtopic) {
        const subtopicMatch = await queryOne<{ id: string; subject_id: string }>(
          `SELECT id, subject_id FROM subtopics WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [rawSubtopic]
        );
        if (subtopicMatch) {
          subtopicId = subtopicMatch.id;
          subjectId = subtopicMatch.subject_id;
        }
      }

      if (!subjectId) {
        let searchTopic = rawTopic;
        const lowerRaw = rawTopic.toLowerCase();
        if (lowerRaw === "cardiology" || lowerRaw.includes("cardio") || lowerRaw.includes("heart")) {
          searchTopic = "Cardiovascular";
        } else if (lowerRaw.includes("respiratory") || lowerRaw.includes("lung") || lowerRaw.includes("asthma")) {
          searchTopic = "Respiratory";
        } else if (lowerRaw === "endocrine" || lowerRaw === "endocrinology") {
          searchTopic = "Endocrinology";
        } else if (lowerRaw.includes("gastro") || lowerRaw === "gastroenterology") {
          searchTopic = "Gastroenterology";
        } else if (lowerRaw.includes("mental") || lowerRaw.includes("psych") || lowerRaw.includes("depress")) {
          searchTopic = "Mental Health";
        } else if (lowerRaw.includes("paediatric") || lowerRaw.includes("child")) {
          searchTopic = "Paediatrics";
        }

        const subtopicMatch = await queryOne<{ id: string; subject_id: string }>(
          `SELECT id, subject_id FROM subtopics WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [searchTopic]
        );
        if (subtopicMatch) {
          subtopicId = subtopicMatch.id;
          subjectId = subtopicMatch.subject_id;
        } else {
          const subjectMatch = await queryOne<{ id: string }>(
            `SELECT id FROM subjects WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [searchTopic]
          );
          if (subjectMatch) {
            subjectId = subjectMatch.id;
          } else {
            const partial = await queryOne<{ id: string }>(
              `SELECT id FROM subjects WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`,
              [`%${searchTopic}%`]
            );
            if (partial) subjectId = partial.id;
          }
        }
      }

      // 3. Upload image to R2 if present, return just the public URL (no DB file row needed)
      let imageUrl: string | null = null;

      if (q.image) {
        if (q.image.startsWith("data:image/")) {
          const parts = q.image.split(";base64,");
          const mimeType = parts[0].split(":")[1];
          const base64Data = parts[1];
          const buffer = Buffer.from(base64Data, "base64");
          const ext = mimeType.split("/")[1] || "jpg";
          const objectKey = `${crypto.randomUUID()}.${ext}`;
          const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";
          try {
            await r2.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
                Body: buffer,
                ContentType: mimeType,
              })
            );
            const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
            imageUrl = `${publicBase}/${objectKey}`;
          } catch (uploadErr) {
            console.error("R2 image upload failed:", uploadErr);
          }
        } else if (q.image.startsWith("http")) {
          imageUrl = q.image;
        }
      }

      // 4. Upsert the question row (match by stem)
      const existingQ = await queryOne<{ id: string }>(
        `SELECT id FROM questions WHERE stem = $1 LIMIT 1`,
        [q.text]
      );

      let questionId: string;

      if (existingQ) {
        questionId = existingQ.id;
        await execute(
          `UPDATE questions
             SET rationale = $1, difficulty = $2, status = $3,
                 exam_type_code = $4, subject_id = $5, subtopic_id = $6,
                 updated_at = NOW()
           WHERE id = $7`,
          [q.rationale || "", difficulty, status, examTypeCode, subjectId, subtopicId, questionId]
        );
      } else {
        const newQ = await queryOne<{ id: string }>(
          `INSERT INTO questions
             (stem, rationale, difficulty, status, exam_type_code, subject_id, subtopic_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [q.text, q.rationale || "", difficulty, status, examTypeCode, subjectId, subtopicId]
        );
        questionId = newQ!.id;
      }

      // 5. Replace options (delete + insert to avoid unique constraint on (question_id, position))
      if (q.options && q.options.length > 0) {
        await execute(`DELETE FROM question_options WHERE question_id = $1`, [questionId]);
        for (let i = 0; i < q.options.length; i++) {
          await execute(
            `INSERT INTO question_options (question_id, label, position, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [
              questionId,
              q.options[i] || `Option ${String.fromCharCode(65 + i)}`,
              i + 1,
              i === q.correctIndex,
            ]
          );
        }
      }

      // 6. Replace tags (delete + upsert to avoid (question_id, tag_id) unique constraint)
      if (q.tags && q.tags.length > 0) {
        await execute(`DELETE FROM question_tags WHERE question_id = $1`, [questionId]);

        const seen = new Set<string>();
        for (const tagName of q.tags) {
          const clean = tagName.trim();
          const key = clean.toLowerCase();
          if (!clean || seen.has(key)) continue;
          seen.add(key);

          const slug = key.replace(/[^a-z0-9]+/g, "-");
          // Upsert tag
          let tag = await queryOne<{ id: string }>(
            `SELECT id FROM tags WHERE LOWER(label) = LOWER($1) LIMIT 1`,
            [clean]
          );
          if (!tag) {
            tag = await queryOne<{ id: string }>(
              `INSERT INTO tags (slug, label) VALUES ($1, $2)
               ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
               RETURNING id`,
              [slug, clean]
            );
          }
          if (tag) {
            await execute(
              `INSERT INTO question_tags (question_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT (question_id, tag_id) DO NOTHING`,
              [questionId, tag.id]
            );
          }
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error importing questions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a question from the database by stem text.
 */
export async function deleteQuestionAction(text: string) {
  try {
    if (!text?.trim()) return { success: false, error: "Empty stem" };
    await execute(`DELETE FROM questions WHERE stem = $1`, [text]);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return { success: false, error: error.message };
  }
}
