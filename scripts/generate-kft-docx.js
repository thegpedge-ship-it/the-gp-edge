const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join(__dirname, 'temp_kfp_docx');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', 'theme'), { recursive: true });

// [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

// _rels/.rels
const dotRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

// word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

// word/theme/theme1.xml
const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GPEdgeTheme">
  <a:themeElements>
    <a:clrScheme name="GPEdge">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="334155"/></a:dk2>
      <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
      <a:accent1><a:srgbClr val="0D9488"/></a:accent1>
      <a:accent2><a:srgbClr val="0284C7"/></a:accent2>
      <a:accent3><a:srgbClr val="D97706"/></a:accent3>
      <a:accent4><a:srgbClr val="10B981"/></a:accent4>
      <a:accent5><a:srgbClr val="6366F1"/></a:accent5>
      <a:accent6><a:srgbClr val="EC4899"/></a:accent6>
      <a:hlink><a:srgbClr val="0D9488"/></a:hlink>
      <a:folHlink><a:srgbClr val="0F766E"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="GPEdgeFonts">
      <a:majorFont><a:latin typeface="Segoe UI Semibold"/></a:majorFont>
      <a:minorFont><a:latin typeface="Segoe UI"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="GPEdgeFormat">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

// word/styles.xml
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Segoe UI"/>
        <w:sz w:val="21"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:before="0" w:after="120"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;

// word/document.xml
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>

    <!-- TITLE / HEADER -->
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="24" w:space="8" w:color="0D9488"/>
        </w:pBdr>
        <w:spacing w:before="120" w:after="240"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="0D9488"/>
        </w:rPr>
        <w:t>GP EDGE</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="160"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>Key Feature Problem (KFP) Question Authoring Template</w:t>
      </w:r>
    </w:p>

    <!-- INSTRUCTIONS BOX -->
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:top w:val="single" w:sz="18" w:space="8" w:color="0D9488"/>
          <w:left w:val="single" w:sz="18" w:space="12" w:color="0D9488"/>
          <w:bottom w:val="single" w:sz="18" w:space="8" w:color="0D9488"/>
          <w:right w:val="single" w:sz="18" w:space="12" w:color="0D9488"/>
        </w:pBdr>
        <w:shd w:val="clear" w:color="auto" w:fill="F0FDFA"/>
        <w:spacing w:before="120" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="22"/></w:rPr>
        <w:t>INSTRUCTIONS FOR QUESTION AUTHORS:</w:t>
      </w:r>
      <w:r><w:br/></w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>• Replace all bracketed text [Enter ...] below with your clinical question content.</w:t>
      </w:r>
      <w:r><w:br/></w:r>
      <w:r>
        <w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>• Duplicate the Question block below for each new question.</w:t>
      </w:r>
    </w:p>

    <!-- QUESTION 1 -->
    <w:p><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0D9488"/></w:rPr><w:t>Question 1:</w:t></w:r></w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Exam Type: </w:t></w:r>
      <w:r><w:t>KFP</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Topic: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter primary topic, e.g. Cardiology / Respiratory / Paediatrics / Mental Health / Dermatology]</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Subtopic: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter subtopic / condition, e.g. Acute Coronary Syndrome / Asthma / Heart Failure]</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Difficulty: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter difficulty: Easy / Medium / Hard]</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Tags: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter comma-separated tags, e.g. KFP, Cardiovascular, Acute Care]</w:t></w:r>
    </w:p>

    <!-- ZONE 1: STEM & LEAD-IN -->
    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Stem:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:color w:val="334155"/></w:rPr><w:t>[Enter detailed clinical case presentation / scenario here. Include patient age, presentation, history, physical exam findings, and preliminary investigations.]</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Lead-in:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:color w:val="334155"/></w:rPr><w:t>[Enter specific instructional question, e.g. Which THREE (3) of the following initial investigations are most appropriate?]</w:t></w:r>
    </w:p>

    <!-- ZONE 2: OPTIONS -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Options:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>A. </w:t></w:r><w:r><w:t>[Option A]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>B. </w:t></w:r><w:r><w:t>[Option B]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>C. </w:t></w:r><w:r><w:t>[Option C]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>D. </w:t></w:r><w:r><w:t>[Option D]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>E. </w:t></w:r><w:r><w:t>[Option E]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>F. </w:t></w:r><w:r><w:t>[Option F]</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Correct Answers: </w:t></w:r>
      <w:r><w:rPr><w:color w:val="0D9488"/><w:b/></w:rPr><w:t>A, C, E</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="40" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Limit: </w:t></w:r>
      <w:r><w:t>3</w:t></w:r>
    </w:p>

    <!-- ZONE 3: EXPLANATIONS -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Why Correct:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:color w:val="334155"/></w:rPr><w:t>[Explain in detail why the keyed answers are correct and cite evidence-based RACGP / ACRRM guidelines.]</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Distractor Rationales:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>A: </w:t></w:r><w:r><w:t>[Why A is correct]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>B: </w:t></w:r><w:r><w:t>[Why B is incorrect]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>C: </w:t></w:r><w:r><w:t>[Why C is correct]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>D: </w:t></w:r><w:r><w:t>[Why D is incorrect]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>E: </w:t></w:r><w:r><w:t>[Why E is correct]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>F: </w:t></w:r><w:r><w:t>[Why F is incorrect]</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Knowledge Bank:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:color w:val="334155"/></w:rPr><w:t>[Comprehensive background overview, diagnostic algorithms, treatment criteria, guideline references.]</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Clinical Pearl:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="0" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:color w:val="0D9488"/><w:i/></w:rPr><w:t>[One-sentence high-yield clinical takeaway / exam tip]</w:t></w:r>
    </w:p>

    <!-- HORIZONTAL DIVIDER -->
    <w:p>
      <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="6" w:color="CBD5E1"/></w:pBdr></w:pPr>
    </w:p>

    <!-- QUESTION 2 -->
    <w:p><w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0D9488"/></w:rPr><w:t>Question 2:</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Exam Type: </w:t></w:r><w:r><w:t>KFP</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Topic: </w:t></w:r><w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter primary topic]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Subtopic: </w:t></w:r><w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter subtopic]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Difficulty: </w:t></w:r><w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter difficulty]</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Tags: </w:t></w:r><w:r><w:rPr><w:color w:val="64748B"/><w:i/></w:rPr><w:t>[Enter tags]</w:t></w:r></w:p>

  </w:body>
</w:document>`;

fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml);
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), dotRelsXml);
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml);
fs.writeFileSync(path.join(tempDir, 'word', 'theme', 'theme1.xml'), themeXml);
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), stylesXml);
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), documentXml);

const outputPath = path.join(__dirname, '..', 'public', 'templates', 'kfp_template.docx');
const legacyPath = path.join(__dirname, '..', 'public', 'templates', 'kft_template.docx');

try {
  execSync(`pwsh -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${outputPath}' -Force"`);
  fs.copyFileSync(outputPath, legacyPath);
  console.log('Successfully regenerated KFP placeholder template:', outputPath, 'Size:', fs.statSync(outputPath).size);
} catch (e) {
  console.error('Failed to create DOCX:', e);
} finally {
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
}
