import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { execFileSync } from "child_process";

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
      const markerRegex = /\n\s*(?:Options:|Correct Answer:|Correct:|Answer:|[A-H][\.\)\-]\s+|Topic:|Category:|Subtopic:|Difficulty:|Tags:|Rationale:|High-Yield Rationale:|Explanation:)/i;
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
  const markerRegex = /\n\s*(?:Options:|Correct Answer:|Correct:|Answer:|[A-H][\.\)\-]\s+|Topic:|Category:|Subtopic:|Difficulty:|Tags:|Rationale:|High-Yield Rationale:|Explanation:)/i;
  const match = blockText.match(markerRegex);
  if (match && match.index !== undefined) {
    const idx = match.index;
    return blockText.substring(0, idx).trim() + `\n[IMAGE: ${dataUrl}]\n` + blockText.substring(idx);
  }
  return blockText.trim() + `\n[IMAGE: ${dataUrl}]\n`;
}

/**
 * Checks if a line is a metadata tag.
 */
function isMetadataLine(line: string): boolean {
  const clean = line.trim().toLowerCase();
  return (
    /^(?:correct\s*answer|correct\s*option|correct|answer)\s*[:\-]?/i.test(clean) ||
    /^(?:topic|category)\s*[:\-]?/i.test(clean) ||
    /^subtopic\s*[:\-]?/i.test(clean) ||
    /^difficulty\s*[:\-]?/i.test(clean) ||
    /^tags\s*[:\-]?/i.test(clean) ||
    /^(?:rationale|high\s*-?\s*yield\s*rationale|explanation)\s*[:\-]?/i.test(clean)
  );
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
      const combinedText = subResult.pages.map((p) => p.text || "").join("\n\n").trim();
      if (combinedText.length > 20) {
        // Collect images from subprocess
        let allImageUrls = subResult.images.map((img) => img.dataUrl);

        // If subprocess found no images, carve from binary
        if (allImageUrls.length === 0) {
          allImageUrls = getCarvedImages();
        }

        console.log(`PDF extracted via subprocess: ${subResult.pages.length} pages, ${allImageUrls.length} images`);

        if (allImageUrls.length > 0) {
          return associateImagesWithText(combinedText, allImageUrls);
        }
        return combinedText;
      }
    }
  } catch (e: any) {
    console.error("Subprocess PDF extraction failed:", e.message);
  }

  // ── Strategy 2: In-process PDFParse ──
  try {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const textResult = await parser.getText();
    const imageResult = await parser.getImage({ imageThreshold: 0 });

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
        return associateImagesWithText(combinedText, allImageUrls);
      }
      return combinedText;
    }
  } catch (error) {
    console.error("PDFParse image & text extraction failed:", error);
  }

  // ── Strategy 3: Text-only extraction + image carving ──
  try {
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const textResult = await parser.getText();
    const text = textResult.text || "";
    if (text.trim().length > 20) {
      const images = getCarvedImages();
      if (images.length > 0) {
        return associateImagesWithText(text, images);
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
  try {
    const result = await mammoth.convertToHtml({ buffer }, {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
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

function convertPlainTextToHtml(text: string): string {
  const lines = text.split("\n").map(l => l.trim());
  let html = "";
  
  for (const line of lines) {
    if (!line) continue;
    
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
      
    if (isHeader) {
      html += `<h2>${line}</h2>\n`;
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
  
  let marked = html;
  
  for (const sec of sections) {
    const pattern = new RegExp(
      `<(h[1-6]|p)[^>]*>([\\s\\S]*?)(?:\\b${sec.regex.source}\\b)([\\s\\S]*?)<\\/\\1>`,
      "gi"
    );
    
    marked = marked.replace(pattern, (match: string, tag: string, before: string, after: string) => {
      const plainBefore = before.replace(/<[^>]+>/g, "").trim();
      const plainAfter = after.replace(/<[^>]+>/g, "").trim();
      
      if (plainBefore.length + plainAfter.length < 10) {
        return `[SECTION_SPLIT: ${sec.key}]`;
      }
      return match;
    });
  }
  
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
        let icon = "ℹ️";
        
        if (
          plainText.includes("red flag") || 
          plainText.includes("contraindication") || 
          plainText.includes("danger") || 
          plainText.includes("critical") ||
          plainText.includes("alert") ||
          plainText.includes("urgently")
        ) {
          variant = "danger";
          bg = "#fff5f5";
          border = "#c53030";
          titleColor = "#c53030";
          color = "#9b2c2c";
          label = "Red Flags";
          icon = "⚠️";
        } else if (
          plainText.includes("important") || 
          plainText.includes("warning") || 
          plainText.includes("caution") || 
          plainText.includes("urgent") || 
          plainText.includes("attention")
        ) {
          variant = "warning";
          bg = "#fff9e6";
          border = "#dd6b20";
          titleColor = "#dd6b20";
          color = "#7b341e";
          label = "Important";
          icon = "⚡";
        } else if (
          plainText.includes("key point") || 
          plainText.includes("pearl") || 
          plainText.includes("clinical pearl")
        ) {
          variant = "pearl";
          bg = "#e6f7f4";
          border = "#2bb09c";
          titleColor = "#2bb09c";
          color = "#1a5c51";
          label = "Key Points";
          icon = "☑";
        } else if (
          plainText.includes("billing") || 
          plainText.includes("mbs")
        ) {
          variant = "billing";
          bg = "#f8fafc";
          border = "#64748b";
          titleColor = "#475569";
          color = "#334155";
          label = "Billing";
          icon = "📋";
        }
        
        let headerText = label;
        let bodyHtml = "";
        
        const firstCellPlain = cellContents[0].replace(/<[^>]+>/g, "").trim();
        if (cellContents.length > 1 && firstCellPlain.length < 80) {
          headerText = firstCellPlain;
          if (headerText.endsWith(":")) {
            headerText = headerText.substring(0, headerText.length - 1).trim();
          }
          bodyHtml = cellContents.slice(1).join("\n");
        } else {
          bodyHtml = cellContents.join("\n");
        }
        
        return `
          <div class="callout-block" data-variant="${variant}" style="background-color: ${bg}; border: 1px solid ${bg}; border-left: 5px solid ${border}; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; color: ${color};">
            <div style="font-weight: bold; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem; color: ${titleColor};">${icon} ${headerText}</div>
            <div style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem; line-height: 1.6;">${bodyHtml}</div>
          </div>
        `;
      }
    }
    return tableMatch;
  });
}

function styleHtmlTables(html: string): string {
  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match: string, tableBody: string) => {
    let styledBody = tableBody;
    
    // Style headers
    styledBody = styledBody.replace(/<th[^>]*>([\s\S]*?)<\/th>/gi, (m: string, cellContent: string) => {
      return `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #2bb09c; border: 1px solid #cbd5e1; color: #ffffff;">${cellContent.trim()}</th>`;
    });
    
    if (!tableBody.toLowerCase().includes("<th")) {
      let isFirstRow = true;
      styledBody = styledBody.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (trMatch: string, trContent: string) => {
        if (isFirstRow) {
          isFirstRow = false;
          const headerContent = trContent.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (tdMatch: string, tdContent: string) => {
            return `<th style="text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; background-color: #2bb09c; border: 1px solid #cbd5e1; color: #ffffff;">${tdContent.trim()}</th>`;
          });
          return `<tr>${headerContent}</tr>`;
        }
        return trMatch;
      });
    }
    
    let rowIndex = 0;
    styledBody = styledBody.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (trMatch: string, trContent: string) => {
      if (trContent.toLowerCase().includes("<th")) {
        return trMatch;
      }
      
      const bg = rowIndex % 2 === 1 ? "#f8fafc" : "#ffffff";
      rowIndex++;
      
      let cellIndex = 0;
      const styledCells = trContent.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (tdMatch: string, tdContent: string) => {
        const color = cellIndex === 0 ? "#0f172a" : "#475569";
        cellIndex++;
        return `<td style="padding: 0.75rem 1rem; font-size: 0.825rem; border: 1px solid #e2e8f0; background-color: ${bg}; color: ${color};">${tdContent.trim()}</td>`;
      });
      
      return `<tr>${styledCells}</tr>`;
    });
    
    return `
      <div style="overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 0.75rem; margin-bottom: 1.25rem; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          ${styledBody}
        </table>
      </div>
    `;
  });
}

