import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";

// ── Lightweight text extraction helpers ────────────────────────────────────────

/**
 * Extract plain text from a PDF buffer using a simple byte-scan approach.
 * Pulls readable ASCII strings from the binary, which works well for
 * text-based PDFs without needing any native bindings.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const content = buffer.toString("latin1");
    // Pull runs of printable ASCII characters (length ≥ 4)
    const strings: string[] = [];
    let current = "";
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i);
      if (code >= 32 && code <= 126) {
        current += content[i];
      } else {
        if (current.length >= 4) strings.push(current);
        current = "";
      }
    }
    if (current.length >= 4) strings.push(current);
    return strings.join(" ").replace(/\s{3,}/g, "\n").trim();
  } catch {
    return "";
  }
}

/**
 * Extract plain text from a DOCX buffer.
 * DOCX files are ZIP archives — we scan for the word/document.xml entry
 * and strip XML tags to get plain text.
 */
function extractTextFromDocxBuffer(buffer: Buffer): string {
  try {
    const content = buffer.toString("utf-8");
    // Find XML text segments between tags
    const xmlMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const text = xmlMatches
      .map((m) => m.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/\s{3,}/g, "\n")
      .trim();
    return text || extractTextFromPdfBuffer(buffer); // fallback to raw scan
  } catch {
    return extractTextFromPdfBuffer(buffer);
  }
}

// ── SOAP section keyword matchers ──────────────────────────────────────────────

const SOAP_PATTERNS: Record<string, RegExp[]> = {
  title: [
    /^([A-Z][A-Za-z\s\-:]{3,60})(?:\n|$)/m,
    /title[:\s]+(.+)/i,
    /template[:\s]+(.+)/i,
  ],
  system: [
    /system[:\s]+(respiratory|cardiovascular|endocrine|psychiatry|dermatology|musculoskeletal|gastroenterology|women.?s health|paediatrics|mbs)/i,
    /(respiratory|cardiovascular|endocrine|psychiatry|dermatology|musculoskeletal|gastroenterology|paediatrics)/i,
  ],
  category: [
    /category[:\s]+(acute|chronic|screening|mental health|billing|obstetrics)/i,
    /(acute|chronic|screening|mental health|billing)/i,
  ],
  subjective: [
    /subjective[:\s]*\n?([^\n]+(?:\n(?!objective|assessment|plan|doctor|patient)[^\n]+)*)/i,
    /s(?:ymptoms?|ubjective)[:\s]*\n?([^\n]+(?:\n(?!o\b|objective|assessment|plan)[^\n]+)*)/i,
  ],
  objective: [
    /objective[:\s]*\n?([^\n]+(?:\n(?!assessment|plan|doctor|patient)[^\n]+)*)/i,
    /o(?:bjective|bservation)[:\s]*\n?([^\n]+(?:\n(?!a\b|assessment|plan)[^\n]+)*)/i,
  ],
  assessment: [
    /assessment[:\s]*\n?([^\n]+(?:\n(?!plan|doctor|patient)[^\n]+)*)/i,
    /a(?:ssessment|nalysis|diagnosis)[:\s]*\n?([^\n]+(?:\n(?!p\b|plan)[^\n]+)*)/i,
  ],
  plan: [
    /plan[:\s]*\n?([^\n]+(?:\n(?!doctor|patient|notes)[^\n]+)*)/i,
    /p(?:lan|management)[:\s]*\n?([^\n]+(?:\n(?!doctor|patient)[^\n]+)*)/i,
  ],
  symptoms: [
    /symptoms?[:\s]*\n?([^\n]+(?:\n(?!treatment|assessment|objective)[^\n]+)*)/i,
    /presents? with[:\s]*([^\n]+)/i,
    /complaints?[:\s]*([^\n]+)/i,
  ],
  treatment: [
    /treatment[:\s]*\n?([^\n]+(?:\n(?!notes|resources)[^\n]+)*)/i,
    /management[:\s]*\n?([^\n]+)/i,
    /medication[:\s]*\n?([^\n]+)/i,
  ],
  notes: [
    /notes?[:\s]*\n?([^\n]+)/i,
    /summary[:\s]*\n?([^\n]+)/i,
    /remarks?[:\s]*\n?([^\n]+)/i,
  ],
};

function matchField(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1]
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .substring(0, 600);
    }
  }
  return "";
}

function inferTitle(fileName: string, text: string): string {
  // Try to get title from first non-empty line of extracted text
  const firstLine = text.split("\n").find((l) => l.trim().length > 4);
  if (firstLine && firstLine.trim().length < 80) return firstLine.trim();
  // Fall back to file name without extension
  return fileName
    .replace(/\.(pdf|docx?)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let tempPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name || "uploaded_file";
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx", "doc"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX files are supported." },
        { status: 400 }
      );
    }

    // Save buffer for reading
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temp for cleanup tracking
    const tempDir = os.tmpdir();
    tempPath = join(tempDir, `gpedgesync_${Date.now()}_${fileName}`);
    await writeFile(tempPath, buffer);

    // ── Extract text ─────────────────────────────────────────────────────────
    let rawText = "";
    if (ext === "pdf") {
      rawText = extractTextFromPdfBuffer(buffer);
    } else {
      rawText = extractTextFromDocxBuffer(buffer);
    }

    // ── Parse SOAP fields ────────────────────────────────────────────────────
    const title = matchField(rawText, SOAP_PATTERNS.title) || inferTitle(fileName, rawText);
    const system = matchField(rawText, SOAP_PATTERNS.system) || "Respiratory";
    const category = matchField(rawText, SOAP_PATTERNS.category) || "Acute";
    const subjective = matchField(rawText, SOAP_PATTERNS.subjective) || matchField(rawText, SOAP_PATTERNS.symptoms);
    const objective = matchField(rawText, SOAP_PATTERNS.objective);
    const assessment = matchField(rawText, SOAP_PATTERNS.assessment) || matchField(rawText, SOAP_PATTERNS.notes);
    const plan = matchField(rawText, SOAP_PATTERNS.plan) || matchField(rawText, SOAP_PATTERNS.treatment);
    const symptoms = matchField(rawText, SOAP_PATTERNS.symptoms);
    const treatment = matchField(rawText, SOAP_PATTERNS.treatment);
    const notes = matchField(rawText, SOAP_PATTERNS.notes);

    // Cleanup
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      tempPath = null;
    }

    return NextResponse.json({
      success: true,
      title: title || "Extracted Template",
      system,
      category,
      subjective,
      objective,
      assessment,
      plan,
      symptoms,
      treatment,
      notes,
      rawTextLength: rawText.length,
      fileName,
    });
  } catch (error: any) {
    // Always clean up
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    return NextResponse.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
