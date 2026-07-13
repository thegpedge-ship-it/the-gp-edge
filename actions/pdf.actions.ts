"use server";

import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import path from "path";

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
 * Generates a clinical PDF and uploads it to Cloudflare R2.
 * Returns the public PDF URL — no database row is written.
 */
export async function generatePdfAndUploadToR2Action(data: ExtractedData) {
  try {
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const regularFontPath = path.join(process.cwd(), "assets", "fonts", "Geist-Regular.ttf");
      const boldFontPath = path.join(process.cwd(), "assets", "fonts", "LiberationSans-Bold.ttf");
      doc.registerFont("Geist-Regular", regularFontPath);
      doc.registerFont("Geist-Bold", boldFontPath);

      doc.font("Geist-Bold").fontSize(22).fillColor("#0f766e").text(
        data.title || "Clinical Reference Guideline", { align: "center" }
      );
      doc.moveDown(1.5);

      doc.font("Geist-Regular").fontSize(9).fillColor("#475569").text(
        `Author: GP Edge Admin  |  System: ${data.system || "Endocrine"}  |  Category: ${data.category || "Clinical Reference"}`,
        { align: "center" }
      );
      doc.moveDown(2);

      doc.font("Geist-Bold").fontSize(14).fillColor("#0f766e").text("1. Overview", { underline: true });
      doc.moveDown(0.5);
      doc.font("Geist-Regular").fontSize(10).fillColor("#1e293b").text(data.notes || "No overview notes provided.", { lineGap: 4 });
      doc.moveDown(1.5);

      doc.font("Geist-Bold").fontSize(14).fillColor("#0f766e").text("2. Clinical Features", { underline: true });
      doc.moveDown(0.5);
      if (data.symptoms) {
        const symptomsList = data.symptoms.split("\n").filter(Boolean);
        for (const item of symptomsList) {
          doc.font("Geist-Regular").fontSize(10).fillColor("#1e293b").text(`• ${item.trim()}`, { lineGap: 3 });
        }
      } else {
        doc.font("Geist-Regular").fontSize(10).fillColor("#1e293b").text("No clinical symptoms documented.", { lineGap: 4 });
      }
      doc.moveDown(1.5);

      doc.font("Geist-Bold").fontSize(14).fillColor("#0f766e").text("3. Management & Treatment Guidelines", { underline: true });
      doc.moveDown(0.5);
      doc.font("Geist-Regular").fontSize(10).fillColor("#1e293b").text(data.treatment || "No management guidelines documented.", { lineGap: 4 });
      doc.moveDown(2);

      if (data.references?.length > 0) {
        doc.font("Geist-Bold").fontSize(12).fillColor("#0f766e").text("Clinical References", { underline: true });
        doc.moveDown(0.5);
        data.references.forEach((ref) => {
          doc.font("Geist-Regular").fontSize(9).fillColor("#64748b").text(`[${ref.id}] ${ref.text}`, { lineGap: 2 });
        });
      }

      doc.end();
    });

    const fileKey = `${crypto.randomUUID()}-${(data.title || "guideline").toLowerCase().replace(/[^a-z0-9.-]/g, "_")}.pdf`;
    const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    const publicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
    const pdfUrl = `${publicUrl}/${fileKey}`;

    return {
      success: true,
      pdfUrl,
      fileSize: `${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB`,
    };
  } catch (err: any) {
    console.error("Failed to generate and upload PDF:", err);
    return { success: false, error: err.message };
  }
}
