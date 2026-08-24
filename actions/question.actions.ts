"use server";

import { query, queryOne, execute } from "@/lib/db";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";
import { registerOrUpdateTopicWithCodeAction } from "@/actions/taxonomy.actions";
import { buildBulkQuestionWhereClause, BulkQuestionFilters } from "@/lib/questionQueryFilters";

export type { BulkQuestionFilters } from "@/lib/questionQueryFilters";

/**
 * Adds the "Item Data Collection" spec fields to `questions` (task_type, patient_context,
 * key_drugs_mentioned, source_refs, wiki_page_id/version, supplemental sources, volatility_tier,
 * testable_point, expected_pass_rate, review/sign-off tracking) plus the `tags.tag_category`
 * column (used to scope the clinicalConcepts picker) and the append-only `question_events` log.
 * Idempotent — safe to call on every write, same pattern as the taxonomy column migration.
 */
export async function ensureQuestionExtendedColumns() {
  await execute(`
    ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS task_type TEXT,
      ADD COLUMN IF NOT EXISTS patient_context JSONB,
      ADD COLUMN IF NOT EXISTS key_drugs_mentioned JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS source_refs JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS wiki_page_id TEXT,
      ADD COLUMN IF NOT EXISTS wiki_version TEXT,
      ADD COLUMN IF NOT EXISTS supplemental_sources_used JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS key_rests_on_supplemental BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS volatility_tier TEXT,
      ADD COLUMN IF NOT EXISTS testable_point TEXT,
      ADD COLUMN IF NOT EXISTS expected_pass_rate NUMERIC,
      ADD COLUMN IF NOT EXISTS date_last_reviewed TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id),
      ADD COLUMN IF NOT EXISTS signed_off_by UUID REFERENCES admin_users(id)
  `);
  // Taxonomy denormalization columns — normally added by taxonomy.actions.ts's
  // syncMasterTaxonomyAction(), but that hasn't necessarily run on every environment.
  // Repeating the ALTER here (idempotent) guarantees the columns this feature reads/writes
  // actually exist regardless of whether that sync has been triggered.
  await execute(`
    ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS topic_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS home_unit VARCHAR(20),
      ADD COLUMN IF NOT EXISTS group_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cross_ref_units JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS depth_tier VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cross_cutting_tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS topic_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS taxonomy_version VARCHAR(20) DEFAULT '1.1'
  `);
  await execute(`ALTER TABLE tags ADD COLUMN IF NOT EXISTS tag_category TEXT DEFAULT 'general'`);
  await execute(`
    CREATE TABLE IF NOT EXISTS question_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor_type TEXT NOT NULL DEFAULT 'human',
      actor_id UUID,
      actor_name TEXT,
      fields_changed JSONB,
      from_status TEXT,
      to_status TEXT,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`CREATE INDEX IF NOT EXISTS idx_question_events_question ON question_events(question_id)`);
}

async function recordQuestionEvent(params: {
  questionId: string;
  eventType: "created" | "edited" | "reviewed" | "signedoff" | "published" | "flagged" | "retired" | "restored";
  fieldsChanged?: string[];
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  adminUser?: PermissionUser;
}) {
  try {
    await execute(
      `INSERT INTO question_events (question_id, event_type, actor_type, actor_id, actor_name, fields_changed, from_status, to_status, note)
       VALUES ($1, $2, 'human', $3, $4, $5, $6, $7, $8)`,
      [
        params.questionId,
        params.eventType,
        params.adminUser?.id || null,
        params.adminUser?.name || params.adminUser?.email || "GP Edge Admin",
        params.fieldsChanged && params.fieldsChanged.length > 0 ? JSON.stringify(params.fieldsChanged) : null,
        params.fromStatus ?? null,
        params.toStatus ?? null,
        params.note ?? null,
      ]
    );
  } catch (e) {
    console.warn("Could not record question event:", e);
  }
}

/**
 * Syncs a list of questions to the Neon PostgreSQL database via raw pg.
 * If a question with the exact same stem exists it updates it,
 * otherwise it creates a new row.
 */
export async function importQuestionsAction(questionsList: any[], adminUser?: PermissionUser) {
  try {
    await ensureQuestionExtendedColumns();
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
      // subtopics has UNIQUE (subject_id, slug); the in-memory map is keyed by lowercased name,
      // so two label variants that normalize to the same slug (e.g. differing punctuation across
      // a large batch) can both miss the map and collide on insert. ON CONFLICT keeps that safe
      // instead of throwing and failing the whole import chunk.
      const newSubtopic = await queryOne<{ id: string }>(
        `INSERT INTO subtopics (subject_id, slug, name) VALUES ($1, $2, $3)
         ON CONFLICT (subject_id, slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [subjectId, slug, name]
      );
      if (newSubtopic) {
        subtopicMap.set(key, { id: newSubtopic.id, subjectId });
        return newSubtopic.id;
      }
      return null;
    };

    const getOrCreateTag = async (label: string, category: "general" | "clinical_concept" = "general"): Promise<string | null> => {
      const clean = label.trim();
      const key = clean.toLowerCase();
      if (category === "general" && tagMap.has(key)) return tagMap.get(key)!;

      const slug = key.replace(/[^a-z0-9]+/g, "-");
      const tag = await queryOne<{ id: string }>(
        `INSERT INTO tags (slug, label, tag_category) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label,
           tag_category = CASE WHEN tags.tag_category = 'clinical_concept' OR EXCLUDED.tag_category = 'clinical_concept' THEN 'clinical_concept' ELSE tags.tag_category END
         RETURNING id`,
        [slug, clean, category]
      );
      if (tag) {
        if (category === "general") tagMap.set(key, tag.id);
        return tag.id;
      }
      return null;
    };

    const results: { text: string; dbId: string; uqid?: string }[] = [];
    const errors: { text: string; error: string }[] = [];

    for (const q of questionsList) {
      if (!q.text || !q.text.trim()) continue;

      // Isolate each question so one bad row (a constraint violation, a malformed field) can't
      // silently fail the entire chunk it was imported in — every other question in the batch
      // still gets saved, and the caller learns exactly which ones didn't.
      try {

      const difficulty = (q.difficulty?.toLowerCase() || "medium") as string;
      const status = (q.status?.toLowerCase() || "published") as string;
      const examTypeCode: string = q.examType || "AKT";

      // Ensure exam type exists
      const examTypeKey = examTypeCode.toUpperCase();
      if (!examTypeSet.has(examTypeKey)) {
        const isKfp = examTypeCode === "KFP";
        const examName =
          examTypeCode === "AKT"
            ? "Applied Knowledge Test"
            : isKfp
            ? "Key Feature Problem"
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
        // Only let the Topic text resolve a subtopic when the admin didn't explicitly give one —
        // otherwise a brand-new subtopic name (e.g. "medical") that doesn't exist yet gets
        // silently overwritten here whenever the Topic text happens to match a DIFFERENT,
        // unrelated subtopic already in the database.
        if (!rawSubtopic && subtopicMap.has(key)) {
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

      // Item Data Collection spec fields — read once, shared by both insert and update paths
      const taskType = q.taskType || null;
      const patientContext = q.patientContext ? JSON.stringify(q.patientContext) : null;
      const keyDrugsMentioned = JSON.stringify(Array.isArray(q.keyDrugsMentioned) ? q.keyDrugsMentioned : []);
      const sourceRefs = JSON.stringify(Array.isArray(q.sourceRefs) ? q.sourceRefs : []);
      const wikiPageId = q.wikiPageId || null;
      const wikiVersion = q.wikiVersion || null;
      const supplementalSourcesUsed = JSON.stringify(Array.isArray(q.supplementalSourcesUsed) ? q.supplementalSourcesUsed : []);
      const keyRestsOnSupplemental = !!q.keyRestsOnSupplemental;
      const volatilityTier = q.volatilityTier || null;
      const testablePoint = q.testablePoint || null;
      const expectedPassRate = q.expectedPassRate != null && q.expectedPassRate !== "" ? Number(q.expectedPassRate) : null;

      // "Supersedes" — resolve a UQID reference to the row it replaces (dead `parent_id` column, now wired)
      let supersedesId: string | null = null;
      if (q.supersedesUqid) {
        const superseded = await queryOne<{ id: string }>(`SELECT id FROM questions WHERE uqid = $1`, [q.supersedesUqid.toUpperCase()]);
        supersedesId = superseded?.id || null;
      }

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
        const isKfp = examTypeCode === "KFP";
        const correctCount = isKfp ? (q.kfpCorrectCount ?? q.kftCorrectCount ?? null) : null;

        // Fetch current question's tracked fields — used to detect exam-type change (UQID reallocation)
        // and to build the question_events fieldsChanged diff below.
        const currentQ = await queryOne<any>(
          `SELECT exam_type_code, uqid, status, stem, lead_in, why_correct, knowledge_bank, pearl,
                  difficulty, task_type, volatility_tier
             FROM questions WHERE id = $1`,
          [questionId]
        );
        const beforeOptions = await query<{ label: string; is_correct: boolean }>(
          `SELECT label, is_correct FROM question_options WHERE question_id = $1 ORDER BY position`,
          [questionId]
        );

        const rawCurrentType = (currentQ?.exam_type_code || "AKT").toUpperCase();
        const rawTargetType = examTypeCode.toUpperCase();
        const currentExamType = rawCurrentType === "KFP" ? "KFP" : rawCurrentType;
        const targetExamType = rawTargetType === "KFP" ? "KFP" : rawTargetType;

        if (currentQ && (currentExamType !== targetExamType || (currentQ.uqid && !currentQ.uqid.startsWith(targetExamType)))) {
          // Exam type changed (e.g. AKT -> KFP or KFP -> AKT): allocate a new sequential UQID with target prefix
          const targetSeq = targetExamType === "KFP" ? "kfp_seq" : "akt_seq";
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
                 task_type = $15, patient_context = $16, key_drugs_mentioned = $17,
                 source_refs = $18, wiki_page_id = $19, wiki_version = $20,
                 supplemental_sources_used = $21, key_rests_on_supplemental = $22,
                 volatility_tier = $23, testable_point = $24, expected_pass_rate = $25,
                 parent_id = COALESCE($26, parent_id),
                 version = version + 1, updated_at = NOW()
           WHERE id = $27`,
          [cleanStem, q.rationale || q.whyCorrect || "", difficulty, status,
           examTypeCode, subjectId, subtopicId, imageFileId,
           correctCount,
           q.leadIn || null, q.whyCorrect || null,
           q.knowledgeBank || null, q.pearl || null,
           finalUqid,
           taskType, patientContext, keyDrugsMentioned,
           sourceRefs, wikiPageId, wikiVersion,
           supplementalSourcesUsed, keyRestsOnSupplemental,
           volatilityTier, testablePoint, expectedPassRate,
           supersedesId,
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

        // Field-level diff for the append-only event log — flags the riskiest edits
        // (the keyed answer / distractor set) alongside ordinary content changes.
        const fieldsChanged: string[] = [];
        if (currentQ) {
          if ((currentQ.stem || "") !== cleanStem) fieldsChanged.push("stem");
          if ((currentQ.lead_in || "") !== (q.leadIn || "")) fieldsChanged.push("leadIn");
          if ((currentQ.why_correct || "") !== (q.whyCorrect || "")) fieldsChanged.push("whyCorrect");
          if ((currentQ.knowledge_bank || "") !== (q.knowledgeBank || "")) fieldsChanged.push("knowledgeBank");
          if ((currentQ.pearl || "") !== (q.pearl || "")) fieldsChanged.push("pearl");
          if ((currentQ.difficulty || "") !== difficulty) fieldsChanged.push("difficulty");
          if ((currentQ.task_type || null) !== taskType) fieldsChanged.push("taskType");
          if ((currentQ.volatility_tier || null) !== volatilityTier) fieldsChanged.push("volatilityTier");
        }
        if (q.options && q.options.length > 0) {
          const newLabels = q.options.map((o: string, i: number) => o || `Option ${String.fromCharCode(65 + i)}`);
          const oldLabels = beforeOptions.map((o) => o.label);
          if (JSON.stringify(oldLabels) !== JSON.stringify(newLabels)) fieldsChanged.push("options");
          const oldCorrect = beforeOptions.map((o) => o.is_correct);
          const isMultiCorrectDiff = examTypeCode === "KFP";
          const newCorrectSet = new Set<number>(
            isMultiCorrectDiff && Array.isArray(q.correctIndices) && q.correctIndices.length > 0
              ? q.correctIndices
              : [q.correctIndex ?? 0]
          );
          const newCorrect = q.options.map((_: string, i: number) => newCorrectSet.has(i));
          if (JSON.stringify(oldCorrect) !== JSON.stringify(newCorrect)) fieldsChanged.push("answer");
        }

        const statusChanged = currentQ && currentQ.status !== status;
        await recordQuestionEvent({
          questionId,
          eventType: statusChanged && status === "published" ? "published" : "edited",
          fieldsChanged,
          fromStatus: currentQ?.status ?? null,
          toStatus: status,
          adminUser,
        });
      } else {
        // Auto-generate UQID using DB sequence
        const isKfpNew = examTypeCode === "KFP";
        const seqName = isKfpNew ? "kfp_seq" : "akt_seq";
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
              knowledge_bank, pearl, batch_id, version,
              task_type, patient_context, key_drugs_mentioned, source_refs,
              wiki_page_id, wiki_version, supplemental_sources_used, key_rests_on_supplemental,
              volatility_tier, testable_point, expected_pass_rate, parent_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1,
                   $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
           RETURNING id`,
          [cleanStem, q.rationale || q.whyCorrect || "", difficulty, status, examTypeCode,
           subjectId, subtopicId, imageFileId,
           isKfpNew ? (q.kfpCorrectCount ?? q.kftCorrectCount ?? null) : null,
           finalUqid,
           q.leadIn || null, q.whyCorrect || null,
           q.knowledgeBank || null, q.pearl || null,
           autoBatchId,
           taskType, patientContext, keyDrugsMentioned, sourceRefs,
           wikiPageId, wikiVersion, supplementalSourcesUsed, keyRestsOnSupplemental,
           volatilityTier, testablePoint, expectedPassRate, supersedesId]
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
        await recordQuestionEvent({
          questionId,
          eventType: "created",
          toStatus: status,
          adminUser,
        });
      }

      // Replace options — support multiple correct for KFP / KFP + distractor rationales
      if (q.options && q.options.length > 0) {
        await execute(
          `DELETE FROM question_options 
            WHERE question_id = $1 AND position > $2`,
          [questionId, q.options.length]
        );
        const isMultiCorrect = examTypeCode === "KFP";
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

      // Replace tags — scoped to 'general' so it never touches clinicalConcepts tags below
      if (q.tags && q.tags.length > 0) {
        await execute(
          `DELETE FROM question_tags WHERE question_id = $1
             AND tag_id IN (SELECT id FROM tags WHERE tag_category = 'general')`,
          [questionId]
        );

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

      // Replace clinicalConcepts — controlled vocabulary reusing tags/question_tags,
      // scoped to tag_category = 'clinical_concept' so it never touches general tags above
      if (Array.isArray(q.clinicalConcepts)) {
        await execute(
          `DELETE FROM question_tags WHERE question_id = $1
             AND tag_id IN (SELECT id FROM tags WHERE tag_category = 'clinical_concept')`,
          [questionId]
        );
        const seenConcepts = new Set<string>();
        for (const conceptName of q.clinicalConcepts) {
          const cleanConcept = String(conceptName).trim();
          const conceptKey = cleanConcept.toLowerCase();
          if (!cleanConcept || seenConcepts.has(conceptKey)) continue;
          seenConcepts.add(conceptKey);

          const conceptTagId = await getOrCreateTag(cleanConcept, "clinical_concept");
          if (conceptTagId) {
            await execute(
              `INSERT INTO question_tags (question_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT (question_id, tag_id) DO NOTHING`,
              [questionId, conceptTagId]
            );
          }
        }
      }

      // Auto-register Topic Code (T####), Home Unit, and Tags in database & search section
      const topicLabel = rawSubtopic || rawTopic || "General";
      const topicReg = await registerOrUpdateTopicWithCodeAction({
        label: topicLabel,
        homeUnit: rawTopic || "General",
        topicType: "Question Topic",
        depth: q.depthTier,
        tags: q.tags || [],
        adminUser,
      });

      // Denormalize the taxonomy topic record onto the question row (Section C —
      // these columns existed but were never populated before this feature).
      if (topicReg.success) {
        const taxTopic = await queryOne<any>(
          `SELECT depth, topic_type, group_code, cross_refs, cross_cutting_tags, taxonomy_version
             FROM taxonomy_topics WHERE code = $1`,
          [topicReg.topicCode]
        );
        await execute(
          `UPDATE questions
             SET topic_code = $1, home_unit = $2, group_code = $3,
                 cross_ref_units = $4, depth_tier = $5, cross_cutting_tags = $6,
                 topic_type = $7, taxonomy_version = $8
           WHERE id = $9`,
          [
            topicReg.topicCode,
            topicReg.homeUnit,
            taxTopic?.group_code || null,
            JSON.stringify(taxTopic?.cross_refs || []),
            q.depthTier || taxTopic?.depth || null,
            JSON.stringify(taxTopic?.cross_cutting_tags || []),
            taxTopic?.topic_type || null,
            taxTopic?.taxonomy_version || null,
            questionId,
          ]
        );
      }

      results.push({ text: q.text, dbId: questionId, uqid: finalUqid });
      } catch (qErr: any) {
        console.error("Error importing question:", q.text?.slice(0, 80), qErr);
        errors.push({ text: q.text, error: qErr.message || "Failed to import this question." });
      }
    }
    return { success: true, results, errors: errors.length > 0 ? errors : undefined };
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
    await ensureQuestionExtendedColumns();

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "review",
      item: { id: questionId, type: "question" },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const before = await queryOne<{ status: string }>(`SELECT status FROM questions WHERE id = $1`, [questionId]);
    const isSignOff = newStatus === "published";

    await execute(
      `UPDATE questions
         SET status = $1, updated_at = NOW(), date_last_reviewed = NOW(),
             reviewed_by = $2, signed_off_by = CASE WHEN $3 THEN $2 ELSE signed_off_by END
       WHERE id = $4`,
      [newStatus, adminUser.id, isSignOff, questionId]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "review",
      category: "question",
      entityType: "question",
      entityId: questionId,
      metadata: { newStatus, reviewer: adminUser.name || adminUser.email },
    });

    await recordQuestionEvent({
      questionId,
      eventType: isSignOff ? "signedoff" : "reviewed",
      fromStatus: before?.status ?? null,
      toStatus: newStatus,
      adminUser,
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
      await recordQuestionEvent({ questionId: targetId, eventType: "retired", toStatus: "archived", adminUser });
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

    await recordQuestionEvent({ questionId, eventType: "restored", adminUser });

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

/**
 * The append-only lifecycle event log for one question (Section G — "History").
 */
export interface QuestionEvent {
  id: string;
  eventType: string;
  actorType: string;
  actorName: string | null;
  fieldsChanged: string[];
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
}

export async function getQuestionEventsAction(questionId: string): Promise<QuestionEvent[]> {
  try {
    await ensureQuestionExtendedColumns();
    const rows = await query<any>(
      `SELECT id, event_type, actor_type, actor_name, fields_changed, from_status, to_status, note, created_at
         FROM question_events
        WHERE question_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
      [questionId]
    );
    return rows.map((r) => ({
      id: r.id,
      eventType: r.event_type,
      actorType: r.actor_type,
      actorName: r.actor_name,
      fieldsChanged: Array.isArray(r.fields_changed) ? r.fields_changed : [],
      fromStatus: r.from_status,
      toStatus: r.to_status,
      note: r.note,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching question events:", error);
    return [];
  }
}

/**
 * Section E psychometrics — computed on read from live attempt data rather than
 * stored counters, so they're never stale and don't need a background job to maintain.
 */
export interface QuestionPsychometrics {
  timesServed: number;
  actualCorrectRate: number | null;
  medianTimeSeconds: number | null;
}

export async function getQuestionPsychometricsAction(questionId: string): Promise<QuestionPsychometrics> {
  try {
    const row = await queryOne<any>(
      `SELECT
         COUNT(aa.id)::int AS times_served,
         AVG(CASE WHEN aa.is_correct THEN 1.0 ELSE 0.0 END) AS actual_correct_rate,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY aa.time_spent_seconds) AS median_time_seconds
       FROM attempt_questions aq
       JOIN attempt_answers aa ON aa.attempt_question_id = aq.id
       WHERE aq.question_id = $1 AND aa.is_correct IS NOT NULL`,
      [questionId]
    );
    return {
      timesServed: row?.times_served ?? 0,
      actualCorrectRate: row?.actual_correct_rate != null ? Number(row.actual_correct_rate) : null,
      medianTimeSeconds: row?.median_time_seconds != null ? Number(row.median_time_seconds) : null,
    };
  } catch (error) {
    console.error("Error computing question psychometrics:", error);
    return { timesServed: 0, actualCorrectRate: null, medianTimeSeconds: null };
  }
}

/**
 * Bulk query-edit — Section 5 of the plan. Filters resolve to an explicit id list
 * server-side (real query, not a client-side filter over an already-fetched page),
 * which the admin previews and approves before any write happens.
 */
export async function previewBulkQuestionEditAction(filters: BulkQuestionFilters): Promise<{
  success: boolean;
  count: number;
  ids: string[];
  sample: { id: string; uqid: string | null; stem: string }[];
  error?: string;
}> {
  try {
    await ensureQuestionExtendedColumns();
    const { where, params } = buildBulkQuestionWhereClause(filters);
    const rows = await query<{ id: string; uqid: string | null; stem: string }>(
      `SELECT q.id, q.uqid, q.stem
         FROM questions q
         LEFT JOIN subtopics st ON st.id = q.subtopic_id
        WHERE ${where}
        ORDER BY q.created_at DESC
        LIMIT 2000`,
      params
    );
    return { success: true, count: rows.length, ids: rows.map((r) => r.id), sample: rows.slice(0, 20) };
  } catch (error: any) {
    console.error("Error previewing bulk question edit:", error);
    return { success: false, count: 0, ids: [], sample: [], error: error.message };
  }
}

export interface BulkQuestionChanges {
  status?: string;
  depthTier?: string;
  taskType?: string;
  volatilityTier?: string;
  knowledgeBank?: string;
  pearl?: string;
  addClinicalConcepts?: string[];
  removeClinicalConcepts?: string[];
  // Remaining Zone 4 / Item Data Collection metadata fields — content fields (stem, options,
  // answer, whyCorrect) are deliberately excluded from bulk-edit; those are single-item only.
  patientContext?: { ageBand?: string; sex?: string; pregnancyStatus?: string; setting?: string; atsiStatus?: string };
  keyDrugsMentioned?: string[];
  addSourceRef?: { docId: string; edition?: string; locator?: string; tier?: string; claimType?: string };
  wikiPageId?: string;
  wikiVersion?: string;
  supplementalSourcesUsed?: string[];
  keyRestsOnSupplemental?: boolean;
  testablePoint?: string;
  expectedPassRate?: number;
}

/**
 * Applies changes to the exact id list the admin previewed and approved — never a
 * re-run query — so what gets written always matches what was shown in the preview.
 */
export async function applyBulkQuestionEditAction(
  ids: string[],
  changes: BulkQuestionChanges,
  adminUser?: PermissionUser
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (!ids || ids.length === 0) return { success: false, error: "No questions selected." };
    await ensureQuestionExtendedColumns();

    const setClauses: string[] = [];
    const params: any[] = [];
    const fieldsChanged: string[] = [];

    const addSet = (col: string, val: any, fieldName: string) => {
      params.push(val);
      setClauses.push(`${col} = $${params.length}`);
      fieldsChanged.push(fieldName);
    };

    if (changes.status !== undefined) addSet("status", changes.status, "status");
    if (changes.depthTier !== undefined) addSet("depth_tier", changes.depthTier, "depthTier");
    if (changes.taskType !== undefined) addSet("task_type", changes.taskType, "taskType");
    if (changes.volatilityTier !== undefined) addSet("volatility_tier", changes.volatilityTier, "volatilityTier");
    if (changes.knowledgeBank !== undefined) addSet("knowledge_bank", changes.knowledgeBank, "knowledgeBank");
    if (changes.pearl !== undefined) addSet("pearl", changes.pearl, "pearl");
    if (changes.patientContext !== undefined) addSet("patient_context", JSON.stringify(changes.patientContext), "patientContext");
    if (changes.keyDrugsMentioned !== undefined) addSet("key_drugs_mentioned", JSON.stringify(changes.keyDrugsMentioned), "keyDrugsMentioned");
    if (changes.wikiPageId !== undefined) addSet("wiki_page_id", changes.wikiPageId, "wikiPageId");
    if (changes.wikiVersion !== undefined) addSet("wiki_version", changes.wikiVersion, "wikiVersion");
    if (changes.supplementalSourcesUsed !== undefined) addSet("supplemental_sources_used", JSON.stringify(changes.supplementalSourcesUsed), "supplementalSourcesUsed");
    if (changes.keyRestsOnSupplemental !== undefined) addSet("key_rests_on_supplemental", changes.keyRestsOnSupplemental, "keyRestsOnSupplemental");
    if (changes.testablePoint !== undefined) addSet("testable_point", changes.testablePoint, "testablePoint");
    if (changes.expectedPassRate !== undefined) addSet("expected_pass_rate", changes.expectedPassRate, "expectedPassRate");

    if (changes.addSourceRef && changes.addSourceRef.docId?.trim()) {
      params.push(JSON.stringify([changes.addSourceRef]));
      setClauses.push(`source_refs = COALESCE(source_refs, '[]'::jsonb) || $${params.length}::jsonb`);
      fieldsChanged.push("sourceRefs");
    }

    if (setClauses.length > 0) {
      params.push(ids);
      const idParamIdx = params.length;
      await execute(
        `UPDATE questions SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = ANY($${idParamIdx}::uuid[])`,
        params
      );
    }

    if (changes.addClinicalConcepts && changes.addClinicalConcepts.length > 0) {
      for (const label of changes.addClinicalConcepts) {
        const clean = label.trim();
        if (!clean) continue;
        const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const tag = await queryOne<{ id: string }>(
          `INSERT INTO tags (slug, label, tag_category) VALUES ($1, $2, 'clinical_concept')
           ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, tag_category = 'clinical_concept'
           RETURNING id`,
          [slug, clean]
        );
        if (tag) {
          await execute(
            `INSERT INTO question_tags (question_id, tag_id)
             SELECT unnest($1::uuid[]), $2
             ON CONFLICT (question_id, tag_id) DO NOTHING`,
            [ids, tag.id]
          );
        }
      }
      fieldsChanged.push("clinicalConcepts");
    }
    if (changes.removeClinicalConcepts && changes.removeClinicalConcepts.length > 0) {
      const slugs = changes.removeClinicalConcepts.map((l) => l.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      await execute(
        `DELETE FROM question_tags WHERE question_id = ANY($1::uuid[])
           AND tag_id IN (SELECT id FROM tags WHERE slug = ANY($2::text[]))`,
        [ids, slugs]
      );
      if (!fieldsChanged.includes("clinicalConcepts")) fieldsChanged.push("clinicalConcepts");
    }

    if (fieldsChanged.length === 0) {
      return { success: false, error: "No changes specified." };
    }

    // One question_events row per affected question, written as a single multi-row insert.
    await execute(
      `INSERT INTO question_events (question_id, event_type, actor_type, actor_id, actor_name, fields_changed, note)
       SELECT unnest($1::uuid[]), 'edited', 'human', $2, $3, $4::jsonb, $5`,
      [ids, adminUser?.id || null, adminUser?.name || adminUser?.email || "GP Edge Admin", JSON.stringify(fieldsChanged), "Bulk edit via query"]
    );

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: "bulk_edit",
      category: "question",
      entityType: "question",
      entityId: ids[0],
      metadata: { count: ids.length, fieldsChanged, changes },
    });

    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Error applying bulk question edit:", error);
    return { success: false, error: error.message };
  }
}


