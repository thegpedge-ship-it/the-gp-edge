import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { execFileSync } from "child_process";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Tesseract from "tesseract.js";

// Next.js App Router route segment config — allow large uploads (images in DOCX/PDF)
export const maxDuration = 60; // seconds
export const dynamic = "force-dynamic";


// Shim canvas globals (DOMMatrix, Image, etc.) for pdfjs-dist in Next.js Node environment using pure JS classes to avoid native binding errors
class DOMMatrixShim {
  a: number = 1;
  b: number = 0;
  c: number = 0;
  d: number = 1;
  e: number = 0;
  f: number = 0;

  m11: number = 1; m12: number = 0; m13: number = 0; m14: number = 0;
  m21: number = 0; m22: number = 1; m23: number = 0; m24: number = 0;
  m31: number = 0; m32: number = 0; m33: number = 1; m34: number = 0;
  m41: number = 0; m42: number = 0; m43: number = 0; m44: number = 1;

  constructor(init?: any) {
    if (Array.isArray(init)) {
      if (init.length === 6) {
        this.a = this.m11 = init[0];
        this.b = this.m12 = init[1];
        this.c = this.m21 = init[2];
        this.d = this.m22 = init[3];
        this.e = this.m41 = init[4];
        this.f = this.m42 = init[5];
      } else if (init.length === 16) {
        this.m11 = this.a = init[0];
        this.m12 = this.b = init[1];
        this.m13 = init[2];
        this.m14 = init[3];
        this.m21 = this.c = init[4];
        this.m22 = this.d = init[5];
        this.m23 = init[6];
        this.m24 = init[7];
        this.m31 = init[8];
        this.m32 = init[9];
        this.m33 = init[10];
        this.m34 = init[11];
        this.m41 = this.e = init[12];
        this.m42 = this.f = init[13];
        this.m43 = init[14];
        this.m44 = init[15];
      }
    } else if (init && typeof init === "object") {
      this.a = this.m11 = init.a !== undefined ? init.a : 1;
      this.b = this.m12 = init.b !== undefined ? init.b : 0;
      this.c = this.m21 = init.c !== undefined ? init.c : 0;
      this.d = this.m22 = init.d !== undefined ? init.d : 1;
      this.e = this.m41 = init.e !== undefined ? init.e : 0;
      this.f = this.m42 = init.f !== undefined ? init.f : 0;
    }
  }

  get is2D(): boolean {
    return (
      this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
      this.m43 === 0 && this.m44 === 1 && this.m13 === 0 && this.m14 === 0 &&
      this.m23 === 0 && this.m24 === 0
    );
  }

  get isIdentity(): boolean {
    return (
      this.m11 === 1 && this.m12 === 0 && this.m13 === 0 && this.m14 === 0 &&
      this.m21 === 0 && this.m22 === 1 && this.m23 === 0 && this.m24 === 0 &&
      this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
      this.m41 === 0 && this.m42 === 0 && this.m43 === 0 && this.m44 === 1
    );
  }

  static fromMatrix(init?: any) { return new DOMMatrixShim(init); }
  static fromFloat32Array(init: Float32Array) { return new DOMMatrixShim(Array.from(init)); }
  static fromFloat64Array(init: Float64Array) { return new DOMMatrixShim(Array.from(init)); }

  translate(tx: number = 0, ty: number = 0, tz: number = 0): DOMMatrixShim {
    const copy = new DOMMatrixShim();
    Object.assign(copy, this);
    copy.e = copy.m41 = this.e + tx * this.a + ty * this.c;
    copy.f = copy.m42 = this.f + tx * this.b + ty * this.d;
    return copy;
  }

  scale(sx: number = 1, sy: number = sx, sz: number = 1): DOMMatrixShim {
    const copy = new DOMMatrixShim();
    Object.assign(copy, this);
    copy.a = copy.m11 = this.a * sx;
    copy.b = copy.m12 = this.b * sx;
    copy.c = copy.m21 = this.c * sy;
    copy.d = copy.m22 = this.d * sy;
    return copy;
  }

  multiply(other: DOMMatrixShim): DOMMatrixShim {
    const copy = new DOMMatrixShim();
    copy.a = copy.m11 = this.a * other.a + this.c * other.b;
    copy.b = copy.m12 = this.b * other.a + this.d * other.b;
    copy.c = copy.m21 = this.a * other.c + this.c * other.d;
    copy.d = copy.m22 = this.b * other.c + this.d * other.d;
    copy.e = copy.m41 = this.a * other.e + this.c * other.f + this.e;
    copy.f = copy.m42 = this.b * other.e + this.d * other.f + this.f;
    return copy;
  }

  inverse(): DOMMatrixShim {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return new DOMMatrixShim();
    const inv = new DOMMatrixShim();
    inv.a = inv.m11 = this.d / det;
    inv.b = inv.m12 = -this.b / det;
    inv.c = inv.m21 = -this.c / det;
    inv.d = inv.m22 = this.a / det;
    inv.e = inv.m41 = (this.c * this.f - this.d * this.e) / det;
    inv.f = inv.m42 = (this.b * this.e - this.a * this.f) / det;
    return inv;
  }

  transformPoint(point: any) {
    const x = point.x || 0;
    const y = point.y || 0;
    return {
      x: x * this.a + y * this.c + this.e,
      y: x * this.b + y * this.d + this.f,
      z: point.z || 0,
      w: point.w || 1
    };
  }
}

class ImageDataShim {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

class Path2DShim {
  constructor() {}
  addPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  arc() {}
  arcTo() {}
  rect() {}
}

if (typeof global !== "undefined") {
  (global as any).DOMMatrix = DOMMatrixShim;
  (global as any).ImageData = ImageDataShim;
  (global as any).Path2D = Path2DShim;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).DOMMatrix = DOMMatrixShim;
  (globalThis as any).ImageData = ImageDataShim;
  (globalThis as any).Path2D = Path2DShim;
}

// ── Lightweight text extraction helpers ────────────────────────────────────────

/**
 * Check if a string looks like base64-encoded binary data (image streams, etc.).
 * Returns true for long strings (>=50 chars) that are 90%+ base64 alphabet with no spaces.
 */
function looksLikeBase64OrBinary(s: string): boolean {
  if (s.length < 50) return false;
  // If it contains spaces it's likely real text
  if (s.includes(" ")) return false;
  let b64Count = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    // A-Z(65-90), a-z(97-122), 0-9(48-57), +(43), /(47), =(61)
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 43 || c === 47 || c === 61) {
      b64Count++;
    }
  }
  return b64Count >= s.length * 0.9;
}

/**
 * Check if a string looks like a PDF internal operator/command.
 */
function looksLikePdfOperator(s: string): boolean {
  if (s.length > 120) return false;
  // PDF operators like /Type, /Subtype, /Font, BT, ET, Tf, Td, etc.
  if (/^\/[A-Z][a-zA-Z0-9]+$/.test(s)) return true;
  if (/^(BT|ET|Tf|Td|Tj|TJ|cm|re|f|W|n|q|Q|gs|Do)$/.test(s)) return true;
  // PDF stream dictionaries
  if (/^<</.test(s) || />>$/.test(s)) return true;
  // Raw hex strings
  if (/^[0-9A-Fa-f]{20,}$/.test(s)) return true;
  return false;
}

/**
 * Extract plain text from a PDF buffer using a simple byte-scan approach.
 * Pulls readable ASCII strings from the binary. Filters out base64 image
 * data and PDF internal commands to produce cleaner output.
 */
function extractTextFromPdfBufferFallback(buffer: Buffer): string {
  try {
    const content = buffer.toString("latin1");
    const strings: string[] = [];
    let current = "";
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i);
      if (code >= 32 && code <= 126) {
        current += content[i];
      } else {
        if (current.length >= 4) {
          // Filter out base64 image data and PDF operators
          if (!looksLikeBase64OrBinary(current) && !looksLikePdfOperator(current)) {
            strings.push(current);
          }
        }
        current = "";
      }
    }
    if (current.length >= 4 && !looksLikeBase64OrBinary(current) && !looksLikePdfOperator(current)) {
      strings.push(current);
    }
    return strings.join(" ").replace(/\s{3,}/g, "\n").trim();
  } catch {
    return "";
  }
}

/**
 * Run pdf-parse in a subprocess to bypass Next.js Turbopack bundler issues.
 * Returns parsed result or null if subprocess fails.
 */
async function extractPdfViaSubprocess(buffer: Buffer): Promise<{
  pages: { num: number; text: string }[];
  images: { pageNumber: number; dataUrl: string }[];
} | null> {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const inputPath = join(tempDir, `gpedge_pdf_in_${timestamp}.pdf`);
  const outputPath = join(tempDir, `gpedge_pdf_out_${timestamp}.json`);

  try {
    fs.writeFileSync(inputPath, buffer);

    const parts = ["lib", "pdf-extract-worker.js"];
    const workerScript = join(/*turbopackIgnore: true*/ process.cwd(), ...parts);

    if (!fs.existsSync(workerScript)) {
      console.error("PDF worker script not found at:", workerScript);
      return null;
    }

    execFileSync("node", [workerScript, inputPath, outputPath], {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: process.cwd(),
    });

    if (!fs.existsSync(outputPath)) {
      console.error("PDF worker did not produce output file");
      return null;
    }

    const raw = fs.readFileSync(outputPath, "utf8");
    return JSON.parse(raw);
  } catch (e: any) {
    console.error("PDF subprocess extraction failed:", e.message);
    if (e.stderr) console.error("stderr:", e.stderr.toString());
    return null;
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

/**
 * Extract plain text from a PDF buffer.
 * Tries subprocess first, then in-process PDFParse, then byte-scan fallback.
 */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // Try subprocess first
  try {
    const subResult = await extractPdfViaSubprocess(buffer);
    if (subResult && subResult.pages.length > 0) {
      const text = subResult.pages.map((p) => p.text || "").join("\n\n").trim();
      if (text.length > 20) return text;
    }
  } catch {}

  // Try in-process PDFParse
  try {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const textResult = await parser.getText();
    if (textResult.text && textResult.text.trim().length > 20) {
      return textResult.text;
    }
  } catch (error) {
    console.error("PDFParse text extraction failed, falling back:", error);
  }

  return extractTextFromPdfBufferFallback(buffer);
}

/**
 * Associate images with catalog / clinical document text by distributing them
 * across page boundaries. Unlike the question-bank heuristic this does not
 * require "Question N" markers — it simply inserts each image at a paragraph
 * break roughly proportional to where it appeared in the original PDF.
 */
function associateCatalogImagesWithText(pageTexts: string[], pageImages: string[][]): string {
  const parts: string[] = [];
  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i].trim();
    if (pageText) parts.push(pageText);
    // Append images found on this page immediately after the page text
    const imgs = pageImages[i] || [];
    for (const url of imgs) {
      parts.push(`[IMAGE: ${url}]`);
    }
  }
  return parts.join("\n\n");
}

/**
 * Associate extracted images with the corresponding question blocks within the text.
 */
function associateImagesWithText(text: string, dataUrls: string[]): string {
  if (dataUrls.length === 0) return text;
  
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Try split by Question/Q prefix first
  let separatorRegex = /((?:Question|Q)\s*\d+[:.]?)/i;
  let parts = normalizedText.split(separatorRegex);
  
  if (parts.length <= 1) {
    // Fallback to numeric splits
    separatorRegex = /((?:\n|^)\s*\d+[\.\)]\s+)/;
    parts = normalizedText.split(separatorRegex);
  }
  
  if (parts.length <= 1) {
    // Check if the block text actually contains any image keywords
    const imageKeywords = /ecg|ekg|rash|lesion|dermatology|skin|x-ray|xray|cxr|radiograph|ct\s+scan|mri|ultrasound|photo|picture|image|img|illustration|diagram|chart|graph|figure|fig\b|shown|depict|below|above|visual|see\s+below|clinical|patient|scan|angiogram|histology|biopsy|pathology|microscope|endoscopy|colonoscopy|fundoscopy|otoscopy|view|observe|demonstrate|exhibit|display|reveal/i;
    if (!imageKeywords.test(normalizedText)) {
      return normalizedText;
    }
    // If it does, find the best position to insert the images at the end of the question text
    let resultText = normalizedText;
    for (const url of dataUrls) {
      const markerRegex = /\n\s*(?:Options:|Correct Answer:|Correct:|Answer:|[A-H][\.\)\-]\s+|Topic:|Category:|Subtopic:|Difficulty:|Tags:|Rationale:|High-Yield Rationale:|Explanation:|Explaination:)/i;
      const match = resultText.match(markerRegex);
      if (match && match.index !== undefined) {
        const idx = match.index;
        resultText = resultText.substring(0, idx).trim() + `\n[IMAGE: ${url}]\n` + resultText.substring(idx);
      } else {
        resultText = resultText.trim() + `\n[IMAGE: ${url}]\n`;
      }
    }
    return resultText;
  }
  
  // We have multiple parts. The parts at odd indices are separators (e.g. Question 1).
  // The parts at even indices:
  // parts[0] is the introduction text before the first question.
  // parts[2], parts[4], parts[6], etc. are the question blocks.
  
  const questionBlocks: { index: number; text: string; hasImage: boolean }[] = [];
  for (let i = 2; i < parts.length; i += 2) {
    questionBlocks.push({ index: i, text: parts[i], hasImage: false });
  }
  
  // Image-indicative keywords (comprehensive match list for clinical question banks)
  const imageKeywords = /ecg|ekg|rash|lesion|dermatology|skin|x-ray|xray|cxr|radiograph|ct\s+scan|mri|ultrasound|photo|picture|image|img|illustration|diagram|chart|graph|figure|fig\b|shown|depict|below|above|visual|see\s+below|clinical|patient|scan|angiogram|histology|biopsy|pathology|microscope|endoscopy|colonoscopy|fundoscopy|otoscopy|view|observe|demonstrate|exhibit|display|reveal/i;
  
  // Three-pass image association to ensure images are placed correctly:
  const remainingUrls = [...dataUrls];
  
  // 1st Pass: Assign to blocks containing keywords
  for (const block of questionBlocks) {
    if (remainingUrls.length === 0) break;
    if (imageKeywords.test(block.text)) {
      const url = remainingUrls.shift()!;
      block.text = insertImageIntoBlock(block.text, url);
      block.hasImage = true;
    }
  }
  
  // 2nd Pass: Assign to blocks that don't have images yet
  for (const block of questionBlocks) {
    if (remainingUrls.length === 0) break;
    if (!block.hasImage) {
      const url = remainingUrls.shift()!;
      block.text = insertImageIntoBlock(block.text, url);
      block.hasImage = true;
    }
  }
  
  // 3rd Pass: If still remaining (multiple images on same question block), append to first block
  if (remainingUrls.length > 0 && questionBlocks.length > 0) {
    const block = questionBlocks[0];
    for (const url of remainingUrls) {
      block.text = insertImageIntoBlock(block.text, url);
    }
  }
  
  // Update parts array
  for (const block of questionBlocks) {
    parts[block.index] = block.text;
  }
  
  return parts.join("");
}

