/**
 * PDF extraction worker script.
 * Runs as a standalone Node.js subprocess to bypass Next.js Turbopack bundler
 * issues with pdfjs-dist worker setup.
 *
 * Usage: node lib/pdf-extract-worker.js <inputPdfPath> <outputJsonPath>
 *
 * Writes a JSON file with: { pages: [{num, text}], images: [{pageNumber, dataUrl}] }
 */

// Shim globals needed by pdfjs-dist in Node.js
class DOMMatrixShim {
  constructor(init) {
    this.a = this.m11 = 1;
    this.b = this.m12 = 0;
    this.c = this.m21 = 0;
    this.d = this.m22 = 1;
    this.e = this.m41 = 0;
    this.f = this.m42 = 0;
    this.m13 = 0; this.m14 = 0;
    this.m23 = 0; this.m24 = 0;
    this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
    this.m43 = 0; this.m44 = 1;

    if (Array.isArray(init)) {
      if (init.length === 6) {
        this.a = this.m11 = init[0];
        this.b = this.m12 = init[1];
        this.c = this.m21 = init[2];
        this.d = this.m22 = init[3];
        this.e = this.m41 = init[4];
        this.f = this.m42 = init[5];
      }
    }
  }
  static fromMatrix(init) { return new DOMMatrixShim(init); }
  static fromFloat32Array(a) { return new DOMMatrixShim(Array.from(a)); }
  static fromFloat64Array(a) { return new DOMMatrixShim(Array.from(a)); }
  translate(tx = 0, ty = 0) {
    const c = new DOMMatrixShim();
    Object.assign(c, this);
    c.e = c.m41 = this.e + tx * this.a + ty * this.c;
    c.f = c.m42 = this.f + tx * this.b + ty * this.d;
    return c;
  }
  scale(sx = 1, sy = sx) {
    const c = new DOMMatrixShim();
    Object.assign(c, this);
    c.a = c.m11 = this.a * sx;
    c.b = c.m12 = this.b * sx;
    c.c = c.m21 = this.c * sy;
    c.d = c.m22 = this.d * sy;
    return c;
  }
  multiply(o) {
    const c = new DOMMatrixShim();
    c.a = c.m11 = this.a * o.a + this.c * o.b;
    c.b = c.m12 = this.b * o.a + this.d * o.b;
    c.c = c.m21 = this.a * o.c + this.c * o.d;
    c.d = c.m22 = this.b * o.c + this.d * o.d;
    c.e = c.m41 = this.a * o.e + this.c * o.f + this.e;
    c.f = c.m42 = this.b * o.e + this.d * o.f + this.f;
    return c;
  }
  inverse() {
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
  transformPoint(p) {
    return {
      x: (p.x || 0) * this.a + (p.y || 0) * this.c + this.e,
      y: (p.x || 0) * this.b + (p.y || 0) * this.d + this.f,
      z: p.z || 0, w: p.w || 1
    };
  }
  get is2D() { return true; }
  get isIdentity() { return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0; }
}

class ImageDataShim {
  constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
}

class Path2DShim {
  addPath() {} closePath() {} moveTo() {} lineTo() {}
  quadraticCurveTo() {} bezierCurveTo() {} arc() {} arcTo() {} rect() {}
}

globalThis.DOMMatrix = DOMMatrixShim;
globalThis.ImageData = ImageDataShim;
globalThis.Path2D = Path2DShim;

const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Usage: node pdf-extract-worker.js <input.pdf> <output.json>");
    process.exit(1);
  }

  const buffer = fs.readFileSync(inputPath);
  const parser = new PDFParse({ data: buffer, verbosity: 0 });

  // Extract text
  const textResult = await parser.getText();

  // Extract images (may fail, that's OK)
  let imagePages = [];
  try {
    const imageResult = await parser.getImage({ imageThreshold: 0 });
    imagePages = imageResult.pages || [];
  } catch (e) {
    console.error("Image extraction warning:", e.message);
  }

  const result = {
    pages: textResult.pages.map((p) => ({
      num: p.num,
      text: p.text || "",
    })),
    images: [],
  };

  for (const page of imagePages) {
    if (!page.images) continue;
    for (const img of page.images) {
      let dataUrl = img.dataUrl || "";
      if (!dataUrl && img.data && img.data.length > 0) {
        const bytes = Buffer.from(img.data);
        let mime = "image/png";
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) mime = "image/jpeg";
        else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) mime = "image/gif";
        dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
      }
      // Filter out small decorative icons (< 4000 chars)
      if (dataUrl && dataUrl.length >= 4000) {
        result.images.push({
          pageNumber: page.pageNumber,
          dataUrl: dataUrl,
        });
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(result));
  console.log("OK");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