function styleHtmlImages(html: string): string {
  return html.replace(/<img([^>]*?)>/gi, (match: string, attributes: string) => {
    if (attributes.includes("style=")) {
      return match;
    }
    return `<img style="border-radius: 0.75rem; max-width: 100%; height: auto; display: block; margin: 1.25rem auto;" ${attributes}>`;
  });
}

function formatSectionHtml(html: string): string {
  if (!html) return "";
  
  let formatted = html;
  formatted = styleHtmlCallouts(formatted);
  formatted = styleHtmlTables(formatted);
  formatted = styleHtmlImages(formatted);
  
  formatted = formatted.replace(/<p[^>]*>/gi, '<p style="font-family: \'DM Sans\', sans-serif; font-size: 0.875rem; color: #334155; line-height: 1.7; margin-bottom: 1rem;">');
  formatted = formatted.replace(/<ul[^>]*>/gi, '<ul style="list-style-type: disc; padding-left: 1.25rem; font-family: \'DM Sans\', sans-serif; margin-bottom: 1rem;">');
  formatted = formatted.replace(/<ol[^>]*>/gi, '<ol style="list-style-type: decimal; padding-left: 1.25rem; font-family: \'DM Sans\', sans-serif; margin-bottom: 1rem;">');
  formatted = formatted.replace(/<li[^>]*>/gi, '<li style="margin-bottom: 0.375rem; font-size: 0.875rem; color: #334155;">');
  
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
  
  let overviewContent = sectionsMap.OVERVIEW;
  if (cleanHeaderHtml) {
    overviewContent = cleanHeaderHtml + "\n" + overviewContent;
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
  
  const firstOverviewP = sectionsMap.OVERVIEW.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
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

// ── Question Extractor and Parser ──────────────────────────────────────────────

async function extractTextAndImagesFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ buffer }, {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    
    let html = result.value;
    
    // Replace inline formatting tags with empty string to prevent splitting keys from values (e.g. <strong>Difficulty: </strong>Easy)
    let cleaned = html.replace(/<\/?(strong|b|em|i|u|span|a)\b[^>]*>/gi, "");
    
    // Replace inline images with image tags
    cleaned = cleaned.replace(/<img\s+[^>]*src=["'](data:[^"']+)["'][^>]*>/gi, "\n[IMAGE: $1]\n");
    
    // Replace remaining block tags with newlines
    cleaned = cleaned.replace(/<[^>]+>/g, "\n");
    
    return cleaned.trim();
  } catch (error) {
    console.error("Mammoth HTML conversion failed:", error);
    const textResult = await mammoth.extractRawText({ buffer });
    return textResult.value.trim();
  }
}