/**
 * Inserts the image tag right after the question sentence (before options/metadata).
 */
function insertImageIntoBlock(blockText: string, dataUrl: string): string {
  const markerRegex = /\n\s*(?:Options:|Correct Answer:|Correct:|Answer:|[A-H][\.\)\-]\s+|Topic:|Category:|Subtopic:|Difficulty:|Tags:|Rationale:|High-Yield Rationale:|Explanation:|Explaination:)/i;
  const match = blockText.match(markerRegex);
  if (match && match.index !== undefined) {
    const idx = match.index;
    return blockText.substring(0, idx).trim() + `\n[IMAGE: ${dataUrl}]\n` + blockText.substring(idx);
  }
  return blockText.trim() + `\n[IMAGE: ${dataUrl}]\n`;
}

/**
 * Checks if a line is a metadata tag. Supports plural, alternative, or misspelled forms.
 */
function isMetadataLine(line: string): boolean {
  const clean = line.trim().replace(/^[*#•\-\d\.\)\s]+/, "").toLowerCase();
  return (
    /^(?:correct\s*answer|correct\s*option|correct|answer|answer\s*key)\s*[:\-\=\–\—]/i.test(clean) ||
    /^(?:topic|category|subject|domain|specialty|system)s?\s*[:\-\=\–\—]/i.test(clean) ||
    /^sub[- ]?(?:topics?|category|categories?|section)\s*[:\-\=\–\—]/i.test(clean) ||
    /^(?:diffculty|difficulty|difficulty\s*level|level|grade|tier|exam\s*type|exam|test)\s*[:\-\=\–\—]/i.test(clean) ||
    /^(?:tags?|keywords?|labels?)\s*[:\-\=\–\—]/i.test(clean) ||
    /^(?:rationale|high\s*-?\s*yield\s*rationale|explanation|explaination|explanations|answer\s*&\s*explanation|answer\s*&\s*rationale|answer\s*explanation|detailed\s*explanation|detailed\s*rationale|clinical\s*rationale|why\s*correct|why\s*this\s*option|discussion|reasoning|feedback|solution|key\s*takeaway|key\s*point)\s*[:\-\=\–\—]/i.test(clean)
  );
}

/**
 * Checks if a parsed metadata value is strictly valid when we are already in rationale parsing mode.
 * This prevents ordinary sentences inside rationale containing colons/dashes from triggering false positive exits.
 */
function isStrictMetadataMatch(
  val: string,
  type: "correct" | "difficulty" | "tags" | "topic" | "subtopic",
  parsingRationale: boolean
): boolean {
  if (!parsingRationale) return true;
  const cleanVal = val.trim();
  if (type === "difficulty") {
    return /^(easy|medium|hard|basic|intermediate|advanced|moderate|1|2|3|akt|kfp|cce|amc)$/i.test(cleanVal) && cleanVal.length < 30;
  }
  if (type === "correct") {
    return /^[A-H](\b|[\.\)\- ]|$)/i.test(cleanVal) && cleanVal.length < 200;
  }
  if (type === "tags") {
    return cleanVal.length < 120 && !cleanVal.includes(".");
  }
  if (type === "topic" || type === "subtopic") {
    return cleanVal.length < 80 && !cleanVal.includes(".") && !/\b(is|are|was|were|should|will|have|has)\b/i.test(cleanVal);
  }
  return true;
}


/**
 * Carves JPEG, PNG images from raw binary buffer, and also extracts
 * images from FlateDecode-compressed PDF streams.
 */
function carveImagesFromBuffer(buffer: Buffer): string[] {
  const imageUrls: string[] = [];
  
  // ── 1. Search for raw JPEGs (FFD8FF...FFD9) ──
  let i = 0;
  while (i < buffer.length - 2) {
    if (buffer[i] === 0xFF && buffer[i+1] === 0xD8 && buffer[i+2] === 0xFF) {
      const start = i;
      let j = i + 3;
      let end = -1;
      while (j < buffer.length - 1) {
        if (buffer[j] === 0xFF && buffer[j+1] === 0xD9) {
          end = j + 2;
          break;
        }
        j++;
      }
      if (end !== -1) {
        const imgBuffer = buffer.slice(start, end);
        if (imgBuffer.length > 2000) {
          imageUrls.push(`data:image/jpeg;base64,${imgBuffer.toString("base64")}`);
          i = end;
          continue;
        }
      }
    }
    i++;
  }
  
  // ── 2. Search for raw PNGs (89504E47...IEND) ──
  i = 0;
  while (i < buffer.length - 8) {
    if (
      buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47 &&
      buffer[i+4] === 0x0D && buffer[i+5] === 0x0A && buffer[i+6] === 0x1A && buffer[i+7] === 0x0A
    ) {
      const start = i;
      let j = i + 8;
      let end = -1;
      while (j < buffer.length - 12) {
        if (
          buffer[j] === 0x00 && buffer[j+1] === 0x00 && buffer[j+2] === 0x00 && buffer[j+3] === 0x00 &&
          buffer[j+4] === 0x49 && buffer[j+5] === 0x45 && buffer[j+6] === 0x4E && buffer[j+7] === 0x44 &&
          buffer[j+8] === 0xAE && buffer[j+9] === 0x42 && buffer[j+10] === 0x60 && buffer[j+11] === 0x82
        ) {
          end = j + 12;
          break;
        }
        j++;
      }
      if (end !== -1) {
        const imgBuffer = buffer.slice(start, end);
        if (imgBuffer.length > 2000) {
          imageUrls.push(`data:image/png;base64,${imgBuffer.toString("base64")}`);
          i = end;
          continue;
        }
      }
    }
    i++;
  }

  // ── 3. Extract images from FlateDecode-compressed PDF streams ──
  // PDF images are often in streams like:
  //   /Subtype /Image ... /Filter /FlateDecode ... stream\r\n<compressed data>\r\nendstream
  try {
    const zlib = require("zlib");
    const text = buffer.toString("latin1");
    // Find all 'stream' markers and try to decompress
    const streamRegex = /\/Subtype\s*\/Image[^]*?\/Width\s+(\d+)[^]*?\/Height\s+(\d+)[^]*?\/BitsPerComponent\s+(\d+)[^]*?(?:\/Filter\s*\/(\w+))?[^]*?stream\r?\n/gi;
    let match;
    while ((match = streamRegex.exec(text)) !== null) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      const bpc = parseInt(match[3]);
      const filter = match[4] || "";
      const streamStart = match.index + match[0].length;
      
      // Find endstream
      const endIdx = text.indexOf("endstream", streamStart);
      if (endIdx === -1 || endIdx - streamStart < 100) continue;
      
      const streamData = buffer.slice(streamStart, endIdx);
      
      // Skip tiny images
      if (width < 50 || height < 50) continue;
      
      let rawPixels: Buffer | null = null;
      
      if (filter.toLowerCase() === "flatedecode" || filter === "") {
        try {
          rawPixels = zlib.inflateSync(streamData);
        } catch {
          // Try raw deflate (no zlib header)
          try {
            rawPixels = zlib.inflateRawSync(streamData);
          } catch {
            continue;
          }
        }
      } else if (filter.toLowerCase() === "dctdecode") {
        // DCTDecode = raw JPEG data
        if (streamData.length > 2000) {
          imageUrls.push(`data:image/jpeg;base64,${streamData.toString("base64")}`);
        }
        continue;
      } else {
        continue;
      }
      
      if (!rawPixels || rawPixels.length < width * height) continue;
      
      // Check if decompressed data starts with JPEG or PNG magic
      if (rawPixels[0] === 0xFF && rawPixels[1] === 0xD8) {
        if (rawPixels.length > 2000) {
          imageUrls.push(`data:image/jpeg;base64,${rawPixels.toString("base64")}`);
        }
      } else if (rawPixels[0] === 0x89 && rawPixels[1] === 0x50 && rawPixels[2] === 0x4E && rawPixels[3] === 0x47) {
        if (rawPixels.length > 2000) {
          imageUrls.push(`data:image/png;base64,${rawPixels.toString("base64")}`);
        }
      }
      // Raw pixel data (RGB/grayscale) — would need to be converted to PNG which is complex,
      // so we skip these for now
    }
  } catch (e) {
    // FlateDecode extraction is best-effort
    console.error("FlateDecode image extraction error:", e);
  }
  
  return imageUrls;
}

/**
 * Extract plain text and inline images from a PDF buffer.
 * Strategy:
 *   1. Try subprocess-based extraction (bypasses Turbopack bundler issues)
 *   2. Fall back to in-process PDFParse
 *   3. Fall back to text-only extraction
 *   4. Last resort: byte-scan fallback with base64 filtering + image carving
 */

/**
 * Robust question-bank detector for any MCQ document format.
 * Returns true when the text looks like a question bank / MCQ document,
 * regardless of whether it uses:
 *   "Question 1", "Q.1", "1.", "1)", "(1)", numbered or lettered options,
 *   "Answer:", "Correct answer:", "A)", "A.", "[A]", "Tags:", "High-Yield Rationale:", etc.
 */
function isQuestionBankText(text: string): boolean {
  const t = text.replace(/\u00A0/g, " ");
  // Must have at least one question-number marker
  const hasQuestionMarker =
    /(?:^|\n)\s*(?:Question|Q\.?|Item|Case|Scenario|MCQ|Task|Stem|Station)\s*#?\s*\d+/im.test(t) ||
    /(?:^|\n)\s*\(?\d{1,3}[\.\)\:\-]\s+[A-Z]/m.test(t);
  if (!hasQuestionMarker) return false;
  // Must also have at least one of: lettered option, answer line, rationale, or tags
  const hasOptionOrAnswer =
    /(?:^|\n)\s*\(?[A-H][\.\):\-]\s+\S/m.test(t) ||
    /\b(?:answer|correct\s*answer|answer\s*key)\s*[:\-\=\u2013\u2014]/i.test(t) ||
    /\b(?:rationale|explanation|high[- ]yield|clinical\s*pearl|tags?)\s*[:\-\=\u2013\u2014]/i.test(t);
  return hasOptionOrAnswer;
}
async function extractTextAndImagesFromPdfBuffer(buffer: Buffer): Promise<string> {
  // Carve images from raw binary once (used as fallback when pdf-parse finds 0 images)
  let carvedImageUrls: string[] | null = null;
  function getCarvedImages(): string[] {
    if (carvedImageUrls === null) {
      carvedImageUrls = carveImagesFromBuffer(buffer);
      if (carvedImageUrls.length > 0) {
        console.log(`Carved ${carvedImageUrls.length} images from PDF binary`);
      }
    }
    return carvedImageUrls;
  }

  // ── Strategy 1: Subprocess (most reliable in Next.js) ──
  try {
    const subResult = await extractPdfViaSubprocess(buffer);
    if (subResult && subResult.pages.length > 0) {
      const pageTexts = subResult.pages.map((p) => p.text || "");
      const combinedText = pageTexts.join("\n\n").trim();
      if (combinedText.length > 20) {
        // Build per-page image map
        const pageImageMap: string[][] = pageTexts.map(() => []);
        let allImageUrls: string[] = [];

        for (const img of subResult.images) {
          const pgIdx = (img.pageNumber || 1) - 1;
          const safeIdx = Math.max(0, Math.min(pgIdx, pageImageMap.length - 1));
          pageImageMap[safeIdx].push(img.dataUrl);
          allImageUrls.push(img.dataUrl);
        }

        // If subprocess found no images, carve from binary and distribute equally
        if (allImageUrls.length === 0) {
          allImageUrls = getCarvedImages();
          // Evenly spread carved images across pages
          if (allImageUrls.length > 0) {
            allImageUrls.forEach((url, i) => {
              const pgIdx = Math.floor((i / allImageUrls.length) * pageImageMap.length);
              pageImageMap[pgIdx].push(url);
            });
          }
        }

        console.log(`PDF extracted via subprocess: ${subResult.pages.length} pages, ${allImageUrls.length} images`);

        if (allImageUrls.length > 0) {
          // If the text looks like a question bank, use the specialized regex association
          // to pair images with specific question numbers/options.
          const isQuestionText = isQuestionBankText(combinedText);
          if (isQuestionText) {
            return associateImagesWithText(combinedText, allImageUrls);
          }
          // Otherwise, use page-aware catalog association (no question-bank heuristic needed)
          return associateCatalogImagesWithText(pageTexts, pageImageMap);
        }
        return combinedText;
      }
    }
  } catch (e: any) {
    console.error("Subprocess PDF extraction failed:", e.message);
  }

  // ── Strategy 2: In-process PDFParse ──
  // NOTE: Each getText() / getImage() call internally calls load() and closes
  // the document, so a fresh PDFParse instance is required for each call.
  try {
    const textParser = new PDFParse({ data: buffer, verbosity: 0 });
    const textResult = await textParser.getText();

    const imageParser = new PDFParse({ data: buffer, verbosity: 0 });
    const imageResult = await imageParser.getImage({ imageThreshold: 0 });

    const combinedText = textResult.pages.map((p: any) => p.text || "").join("\n\n").trim();

    // Collect images from PDFParse
    let allImageUrls: string[] = [];
    for (const page of imageResult.pages) {
      if (page.images && page.images.length > 0) {
        for (const img of page.images) {
          let dataUrl = img.dataUrl;
          if (!dataUrl && img.data && img.data.length > 0) {
            const bytes = img.data;
            let mime = "image/png";
            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) mime = "image/png";
            else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) mime = "image/jpeg";
            else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) mime = "image/gif";
            dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
          }
          if (dataUrl && dataUrl.length >= 4000) {
            allImageUrls.push(dataUrl);
          }
        }
      }
    }

    // If PDFParse found no images, carve from binary
    if (allImageUrls.length === 0) {
      allImageUrls = getCarvedImages();
    }

    if (combinedText.length > 20) {
      console.log(`PDF extracted via in-process PDFParse: ${textResult.pages.length} pages, ${allImageUrls.length} images`);
      if (allImageUrls.length > 0) {
        const isQuestionText = isQuestionBankText(combinedText);
        if (isQuestionText) {
          return associateImagesWithText(combinedText, allImageUrls);
        }
        // For catalogs, distribute images evenly across pages
        const pageTexts = textResult.pages.map((p: any) => p.text || "");
        const pageImageMap: string[][] = pageTexts.map(() => []);
        allImageUrls.forEach((url, i) => {
          const pgIdx = Math.floor((i / allImageUrls.length) * pageImageMap.length);
          pageImageMap[pgIdx].push(url);
        });
        return associateCatalogImagesWithText(pageTexts, pageImageMap);
      }
      return combinedText;
    }
  } catch (error) {
    console.error("PDFParse image & text extraction failed:", error);
  }

  // ── Strategy 3: Text-only extraction + image carving ──
  // Fallback for cases where getImage() throws but getText() succeeds.
  try {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const textResult = await parser.getText();
    // Use the top-level .text field (concatenated across all pages) if available,
    // otherwise join individual page texts.
    const text = textResult.text || textResult.pages.map((p: any) => p.text || "").join("\n\n");
    if (text.trim().length > 20) {
      const images = getCarvedImages();
      if (images.length > 0) {
        const isQuestionText = isQuestionBankText(text);
        if (isQuestionText) {
          return associateImagesWithText(text, images);
        }
        // For catalogs, distribute images evenly across pages
        const pageTexts = textResult.pages.map((p: any) => p.text || "");
        const pageImageMap: string[][] = pageTexts.map(() => []);
        images.forEach((url, i) => {
          const pgIdx = Math.floor((i / images.length) * pageImageMap.length);
          pageImageMap[pgIdx].push(url);
        });
        return associateCatalogImagesWithText(pageTexts, pageImageMap);
      }
      return text;
    }
  } catch (error) {
    console.error("PDFParse text-only extraction failed:", error);
  }

  // ── Strategy 4: Fallback byte-scan + image carving ──
  console.warn("All PDF parse strategies failed, using byte-scan fallback");
  const fallbackText = extractTextFromPdfBufferFallback(buffer);
  const images = getCarvedImages();
  if (images.length > 0 && fallbackText.length > 20) {
    return associateImagesWithText(fallbackText, images);
  }
  return fallbackText;
}

