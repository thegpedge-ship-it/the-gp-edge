import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";
import mammoth from "mammoth";

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
 * Extract plain text from a DOCX buffer using mammoth.
 */
async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim() || extractTextFromPdfBuffer(buffer);
  } catch (error) {
    console.error("Mammoth text extraction failed:", error);
    return extractTextFromPdfBuffer(buffer);
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
    
    // Replace inline images with image tags, clean up other html tags
    return result.value
      .replace(/<img[^>]+src=["'](data:[^"']+)["'][^>]*>/g, "\n[IMAGE: $1]\n")
      .replace(/<[^>]+>/g, "\n")
      .trim();
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
  
  // Split by Question followed by number, e.g. "Question 1:", "Question 1.", "Question 1 "
  const blocks = normalizedText.split(/Question\s+\d+[:.]?/i);
  
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;
    
    const lines = block.split("\n").map(l => l.trim());
    let questionTextLines: string[] = [];
    const options: string[] = [];
    let correctIndex = 0;
    let rationale = "";
    let topic = "General";
    let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
    let subtopic = "";
    let tags: string[] = [];
    let image: string | undefined = undefined;
    
    let parsingOptions = false;
    let parsingRationale = false;
    
    for (let j = 0; j < lines.length; j++) {
      let line = lines[j];
      if (!line) continue;
      
      const lowerLine = line.toLowerCase();
      
      // Check for image placeholder syntax
      if (line.startsWith("[IMAGE:") && line.endsWith("]")) {
        image = line.substring(7, line.length - 1).trim();
        continue;
      }
      
      // Check for metadata keys
      if (lowerLine.startsWith("correct answer:") || lowerLine.startsWith("correct:") || lowerLine.startsWith("answer:")) {
        let ansVal = line.replace(/^(correct answer|correct|answer)[:\s]+/i, "").trim();
        if (ansVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:") && !nextLower.startsWith("rationale:") && !nextLower.startsWith("explanation:")) {
              ansVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        const ansChar = ansVal.toUpperCase();
        if (ansChar.length > 0) {
          // Find the first alphabetical character in the answer string (e.g. A, B, C, D, E, F, G, H)
          const match = ansChar.match(/[A-H]/);
          if (match) {
            correctIndex = match[0].charCodeAt(0) - 65; // A -> 0, B -> 1, etc.
          }
          if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 10) {
            correctIndex = 0;
          }
        }
        parsingOptions = false;
        parsingRationale = false;
        continue;
      }
      
      if (lowerLine.startsWith("topic:") || lowerLine.startsWith("category:")) {
        let topicVal = line.replace(/^(topic|category)[:\s]+/i, "").trim();
        if (topicVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:") && !nextLower.startsWith("rationale:") && !nextLower.startsWith("explanation:")) {
              topicVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        topic = topicVal || "General";
        parsingOptions = false;
        parsingRationale = false;
        continue;
      }
      
      if (lowerLine.startsWith("subtopic:")) {
        let subtopicVal = line.replace(/^subtopic[:\s]+/i, "").trim();
        if (subtopicVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:") && !nextLower.startsWith("rationale:") && !nextLower.startsWith("explanation:")) {
              subtopicVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        subtopic = subtopicVal;
        parsingOptions = false;
        parsingRationale = false;
        continue;
      }
      
      if (lowerLine.startsWith("difficulty:")) {
        let diffVal = line.replace(/^difficulty[:\s]+/i, "").trim();
        if (diffVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:") && !nextLower.startsWith("rationale:") && !nextLower.startsWith("explanation:")) {
              diffVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        const diff = diffVal.toLowerCase();
        if (diff.includes("easy")) difficulty = "Easy";
        else if (diff.includes("hard")) difficulty = "Hard";
        else difficulty = "Medium";
        parsingOptions = false;
        parsingRationale = false;
        continue;
      }
      
      if (lowerLine.startsWith("tags:")) {
        let tagsVal = line.replace(/^tags[:\s]+/i, "").trim();
        if (tagsVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:") && !nextLower.startsWith("rationale:") && !nextLower.startsWith("explanation:")) {
              tagsVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        tags = tagsVal.split(",").map(t => t.trim()).filter(Boolean);
        parsingOptions = false;
        parsingRationale = false;
        continue;
      }
      
      if (lowerLine.startsWith("rationale:") || lowerLine.startsWith("high-yield rationale:") || lowerLine.startsWith("explanation:")) {
        let ratVal = line.replace(/^(rationale|high-yield rationale|explanation)[:\s]+/i, "").trim();
        if (ratVal === "" && j + 1 < lines.length) {
          let nextIdx = j + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            const nextLower = lines[nextIdx].trim().toLowerCase();
            if (!nextLower.startsWith("difficulty:") && !nextLower.startsWith("topic:") && !nextLower.startsWith("subtopic:") && !nextLower.startsWith("tags:") && !nextLower.startsWith("correct") && !nextLower.startsWith("answer:")) {
              ratVal = lines[nextIdx].trim();
              j = nextIdx;
            }
          }
        }
        rationale = ratVal;
        parsingOptions = false;
        parsingRationale = true;
        continue;
      }
      
      if (lowerLine === "options:") {
        parsingOptions = true;
        parsingRationale = false;
        continue;
      }
      
      // Check for option line e.g., A) Option text or A. Option text
      const optionMatch = line.match(/^([A-H])[\.\)\-]\s*(.*)$/i);
      if (optionMatch) {
        const letter = optionMatch[1].toUpperCase();
        const idx = letter.charCodeAt(0) - 65;
        options[idx] = optionMatch[2].trim();
        parsingOptions = true;
        parsingRationale = false;
        continue;
      }
      
      // Continue parsing rationale if flag is active
      if (parsingRationale) {
        rationale += "\n" + line;
        continue;
      }
      
      // Continue parsing options if flag is active (multi-line option text)
      if (parsingOptions && options.length > 0) {
        const lastIdx = options.length - 1;
        options[lastIdx] += " " + line;
        continue;
      }
      
      // Otherwise it is part of the question text
      questionTextLines.push(line);
    }
    
    const finalQuestionText = questionTextLines.join("\n").trim();
    
    // Skip empty placeholder question templates
    if (finalQuestionText.includes("[Enter question text here]") || finalQuestionText === "") {
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
        rawText = extractTextFromPdfBuffer(buffer);
      } else {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value.trim() || extractTextFromPdfBuffer(buffer);
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
        rawText = extractTextFromPdfBuffer(buffer);
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
      const pdfText = extractTextFromPdfBuffer(buffer);
      catalogHtml = convertPlainTextToHtml(pdfText);
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
        qRawText = extractTextFromPdfBuffer(buffer);
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
