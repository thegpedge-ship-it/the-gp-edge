"use server";

import { query, queryOne, execute } from "@/lib/db";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";
import { registerOrUpdateTopicWithCodeAction } from "@/actions/taxonomy.actions";


/**
 * Syncs a list of questions to the Neon PostgreSQL database via raw pg.
 * If a question with the exact same stem exists it updates it,
 * otherwise it creates a new row.
 */
export async function importQuestionsAction(questionsList: any[], adminUser?: PermissionUser) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // 1. Fetch all existing exam types
    const allExamTypes = await query<{ code: string }>(`SELECT code FROM exam_types`);
    const examTypeSet = new Set(allExamTypes.map(r => r.code.toUpperCase()));

    // 2. Fetch all subjects and subtopics
    const allSubjects = await query<{ id: string; name: string; slug: string }>(`SELECT id, name, slug FROM subjects`);
    const allSubtopics = await query<{ id: string; name: string; slug: string; subject_id: string }>(
      `SELECT id, name, slug, subject_id FROM subtopics`
    );

    const subjectMap = new Map<string, string>(); // lowerCase name -> id
    allSubjects.forEach(s => subjectMap.set(s.name.toLowerCase(), s.id));

    const subtopicMap = new Map<string, { id: string; subjectId: string }>(); // lowerCase name -> { id, subjectId }
    allSubtopics.forEach(st => subtopicMap.set(st.name.toLowerCase(), { id: st.id, subjectId: st.subject_id }));

    // 3. Fetch existing tags
    const allTagNames = Array.from(
      new Set(
        questionsList.flatMap(q => q.tags || [])
          .map((t: string) => t.trim())
          .filter(Boolean)
      )
    );

    const tagMap = new Map<string, string>(); // lowerCase label -> id
    if (allTagNames.length > 0) {
      const existingTags = await query<{ id: string; label: string }>(
        `SELECT id, label FROM tags WHERE LOWER(label) = ANY($1::text[])`,
        [allTagNames.map(t => t.toLowerCase())]
      );
      existingTags.forEach(t => tagMap.set(t.label.toLowerCase(), t.id));
    }

    // 4. Pre-fetch existing questions (by stem or dbId)
    const stems = questionsList.map(q => q.text?.trim()).filter(Boolean);
    const dbIds = questionsList.map(q => q.dbId).filter(id => id && uuidRegex.test(id));

    const questionByStem = new Map<string, string>(); // lowerCase stem -> id
    const questionById = new Set<string>();

    if (stems.length > 0) {
      const existingQsByStem = await query<{ id: string; stem: string }>(
        `SELECT id, stem FROM questions WHERE stem = ANY($1::text[])`,
        [stems]
      );
      existingQsByStem.forEach(q => questionByStem.set(q.stem.trim().toLowerCase(), q.id));
    }

    if (dbIds.length > 0) {
      const existingQsById = await query<{ id: string }>(
        `SELECT id FROM questions WHERE id = ANY($1::uuid[])`,
        [dbIds]
      );
      existingQsById.forEach(q => questionById.add(q.id));
    }

    // In-memory helpers for creating Subjects/Subtopics/Tags
    const getOrCreateSubject = async (name: string): Promise<string | null> => {
      const key = name.toLowerCase();
      if (subjectMap.has(key)) return subjectMap.get(key)!;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newSub = await queryOne<{ id: string }>(
        `INSERT INTO subjects (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [slug, name]
      );
      if (newSub) {
        subjectMap.set(key, newSub.id);
        return newSub.id;
      }
      return null;
    };

    const getOrCreateSubtopic = async (name: string, subjectId: string): Promise<string | null> => {
      const key = name.toLowerCase();
      if (subtopicMap.has(key)) return subtopicMap.get(key)!.id;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newSubtopic = await queryOne<{ id: string }>(
        `INSERT INTO subtopics (subject_id, slug, name) VALUES ($1, $2, $3) RETURNING id`,
        [subjectId, slug, name]
      );
      if (newSubtopic) {
        subtopicMap.set(key, { id: newSubtopic.id, subjectId });
        return newSubtopic.id;
      }
      return null;
    };

    const getOrCreateTag = async (label: string): Promise<string | null> => {
      const clean = label.trim();
      const key = clean.toLowerCase();
      if (tagMap.has(key)) return tagMap.get(key)!;

      const slug = key.replace(/[^a-z0-9]+/g, "-");
      const tag = await queryOne<{ id: string }>(
        `INSERT INTO tags (slug, label) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label
         RETURNING id`,
        [slug, clean]
      );
      if (tag) {
        tagMap.set(key, tag.id);
        return tag.id;
      }
      return null;
    };

    const results: { text: string; dbId: string; uqid?: string }[] = [];

    for (const q of questionsList) {
      if (!q.text || !q.text.trim()) continue;

      const difficulty = (q.difficulty?.toLowerCase() || "medium") as string;
      const status = (q.status?.toLowerCase() || "published") as string;
      const examTypeCode: string = q.examType || "AKT";

      // Ensure exam type exists
      const examTypeKey = examTypeCode.toUpperCase();
      if (!examTypeSet.has(examTypeKey)) {
        const isKft = examTypeCode === "KFT" || examTypeCode === "KFP";
        const examName =
          examTypeCode === "AKT"
            ? "Applied Knowledge Test"
            : isKft
            ? "Key Feature Test"
            : examTypeCode;
        await execute(
          `INSERT INTO exam_types (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
          [examTypeCode, examName]
        );
        examTypeSet.add(examTypeKey);
      }

      // Resolve subject / subtopic IDs
      let subjectId: string | null = null;
      let subtopicId: string | null = null;

      const rawTopic = q.topic ? q.topic.split(",")[0].trim() : "General";
      const rawSubtopic = q.subtopic ? q.subtopic.split(",")[0].trim() : "";

      // Resolve subtopic
      if (rawSubtopic) {
        const key = rawSubtopic.toLowerCase();
        if (subtopicMap.has(key)) {
          subtopicId = subtopicMap.get(key)!.id;
          subjectId = subtopicMap.get(key)!.subjectId;
        }
      }

      // Resolve subject/topic
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

        const key = searchTopic.toLowerCase();
        if (subtopicMap.has(key)) {
          subtopicId = subtopicMap.get(key)!.id;
          subjectId = subtopicMap.get(key)!.subjectId;
        } else if (subjectMap.has(key)) {
          subjectId = subjectMap.get(key)!;
        } else {
          // Check partial match
          const partialMatch = Array.from(subjectMap.keys()).find(k => k.includes(key));
          if (partialMatch) {
            subjectId = subjectMap.get(partialMatch)!;
          } else {
            subjectId = await getOrCreateSubject(searchTopic);
          }
        }
      }

      // If rawSubtopic was specified but not found, create it
      if (rawSubtopic && !subtopicId && subjectId) {
        subtopicId = await getOrCreateSubtopic(rawSubtopic, subjectId);
      }

      // Handle image reference
      let imageFileId: string | null = null;
      if (q.image) {
        if (q.image.startsWith("http")) {
          const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
          if (q.image.startsWith(publicBase)) {
            const objectKey = q.image.replace(publicBase, "").replace(/^\//, "");
            const existingFile = await queryOne<{ id: string }>(
              `SELECT id FROM files WHERE object_key = $1 LIMIT 1`,
              [objectKey]
            );
            if (existingFile) {
              imageFileId = existingFile.id;
            } else {
              const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";
              const fileRow = await queryOne<{ id: string }>(
                `INSERT INTO files (bucket, object_key, original_name, mime_type, size_bytes, status)
                 VALUES ($1, $2, $3, $4, $5, 'active')
                 RETURNING id`,
                [bucketName, objectKey, "uploaded_question_image.jpg", "image/jpeg", 0]
              );
              if (fileRow) {
                imageFileId = fileRow.id;
              }
            }
          }
        } else if (q.image.startsWith("data:image/")) {
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
            
            const fileRow = await queryOne<{ id: string }>(
              `INSERT INTO files (bucket, object_key, original_name, mime_type, size_bytes, status)
               VALUES ($1, $2, $3, $4, $5, 'active')
               RETURNING id`,
              [bucketName, objectKey, `extracted_question_image.${ext}`, mimeType, buffer.length]
            );
            if (fileRow) {
              imageFileId = fileRow.id;
            }
          } catch (uploadErr) {
            console.error("R2 image upload failed:", uploadErr);
          }
        }
      }

      // Upsert the question row
      let questionId: string | null = null;
      const cleanStem = q.text.trim();
      const stemKey = cleanStem.toLowerCase();

      if (q.dbId && uuidRegex.test(q.dbId) && questionById.has(q.dbId)) {
        questionId = q.dbId;
      } else if (questionByStem.has(stemKey)) {
        questionId = questionByStem.get(stemKey)!;
      }

      let finalUqid = q.uqid;

      if (questionId) {
        if (adminUser) {
          const permCheck = await evaluateRelationalPermission({
            user: adminUser,
            capability: status === "published" || status === "review" ? "review" : "edit",
            item: { id: questionId, type: "question" },
          });
          if (!permCheck.allowed) {
            throw new Error(permCheck.reason || "Permission denied for updating question.");
          }
        }
        const isKftOrKfp = examTypeCode === "KFT" || examTypeCode === "KFP";
        const correctCount = isKftOrKfp ? (q.kftCorrectCount ?? q.kfpCorrectCount ?? null) : null;

        // Fetch current question's exam_type_code and uqid to see if exam type changed
        const currentQ = await queryOne<{ exam_type_code: string; uqid: string }>(
          `SELECT exam_type_code, uqid FROM questions WHERE id = $1`,
          [questionId]
        );

        const rawCurrentType = (currentQ?.exam_type_code || "AKT").toUpperCase();
        const rawTargetType = examTypeCode.toUpperCase();
        const currentExamType = rawCurrentType === "KFP" ? "KFT" : rawCurrentType;
        const targetExamType = rawTargetType === "KFP" ? "KFT" : rawTargetType;

        if (currentQ && (currentExamType !== targetExamType || (currentQ.uqid && !currentQ.uqid.startsWith(targetExamType)))) {
          // Exam type changed (e.g. AKT -> KFT or KFT -> AKT): allocate a new sequential UQID with target prefix
          const targetSeq = targetExamType === "KFT" ? "kft_seq" : "akt_seq";
          const seqResult = await queryOne<{ n: string }>(`SELECT nextval('${targetSeq}') AS n`);
          const seqNum = String(seqResult?.n ?? 1).padStart(6, "0");
          finalUqid = `${targetExamType}-${seqNum}`;
        } else if (currentQ?.uqid) {
          finalUqid = currentQ.uqid;
        }

        await execute(
          `UPDATE questions
             SET stem = $1, rationale = $2, difficulty = $3, status = $4,
                 exam_type_code = $5, subject_id = $6, subtopic_id = $7,
                 image_file_id = $8, kfp_correct_count = $9,
                 lead_in = $10, why_correct = $11,
                 knowledge_bank = $12, pearl = $13,
                 uqid = $14,
                 version = version + 1, updated_at = NOW()
           WHERE id = $15`,
          [cleanStem, q.rationale || q.whyCorrect || "", difficulty, status,
           examTypeCode, subjectId, subtopicId, imageFileId,
           correctCount,
           q.leadIn || null, q.whyCorrect || null,
           q.knowledgeBank || null, q.pearl || null,
           finalUqid,
           questionId]
        );
        await recordAuditLog({
          adminUserId: adminUser?.id,
          action: "update",
          category: "question",
          entityType: "question",
          entityId: questionId,
          metadata: { author: adminUser?.name || adminUser?.email || "GP Edge Admin", stem: cleanStem, uqid: finalUqid },
        });
      } else {
        // Auto-generate UQID using DB sequence
        const isKftOrKfpNew = examTypeCode === "KFT" || examTypeCode === "KFP";
        const seqName = isKftOrKfpNew ? "kft_seq" : "akt_seq";
        const seqResult = await queryOne<{ n: string }>(`SELECT nextval('${seqName}') AS n`);
        const seqNum = String(seqResult?.n ?? 1).padStart(6, "0");
        finalUqid = `${examTypeCode.toUpperCase()}-${seqNum}`;
        // Auto-generate batchId if not provided
        const today = new Date().toISOString().slice(0, 10);
        const autoBatchId = q.batchId || `${today}-batch-01`;

        const newQ = await queryOne<{ id: string }>(
          `INSERT INTO questions
             (stem, rationale, difficulty, status, exam_type_code, subject_id, subtopic_id,
              image_file_id, kfp_correct_count, uqid, lead_in, why_correct,
              knowledge_bank, pearl, batch_id, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1)
           RETURNING id`,
          [cleanStem, q.rationale || q.whyCorrect || "", difficulty, status, examTypeCode,
           subjectId, subtopicId, imageFileId,
           isKftOrKfpNew ? (q.kftCorrectCount ?? q.kfpCorrectCount ?? null) : null,
           finalUqid,
           q.leadIn || null, q.whyCorrect || null,
           q.knowledgeBank || null, q.pearl || null,
           autoBatchId]
        );
        questionId = newQ!.id;
        await recordAuditLog({
          adminUserId: adminUser?.id,
          action: "create",
          category: "question",
          entityType: "question",
          entityId: questionId,
          metadata: { author: adminUser?.name || adminUser?.email || "GP Edge Admin", stem: cleanStem, uqid: finalUqid },
        });
      }

      // Replace options — support multiple correct for KFT / KFP + distractor rationales
      if (q.options && q.options.length > 0) {
        await execute(
          `DELETE FROM question_options 
            WHERE question_id = $1 AND position > $2`,
          [questionId, q.options.length]
        );
        const isMultiCorrect = examTypeCode === "KFT" || examTypeCode === "KFP";
        // Build set of correct indices
        const correctSet = new Set<number>(
          isMultiCorrect && Array.isArray(q.correctIndices) && q.correctIndices.length > 0
            ? q.correctIndices
            : [q.correctIndex ?? 0]
        );
        for (let i = 0; i < q.options.length; i++) {
          const distractorRationale = q.distractorRationales?.[i] || null;
          await execute(
            `INSERT INTO question_options (question_id, label, position, is_correct, distractor_rationale)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (question_id, position)
             DO UPDATE SET label = EXCLUDED.label, is_correct = EXCLUDED.is_correct,
                           distractor_rationale = EXCLUDED.distractor_rationale`,
            [
              questionId,
              q.options[i] || `Option ${String.fromCharCode(65 + i)}`,
              i + 1,
              correctSet.has(i),
              distractorRationale,
            ]
          );
        }
      }

      // Replace tags
      if (q.tags && q.tags.length > 0) {
        await execute(`DELETE FROM question_tags WHERE question_id = $1`, [questionId]);

        const seen = new Set<string>();
        for (const tagName of q.tags) {
          const cleanTagName = tagName.trim();
          const tagKey = cleanTagName.toLowerCase();
          if (!cleanTagName || seen.has(tagKey)) continue;
          seen.add(tagKey);

          const tagId = await getOrCreateTag(cleanTagName);
          if (tagId) {
            await execute(
              `INSERT INTO question_tags (question_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT (question_id, tag_id) DO NOTHING`,
              [questionId, tagId]
            );
          }
        }
      }

      // Auto-register Topic Code (T####), Home Unit, and Tags in database & search section
      const topicLabel = rawSubtopic || rawTopic || "General";
      await registerOrUpdateTopicWithCodeAction({
        label: topicLabel,
        homeUnit: rawTopic || "General",
        topicType: "Question Topic",
        tags: q.tags || [],
        adminUser,
      });

      results.push({ text: q.text, dbId: questionId, uqid: finalUqid });
    }
    return { success: true, results };
  } catch (error: any) {
    console.error("Error importing questions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reviews or approves a question.
 * Strictly checks relational history: users cannot review items they authored or edited.
 */
export async function reviewQuestionAction(
  questionId: string,
  newStatus: "published" | "review" | "draft",
  adminUser: PermissionUser
) {
  try {
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "review",
      item: { id: questionId, type: "question" },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await execute(
      `UPDATE questions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, questionId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "review",
      category: "question",
      entityType: "question",
      entityId: questionId,
      metadata: { newStatus, reviewer: adminUser.name || adminUser.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing question:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Soft-archives a question from the database by stem text or UUID.
 * Hides item and withdraws from production while retaining all versions, reviews, and audit trails permanently.
 */
export async function deleteQuestionAction(idOrText: string, adminUser?: PermissionUser) {
  try {
    if (!idOrText?.trim()) return { success: false, error: "Empty identifier" };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let targetId = idOrText;

    if (uuidRegex.test(idOrText)) {
      targetId = idOrText;
    } else {
      const found = await queryOne<{ id: string }>(`SELECT id FROM questions WHERE stem = $1`, [idOrText]);
      if (found) targetId = found.id;
    }

    if (adminUser) {
      const check = await evaluateRelationalPermission({
        user: adminUser,
        capability: "archive_item",
        item: { id: targetId, type: "question" },
      });
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }
    }

    // NO HARD DELETE: Soft-archive by setting deleted_at = NOW()
    await execute(`UPDATE questions SET deleted_at = NOW() WHERE id = $1 OR stem = $1`, [idOrText]);

    if (uuidRegex.test(idOrText)) {
      await recordAuditLog({
        adminUserId: adminUser?.id,
        action: "archive",
        category: "question",
        entityType: "question",
        entityId: targetId,
        metadata: { archivedBy: adminUser?.name || adminUser?.email },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error archiving question:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restores an archived question.
 * SA-ONLY (Super Admin)!
 */
export async function restoreQuestionAction(questionId: string, adminUser: PermissionUser) {
  try {
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "restore_item",
      item: { id: questionId, type: "question" },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    await execute(`UPDATE questions SET deleted_at = NULL, updated_at = NOW() WHERE id = $1`, [questionId]);

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "restore",
      category: "question",
      entityType: "question",
      entityId: questionId,
      metadata: { restoredBy: adminUser.name || adminUser.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error restoring question:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Permanently deletes a question from the database.
 * SA-ONLY (Super Admin)!
 */
export async function permanentlyDeleteQuestionAction(questionId: string, adminUser: PermissionUser) {
  try {
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "restore_item", // SA-only capability
      item: { id: questionId, type: "question" },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // Delete related child rows first
    await execute(`DELETE FROM question_options WHERE question_id = $1`, [questionId]);
    await execute(`DELETE FROM question_tags WHERE question_id = $1`, [questionId]);
    await execute(`DELETE FROM condition_questions WHERE question_id = $1`, [questionId]);
    await execute(`DELETE FROM attempt_questions WHERE question_id = $1`, [questionId]);
    await execute(`DELETE FROM questions WHERE id = $1`, [questionId]);

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "delete_permanent",
      category: "question",
      entityType: "question",
      entityId: questionId,
      metadata: { deletedPermanentlyBy: adminUser.name || adminUser.email },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error permanently deleting question:", error);
    return { success: false, error: error.message };
  }
}