/**
 * Extract plain text and inline images from legacy .doc buffer.
 */
async function extractTextAndImagesFromDocBuffer(buffer: Buffer): Promise<string> {
  try {
    const WordExtractor = require("word-extractor");
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    const text = doc.getBody() || "";
    
    // Carve PNG and JPEG images from the legacy DOC compound binary format
    const imageUrls = carveImagesFromBuffer(buffer);
    
    return associateImagesWithText(text, imageUrls);
  } catch (error) {
    console.error("WordExtractor doc parser failed, falling back:", error);
    return await extractTextFromPdfBuffer(buffer);
  }
}

/**
 * Extract plain text from a DOCX buffer using mammoth.
 */
async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim() || await extractTextFromPdfBuffer(buffer);
  } catch (error) {
    console.error("Mammoth text extraction failed:", error);
    return await extractTextFromPdfBuffer(buffer);
  }
}

// ── HTML-based Catalog Parser and Formatter ──────────────────────────────────────────

interface ExtractedCatalog {
  title: string;
  tags: string[];
  definition: string;
  sections: {
    overview: string;
    pathophysiology: string;
    clinicalFeatures: string;
    diagnosis: string;
    management: string;
    complications: string;
    whenToRefer: string;
    prognosis: string;
    resources: string;
  };
}


async function extractHtmlFromDocxBuffer(buffer: Buffer): Promise<string> {
  const fixedBuffer = fixZipSeparators(buffer);
  try {
    const result = await mammoth.convertToHtml({ buffer: fixedBuffer }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "b => strong",
        "i => em",
        "u => u",
        "strike => s",
      ],
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          let contentType = image.contentType;
          if (contentType === "application/octet-stream" || !contentType.startsWith("image/")) {
            if (imageBuffer.startsWith("iVBORw0KGgo")) {
              contentType = "image/png";
            } else if (imageBuffer.startsWith("/9j/")) {
              contentType = "image/jpeg";
            } else if (imageBuffer.startsWith("R0lGOD")) {
              contentType = "image/gif";
            } else if (imageBuffer.startsWith("UklGR")) {
              contentType = "image/webp";
            } else {
              contentType = "image/png"; // safe fallback
            }
          }
          return {
            src: "data:" + contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    return result.value.trim();
  } catch (error) {
    console.error("Mammoth HTML extraction failed:", error);
    return "";
  }
}

/**
 * Converts mammoth HTML into richly styled GP Edge HTML suitable for the viewer.
 * Preserves all original content — tables, images, lists, headings — and applies
 * the GP Edge design system styles without discarding anything.
 */
function polishDocxHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  let html = rawHtml;

  // ── 1. Style headings ──────────────────────────────────────────────────────
  html = html.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, (_m, attrs, inner) =>
    `<h1${attrs} style="font-family: Georgia, serif; font-size: 1.75rem; font-weight: bold; color: #0f172a; margin: 1.5rem 0 0.75rem; line-height: 1.2;">${inner}</h1>`
  );
  html = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs, inner) =>
    `<h2${attrs} style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">${inner}</h2>`
  );
  html = html.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_m, attrs, inner) =>
    `<h3${attrs} style="font-family: Georgia, serif; font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-top: 1.25rem; margin-bottom: 0.5rem;">${inner}</h3>`
  );
  html = html.replace(/<h4([^>]*)>([\s\S]*?)<\/h4>/gi, (_m, attrs, inner) =>
    `<h4${attrs} style="font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 1rem; margin-bottom: 0.4rem;">${inner}</h4>`
  );

  // ── 2. Style paragraphs ───────────────────────────────────────────────────
  html = html.replace(/<p([^>]*?)>([\s\S]*?)<\/p>/gi, (_m, attrs, inner) => {
    if (inner.includes("<img")) return `<p${attrs}>${inner}</p>`;
    const plain = inner.replace(/<[^>]+>/g, "").trim();
    if (!plain) return "";
    return `<p${attrs} style="font-family:'DM Sans',sans-serif;font-size:0.875rem;color:#334155;line-height:1.75;margin-bottom:0.9rem;">${inner}</p>`;
  });

  // ── 3. Style lists ────────────────────────────────────────────────────────
  html = html.replace(/<ul([^>]*)>/gi, (_m, attrs) =>
    `<ul${attrs} style="list-style-type: disc; padding-left: 1.5rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">`
  );
  html = html.replace(/<ol([^>]*)>/gi, (_m, attrs) =>
    `<ol${attrs} style="list-style-type: decimal; padding-left: 1.5rem; font-family: 'DM Sans', sans-serif; margin-bottom: 1rem;">`
  );
  html = html.replace(/<li([^>]*)>([\s\S]*?)<\/li>/gi, (_m, attrs, inner) =>
    `<li${attrs} style="font-size: 0.875rem; color: #334155; margin-bottom: 0.35rem; line-height: 1.65;">${inner}</li>`
  );

  // ── 4. Style tables ───────────────────────────────────────────────────────
  html = styleHtmlTables(html);

  // ── 5. Style images ───────────────────────────────────────────────────────
  html = styleHtmlImages(html);

  // ── 6. Strip emojis BEFORE callout detection (keep ⚠ for warning triggers)
  html = html.replace(/(?![⚠️⚠])\p{Extended_Pictographic}/gu, "");

  // ── 7. Callout detection — TWO passes to cover both DOCX and plain-text formats
  // styleHtmlCallouts: converts single-column tables with callout keywords (e.g. a
  //   one-column table whose cell reads "Key Points:") into coloured callout divs.
  // convertTextCallouts: converts <p>/<h3>/<h4> elements whose text matches callout
  //   keywords (e.g. <h3>Key Points:</h3> followed by a <ul>) into callout divs.
  // Both must run so that callouts created with either document convention are caught.
  html = styleHtmlCallouts(html);
  html = convertTextCallouts(html);

  // ── 8. Warning text highlight ─────────────────────────────────────────────
  html = highlightWarningText(html);

  // ── 9. Strip any residual emojis after processing ─────────────────────────
  html = html.replace(/\p{Extended_Pictographic}/gu, "");

  return html.trim();
}


function convertPlainTextToHtml(text: string): string {
  const lines = text.split("\n").map(l => l.trim());
  let html = "";
  
  for (const line of lines) {
    if (!line) continue;
    
    // ── IMAGE marker: [IMAGE: data:image/png;base64,...] ─────────────────────
    // Use [^\]]+ (greedy, "anything but ]") instead of .+? (lazy) to safely
    // match very long base64 data URLs without risking catastrophic backtracking.
    if (/^\[IMAGE:\s*[^\]]+\]$/i.test(line)) {
      const match = line.match(/^\[IMAGE:\s*([^\]]+)\]$/i);
      if (match) {
        const src = match[1].trim();
        html += `<figure style="margin:1.25rem 0;text-align:center;"><img src="${src}" alt="Clinical image" loading="lazy" style="max-width:100%;height:auto;border-radius:0.5rem;box-shadow:0 1px 6px rgba(0,0,0,0.12);display:inline-block;" /></figure>\n`;
        continue;
      }
    }
    
    const cleanLine = line.toLowerCase();
    const isHeader = 
      /^(?:1\.)?\s*overview/i.test(cleanLine) ||
      /^(?:2\.)?\s*pathophysiology/i.test(cleanLine) ||
      /^(?:3\.)?\s*clinical\s+features/i.test(cleanLine) ||
      /^(?:4\.)?\s*(?:diagnosis\s+&\s+investigations|diagnosis|investigations)/i.test(cleanLine) ||
      /^(?:5\.)?\s*management/i.test(cleanLine) ||
      /^(?:6\.)?\s*complications/i.test(cleanLine) ||
      /^(?:7\.)?\s*when\s+to\s+refer/i.test(cleanLine) ||
      /^(?:8\.)?\s*prognosis/i.test(cleanLine) ||
      /^(?:9\.)?\s*(?:resources|references)/i.test(cleanLine);

    // ── Callout keyword lines ──────────────────────────────────────────────
    // Lines whose entire content is a callout label (e.g. "Key Points:", "⚠ Warning",
    // "Important:", "MBS Billing Info") must become <h3> tags so that
    // convertTextCallouts() can detect them and wrap the following content in a
    // styled callout div.  Without this, plain-text extraction from PDFs/DOCs
    // collapses them into ordinary <p> tags and the callout is lost.
    const strippedLine = line.replace(/^[\s⚠️⚠⚡✅☑📋ℹ️ℹ\-—:\[\]]+/u, "").replace(/[-—:\s]+$/, "").trim();
    const isCalloutHeader =
      !isHeader &&
      strippedLine.length > 0 &&
      strippedLine.length < 80 && // short label, not a paragraph sentence
      (
        /^(?:key\s*point|pearl|clinical\s*pearl)/i.test(cleanLine) ||
        /^(?:warning|caution|red\s*flag|contraindication|urgent|immediate|referral|danger|critical|alert)/i.test(cleanLine) ||
        /^(?:important|key\s*diagnostic\s*rule|key\s*rule|diagnostic\s*rule|attention|note\s*:)/i.test(cleanLine) ||
        /^(?:billing|mbs)/i.test(cleanLine)
      );

    if (isHeader) {
      html += `<h2>${line}</h2>\n`;
    } else if (isCalloutHeader) {
      // Emit as h3 so convertTextCallouts() pattern-matches it as a callout header
      html += `<h3>${line}</h3>\n`;
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      html += `<li>${line.replace(/^[•\-*]\s*/, "")}</li>\n`;
    } else if (line.includes("|")) {
      const parts = line.split("|");
      html += `<tr>${parts.map(p => `<td>${p.trim()}</td>`).join("")}</tr>\n`;
    } else {
      html += `<p>${line}</p>\n`;
    }
  }
  
  html = html
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, "<ul>\n$&</ul>\n")
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, "<table>\n$&</table>\n");
    
  return html;
}

function markHtmlHeaders(html: string): string {
  const sections = [
    { key: "OVERVIEW", regex: /overview/i },
    { key: "PATHOPHYSIOLOGY", regex: /pathophysiology/i },
    { key: "CLINICALFEATURES", regex: /clinical\s+features/i },
    { key: "DIAGNOSIS", regex: /diagnosis\s*&\s*investigations|diagnosis|investigations/i },
    { key: "MANAGEMENT", regex: /management/i },
    { key: "COMPLICATIONS", regex: /complications/i },
    { key: "WHENTOREFER", regex: /when\s+to\s+refer/i },
    { key: "PROGNOSIS", regex: /prognosis/i },
    { key: "RESOURCES", regex: /resources|references/i }
  ];
  
  // PHASE 1: Handle section headings inside table cells (<td>).
  // The DOCX template uses styled two-column tables for section headers 
  // (e.g. left cell = "Typical Features", right cell = "4. Diagnosis & Investigations").
  // We need to detect when a table cell contains a numbered section heading,
  // keep the non-header cells as content, and insert a [SECTION_SPLIT] marker.
  let marked = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableMatch: string) => {
    // Extract all cell contents with their raw HTML
    const cellsRaw: string[] = [];
    const cellsPlain: string[] = [];
    tableMatch.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (_m: string, cellContent: string) => {
      cellsRaw.push(cellContent);
      cellsPlain.push(cellContent.replace(/<[^>]+>/g, "").trim());
      return _m;
    });
    
    // Check if any cell contains a numbered section heading keyword
    let splitKey = "";
    let splitCellIdx = -1;
    for (let ci = 0; ci < cellsPlain.length; ci++) {
      const cellText = cellsPlain[ci];
      if (cellText.length > 120) continue;
      for (const sec of sections) {
        if (sec.regex.test(cellText)) {
          const looksLikeHeader = /^\d+[.\s]/.test(cellText) || cellText.length < 60;
          if (looksLikeHeader) {
            splitKey = sec.key;
            splitCellIdx = ci;
            break;
          }
        }
      }
      if (splitKey) break;
    }
    
    // Protect flowcharts and multi-row tables — only consider 1-2 row tables as section headers
    const rowCount = (tableMatch.match(/<tr/gi) || []).length;
    if (rowCount > 2) return tableMatch; // multi-row = flowchart or data table, keep as-is
    
    if (!splitKey) return tableMatch; // no section header found — keep table as-is
    
    // Collect non-header cell content to preserve before the split
    const preservedContent: string[] = [];
    for (let ci = 0; ci < cellsRaw.length; ci++) {
      if (ci === splitCellIdx) continue;
      const raw = cellsRaw[ci].trim();
      if (raw) preservedContent.push(raw);
    }
    
    // Output: preserved content (belongs to previous section) + split marker
    let output = "";
    if (preservedContent.length > 0) {
      output += preservedContent.join("\n");
    }
    output += `[SECTION_SPLIT: ${splitKey}]`;
    return output;
  });
  
  // PHASE 2: Handle heading tags (h1-h6) and bold paragraphs containing section keywords
  const tagPattern = /<(h[1-6]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  
  marked = marked.replace(tagPattern, (match: string, tag: string, innerContent: string) => {
    // Never treat a paragraph containing an image as a section header
    if (innerContent.includes('<img')) return match;
    
    const plainText = innerContent.replace(/<[^>]+>/g, "").trim();
    
    // Only treat short text as potential section headers (not long paragraphs)
    if (plainText.length > 80) return match;
    
    for (const sec of sections) {
      if (sec.regex.test(plainText)) {
        return `[SECTION_SPLIT: ${sec.key}]`;
      }
    }
    return match;
  });
  
  return marked;
}

