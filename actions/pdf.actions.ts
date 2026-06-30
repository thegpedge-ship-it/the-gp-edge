"use server";

import prisma from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import PDFDocument from "pdfkit";

interface ExtractedData {
  title: string;
  system: string;
  category: string;
  symptoms: string;
  treatment: string;
  notes: string;
  references: { id: number; text: string }[];
}

/**
 * Generates a clean clinical PDF document from extracted guideline text
 * and uploads it to Cloudflare R2, returning the final public PDF URL.
 */
export async function generatePdfAndUploadToR2Action(data: ExtractedData) {
  try {
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Title
      doc.fontSize(22).fillColor("#0f766e").text(data.title || "Clinical Reference Guideline", { align: "center" });
      doc.moveDown(1.5);

      // Metadata Header
      doc.fontSize(9).fillColor("#475569").text(
        `Author: GP Edge Admin  |  System: ${data.system || "Endocrine"}  |  Category: ${data.category || "Clinical Reference"}`,
        { align: "center" }
      );
      doc.moveDown(2);

      // Section 1: Overview
      doc.fontSize(14).fillColor("#0f766e").text("1. Overview", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#1e293b").text(data.notes || "No overview notes provided.", { lineGap: 4 });
      doc.moveDown(1.5);

      // Section 2: Clinical Features
      doc.fontSize(14).fillColor("#0f766e").text("2. Clinical Features", { underline: true });
      doc.moveDown(0.5);
      if (data.symptoms) {
        const symptomsList = data.symptoms.split("\n").filter(Boolean);
        for (const item of symptomsList) {
          doc.fontSize(10).fillColor("#1e293b").text(`• ${item.trim()}`, { lineGap: 3 });
        }
      } else {
        doc.fontSize(10).fillColor("#1e293b").text("No clinical symptoms documented.", { lineGap: 4 });
      }
      doc.moveDown(1.5);

      // Section 3: Management
      doc.fontSize(14).fillColor("#0f766e").text("3. Management & Treatment Guidelines", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#1e293b").text(data.treatment || "No management guidelines documented.", { lineGap: 4 });
      doc.moveDown(2);

      // Section 4: References
      if (data.references && data.references.length > 0) {
        doc.fontSize(12).fillColor("#0f766e").text("Clinical References", { underline: true });
        doc.moveDown(0.5);
        data.references.forEach((ref) => {
          doc.fontSize(9).fillColor("#64748b").text(`[${ref.id}] ${ref.text}`, { lineGap: 2 });
        });
      }

      doc.end();
    });

    const fileKey = `${crypto.randomUUID()}-${(data.title || "guideline").toLowerCase().replace(/[^a-z0-9.-]/g, "_")}.pdf`;
    const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";

    // Upload directly to Cloudflare R2
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    // Register the file in the files table
    const newFile = await prisma.files.create({
      data: {
        bucket: bucketName,
        object_key: fileKey,
        original_name: `${data.title || "guideline"}.pdf`,
        mime_type: "application/pdf",
        size_bytes: pdfBuffer.length,
        status: "active"
      }
    });

    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
    const basePublicUrl = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
    const pdfUrl = `${basePublicUrl}${fileKey}`;

    return { success: true, pdfUrl, fileSize: `${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB` };
  } catch (err: any) {
    console.error("Failed to generate and upload PDF:", err);
    return { success: false, error: err.message };
  }
}