function parseTextToQuestions(text: string): any[] {
  const questions: any[] = [];
  
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Extract and replace all [IMAGE: ...] tags with placeholders to prevent
  // base64 image data (which frequently contains 'Q' + digits or numeric sequences)
  // from triggering false split points in the regex.
  const imageUrls: string[] = [];
  const textWithPlaceholders = normalizedText.replace(/\[IMAGE:\s*([^\]]+)\]/gi, (match, url) => {
    imageUrls.push(url.trim());
    return `[IMAGE_PLACEHOLDER_${imageUrls.length - 1}]`;
  });
  
  // Split by Question/Q followed by number
  let blocks = textWithPlaceholders.split(/\b(?:Question|Q)\s*\d+[:.]?/i);
  if (blocks.length <= 1) {
    // Fallback: split by numeric lines (e.g. "\n1. " or "\n1) ")
    blocks = textWithPlaceholders.split(/(?:\n|^)\s*\d+[\.\)]\s+/);
  }
  
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    
    // Find the placeholder tag if any and map it back to the original image data URL/URL
    let image: string | undefined = undefined;
    const placeholderMatch = block.match(/\[IMAGE_PLACEHOLDER_(\d+)\]/i);
    if (placeholderMatch) {
      const imgIdx = parseInt(placeholderMatch[1]);
      if (imgIdx >= 0 && imgIdx < imageUrls.length) {
        const matchedImage = imageUrls[imgIdx];
        // Only keep the image if it is not a tiny decorative icon (e.g. data URL length >= 4000 or filename)
        let isDecorative = false;
        if (matchedImage.startsWith("data:") && matchedImage.length < 4000) {
          isDecorative = true;
        }
        if (!isDecorative) {
          image = matchedImage;
          // Normalize relative static paths to prevent browser 404s relative to admin route
          if (!image.startsWith("data:") && !image.startsWith("/")) {
            if (image.startsWith("assets/")) {
              image = "/" + image;
            } else {
              image = "/assets/" + image;
            }
          }
        }
      }
    }

    // Remove all [IMAGE_PLACEHOLDER_N] tags from the block text
    const cleanedBlock = block.replace(/\[IMAGE_PLACEHOLDER_\d+\]/gi, "").trim();
    
    const lines = cleanedBlock.split("\n").map(l => l.trim());
    // Safety: filter out any lines that are raw base64 data (no spaces, 90%+ base64 chars)
    const filteredLines = lines.filter(l => !looksLikeBase64OrBinary(l));
    let questionTextLines: string[] = [];
    const options: string[] = [];
    let correctIndex = 0;
    let rationale = "";
    let topic = "General";
    let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
    let subtopic = "";
    let tags: string[] = [];
    
    let parsingState: "question" | "options" | "metadata" = "question";
    let parsingRationale = false;
    
    for (let j = 0; j < filteredLines.length; j++) {
      let line = filteredLines[j];
      if (!line) continue;
      
      const lowerLine = line.toLowerCase();
      
      // State Machine Transitions and parsing:
      
      // 1. Question Text state: check for transition to options
      if (parsingState === "question") {
        if (lowerLine === "options:" || line.match(/^A[\.\)\-]\s+/i)) {
          parsingState = "options";
          if (lowerLine === "options:") {
            continue;
          }
        } else {
          questionTextLines.push(line);
          continue;
        }
      }
      
      // 2. Metadata Matches (only checked once we leave the question text state)
      // Check for Correct Answer
      const correctMatch = line.match(/^(?:correct\s*answer|correct\s*option|correct|answer)\s*[:\-]\s*(.*)$/i);
      if (correctMatch) {
        parsingState = "metadata";
        parsingRationale = false;
        let ansVal = correctMatch[1].trim();
        if (ansVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine)) {
              ansVal = nextLine;
              j = nextIdx;
            }
          }
        }
        const ansChar = ansVal.toUpperCase();
        if (ansChar.length > 0) {
          const match = ansChar.match(/[A-H]/);
          if (match) {
            correctIndex = match[0].charCodeAt(0) - 65; // A -> 0, B -> 1, etc.
          }
          if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 10) {
            correctIndex = 0;
          }
        }
        continue;
      }
      
      // Check for Topic
      const topicMatch = line.match(/^(?:topic|category)\s*[:\-]\s*(.*)$/i);
      if (topicMatch) {
        parsingState = "metadata";
        parsingRationale = false;
        let topicVal = topicMatch[1].trim();
        if (topicVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine)) {
              topicVal = nextLine;
              j = nextIdx;
            }
          }
        }
        topic = topicVal || "General";
        continue;
      }
      
      // Check for Subtopic
      const subtopicMatch = line.match(/^subtopic\s*[:\-]\s*(.*)$/i);
      if (subtopicMatch) {
        parsingState = "metadata";
        parsingRationale = false;
        let subtopicVal = subtopicMatch[1].trim();
        if (subtopicVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine)) {
              subtopicVal = nextLine;
              j = nextIdx;
            }
          }
        }
        subtopic = subtopicVal;
        continue;
      }
      
      // Check for Difficulty
      const difficultyMatch = line.match(/^difficulty\s*[:\-]\s*(.*)$/i);
      if (difficultyMatch) {
        parsingState = "metadata";
        parsingRationale = false;
        let diffVal = difficultyMatch[1].trim();
        if (diffVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine)) {
              diffVal = nextLine;
              j = nextIdx;
            }
          }
        }
        const diff = diffVal.toLowerCase();
        if (diff.includes("easy")) difficulty = "Easy";
        else if (diff.includes("hard")) difficulty = "Hard";
        else difficulty = "Medium";
        continue;
      }
      
      // Check for Tags
      const tagsMatch = line.match(/^tags\s*[:\-]\s*(.*)$/i);
      if (tagsMatch) {
        parsingState = "metadata";
        parsingRationale = false;
        let tagsVal = tagsMatch[1].trim();
        if (tagsVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine)) {
              tagsVal = nextLine;
              j = nextIdx;
            }
          }
        }
        tags = tagsVal.split(",").map(t => t.trim()).filter(Boolean);
        continue;
      }
      
      // Check for Rationale
      const rationaleMatch = line.match(/^(?:rationale|high-yield\s*rationale|explanation)\s*[:\-]\s*(.*)$/i);
      if (rationaleMatch) {
        parsingState = "metadata";
        parsingRationale = true;
        let ratVal = rationaleMatch[1].trim();
        if (ratVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx].trim();
            if (!isMetadataLine(nextLine) && !nextLine.match(/^([A-H])[\.\)\-]/i)) {
              ratVal = nextLine;
              j = nextIdx;
            }
          }
        }
        rationale = ratVal;
        continue;
      }
      
      // 3. Option parsing state
      if (parsingState === "options") {
        const optionMatch = line.match(/^([A-H])[\.\)\-]\s*(.*)$/i);
        if (optionMatch) {
          const letter = optionMatch[1].toUpperCase();
          const idx = letter.charCodeAt(0) - 65;
          options[idx] = optionMatch[2].trim();
        } else if (options.length > 0) {
          // Multi-line option text
          const lastIdx = options.length - 1;
          options[lastIdx] += " " + line;
        }
        continue;
      }
      
      // 4. Metadata state (rationale accumulation)
      if (parsingState === "metadata" && parsingRationale) {
        rationale += "\n" + line;
        continue;
      }
    }
    
    const finalQuestionText = questionTextLines.join("\n").trim();
    
    // Skip empty placeholder question templates
    if (finalQuestionText.includes("[Enter question text here]") || finalQuestionText === "") {
      continue;
    }
    
    // Skip false-positive blocks that don't have any parsed options (e.g. lists inside rationales)
    if (options.length === 0) {
      continue;
    }
    
    // Default to A, B, C, D options if fewer options parsed
    const finalOptions = [];
    const numOptions = Math.max(4, options.length);
    for (let k = 0; k < numOptions; k++) {
      finalOptions.push(options[k] || `Option ${String.fromCharCode(65 + k)}`);
    }
    
    questions.push({
      text: finalQuestionText || "Practice Question Placeholder",
      options: finalOptions,
      correctIndex,
      rationale: rationale.trim() || "No explanation provided.",
      topic,
      subtopic,
      difficulty,
      tags: tags.length > 0 ? tags : ["General"],
      image
    });
  }
  
  return questions;
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

    // Determine if this is an autofill template upload
    const isAutofillType = type === "autofill";

    if (isAutofillType) {
      let rawText = "";
      if (ext === "pdf") {
        rawText = await extractTextFromPdfBuffer(buffer);
      } else if (ext === "doc") {
        rawText = await extractTextAndImagesFromDocBuffer(buffer);
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

      return NextResponse.json({
        success: true,
        type: "autofill",
        title: title,
        system: "General",
        category: "General",
        content: rawText,
        subjective: "",
        objective: "",
        assessment: rawText, // backward compatibility
        plan: "",
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
      } else {
        rawText = await extractTextAndImagesFromDocxBuffer(buffer);
      }
      
      const questions = parseTextToQuestions(rawText);

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

    // ── Extract HTML and Raw Text ─────────────────────────────────────────────
    let catalogHtml = "";
    if (ext === "pdf") {
      const pdfText = await extractTextFromPdfBuffer(buffer);
      catalogHtml = convertPlainTextToHtml(pdfText);
    } else if (ext === "doc") {
      const docText = await extractTextAndImagesFromDocBuffer(buffer);
      catalogHtml = convertPlainTextToHtml(docText);
    } else {
      catalogHtml = await extractHtmlFromDocxBuffer(buffer);
    }

    const rawText = catalogHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Heuristic auto-detect fallback check for questions
    const hasQuestionPatterns = 
      rawText.substring(0, 1500).toLowerCase().includes("question 1") && 
      (rawText.toLowerCase().includes("correct answer") || rawText.toLowerCase().includes("rationale"));

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
    const fullHtml = generateCatalogHtml(catalog, system, category);
    
    // Map backwards-compatible fields
    const finalSymptoms = catalog.sections.clinicalFeatures.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.subjective) || matchField(rawText, SOAP_PATTERNS.symptoms) || "";
    const finalTreatment = (catalog.sections.management + "\n" + catalog.sections.diagnosis + "\n" + catalog.sections.whenToRefer + "\n" + catalog.sections.prognosis).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.plan) || matchField(rawText, SOAP_PATTERNS.treatment) || "";
    const finalNotes = (catalog.sections.overview + "\n" + catalog.sections.pathophysiology).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || matchField(rawText, SOAP_PATTERNS.assessment) || matchField(rawText, SOAP_PATTERNS.notes) || "";

    // Parse references from the resources section
    const refLines = catalog.sections.resources.match(/<li>([^<]+)<\/li>/g) || [];
    const references = refLines.map(line => line.replace(/<\/?li>/g, "").trim());

    // Cleanup
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      tempPath = null;
    }

    return NextResponse.json({
      success: true,
      title: catalog.title || title || "Extracted Template",
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