function parseHeaderMetadata(headerHtml: string, fileName: string): { title: string, system: string, category: string, tags: string[] } {
  const text = headerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  
  let title = "";
  let system = "Respiratory";
  let category = "Acute";
  const tags: string[] = [];
  
  const titleMatch = text.match(/title[:\s]+(.*?)(?=\s*system:|\s*category:|\s*tags:|$)/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].replace(/\[|\]/g, "").trim();
  }
  
  const systemMatch = text.match(/system[:\s]+(.*?)(?=\s*category:|\s*tags:|$)/i);
  if (systemMatch && systemMatch[1].trim()) {
    system = systemMatch[1].replace(/\[|\]/g, "").trim();
  }
  
  const categoryMatch = text.match(/category[:\s]+(.*?)(?=\s*tags:|$)/i);
  if (categoryMatch && categoryMatch[1].trim()) {
    category = categoryMatch[1].replace(/\[|\]/g, "").trim();
  }
  
  const hashtags = text.match(/#\w+/g) || [];
  tags.push(...hashtags.map(t => t.substring(1)));
  
  if (!title) {
    const lines = headerHtml.replace(/<[^>]+>/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
    const firstLine = lines.find((l: string) => !l.toLowerCase().includes("clinical catalogue") && !l.toLowerCase().includes("gp edge"));
    title = firstLine || fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  }
  
  return { title, system, category, tags };
}

function mergeStyles(originalAttrStr: string, defaultStyles: Record<string, string>): string {
  const inlineStyles: Record<string, string> = { ...defaultStyles };
  
  // Extract style attribute value
  const styleMatch = originalAttrStr.match(/style=["']([^"']*)["']/i);
  if (styleMatch && styleMatch[1]) {
    const declarations = styleMatch[1].split(";");
    for (const decl of declarations) {
      const parts = decl.split(":");
      if (parts.length >= 2) {
        const prop = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(":").trim();
        if (prop) {
          inlineStyles[prop] = val;
        }
      }
    }
  }
  
  // Extract bgcolor attribute value
  const bgcolorMatch = originalAttrStr.match(/bgcolor=["']([^"']*)["']/i);
  if (bgcolorMatch && bgcolorMatch[1]) {
    inlineStyles["background-color"] = bgcolorMatch[1].trim();
  }
  
  return Object.entries(inlineStyles)
    .map(([prop, val]) => `${prop}: ${val}`)
    .join("; ");
}

function highlightWarningText(html: string): string {
  let processed = html;
  
  // Replace span highlights with styled badges or inline highlights that look premium
  processed = processed.replace(/<span([^>]*)>([\s\S]*?)<\/span>/gi, (match: string, attrs: string, content: string) => {
    const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
    if (styleMatch && styleMatch[1]) {
      const styleStr = styleMatch[1].toLowerCase();
      if (styleStr.includes("background-color") || styleStr.includes("background")) {
        // Extract color
        const colorMatch = styleStr.match(/(?:background-color|background):\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|[a-zA-Z]+)/);
        if (colorMatch) {
          const bgColor = colorMatch[1].trim();
          // Detect red/pink highlights (Red Flag)
          if (/(?:#f[ca][a-f0-9]{2,4}|rgb\(25[0-5],\s*1[0-9]{2},\s*1[0-9]{2}\)|red|pink)/i.test(bgColor)) {
            return `<span style="background-color: #fee2e2; border-bottom: 2px solid #ef4444; color: #991b1b; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-weight: 600;">⚠️ ${content.trim()}</span>`;
          }
          // Detect yellow/orange highlights (Caution/Warning)
          if (/(?:#f[a-f0-9]{2,5}|#e[a-f0-9]{3,5}|rgb\(25[0-5],\s*2[0-9]{2},\s*[0-9]+\)|yellow|orange)/i.test(bgColor)) {
            return `<span style="background-color: #fef3c7; border-bottom: 2px solid #f59e0b; color: #92400e; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-weight: 600;">⚡ ${content.trim()}</span>`;
          }
        }
      }
    }
    return match;
  });
  
  return processed;
}

function convertTextCallouts(html: string): string {
  type CalloutInfo = { variant: string; bg: string; border: string; color: string; titleColor: string; label: string; };
  const calloutMap: Record<number, CalloutInfo> = {};
  let idx = 0;

  // ── PASS 1: Detect callout header tags → replace with a unique null-byte marker ──
  let processed = html.replace(/<(p|h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match: string, _tag: string, _attrs: string, content: string) => {
      const plainText = content.replace(/<[^>]+>/g, "").trim().toLowerCase();

      const isPearl   = /(?:key\s*point|pearl|clinical\s*pearl)/i.test(plainText);
      const isWarning = /(?:warning|caution|red\s*flag|contraindication|urgent|immediate|referral|danger|critical|alert)/i.test(plainText) && !isPearl;
      const isImportant = /(?:important|key\s*diagnostic\s*rule|key\s*rule|diagnostic\s*rule|attention|note\s*:)/i.test(plainText) && !isPearl && !isWarning;
      const isMbs     = /(?:billing|mbs)/i.test(plainText);

      if (!isPearl && !isWarning && !isImportant && !isMbs) return match;

      // Use the document's own header text as the label (strip HTML tags + leading symbols only)
      const rawLabel = content.replace(/<[^>]+>/g, "").replace(/^[\s⚠️⚠⚡✅☑📋ℹ️ℹ\-—:\[\]]+/u, "").replace(/[-—:\s]+$/, "").trim();

      let variant = "info", bg = "#e6f7f4", border = "#2bb09c", color = "#1a5c51", titleColor = "#2bb09c";
      let label = rawLabel;

      if (isWarning) {
        variant = "warning"; bg = "#fef2f2"; border = "#ef4444"; titleColor = "#b91c1c"; color = "#7f1d1d";
        label = rawLabel || (plainText.includes("red flag") ? "Red Flags" : "Warning");
      } else if (isImportant) {
        variant = "important"; bg = "#fefce8"; border = "#eab308"; titleColor = "#854d0e"; color = "#713f12";
        label = rawLabel || "Important";
      } else if (isPearl) {
        variant = "pearl"; bg = "#f0fdf4"; border = "#16a34a"; titleColor = "#15803d"; color = "#14532d";
        label = rawLabel || "Key Points";
      } else if (isMbs) {
        variant = "billing"; bg = "#f8fafc"; border = "#64748b"; titleColor = "#475569"; color = "#334155";
        label = "MBS Billing Info";
      }
      if (!label) label = isWarning ? "Warning" : isImportant ? "Important" : isPearl ? "Key Points" : "Info";

      // Strip all emojis from the label itself
      label = label.replace(/\p{Extended_Pictographic}/gu, "").trim();

      const id = idx++;
      calloutMap[id] = { variant, bg, border, color, titleColor, label };
      return `\x00CALLOUT${id}\x00`;
    }
  );

  // ── PASS 2: For each marker, greedily consume following lists → build callout div ──
  processed = processed.replace(
    /\x00CALLOUT(\d+)\x00((?:\s*(?:<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|<p[^>]*>\s*[•\-\*\u2022][\s\S]*?<\/p>))*)/g,
    (_m: string, idStr: string, followRaw: string) => {
      const info = calloutMap[parseInt(idStr, 10)];
      if (!info) return "";
      const { variant, bg, border, color, titleColor, label } = info;

      let bodyHtml = "";
      if (followRaw.trim()) {
        // Strip ALL existing attributes (including pre-applied inline styles) and apply callout-specific styles
        let body = followRaw;
        body = body.replace(/<ul[^>]*>/gi,  `<ul style="list-style-type:disc;padding-left:1.4rem;margin:0.25rem 0 0.5rem;">`);
        body = body.replace(/<ol[^>]*>/gi,  `<ol style="list-style-type:decimal;padding-left:1.4rem;margin:0.25rem 0 0.5rem;">`);
        body = body.replace(/<li[^>]*>/gi,  `<li style="margin-bottom:0.4rem;font-size:0.875rem;color:inherit;line-height:1.65;">`);
        body = body.replace(/<p[^>]*>/gi,   `<p style="margin:0.3rem 0;font-size:0.875rem;color:inherit;line-height:1.65;">`);
        bodyHtml = body;
      }

      return `<div class="callout-block" data-variant="${variant}" style="background-color:${bg};border-left:4px solid ${border};border-radius:0.5rem;padding:0.85rem 1rem;margin-bottom:1.25rem;color:${color};">
<div style="font-weight:700;font-size:0.85rem;margin-bottom:${bodyHtml.trim() ? "0.5rem" : "0"};color:${titleColor};">${label}</div>${bodyHtml.trim() ? `
<div style="font-family:'DM Sans',sans-serif;font-size:0.875rem;line-height:1.65;">${bodyHtml}</div>` : ""}
</div>`;
    }
  );

  // Clean up any orphaned markers (callout header with no following list)
  processed = processed.replace(/\x00CALLOUT\d+\x00/g, "");

  return processed;
}


function styleHtmlCallouts(html: string): string {
  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (tableMatch: string, tableBody: string) => {
    const rows = tableBody.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    let maxCellsInAnyRow = 0;
    let totalCells = 0;
    
    if (rows.length > 0) {
      for (const row of rows) {
        const cells = row.match(/<(?:td|th)[^>]*>/gi) || [];
        if (cells.length > maxCellsInAnyRow) {
          maxCellsInAnyRow = cells.length;
        }
        totalCells += cells.length;
      }
    } else {
      const cells = tableBody.match(/<(?:td|th)[^>]*>/gi) || [];
      maxCellsInAnyRow = cells.length;
      totalCells = cells.length;
    }
    
    if (maxCellsInAnyRow === 1 && totalCells >= 1) {
      const cellMatches = tableBody.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      const cellContents: string[] = [];
      for (const cell of cellMatches) {
        const match = cell.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/i);
        if (match) {
          cellContents.push(match[1].trim());
        }
      }
      
      if (cellContents.length > 0) {
        const combinedText = cellContents.join(" ").toLowerCase();
        const plainText = combinedText.replace(/<[^>]+>/g, "").trim();
        
        let variant = "info";
        let bg = "#e6f7f4";
        let border = "#2bb09c";
        let color = "#1a5c51";
        let titleColor = "#2bb09c";
        let label = "Guideline";
        
        // Raw label: first cell text, stripped of emoji/symbols
        const firstCellRaw = cellContents[0].replace(/<[^>]+>/g, "").trim();
        const rawLabelFromDoc = firstCellRaw
          .replace(/^[\s⚠️⚠⚡✅☑📋ℹ️ℹ\-—:\[\]]+/u, "")
          .replace(/[-—:\s]+$/, "")
          .trim();
        
        // Detect type — same priority as convertTextCallouts
        // 1. Key Points (GREEN)
        const isPearl = /(?:key\s*point|pearl|clinical\s*pearl|☑|✅)/i.test(plainText);
        // 2. Warning / Urgent / Immediate (RED) 
        const isWarning = /(?:warning|caution|red\s*flag|contraindication|urgent|immediate|referral|danger|critical|alert|⚠)/i.test(plainText) && !isPearl;
        // 3. Important (YELLOW)
        const isImportant = /(?:important|attention|note)/i.test(plainText) && !isPearl && !isWarning;
        // 4. Billing (SLATE)
        const isBilling = /(?:billing|mbs)/i.test(plainText);
        
        if (!isPearl && !isWarning && !isImportant && !isBilling) {
          return tableMatch;
        }
        
        if (isWarning) {
          variant = "warning";
          bg = "#fef2f2";
          border = "#ef4444";
          titleColor = "#b91c1c";
          color = "#7f1d1d";
          label = rawLabelFromDoc || (plainText.includes("red flag") ? "Red Flags" : "Warning");
        } else if (isImportant) {
          variant = "important";
          bg = "#fefce8";
          border = "#eab308";
          titleColor = "#854d0e";
          color = "#713f12";
          label = rawLabelFromDoc || "Important";
        } else if (isPearl) {
          variant = "pearl";
          bg = "#f0fdf4";
          border = "#16a34a";
          titleColor = "#15803d";
          color = "#14532d";
          label = rawLabelFromDoc || "Key Points";
        } else if (isBilling) {
          variant = "billing";
          bg = "#f8fafc";
          border = "#64748b";
          titleColor = "#475569";
          color = "#334155";
          label = "MBS Billing Info";
        }
        
        // Build body: if first cell is a short header and there are more cells, use rest as body
        let headerText = label.replace(/\p{Extended_Pictographic}/gu, "").trim();
        let bodyHtml = "";
        
        if (cellContents.length > 1 && firstCellRaw.length < 120) {
          // First cell = header, rest = body content
          headerText = label.replace(/\p{Extended_Pictographic}/gu, "").trim();
          bodyHtml = cellContents.slice(1).join("\n");
        } else {
          // Single cell — header IS the label, body is everything after the header line in the cell
          bodyHtml = cellContents.join("\n");
        }
        
        // Style lists inside body
        bodyHtml = bodyHtml.replace(/<li([^>]*)>/gi, `<li style="margin-bottom:0.4rem;font-size:0.875rem;color:inherit;line-height:1.65;">`);
        bodyHtml = bodyHtml.replace(/<ul([^>]*)>/gi, `<ul style="list-style-type:disc;padding-left:1.4rem;margin:0.25rem 0 0.5rem;">`);
        bodyHtml = bodyHtml.replace(/<ol([^>]*)>/gi, `<ol style="list-style-type:decimal;padding-left:1.4rem;margin:0.25rem 0 0.5rem;">`);
        
        return `<div class="callout-block" data-variant="${variant}" style="background-color:${bg};border-left:4px solid ${border};border-radius:0.5rem;padding:0.85rem 1rem;margin-bottom:1.25rem;color:${color};">
  <div style="font-weight:700;font-size:0.85rem;margin-bottom:${bodyHtml.trim() ? "0.5rem" : "0"};color:${titleColor};">${headerText}</div>${bodyHtml.trim() ? `
  <div style="font-family:'DM Sans',sans-serif;font-size:0.875rem;line-height:1.65;">${bodyHtml}</div>` : ""}
</div>`;
      }
    }
    return tableMatch;
  });
}


