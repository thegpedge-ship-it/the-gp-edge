"use server";

import prisma from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

/**
 * Syncs a list of questions to the Neon PostgreSQL database.
 * If a question with the exact same stem (text) exists, it updates it;
 * otherwise, it creates a new question row.
 */
export async function importQuestionsAction(questionsList: any[]) {
  try {
    for (const q of questionsList) {
      if (!q.text || !q.text.trim()) continue;

      // 1. Map difficulty level and status enums to lowercased PostgreSQL enums
      const difficulty = (q.difficulty?.toLowerCase() || "medium") as "easy" | "medium" | "hard";
      const status = (q.status?.toLowerCase() || "draft") as "draft" | "review" | "published";

      // 2. Ensure referenced exam_type exists to prevent foreign key constraint violations
      const examTypeCode = q.examType || "AKT";
      const existingExamType = await prisma.exam_types.findUnique({
        where: { code: examTypeCode }
      });
      if (!existingExamType) {
        await prisma.exam_types.create({
          data: {
            code: examTypeCode,
            name: examTypeCode === "AKT" ? "Applied Knowledge Test" : examTypeCode === "KFP" ? "Key Feature Problem" : examTypeCode
          }
        });
      }

      // 3. Find matching subject and subtopic IDs based on parsed topic & subtopic fields
      let subjectId: string | null = null;
      let subtopicId: string | null = null;
      
      const rawTopic = q.topic ? q.topic.split(",")[0].trim() : "General";
      const rawSubtopic = q.subtopic ? q.subtopic.split(",")[0].trim() : "";

      // A) Try to find a subtopic matching rawSubtopic
      if (rawSubtopic) {
        const subtopicMatch = await prisma.subtopics.findFirst({
          where: { name: { equals: rawSubtopic, mode: "insensitive" } }
        });
        if (subtopicMatch) {
          subtopicId = subtopicMatch.id;
          subjectId = subtopicMatch.subject_id;
        }
      }

      // B) If still no subject/subtopic found, match by rawTopic (subject name)
      if (!subjectId) {
        let searchTopic = rawTopic;
        const lowerRaw = rawTopic.toLowerCase();
        
        // Smart normalize commonly extracted aliases to standard DB subject names
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

        // Try to match searchTopic in subtopics first
        const subtopicMatch = await prisma.subtopics.findFirst({
          where: { name: { equals: searchTopic, mode: "insensitive" } }
        });
        if (subtopicMatch) {
          subtopicId = subtopicMatch.id;
          subjectId = subtopicMatch.subject_id;
        } else {
          // Try to match searchTopic in subjects
          const subjectMatch = await prisma.subjects.findFirst({
            where: { name: { equals: searchTopic, mode: "insensitive" } }
          });
          if (subjectMatch) {
            subjectId = subjectMatch.id;
          } else {
            // Partial match query
            const partialSubject = await prisma.subjects.findFirst({
              where: { name: { contains: searchTopic, mode: "insensitive" } }
            });
            if (partialSubject) {
              subjectId = partialSubject.id;
            }
          }
        }
      }

      // 4. Match and link the clinical image file if it exists
      let imageFileId: string | null = null;
      
      if (q.image) {
        if (q.image.startsWith("data:image/")) {
          // Parse base64 parts
          const parts = q.image.split(";base64,");
          const mimeType = parts[0].split(":")[1];
          const base64Data = parts[1];
          const buffer = Buffer.from(base64Data, "base64");
          
          // Generate a unique object key
          const ext = mimeType.split("/")[1] || "jpg";
          const objectKey = `${crypto.randomUUID()}.${ext}`;
          const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";

          try {
            // Upload directly to Cloudflare R2 from the server
            await r2.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
                Body: buffer,
                ContentType: mimeType,
              })
            );

            // Register the file in the files table
            const newFile = await prisma.files.create({
              data: {
                bucket: bucketName,
                object_key: objectKey,
                original_name: `question_image_${Date.now()}.${ext}`,
                mime_type: mimeType,
                size_bytes: buffer.length,
                status: "active"
              }
            });
            imageFileId = newFile.id;
          } catch (uploadErr) {
            console.error("Direct server upload of question image to R2 failed:", uploadErr);
          }
        } else if (q.image.startsWith("http")) {
          // Already an R2 public URL
          const urlParts = q.image.split("/");
          const objectKey = urlParts[urlParts.length - 1];
          const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";
          
          const existingFile = await prisma.files.findFirst({
            where: { object_key: objectKey }
          });
          
          if (existingFile) {
            imageFileId = existingFile.id;
          } else {
            // Create a file record for the R2 object
            const cleanName = objectKey.includes("-") ? objectKey.split("-").slice(1).join("-") : objectKey;
            const newFile = await prisma.files.create({
              data: {
                bucket: bucketName,
                object_key: objectKey,
                original_name: cleanName,
                mime_type: "image/jpeg",
                size_bytes: 0,
                status: "active"
              }
            });
            imageFileId = newFile.id;
          }
        }
      }

      // 5. Check if the question already exists by comparing its text (stem)
      const existingQuestion = await prisma.questions.findFirst({
        where: { stem: q.text }
      });

      let questionId = "";
      if (existingQuestion) {
        questionId = existingQuestion.id;
        await prisma.questions.update({
          where: { id: questionId },
          data: {
            rationale: q.rationale || "",
            difficulty,
            status,
            exam_type_code: examTypeCode,
            subject_id: subjectId,
            subtopic_id: subtopicId,
            image_file_id: imageFileId,
            updated_at: new Date()
          }
        });
        
        // Remove existing options and tags to reload them cleanly
        await prisma.question_options.deleteMany({
          where: { question_id: questionId }
        });
        await prisma.question_tags.deleteMany({
          where: { question_id: questionId }
        });
      } else {
        const createdQuestion = await prisma.questions.create({
          data: {
            stem: q.text,
            rationale: q.rationale || "",
            difficulty,
            status,
            exam_type_code: examTypeCode,
            subject_id: subjectId,
            subtopic_id: subtopicId,
            image_file_id: imageFileId
          }
        });
        questionId = createdQuestion.id;
      }

      // 6. Insert options with correct positions and key associations
      if (q.options && q.options.length > 0) {
        await prisma.question_options.createMany({
          data: q.options.map((optLabel: string, index: number) => ({
            question_id: questionId,
            label: optLabel || `Option ${String.fromCharCode(65 + index)}`,
            position: index + 1,
            is_correct: index === q.correctIndex
          }))
        });
      }

      // 7. Create or link tags
      if (q.tags && q.tags.length > 0) {
        for (const tagName of q.tags) {
          const cleanTagName = tagName.trim();
          if (!cleanTagName) continue;
          
          let tag = await prisma.tags.findFirst({
            where: { label: { equals: cleanTagName, mode: "insensitive" } }
          });
          if (!tag) {
            const slug = cleanTagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            tag = await prisma.tags.create({
              data: {
                slug,
                label: cleanTagName
              }
            });
          }
          
          await prisma.question_tags.create({
            data: {
              question_id: questionId,
              tag_id: tag.id
            }
          });
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error importing questions to Neon:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a question from the Neon PostgreSQL database based on its stem (text).
 */
export async function deleteQuestionAction(text: string) {
  try {
    if (!text || !text.trim()) return { success: false, error: "Empty stem" };
    
    const existing = await prisma.questions.findFirst({
      where: { stem: text }
    });
    if (existing) {
      await prisma.questions.delete({
        where: { id: existing.id }
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting question in Neon:", error);
    return { success: false, error: error.message };
  }
}