function styleHtmlTables(html: string): string {
  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match: string, tableBody: string) => {
    let styledBody = tableBody;
    
    // Style <th> header cells (always green header background, white text)
    styledBody = styledBody.replace(/<th([^>]*)>([\s\S]*?)<\/th>/gi, (m: string, attrs: string, cellContent: string) => {
      const cleanAttrs = attrs.replace(/\bstyle=["']([^"']*)['"]/gi, "").replace(/\bbgcolor=["']([^"']*)['"]/gi, "").trim();
      return `<th ${cleanAttrs} style="text-align:left;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;padding:0.75rem 1rem;background-color:#16a34a;border:1px solid #cbd5e1;color:#ffffff;white-space:normal;word-break:break-word;">${cellContent.trim()}</th>`;
    });
    
    // If no TH, promote first row's TD cells to TH (header)
    if (!tableBody.toLowerCase().includes("<th")) {
      let isFirstRow = true;
      styledBody = styledBody.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi, (trMatch: string, trAttrs: string, trContent: string) => {
        if (isFirstRow) {
          isFirstRow = false;
          const headerContent = trContent.replace(/<td([^>]*)>([\s\S]*?)<\/td>/gi, (_tdMatch: string, tdAttrs: string, tdContent: string) => {
            const cleanAttrs = tdAttrs.replace(/\bstyle=["']([^"']*)['"]/gi, "").replace(/\bbgcolor=["']([^"']*)['"]/gi, "").trim();
            return `<th ${cleanAttrs} style="text-align:left;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;padding:0.75rem 1rem;background-color:#16a34a;border:1px solid #cbd5e1;color:#ffffff;white-space:normal;word-break:break-word;">${tdContent.trim()}</th>`;
          });
          return `<tr ${trAttrs.trim()}>${headerContent}</tr>`;
        }
        return trMatch;
      });
    }
    
    // Style data rows — enforce clean white rows
    styledBody = styledBody.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi, (trMatch: string, trAttrs: string, trContent: string) => {
      if (trContent.toLowerCase().includes("<th")) {
        return trMatch; // skip header rows
      }
      
      const bg = "#ffffff"; // Always white background for data cells
      
      let cellIndex = 0;
      const styledCells = trContent.replace(/<td([^>]*)>([\s\S]*?)<\/td>/gi, (_tdMatch: string, tdAttrs: string, tdContent: string) => {
        const textColor = "#334155";
        cellIndex++;
        
        let preservedStyle = "";
        const styleMatch = tdAttrs.match(/style=["']([^"']*)['"]/i);
        if (styleMatch && styleMatch[1]) {
          const kept = styleMatch[1].split(";").filter((decl: string) => {
            const prop = decl.split(":")[0].trim().toLowerCase();
            return prop === "width" || prop === "min-width" || prop === "max-width" || prop === "vertical-align";
          });
          preservedStyle = kept.join(";");
        }
        
        const cleanAttrs = tdAttrs
          .replace(/\bstyle=["']([^"']*)['"]/gi, "")
          .replace(/\bbgcolor=["']([^"']*)['"]/gi, "")
          .trim();
        
        const finalStyle = [
          preservedStyle,
          "padding:0.75rem 1rem",
          "font-size:0.825rem",
          "border:1px solid #e2e8f0",
          `background-color:${bg}`,
          `color:${textColor}`,
          "word-break:break-word",
          "white-space:normal",
        ].filter(Boolean).join(";");
        
        return `<td ${cleanAttrs} style="${finalStyle}">${tdContent.trim()}</td>`;
      });
      
      return `<tr ${trAttrs.trim()}>${styledCells}</tr>`;
    });
    
    return `
      <div style="overflow-x:auto;max-width:100%;border:1px solid #cbd5e1;border-radius:0.75rem;margin-bottom:1.25rem;background-color:#ffffff;">
        <table style="width:100%;min-width:400px;border-collapse:collapse;text-align:left;">
          ${styledBody}
        </table>
      </div>
    `;
  });
}

function styleHtmlImages(html: string): string {
  // Style all <img> tags that have a valid src (base64 data URLs or http/https URLs)
  return html.replace(/<img([^>]*)>/gi, (match: string, attrs: string) => {
    if (attrs.includes('src=') && (attrs.includes('data:') || attrs.includes('http'))) {
      // Don't double-wrap already styled images; just ensure the style is applied
      const cleanAttrs = attrs.replace(/\bstyle=["'][^"']*["']/gi, "").trim();
      return `<img ${cleanAttrs} loading="lazy" style="max-width:100%;height:auto;display:block;margin:1rem auto;border-radius:0.5rem;box-shadow:0 1px 4px rgba(0,0,0,0.1);" />`;
    }
    return ''; // strip images with no valid src (broken references)
  });
}

function formatSectionHtml(html: string): string {
  if (!html) return "";
  
  let formatted = html;
  
  // Remove any leading heading tags that are just section headers (e.g. "1. Overview" or "1. OVERVIEW")
  // to prevent duplication when the viewer injects its own section header!
  formatted = formatted.replace(/^\s*<h[1-6][^>]*>\s*(?:\d+\.?\s*)?(?:overview|pathophysiology|clinical\s+features|diagnosis|management|complications|when\s+to\s+refer|prognosis|resources|references)\s*<\/h[1-6]>/i, "");
  
  // Also remove bold paragraph variants: <p><strong>1. OVERVIEW</strong></p>
  formatted = formatted.replace(/^\s*<p[^>]*>\s*<strong>\s*(?:\d+\.?\s*)?(?:overview|pathophysiology|clinical\s+features|diagnosis|management|complications|when\s+to\s+refer|prognosis|resources|references)\s*<\/strong>\s*<\/p>/i, "");

  // ── STEP 1: Table and image styling (no interaction with callouts) ──────────
  formatted = styleHtmlTables(formatted);
  formatted = styleHtmlImages(formatted);

  // ── STEP 2: Apply global p/ul/li base styles BEFORE callout detection ───────
  // This way convertTextCallouts sees clean <p> tags and can override styles
  // for content inside callout blocks without the global styles clobbering them.
  formatted = formatted.replace(/<p([^>]*)>/gi, (_m: string, attrs: string) => {
    if (attrs.includes('data:image') || attrs.includes('src=')) return `<p${attrs}>`;
    return '<p style="font-family: \'DM Sans\', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">';
  });
  formatted = formatted.replace(/<ul[^>]*>/gi, '<ul style="list-style-type: disc; padding-left: 1.25rem; font-family: \'DM Sans\', sans-serif; margin-bottom: 1rem;">');
  formatted = formatted.replace(/<ol[^>]*>/gi, '<ol style="list-style-type: decimal; padding-left: 1.25rem; font-family: \'DM Sans\', sans-serif; margin-bottom: 1rem;">');
  formatted = formatted.replace(/<li[^>]*>/gi, '<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">');

  // ── STEP 3: Strip emojis from text content BEFORE callout detection ─────────
  // Strip all emojis/symbols (except warning markers ⚠️ and ⚠ so they can trigger warnings)
  formatted = formatted.replace(/(?![⚠️⚠])\p{Extended_Pictographic}/gu, "");

  // ── STEP 4: Callout detection & styling (runs on clean, pre-styled HTML) ────
  // convertTextCallouts wraps matching sections in colored divs with their own
  // styles — these must run AFTER base styles so the div overrides take effect.
  formatted = styleHtmlCallouts(formatted);
  formatted = convertTextCallouts(formatted);
  formatted = highlightWarningText(formatted);

  // ── STEP 5: Strip remaining emojis (⚠ may remain in text content) ──────────
  // Strip all remaining emojis/pictographs from the output completely
  formatted = formatted.replace(/\p{Extended_Pictographic}/gu, "");
  
  return formatted.trim();
}

function parseHtmlToCatalog(html: string, fileName: string): ExtractedCatalog {
  const marked = markHtmlHeaders(html);
  const parts = marked.split(/\[SECTION_SPLIT:\s*([A-Z]+)\]/);
  
  const headerHtml = parts[0] || "";
  const meta = parseHeaderMetadata(headerHtml, fileName);
  
  const catalog: ExtractedCatalog = {
    title: meta.title,
    tags: meta.tags,
    definition: "",
    sections: {
      overview: "",
      pathophysiology: "",
      clinicalFeatures: "",
      diagnosis: "",
      management: "",
      complications: "",
      whenToRefer: "",
      prognosis: "",
      resources: "",
    }
  };
  
  const sectionsMap: Record<string, string> = {
    OVERVIEW: "",
    PATHOPHYSIOLOGY: "",
    CLINICALFEATURES: "",
    DIAGNOSIS: "",
    MANAGEMENT: "",
    COMPLICATIONS: "",
    WHENTOREFER: "",
    PROGNOSIS: "",
    RESOURCES: "",
  };
  
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const content = parts[i+1] || "";
    if (key in sectionsMap) {
      sectionsMap[key] += content;
    }
  }
  
  // PRESERVE CONTENT PRECEDING HEADINGS:
  let cleanHeaderHtml = headerHtml;
  // Let's remove any table that contains metadata fields
  cleanHeaderHtml = cleanHeaderHtml.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
    const plain = content.replace(/<[^>]+>/g, "").toLowerCase();
    if (plain.includes("title:") || plain.includes("system:") || plain.includes("category:") || plain.includes("tags:")) {
      return ""; // remove metadata table
    }
    return match; // keep other tables
  });
  
  // Also remove simple paragraph headers like "Synapse Clinical Catalogue Template" or similar branding
  cleanHeaderHtml = cleanHeaderHtml.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
    const plain = content.replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (plain.includes("clinical catalogue template") || plain.includes("gp edge") || plain.trim() === "") {
      return ""; // remove branding line
    }
    return match;
  });
  
  cleanHeaderHtml = cleanHeaderHtml.trim();
  
  // Keep overview content strictly within its parsed section (do NOT prepend header metadata/description)
  let overviewContent = sectionsMap.OVERVIEW;

  // Fallback: If no section splits were found, treat the entire document text as overview
  let hasAnySection = false;
  for (const k of Object.keys(sectionsMap)) {
    if (sectionsMap[k].trim()) {
      hasAnySection = true;
      break;
    }
  }
  if (!hasAnySection && cleanHeaderHtml) {
    overviewContent = cleanHeaderHtml;
  }
  
  catalog.sections.overview = formatSectionHtml(overviewContent);
  catalog.sections.pathophysiology = formatSectionHtml(sectionsMap.PATHOPHYSIOLOGY);
  catalog.sections.clinicalFeatures = formatSectionHtml(sectionsMap.CLINICALFEATURES);
  catalog.sections.diagnosis = formatSectionHtml(sectionsMap.DIAGNOSIS);
  catalog.sections.management = formatSectionHtml(sectionsMap.MANAGEMENT);
  catalog.sections.complications = formatSectionHtml(sectionsMap.COMPLICATIONS);
  catalog.sections.whenToRefer = formatSectionHtml(sectionsMap.WHENTOREFER);
  catalog.sections.prognosis = formatSectionHtml(sectionsMap.PROGNOSIS);
  catalog.sections.resources = formatSectionHtml(sectionsMap.RESOURCES);
  
  const firstOverviewP = overviewContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (firstOverviewP) {
    catalog.definition = firstOverviewP[1].replace(/<[^>]+>/g, "").trim();
  }
  if (!catalog.definition) {
    const plainHeader = headerHtml.replace(/<[^>]+>/g, "\n").split("\n").map(l => l.trim()).filter(Boolean);
    const defLine = plainHeader.find(l => !l.toLowerCase().includes("title:") && !l.toLowerCase().includes("system:") && !l.toLowerCase().includes("category:") && !l.toLowerCase().includes("tags:"));
    catalog.definition = defLine || `Clinical catalogue entry for ${catalog.title}.`;
  }
  
  return catalog;
}

function generateCatalogHtml(catalog: ExtractedCatalog, system: string, category: string): string {
  let html = "";

  html += `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem; margin-bottom: 1.5rem; font-family: 'DM Sans', sans-serif;">
      <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">${system || "Clinical Catalog"}</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">${category || "Medical Condition"}</span>
    </div>
  `;

  html += `
    <h1 style="font-family: Georgia, serif; font-size: 2rem; font-weight: bold; color: #0f172a; margin: 0 0 1rem; line-height: 1.2;">${catalog.title}</h1>
  `;

  const definitionText = catalog.definition.trim() || `Clinical catalog overview and guidance for ${catalog.title}.`;
  html += `
    <div style="background-color: #0f766e; color: #ffffff; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 0.25rem 0.25rem 0 0;">${category || "Medical Condition"}</div>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 0.75rem 0.75rem; padding: 1rem; margin-bottom: 1.25rem; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; line-height: 1.6; color: #334155; font-style: italic;">
      ${definitionText}
    </div>
  `;

  if (catalog.tags.length > 0) {
    const tagBadges = catalog.tags.map(tag => `<span style="background-color: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 0.375rem; margin-right: 0.5rem; border: 1px solid #e2e8f0;">#${tag}</span>`).join("");
    html += `
      <div style="margin-bottom: 1.75rem; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem;">
        <span style="font-size: 0.75rem; font-weight: bold; color: #64748b; margin-right: 0.5rem; text-transform: uppercase;">Tags:</span>
        ${tagBadges}
      </div>
    `;
  }

  const sectionsList = [
    { name: "1. Overview", html: catalog.sections.overview },
    { name: "2. Pathophysiology", html: catalog.sections.pathophysiology },
    { name: "3. Clinical Features", html: catalog.sections.clinicalFeatures },
    { name: "4. Diagnosis & Investigations", html: catalog.sections.diagnosis },
    { name: "5. Management", html: catalog.sections.management },
    { name: "6. Complications", html: catalog.sections.complications },
    { name: "7. When to Refer", html: catalog.sections.whenToRefer },
    { name: "8. Prognosis", html: catalog.sections.prognosis },
    { name: "9. Resources", html: catalog.sections.resources },
  ];

  sectionsList.forEach(sec => {
    if (sec.html.trim()) {
      html += `
        <h2 style="font-family: Georgia, serif; font-size: 1.35rem; font-weight: bold; color: #0f766e; border-left: 4px solid #0f766e; padding-left: 0.75rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.25;">${sec.name}</h2>
        ${sec.html}
      `;
    }
  });

  // ── Final callout pass ────────────────────────────────────────────────────
  // formatSectionHtml() runs convertTextCallouts per-section, but for PDF/DOC
  // content the plain-text-to-HTML conversion may have produced <h3> callout
  // headers whose following bullet lists land in a different section chunk.
  // Running a final pass over the fully assembled HTML catches those cases and
  // ensures every callout keyword becomes a styled callout block regardless of
  // where it appeared in the source document.
  html = styleHtmlCallouts(html);
  html = convertTextCallouts(html);
  html = highlightWarningText(html);
  // Strip any remaining pictographic emojis (except those already consumed above)
  html = html.replace(/\p{Extended_Pictographic}/gu, "");

  return html;
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

function isDocxFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.startsWith('word/') ||
    lower.startsWith('word\\') ||
    lower.startsWith('_rels/') ||
    lower.startsWith('_rels\\') ||
    lower.startsWith('docprops/') ||
    lower.startsWith('docprops\\') ||
    lower.startsWith('customxml/') ||
    lower.startsWith('customxml\\') ||
    lower.startsWith('[content_types].xml')
  );
}

function fixZipSeparators(buffer: Buffer): Buffer {
  if (!buffer.includes(0x5C)) return buffer;
  const result = Buffer.from(buffer);
  let offset = 0;
  while (offset < result.length - 30) {
    const signature = result.readUInt32LE(offset);
    if (signature === 0x04034b50) { // Local File Header
      const fileNameLength = result.readUInt16LE(offset + 26);
      const fileNameStart = offset + 30;
      const fileNameEnd = fileNameStart + fileNameLength;
      
      if (fileNameEnd <= result.length) {
        for (let i = fileNameStart; i < fileNameEnd; i++) {
          if (result[i] === 0x5C) {
            result[i] = 0x2F;
          }
        }
        const compressedSize = result.readUInt32LE(offset + 18);
        const extraFieldLength = result.readUInt16LE(offset + 28);
        if (compressedSize > 0) {
          offset += 30 + fileNameLength + extraFieldLength + compressedSize;
          continue;
        }
      }
      offset++;
    } else if (signature === 0x02014b50) { // Central Directory File Header
      if (offset + 46 <= result.length) {
        const fileNameLength = result.readUInt16LE(offset + 28);
        const fileNameStart = offset + 46;
        const fileNameEnd = fileNameStart + fileNameLength;
        
        if (fileNameEnd <= result.length) {
          for (let i = fileNameStart; i < fileNameEnd; i++) {
            if (result[i] === 0x5C) {
              result[i] = 0x2F;
            }
          }
          const extraFieldLength = result.readUInt16LE(offset + 30);
          const fileCommentLength = result.readUInt16LE(offset + 32);
          offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
          continue;
        }
      }
      offset++;
    } else {
      const nextSig = result.indexOf(0x50, offset + 1);
      if (nextSig === -1) break;
      offset = nextSig;
    }
  }
  return result;
}

// ── Question Extractor and Parser ──────────────────────────────────────────────

async function extractTextAndImagesFromDocxBuffer(buffer: Buffer): Promise<string> {
  const fixedBuffer = fixZipSeparators(buffer);

  // Strategy 1: Extract plain text directly using mammoth.extractRawText
  let rawText = "";
  try {
    const rawResult = await mammoth.extractRawText({ buffer: fixedBuffer });
    rawText = rawResult.value || "";
  } catch (e) {
    try {
      const rawResult = await mammoth.extractRawText({ buffer });
      rawText = rawResult.value || "";
    } catch (e2) {
      console.error("mammoth.extractRawText failed:", e2);
    }
  }

  // Strategy 2: Extract embedded images and HTML text via convertToHtml
  let htmlText = "";
  let imageUrls: string[] = [];
  try {
    const htmlResult = await mammoth.convertToHtml({ buffer: fixedBuffer }, {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          let contentType = image.contentType || "image/png";
          if (contentType === "application/octet-stream" || !contentType.startsWith("image/")) {
            if (imageBuffer.startsWith("iVBORw0KGgo")) contentType = "image/png";
            else if (imageBuffer.startsWith("/9j/")) contentType = "image/jpeg";
            else contentType = "image/png";
          }
          return { src: "data:" + contentType + ";base64," + imageBuffer };
        });
      })
    });
    
    const html = htmlResult.value || "";
    const matches = html.match(/<img\s+[^>]*src=["'](data:[^"']+)["'][^>]*>/gi) || [];
    for (const m of matches) {
      const srcMatch = m.match(/src=["'](data:[^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        imageUrls.push(srcMatch[1]);
      }
    }

    htmlText = html
      .replace(/<\/?(strong|b|em|i|u|span|a)\b[^>]*>/gi, "")
      .replace(/<img\s+[^>]*src=["'](data:[^"']+)["'][^>]*>/gi, "\n[IMAGE: $1]\n")
      .replace(/<[^>]+>/g, "\n");
  } catch (e) {
    console.warn("Mammoth image extraction warning:", e);
  }

  // Pick the text with higher content length to guarantee complete extraction
  let finalText = (rawText.trim().length >= htmlText.trim().length ? rawText : htmlText) || rawText || htmlText;

  if (finalText && finalText.trim().length > 10) {
    let cleanText = finalText
      .replace(/[\uFEFF\u200B\u200C\u200D\u200E\u200F\u180E\u202F\u205F\u3000]/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00A0/g, " ")
      .replace(/&nbsp;/gi, " ");

    if (imageUrls.length > 0) {
      cleanText = associateImagesWithText(cleanText, imageUrls);
    }
    return cleanText.trim();
  }

  // Fallback to WordExtractor for legacy files
  try {
    const WordExtractor = require("word-extractor");
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return doc.getBody().trim();
  } catch (err) {
    console.error("WordExtractor fallback failed:", err);
    return finalText.trim();
  }
}

function parseTextToQuestions(text: string): any[] {
  const questions: any[] = [];
  
  // Normalize line endings, BOM, zero-width characters, and non-breaking spaces (\u00A0)
  const normalizedText = text
    .replace(/[\uFEFF\u200B\u200C\u200D\u200E\u200F\u180E\u202F\u205F\u3000]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  
  // Extract and replace all [IMAGE: ...] tags with placeholders so base64 data
  // doesn't interfere with the question-number detection below.
  const imageUrls: string[] = [];
  const textWithPlaceholders = normalizedText.replace(/\[IMAGE:\s*([^\]]+)\]/gi, (_match, url) => {
    imageUrls.push(url.trim());
    return `[IMAGE_PLACEHOLDER_${imageUrls.length - 1}]`;
  });

  // ── STEP 1: Split into lines and group them into per-question blocks ──────
  // Pre-process: insert newlines before inline question numbers so they become their own lines.
  const preProcessed = textWithPlaceholders
    .replace(/([\.\?!])\s+(?=(?:Question|Q\.?|Item|Case|Scenario|MCQ|Task|Stem|Station)\s*#?\s*\d+\s*[:.|\\-—]?\s)/gi, "$1\n")
    .replace(/([\.\?!])\s+(?=\(?\d{1,3}[\.\):\-]\s+[A-Z])/g, "$1\n");

  const allLines = preProcessed.split("\n");

  // Regex that identifies a line as the start of a new question (e.g. "Question 1:", "Question 1", "Q1.", "1.")
  const QUESTION_START = /^(?:(?:Question|Q\.?|Item|Case|Scenario|MCQ|Task|Station|Clinical\s*Case)\s*#?\s*\d+\b[:.|\\-—]?\s*|(?:\(?\d{1,3}[\.\):\-]\s+))/i;

  // Group lines into blocks — initialize on first QUESTION_START line, or first content line if non-template file
  let rawBlocks: string[][] = [];
  let current: string[] | null = null;

  for (const rawLine of allLines) {
    const trimmed = rawLine.trim().replace(/^[*#]+\s*/, ""); // strip markdown headers
    if (QUESTION_START.test(trimmed)) {
      if (current && current.length > 0) rawBlocks.push(current);
      // Strip the question-number prefix so we don't include it in the stem
      const stripped = trimmed.replace(/^(?:(?:Question|Q\.?|Item|Case|Scenario|MCQ|Task|Station|Clinical\s*Case)\s*#?\s*\d+\s*[:.|\\-—]?\s*|(?:\(?\d{1,3}[\.\):\-]\s+))/i, "").trim();
      current = stripped ? [stripped] : [];
    } else {
      if (current !== null) {
        if (trimmed) current.push(trimmed);
      } else if (trimmed && !/^(?:THE GP EDGE|Applied Knowledge Test|Key Feature Test|INSTRUCTIONS FOR)/i.test(trimmed)) {
        // For non-template PDFs/files, start capturing from first actual content line
        current = [trimmed];
      }
    }
  }
  if (current && current.length > 0) rawBlocks.push(current);

  // Fallback: If no QUESTION_START matched or rawBlocks is empty, split by double newlines or option lines
  if (rawBlocks.length === 0 || !rawBlocks.some(blk => blk.some(l => /^\s*(?:\[?[A-J]\]?|\(?\d{1,2}\))[\.\/):\-]/i.test(l)))) {
    const doubleNewlineBlocks = preProcessed.split(/\n\s*\n/).map(b => b.split("\n").map(l => l.trim()).filter(Boolean)).filter(b => b.length > 0);
    const fallbackBlocks: string[][] = [];
    for (const blk of doubleNewlineBlocks) {
      if (blk.some(l => /^\s*(?:\[?[A-J]\]?|\(?\d{1,2}\))[\.\/):\-]/i.test(l)) || blk.some(l => isMetadataLine(l))) {
        fallbackBlocks.push(blk);
      }
    }
    if (fallbackBlocks.length > 0) {
      rawBlocks = fallbackBlocks;
    }
  }

  // ── STEP 2: Parse each block for stem / options / metadata ───────────────
  for (const blockLines of rawBlocks) {
    if (blockLines.length === 0) continue;
    
    // Recover image placeholder from this block
    let image: string | undefined = undefined;
    const blockText = blockLines.join("\n");
    const placeholderMatch = blockText.match(/\[IMAGE_PLACEHOLDER_(\d+)\]/i);
    if (placeholderMatch) {
      const imgIdx = parseInt(placeholderMatch[1]);
      if (imgIdx >= 0 && imgIdx < imageUrls.length) {
        const candidate = imageUrls[imgIdx];
        const isDecorative = candidate.startsWith("data:") && candidate.length < 4000;
        if (!isDecorative) {
          image = candidate;
          if (!image.startsWith("data:") && !image.startsWith("/")) {
            image = image.startsWith("assets/") ? "/" + image : "/assets/" + image;
          }
        }
      }
    }

    // Strip all image placeholders and horizontal rule divider lines
    const filteredLines = blockLines
      .map(l => l.replace(/\[IMAGE_PLACEHOLDER_\d+\]/gi, "").trim())
      .filter(l => l && !/^[_\-=\s]{3,}$/.test(l) && !looksLikeBase64OrBinary(l));

    if (filteredLines.length === 0) continue;

    let questionTextLines: string[] = [];
    let stemLines: string[] = [];
    let leadInLines: string[] = [];
    let whyCorrectLines: string[] = [];
    let distractorLines: string[] = [];
    let knowledgeBankLines: string[] = [];
    let pearlLines: string[] = [];

    const options: string[] = [];
    let correctIndex = 0;
    let correctIndices: number[] = [0];
    let kfpCorrectCount = 1;
    let examType: "AKT" | "KFT" = "AKT";
    let rationale = "";
    let topic = "General";
    let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
    let subtopic = "";
    let tags: string[] = [];

    let parsingState: "question" | "stem" | "leadIn" | "options" | "whyCorrect" | "distractors" | "knowledgeBank" | "pearl" | "metadata" = "question";
    let parsingRationale = false;

    for (let j = 0; j < filteredLines.length; j++) {
      const line = filteredLines[j];
      if (!line) continue;
      const cleanLine = line.trim().replace(/^[*#•\-\s]+/, "");

      // ── Exam Type (e.g. "Exam Type: KFT" or "Exam Type: AKT") ─────────
      const examTypeMatch = cleanLine.match(/^(?:exam\s*type|exam\s*format|format|test\s*type)\s*[:\-\=\–\—]\s*(.*)$/i);
      if (examTypeMatch) {
        const val = examTypeMatch[1].trim().toUpperCase();
        if (val.includes("KFT") || val.includes("KFP")) {
          examType = "KFT";
        } else if (val.includes("AKT") || val.includes("MCQ")) {
          examType = "AKT";
        }
        continue;
      }

      // Check for inline difficulty marker anywhere in rationale or explanation lines
      const inlineDiffMatch = line.match(/\b(?:difficulty|level|grade|tier)\s*[:\-\=\–\—]\s*(easy|medium|hard|intermediate|advanced|basic)/i);
      if (inlineDiffMatch) {
        const d = inlineDiffMatch[1].toLowerCase();
        if (/easy|basic/i.test(d)) difficulty = "Easy";
        else if (/hard|advanced/i.test(d)) difficulty = "Hard";
        else difficulty = "Medium";
      }

      // ── Limit / Allowed Selections (KFT) ──────────────────────────────
      const limitMatch = cleanLine.match(/^(?:limit|max\s*selections?|allowed\s*selections?|selection\s*limit|correct\s*count)\s*[:\-\=\–\—]\s*(\d+)/i);
      if (limitMatch) {
        kfpCorrectCount = parseInt(limitMatch[1], 10) || 3;
        examType = "KFT";
        continue;
      }

      // ── Correct Answer(s) (e.g. "Correct Answers: A, B, D" or "Answer: C") ───
      const correctMatch = cleanLine.match(/^(?:correct\s*answers?|correct\s*options?|correct|answers?|answer\s*key)\s*[:\-\=\–\—]\s*(.*)$/i);
      const isRealCorrect = correctMatch && isStrictMetadataMatch(correctMatch[1], "correct", parsingRationale);
      if (isRealCorrect && correctMatch) {
        parsingState = "metadata";
        let ansVal = correctMatch[1].trim();
        if (!ansVal && j + 1 < filteredLines.length) {
          const next = filteredLines[j + 1].trim();
          if (next && !isMetadataLine(next)) { ansVal = next; j++; }
        }
        
        // Extract multiple option letters (e.g. "A, B, D" or "A, C, F" or "A")
        const letters = ansVal.toUpperCase().match(/[A-J]/g);
        if (letters && letters.length > 0) {
          correctIndices = letters.map((l) => l.charCodeAt(0) - 65).filter((idx) => idx >= 0 && idx < 10);
          correctIndex = correctIndices[0] ?? 0;
          if (letters.length > 1) {
            examType = "KFT";
            if (kfpCorrectCount <= 1) {
              kfpCorrectCount = letters.length;
            }
          }
        }

        const inlineExpMatch = ansVal.match(/^[A-J][\.\)\-\s]*[:\-\=\–\—]?\s*(?:(?:explanation|rationale|because|why|discussion|reasoning)\s*[:\-\=\–\—]?\s*)?(.+)$/i);
        if (inlineExpMatch && inlineExpMatch[1].trim().length > 5 && !/^[A-J]$/i.test(inlineExpMatch[1].trim())) {
          const extractedExp = inlineExpMatch[1].trim().replace(/^(?:explanation|rationale|because|why)\s*[:\-\=\–\—]?\s*/i, "").trim();
          if (extractedExp.length > 8) {
            rationale = (rationale ? rationale + "\n" : "") + extractedExp;
            parsingRationale = true;
          }
        }
        continue;
      }

      // ── Topic ───────────────────────────────────────────────────────────
      const topicMatch = cleanLine.match(/^(?:topic|category|subject|domain|specialty|system)s?\s*[:\-\=\–\—]\s*(.*)$/i);
      if (topicMatch && isStrictMetadataMatch(topicMatch[1], "topic", parsingRationale)) {
        if (options.length > 0) {
          parsingState = "metadata";
          parsingRationale = false;
        }
        let v = topicMatch[1].trim();
        if (!v && j + 1 < filteredLines.length) {
          const next = filteredLines[j + 1].trim();
          if (next && !isMetadataLine(next)) { v = next; j++; }
        }
        topic = v || "General";
        continue;
      }

      // ── Subtopic ────────────────────────────────────────────────────────
      const subtopicMatch = cleanLine.match(/^sub[- ]?(?:topics?|category|categories?|section)\s*[:\-\=\–\—]\s*(.*)$/i);
      if (subtopicMatch && isStrictMetadataMatch(subtopicMatch[1], "subtopic", parsingRationale)) {
        if (options.length > 0) {
          parsingState = "metadata";
          parsingRationale = false;
        }
        let v = subtopicMatch[1].trim();
        if (!v && j + 1 < filteredLines.length) {
          const next = filteredLines[j + 1].trim();
          if (next && !isMetadataLine(next)) { v = next; j++; }
        }
        subtopic = v;
        continue;
      }

      // ── Difficulty / Grade / Level (e.g. "Grade: Easy" or "Difficulty: Medium") ──
      const diffMatch = cleanLine.match(/^(?:diffculty|difficulty|difficulty\s*level|level|grade|tier)\s*[:\-\=\–\—]\s*(.*)$/i);
      if (diffMatch && isStrictMetadataMatch(diffMatch[1], "difficulty", parsingRationale)) {
        if (options.length > 0) {
          parsingState = "metadata";
          parsingRationale = false;
        }
        let v = diffMatch[1].trim();
        if (!v && j + 1 < filteredLines.length) {
          const next = filteredLines[j + 1].trim();
          if (next && !isMetadataLine(next)) { v = next; j++; }
        }
        if (/easy|basic|1/i.test(v)) difficulty = "Easy";
        else if (/hard|advanced|3/i.test(v)) difficulty = "Hard";
        else if (/medium|intermediate|moderate|2/i.test(v)) difficulty = "Medium";
        else difficulty = "Medium";
        continue;
      }

      // ── Tags (e.g. "Tags: Women's Health , Cervical Screening Test...") ──
      const tagMatch = cleanLine.match(/^(?:tags?|keywords?|labels?)\s*[:\-\=\–\—]\s*(.*)$/i);
      if (tagMatch && isStrictMetadataMatch(tagMatch[1], "tags", parsingRationale)) {
        if (options.length > 0) {
          parsingState = "metadata";
          parsingRationale = false;
        }
        let v = tagMatch[1].trim();
        if (!v && j + 1 < filteredLines.length) {
          const next = filteredLines[j + 1].trim();
          if (next && !isMetadataLine(next)) { v = next; j++; }
        }
        if (v) {
          const newTags = v
            .split(/[,;·•|/]+/)
            .map(t => t.trim().replace(/^[*#•·\-\s]+/, "").replace(/[*#•·\-\s_]+$/, ""))
            .filter(Boolean);
          for (const t of newTags) {
            if (!tags.includes(t)) tags.push(t);
          }
        }
        continue;
      }

      // ── Stem Header ─────────────────────────────────────────────────────
      const stemMatch = cleanLine.match(/^(?:stem|clinical\s*vignette|vignette|scenario)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (stemMatch) {
        parsingState = "stem";
        if (stemMatch[1].trim()) stemLines.push(stemMatch[1].trim());
        continue;
      }

      // ── Lead-In / Prompt Header ─────────────────────────────────────────
      const leadInMatch = cleanLine.match(/^(?:lead\s*[-]?\s*in|prompt|question\s*prompt|question\s*text)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (leadInMatch) {
        parsingState = "leadIn";
        if (leadInMatch[1].trim()) leadInLines.push(leadInMatch[1].trim());
        continue;
      }

      // ── Why Correct Header ──────────────────────────────────────────────
      const whyCorrectMatch = cleanLine.match(/^(?:why\s*correct|master\s*rationale|correct\s*rationale)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (whyCorrectMatch) {
        parsingState = "whyCorrect";
        if (whyCorrectMatch[1].trim()) whyCorrectLines.push(whyCorrectMatch[1].trim());
        continue;
      }

      // ── Distractor Rationales Header ────────────────────────────────────
      const distractorMatch = cleanLine.match(/^(?:distractor\s*rationales?|distractor\s*explanations?|distractors?)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (distractorMatch) {
        parsingState = "distractors";
        if (distractorMatch[1].trim()) distractorLines.push(distractorMatch[1].trim());
        continue;
      }

      // ── Knowledge Bank Header ───────────────────────────────────────────
      const kbMatch = cleanLine.match(/^(?:knowledge\s*bank|educational\s*bank|deep\s*dive|guidelines?)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (kbMatch) {
        parsingState = "knowledgeBank";
        if (kbMatch[1].trim()) knowledgeBankLines.push(kbMatch[1].trim());
        continue;
      }

      // ── Clinical Pearl Header ───────────────────────────────────────────
      const pearlMatch = cleanLine.match(/^(?:clinical\s*pearl|pearl|key\s*takeaway|exam\s*pearl)\s*[:\-\=\–\—]?\s*(.*)$/i);
      if (pearlMatch) {
        parsingState = "pearl";
        if (pearlMatch[1].trim()) pearlLines.push(pearlMatch[1].trim());
        continue;
      }

      // ── Rationale / General Explanation ─────────────────────────────────
      const rationaleMatch = cleanLine.match(/^(?:rationale|high\s*-?\s*yield\s*rationale|explanation|explaination|explanations|answer\s*&\s*explanation|answer\s*&\s*rationale|answer\s*explanation|detailed\s*explanation|detailed\s*rationale|clinical\s*rationale|discussion|reasoning|feedback|solution)\s*[:\-\=\–\—\s]\s*(.*)$/i);
      if (rationaleMatch) {
        parsingState = "metadata";
        parsingRationale = true;
        const v = rationaleMatch[1].trim();
        if (v) {
          rationale = (rationale ? rationale + "\n" : "") + cleanLine;
        } else {
          rationale = (rationale ? rationale + "\n" : "") + line.trim();
        }
        continue;
      }

      // ── Option lines (A. B. C. D. or A), (A), [A], 1. 2. 3. 4.) ─────────────────
      const optionMatch = cleanLine.match(/^\s*(?:\[([A-J])\]|\(?([A-J])[\.\/):\-]|([A-J])\)|(?:\(?(\d{1,2})[\.\):\-]))\s*(.+)$/i);
      if (optionMatch) {
        const letterRaw = (optionMatch[1] || optionMatch[2] || optionMatch[3] || "").toUpperCase();
        const numIndex = optionMatch[4] ? parseInt(optionMatch[4], 10) - 1 : -1;
        const letter = letterRaw || (numIndex >= 0 ? String.fromCharCode(65 + numIndex) : "A");
        const optText = optionMatch[5].trim();
        const looksRealOption = optText.length >= 1;
        // Strip out placeholder options (e.g. [Enter Option E text here])
        if (looksRealOption && !optText.includes("[Enter Option")) {
          options.push(optText);
        } else if (looksRealOption && options.length === 0) {
          options.push(optText);
        }
        parsingState = "options";
        continue;
      }

      // ── Plain "Options:" header ─────────────────────────────────────────
      if (/^options?\s*:?\s*$/i.test(cleanLine)) {
        parsingState = "options";
        continue;
      }

      // ── Default: append to current state ───────────────────────────────
      if (parsingState === "stem") {
        stemLines.push(line);
      } else if (parsingState === "leadIn") {
        leadInLines.push(line);
      } else if (parsingState === "whyCorrect") {
        whyCorrectLines.push(line);
      } else if (parsingState === "distractors") {
        distractorLines.push(line);
      } else if (parsingState === "knowledgeBank") {
        knowledgeBankLines.push(line);
      } else if (parsingState === "pearl") {
        pearlLines.push(line);
      } else if (parsingState === "question") {
        questionTextLines.push(line);
      } else if (parsingState === "options") {
        if (!line.includes("[Enter Option")) {
          options.push(line);
        }
      } else if (parsingState === "metadata") {
        if (parsingRationale && !isMetadataLine(line)) {
          const cleanRationaleLine = line.replace(/\bDifficulty\s*:\s*(?:Easy|Medium|Hard)\b/gi, "").trim();
          if (cleanRationaleLine) {
            rationale += (rationale ? "\n" : "") + cleanRationaleLine;
          }
        }
      }
    }

    const stem = stemLines.join("\n").trim();
    const leadIn = leadInLines.join("\n").trim();
    const whyCorrect = whyCorrectLines.join("\n").trim();
    const knowledgeBank = knowledgeBankLines.join("\n").trim();
    const pearl = pearlLines.join("\n").trim();

    const finalQuestionText = stem
      ? (leadIn ? `${stem}\n\n${leadIn}` : stem)
      : questionTextLines.join("\n").trim();

    // Skip empty text blocks
    if (!finalQuestionText) continue;

    // Filter placeholder option text if present
    const realOptions = options.filter((o) => !o.includes("[Enter Option"));
    const finalOptions: string[] = [];
    const optionSource = realOptions.length > 0 ? realOptions : options;
    const numOptions = Math.max(4, optionSource.length);
    for (let k = 0; k < numOptions; k++) {
      const optVal = optionSource[k] || `Option ${String.fromCharCode(65 + k)}`;
      finalOptions.push(optVal.replace(/\[Enter Option [A-Z] text here(?:\s*\(optional\))?\]/gi, `Option ${String.fromCharCode(65 + k)}`));
    }

    // Auto-derive primary Topic from first tag if topic is still "General"
    if (topic === "General" && tags.length > 0) {
      topic = tags[0];
    }

    questions.push({
      text: finalQuestionText,
      stem: stem || finalQuestionText,
      leadIn: leadIn || "",
      options: finalOptions,
      correctIndex,
      correctIndices: correctIndices.length > 0 ? correctIndices : [correctIndex],
      kfpCorrectCount: kfpCorrectCount || (correctIndices.length > 1 ? correctIndices.length : 1),
      kftCorrectCount: kfpCorrectCount || (correctIndices.length > 1 ? correctIndices.length : 1),
      whyCorrect: whyCorrect || rationale,
      distractorRationales: distractorLines.filter(Boolean),
      knowledgeBank,
      pearl,
      examType,
      rationale: (whyCorrect || rationale).trim() || "No explanation provided.",
      topic,
      subtopic,
      difficulty,
      tags: tags.length > 0 ? tags : ["General"],
      image,
    });
  }

  // ── STEP 3: Fallback Answer Key / Explanation linking for standalone answer sections ──
  // If any questions are missing explanations, search the full text for an Answer Key / Explanations section
  const missingRationaleCount = questions.filter(q => !q.rationale || q.rationale === "No explanation provided.").length;
  if (missingRationaleCount > 0) {
    const sections = normalizedText.split(/(?=\n\s*(?:Answers?\s*(?:&|and)?\s*Explanations?|Answer\s*Key|Explanations?|Rationales?)\b)/i);
    if (sections.length > 1) {
      const answerSectionText = sections.slice(1).join("\n");
      const expBlocks = answerSectionText.split(/(?=\n\s*(?:Question|Q\.?|Item|Case|MCQ)\s*#?\s*\d+\b|\n\s*\(?\d{1,3}[\.\):\-]\s+)/i);
      
      for (const expBlock of expBlocks) {
        const numMatch = expBlock.match(/^(?:\s*(?:Question|Q\.?|Item|Case|MCQ)\s*#?\s*(\d+)|\s*\(?(\d{1,3})[\.\):\-]\s+)/i);
        if (numMatch) {
          const qNum = parseInt(numMatch[1] || numMatch[2], 10);
          if (qNum >= 1 && qNum <= questions.length) {
            const targetQ = questions[qNum - 1];
            if (!targetQ.rationale || targetQ.rationale === "No explanation provided.") {
              let expText = expBlock.replace(/^(?:\s*(?:Question|Q\.?|Item|Case|MCQ)\s*#?\s*\d+[:.]?\s*|\s*\(?\d{1,3}[\.\):\-]\s+)/i, "").trim();
              const ansMatch = expText.match(/^(?:Answer|Correct|Option)?\s*[:\-\=\–\—]?\s*([A-H])\b/i);
              if (ansMatch) {
                const idx = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
                if (idx >= 0 && idx < targetQ.options.length) {
                  targetQ.correctIndex = idx;
                }
              }
              expText = expText.replace(/^(?:Answer|Correct|Option)?\s*[:\-\=\–\—]?\s*[A-H][\.\)\-\s]*/i, "").trim();
              expText = expText.replace(/^(?:Explanation|Rationale|Answer\s*&\s*Explanation)\s*[:\-\=\–\—]?\s*/i, "").trim();
              if (expText.length > 5) {
                targetQ.rationale = expText;
              }
            }
          }
        }
      }
    }
  }

  return questions;
}


// ── R2 image uploader ──────────────────────────────────────────────────────────

/**
 * Finds every base64 data:image/... src in an HTML string, uploads each to R2,
 * and replaces the src with the public R2 URL.
 * Returns the updated HTML. Images that fail to upload are left as-is.
 */
async function recognizeImageText(buffer: Buffer, fileName: string): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(buffer, "eng");
    return data.text || "";
  } catch (err: any) {
    console.warn(`Tesseract OCR unavailable or failed for ${fileName} in serverless environment:`, err?.message || err);
    return `[Image Content: ${fileName}]`;
  }
}

/**
 * Finds every base64 data:image/... src in an HTML string, uploads each to R2,
 * and replaces the src with the public R2 URL.
 * Returns the updated HTML. Images that fail to upload are left as-is.
 */
async function uploadBase64ImagesToR2(html: string): Promise<string> {
  // Quick exit — if there are no embedded data URLs skip the whole pass
  if (!html.includes("data:image/")) return html;

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("R2 storage environment variables missing — keeping inline base64 images");
    return html;
  }

  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME || "thegpedge1234";
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

  // Bulletproof regex to match data URL source strings in HTML attributes
  const dataUrlRegex = /src=(["'])(data:image\/[^"'\s>]+?;base64,[^"']+)\1/gi;

  // Collect all unique data URLs first to avoid uploading the same image twice
  const seen = new Map<string, string>(); // dataUrl → r2Url
  const matches: Array<{ full: string; dataUrl: string }> = [];

  let m: RegExpExecArray | null;
  const clone = new RegExp(dataUrlRegex.source, dataUrlRegex.flags);
  while ((m = clone.exec(html)) !== null) {
    const dataUrl = m[2];
    if (!seen.has(dataUrl)) {
      seen.set(dataUrl, ""); // placeholder
      matches.push({ full: m[0], dataUrl });
    }
  }

  // Upload each unique image
  await Promise.all(
    matches.map(async ({ dataUrl }) => {
      try {
        const mimeMatch = dataUrl.match(/^data:image\/([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "png";

        let ext = mimeType.split("+")[0].split("/").pop() || "png";
        let contentType = `image/${ext}`;

        // Normalize legacy or specific content-types
        if (ext === "x-png") {
          ext = "png";
          contentType = "image/png";
        } else if (ext === "x-jpeg" || ext === "pjpeg") {
          ext = "jpeg";
          contentType = "image/jpeg";
        } else if (ext === "x-wmf" || ext === "wmf") {
          ext = "wmf";
          contentType = "image/wmf";
        } else if (ext === "x-emf" || ext === "emf") {
          ext = "emf";
          contentType = "image/emf";
        }

        const objectKey = `content-images/${crypto.randomUUID()}.${ext}`;
        const base64Data = dataUrl.substring(dataUrl.indexOf(",") + 1).replace(/\s/g, "");
        const buffer = Buffer.from(base64Data, "base64");

        await r2Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: buffer,
          ContentType: contentType,
        }));

        seen.set(dataUrl, `${publicBase}/${objectKey}`);
      } catch (err: any) {
        console.error("Failed to upload extracted image to R2:", err.message);
        // Leave the data URL in place — better than losing the image entirely
        seen.set(dataUrl, dataUrl);
      }
    })
  );

  // Replace every data URL src with the R2 URL
  return html.replace(dataUrlRegex, (match, _quote, dataUrl) => {
    const r2Url = seen.get(dataUrl);
    if (r2Url && r2Url !== dataUrl) {
      return `src="${r2Url}"`;
    }
    return match;
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let tempPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name || "uploaded_file";
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx", "doc", "png", "jpg", "jpeg", "webp"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only PDF, DOC, DOCX, and image files (PNG, JPG, JPEG, WEBP) are supported." },
        { status: 400 }
      );
    }

    // Save buffer for reading
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temp for cleanup tracking with safe filename
    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const tempDir = os.tmpdir();
    tempPath = join(tempDir, `gpedgesync_${Date.now()}_${safeFileName}`);
    await writeFile(tempPath, buffer);

    // Determine if this is an autofill template upload
    const isAutofillType = type === "autofill";

    if (isAutofillType) {
      let rawText = "";
      if (ext === "pdf") {
        rawText = await extractTextFromPdfBuffer(buffer);
      } else if (ext === "doc") {
        rawText = await extractTextAndImagesFromDocBuffer(buffer);
      } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
        rawText = await recognizeImageText(buffer, fileName);
      } else {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value.trim() || await extractTextFromPdfBuffer(buffer);
      }

      // Cleanup temp file
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
        tempPath = null;
      }

      const title = inferTitle(fileName, rawText);

      // Parse SOAP sections if present
      let subjective = "";
      let objective = "";
      let assessment = "";
      let plan = "";

      const sMatch = rawText.match(/(?:subjective|s\b)\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)(?:objective|o\b|assessment|a\b|plan|p\b)\s*:|$)/i);
      const oMatch = rawText.match(/(?:objective|o\b)\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)(?:subjective|s\b|assessment|a\b|plan|p\b)\s*:|$)/i);
      const aMatch = rawText.match(/(?:assessment|a\b)\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)(?:subjective|s\b|objective|o\b|plan|p\b)\s*:|$)/i);
      const pMatch = rawText.match(/(?:plan|p\b)\s*:\s*([\s\S]*?)(?=(?:\n|\r|\s)(?:subjective|s\b|objective|o\b|assessment|a\b)\s*:|$)/i);

      if (sMatch || oMatch || aMatch || pMatch) {
        if (sMatch) subjective = sMatch[1].trim();
        if (oMatch) objective = oMatch[1].trim();
        if (aMatch) assessment = aMatch[1].trim();
        if (pMatch) plan = pMatch[1].trim();
      } else {
        assessment = rawText;
      }

      return NextResponse.json({
        success: true,
        type: "autofill",
        title: title,
        system: "General",
        category: "General",
        content: rawText,
        subjective,
        objective,
        assessment,
        plan,
        doctorSummary: "",
        patientResources: "",
        references: [],
        rawTextLength: rawText.length,
        fileName,
      });
    }

    // Determine if this is a question bank upload
    const isQuestionType =
      type === "question" ||
      fileName.toLowerCase().includes("question") ||
      fileName.toLowerCase().includes("quiz");

    if (isQuestionType) {
      let rawText = "";
      if (ext === "pdf") {
        rawText = await extractTextAndImagesFromPdfBuffer(buffer);
      } else if (ext === "doc") {
        rawText = await extractTextAndImagesFromDocBuffer(buffer);
      } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
        rawText = await recognizeImageText(buffer, fileName);
      } else {
        rawText = await extractTextAndImagesFromDocxBuffer(buffer);
      }
      
      const questions = parseTextToQuestions(rawText);

      // ── Debug: log first 3000 chars and question count to server console ──
      console.log("[extract] rawText first 3000 chars:\n" + rawText.substring(0, 3000));
      console.log("[extract] rawText length:", rawText.length);
      console.log("[extract] questions parsed:", questions.length);
      if (questions.length === 0 && rawText.length > 50) {
        // Log lines that look like question starts
        const lines = rawText.split("\n").slice(0, 60);
        console.log("[extract] first 60 lines:\n" + lines.map((l, i) => `${i}: ${l}`).join("\n"));
      }

      // Cleanup temp file
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
        tempPath = null;
      }

      return NextResponse.json({
        success: true,
        type: "question",
        questions,
        rawTextLength: rawText.length,
        fileName,
      });
    }

    // Determine if this is a clinical approach upload
    const isApproachType = type === "approach" || fileName.toLowerCase().includes("approach");

    if (isApproachType) {
      let rawText = "";
      if (ext === "pdf") {
        rawText = await extractTextAndImagesFromPdfBuffer(buffer);
      } else if (ext === "doc") {
        rawText = await extractTextAndImagesFromDocBuffer(buffer);
      } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
        rawText = await recognizeImageText(buffer, fileName);
      } else {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value.trim() || await extractTextFromPdfBuffer(buffer);
      }

      // Cleanup temp file
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
        tempPath = null;
      }

      const title = inferTitle(fileName, rawText);
      const system = matchField(rawText, SOAP_PATTERNS.system) || "Cardiology";
      const category = matchField(rawText, SOAP_PATTERNS.category) || "Clinical Approach";
      
      const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
      
      let overview = "";
      const steps: any[] = [];
      const keyPoints: string[] = [];
      const redFlags: string[] = [];
      const references: any[] = [];
      
      let currentSection: "overview" | "steps" | "keyPoints" | "redFlags" | "references" = "overview";
      let currentStep: any = null;
      
      for (const line of lines) {
        const lower = line.toLowerCase();
        
        // Detect section headers
        if (lower.includes("key point") || lower.includes("key clinical point")) {
          currentSection = "keyPoints";
          continue;
        }
        if (lower.includes("red flag") || lower.includes("warning") || lower.includes("caution")) {
          currentSection = "redFlags";
          continue;
        }
        if (lower.includes("reference") || lower.includes("citation") || lower.includes("source")) {
          currentSection = "references";
          continue;
        }
        if (lower.includes("clinical step") || lower.includes("step 1") || lower.match(/^step\s+\d+/i)) {
          currentSection = "steps";
        }
        
        if (currentSection === "overview") {
          if (line !== title && !line.startsWith("System:") && !line.startsWith("Category:")) {
            overview += (overview ? " " : "") + line;
          }
        } else if (currentSection === "steps") {
          const stepMatch = line.match(/^(?:step\s*\d+\s*[:\-]?\s*|\d+[\.\)\-]\s*)(.+)/i);
          if (stepMatch) {
            if (currentStep) steps.push(currentStep);
            currentStep = {
              id: crypto.randomUUID(),
              title: stepMatch[1].trim(),
              description: "",
              type: "action",
              checklistItems: []
            };
          } else if (currentStep) {
            if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
              currentStep.checklistItems.push(line.replace(/^[-*•]\s*/, "").trim());
            } else {
              currentStep.description += (currentStep.description ? " " : "") + line;
            }
          } else {
            overview += (overview ? " " : "") + line;
          }
        } else if (currentSection === "keyPoints") {
          if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•") || line.match(/^\d+[\.\)\-]/)) {
            keyPoints.push(line.replace(/^[-*•\d\.\)\-]\s*/, "").trim());
          } else {
            keyPoints.push(line);
          }
        } else if (currentSection === "redFlags") {
          if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•") || line.match(/^\d+[\.\)\-]/)) {
            redFlags.push(line.replace(/^[-*•\d\.\)\-]\s*/, "").trim());
          } else {
            redFlags.push(line);
          }
        } else if (currentSection === "references") {
          const refMatch = line.match(/^(?:\d+[\.\)\-]\s*)?(.+)/);
          if (refMatch) {
            const text = refMatch[1].trim();
            const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
            const url = urlMatch ? urlMatch[1] : undefined;
            const cleanText = url ? text.replace(url, "").trim() : text;
            references.push({
              id: references.length + 1,
              text: cleanText || "Source Reference",
              url
            });
          }
        }
      }
      
      if (currentStep) steps.push(currentStep);

      if (steps.length === 0) {
        steps.push({
          id: crypto.randomUUID(),
          title: "Initial Assessment",
          description: "Assess patient history and present symptoms.",
          type: "action",
          checklistItems: ["Check vital signs", "Confirm history"]
        });
      }

      // ── Build fullHtml for the approach (same pipeline as medical content) ──
      // Re-use the same HTML polishing + callout detection functions so that
      // callout blocks (Key Points, Warning, Important, MBS Billing) are
      // rendered correctly in the approach viewer just like in medical content.
      let approachFullHtml = "";
      try {
        if (ext === "docx") {
          const rawHtml = await extractHtmlFromDocxBuffer(buffer);
          approachFullHtml = polishDocxHtml(rawHtml);
        } else {
          // PDF / DOC: convert the already-extracted raw text to HTML then run
          // the full catalog pipeline so callouts are detected and styled.
          const approachCatalogHtml = convertPlainTextToHtml(rawText);
          const approachCatalog = parseHtmlToCatalog(approachCatalogHtml, fileName);
          approachFullHtml = generateCatalogHtml(approachCatalog, system, category);
        }
        // Upload any embedded base64 images to R2 (keeps stored JSON small)
        approachFullHtml = await uploadBase64ImagesToR2(approachFullHtml);
      } catch (htmlErr) {
        console.warn("Approach fullHtml generation failed (non-fatal):", htmlErr);
      }

      return NextResponse.json({
        success: true,
        type: "approach",
        card: {
          title,
          subtitle: overview.substring(0, 120) + (overview.length > 120 ? "..." : ""),
          system,
          category,
          status: "draft",
          overview,
          steps,
          keyPoints: keyPoints.length > 0 ? keyPoints : ["Patient education & follow-up"],
          redFlags: redFlags.length > 0 ? redFlags : ["Immediate referral if red flags present"],
          references: references.length > 0 ? references : [{ id: 1, text: "GP Reference Guide" }],
          fullHtml: approachFullHtml,
        },
        fileName
      });
    }

    // ── Extract HTML and Raw Text ─────────────────────────────────────────────
    let catalogHtml = "";
    if (ext === "pdf") {
      const pdfText = await extractTextAndImagesFromPdfBuffer(buffer);
      catalogHtml = convertPlainTextToHtml(pdfText);
    } else if (ext === "doc") {
      const docText = await extractTextAndImagesFromDocBuffer(buffer);
      catalogHtml = convertPlainTextToHtml(docText);
    } else {
      // DOCX — extract full HTML via mammoth, then polish it directly.
      // Do NOT strip or re-parse it; save the complete styled HTML as fullHtml.
      const rawHtml = await extractHtmlFromDocxBuffer(buffer);
      catalogHtml = rawHtml; // used for section-split parsing below
    }

    const rawText = catalogHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Heuristic auto-detect fallback check for questions
    const hasQuestionPatterns = isQuestionBankText(rawText);

    if (hasQuestionPatterns) {
      let qRawText = "";
      if (ext === "pdf") {
        qRawText = await extractTextAndImagesFromPdfBuffer(buffer);
      } else if (ext === "doc") {
        qRawText = await extractTextAndImagesFromDocBuffer(buffer);
      } else {
        qRawText = await extractTextAndImagesFromDocxBuffer(buffer);
      }
      const questions = parseTextToQuestions(qRawText);

      // Cleanup temp file
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
        tempPath = null;
      }

      return NextResponse.json({
        success: true,
        type: "question",
        questions,
        rawTextLength: qRawText.length,
        fileName,
      });
    }

    // ── Parse SOAP fields ────────────────────────────────────────────────────
    const title = matchField(rawText, SOAP_PATTERNS.title) || inferTitle(fileName, rawText);
    const system = matchField(rawText, SOAP_PATTERNS.system) || "Respiratory";
    const category = matchField(rawText, SOAP_PATTERNS.category) || "Acute";
    
    // Parse catalog sections using HTML parser
    const catalog = parseHtmlToCatalog(catalogHtml, fileName);

    // ── Build fullHtml ────────────────────────────────────────────────────────
    // For DOCX: use polished mammoth HTML directly — preserves ALL original formatting.
    // For PDF/DOC: use the section-based catalog generator.
    let fullHtml: string;
    if (ext === "docx") {
      fullHtml = polishDocxHtml(catalogHtml);
      // Only fall back if polishing produced genuinely nothing (not just short content)
      if (!fullHtml || !fullHtml.trim()) {
        fullHtml = generateCatalogHtml(catalog, system, category);
      }
    } else {
      fullHtml = generateCatalogHtml(catalog, system, category);
    }
    
    // Map backwards-compatible fields
    const finalSymptoms = catalog.sections.clinicalFeatures.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.subjective) || matchField(rawText, SOAP_PATTERNS.symptoms) || "";
    const finalTreatment = (catalog.sections.management + "\n" + catalog.sections.diagnosis + "\n" + catalog.sections.whenToRefer + "\n" + catalog.sections.prognosis).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.plan) || matchField(rawText, SOAP_PATTERNS.treatment) || "";
    const finalNotes = (catalog.sections.overview + "\n" + catalog.sections.pathophysiology).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.assessment) || matchField(rawText, SOAP_PATTERNS.notes) || "";

    // Parse references from the resources section
    const refLines = catalog.sections.resources.match(/<li>([^<]+)<\/li>/g) || [];
    const references = refLines.map(line => line.replace(/<\/?li>/g, "").trim());

    // Upload any embedded base64 images to R2 so the stored HTML stays small.
    // Without this, a DOCX with images produces megabytes of base64 that blows
    // past Next.js's 4 MB JSON body limit and silently drops the images.
    fullHtml = await uploadBase64ImagesToR2(fullHtml);

    // Cleanup
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      tempPath = null;
    }

    return NextResponse.json({
      success: true,
      title: catalog.title || title || inferTitle(fileName, rawText),
      system,
      category,
      subjective: finalSymptoms,
      objective: matchField(rawText, SOAP_PATTERNS.objective) || catalog.sections.diagnosis.replace(/<[^>]+>/g, " ").trim(),
      assessment: finalNotes,
      plan: finalTreatment,
      symptoms: finalSymptoms,
      treatment: finalTreatment,
      notes: finalNotes,
      fullHtml,
      references: references.length > 0 ? references : ["Clinical reference handbook - Resource 1"],
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
