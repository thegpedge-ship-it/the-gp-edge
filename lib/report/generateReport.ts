/* Client-side PDF report generator.

   Builds the full test report entirely in the browser with jsPDF — a stats
   analysis page (score, tiles, and charts) followed by a question-by-question
   review with the candidate's answer, the correct answer, and the explanation.
   Nothing is uploaded; the caller stores the returned Blob in IndexedDB and/or
   triggers a download. */

import type { ReportData } from "./types";
import { donutChart, groupedBarChart, horizontalBarChart } from "./charts";

/* RGB palette (jsPDF setColor takes r,g,b). */
const C = {
  emerald: [5, 150, 105] as const,
  emeraldDark: [4, 120, 87] as const,
  red: [239, 68, 68] as const,
  amber: [217, 119, 6] as const,
  green: [22, 163, 74] as const,
  slate800: [30, 41, 59] as const,
  slate700: [51, 65, 85] as const,
  slate500: [100, 116, 139] as const,
  slate400: [148, 163, 184] as const,
  slate200: [226, 232, 240] as const,
  slate100: [241, 245, 249] as const,
  emeraldBg: [236, 253, 245] as const,
  redBg: [254, 242, 242] as const,
  white: [255, 255, 255] as const,
};

const PAGE = { w: 595.28, h: 841.89, margin: 40 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;
const BOTTOM = PAGE.h - PAGE.margin;

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Aggregate correct/total counts keyed by a field of each question. */
function aggregate(data: ReportData, key: "topic" | "difficulty") {
  const map = new Map<string, { correct: number; total: number }>();
  for (const q of data.questions) {
    const k = q[key] || "General";
    const entry = map.get(k) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (q.selectedIndex === q.correctIndex) entry.correct += 1;
    map.set(k, entry);
  }
  return map;
}

export async function generateReportBlob(data: ReportData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const setFill = (c: readonly number[]) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);

  let y = PAGE.margin;

  /* ── Page 1 — header band ───────────────────────────────────────────── */
  setFill(C.emerald);
  doc.rect(0, 0, PAGE.w, 96, "F");
  setFill(C.emeraldDark);
  doc.rect(0, 96, PAGE.w, 3, "F");

  setText(C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PERFORMANCE REPORT", PAGE.margin, 34);
  doc.setFontSize(18);
  const nameLines = doc.splitTextToSize(data.testName, CONTENT_W - 120);
  doc.text(nameLines.slice(0, 2), PAGE.margin, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.dateLabel, PAGE.margin, 80);

  // score badge on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(`${data.scorePercent}%`, PAGE.w - PAGE.margin, 52, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("SCORE", PAGE.w - PAGE.margin, 68, { align: "right" });

  y = 120;

  /* ── Summary tiles ──────────────────────────────────────────────────── */
  const tiles: { label: string; value: string; color: readonly number[] }[] = [
    { label: "TOTAL", value: String(data.total), color: C.slate700 },
    { label: "CORRECT", value: String(data.correct), color: C.green },
    { label: "INCORRECT", value: String(data.incorrect), color: C.red },
    { label: "UNATTEMPTED", value: String(data.unattempted), color: C.slate500 },
    { label: "ACCURACY", value: `${data.accuracyPercent}%`, color: C.emerald },
    { label: "TIME USED", value: fmtTime(data.timeUsedSeconds), color: C.slate700 },
  ];
  const gap = 10;
  const tileW = (CONTENT_W - gap * 5) / 6;
  const tileH = 52;
  tiles.forEach((t, i) => {
    const x = PAGE.margin + i * (tileW + gap);
    setFill(C.slate100);
    doc.roundedRect(x, y, tileW, tileH, 6, 6, "F");
    setText(t.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(t.value, x + tileW / 2, y + 26, { align: "center" });
    setText(C.slate400);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(t.label, x + tileW / 2, y + 42, { align: "center" });
  });
  y += tileH + 26;

  /* ── Section: outcome + difficulty charts side by side ─────────────── */
  const sectionHeading = (title: string) => {
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, PAGE.margin, y);
    setFill(C.slate200);
    doc.rect(PAGE.margin, y + 6, CONTENT_W, 0.8, "F");
    y += 20;
  };

  sectionHeading("Performance Breakdown");

  const donut = donutChart(
    [
      { label: "Correct", value: data.correct, color: "#059669" },
      { label: "Incorrect", value: data.incorrect, color: "#ef4444" },
      { label: "Unattempted", value: data.unattempted, color: "#cbd5e1" },
    ],
    `${data.scorePercent}%`,
    "score",
  );

  const diffOrder = ["Easy", "Medium", "Hard"];
  const diffMap = aggregate(data, "difficulty");
  const diffGroups = diffOrder
    .filter((d) => diffMap.has(d))
    .map((d) => ({ label: d, ...diffMap.get(d)! }));
  // include any non-standard difficulties at the end
  for (const [k, v] of diffMap) {
    if (!diffOrder.includes(k)) diffGroups.push({ label: k, ...v });
  }
  const diffBars = groupedBarChart(diffGroups.length ? diffGroups : [{ label: "—", correct: 0, total: 0 }]);

  const chartW = (CONTENT_W - 20) / 2;
  const chartH = chartW * (200 / 260);
  // labels above each chart
  setText(C.slate500);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("OUTCOME SPLIT", PAGE.margin, y);
  doc.text("BY DIFFICULTY", PAGE.margin + chartW + 20, y);
  y += 6;
  doc.addImage(donut, "PNG", PAGE.margin, y, chartW, chartH);
  doc.addImage(diffBars, "PNG", PAGE.margin + chartW + 20, y, chartW, chartH);
  y += chartH + 22;

  /* ── Topic-wise accuracy (horizontal bars) ─────────────────────────── */
  const topicMap = aggregate(data, "topic");
  const topicRows = Array.from(topicMap.entries())
    .map(([label, v]) => ({ label, correct: v.correct, total: v.total }))
    .sort((a, b) => b.total - a.total);

  if (topicRows.length > 0) {
    // heading + chart may overflow — move to a fresh page if needed
    const topicImgW = CONTENT_W;
    const topicCanvasW = 540;
    const topicCanvasH = 20 + topicRows.length * 26;
    const topicImgH = topicImgW * (topicCanvasH / topicCanvasW);
    if (y + 26 + topicImgH > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
    }
    sectionHeading("Topic-wise Accuracy");
    const topicChart = horizontalBarChart(topicRows);
    doc.addImage(topicChart, "PNG", PAGE.margin, y, topicImgW, topicImgH);
    y += topicImgH + 10;
  }

  /* ── Question-by-question review ────────────────────────────────────── */
  doc.addPage();
  y = PAGE.margin;

  setText(C.slate800);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Answer Review & Explanations", PAGE.margin, y);
  y += 8;
  setFill(C.emerald);
  doc.rect(PAGE.margin, y, 60, 2.5, "F");
  y += 22;

  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
    }
  };

  const writeWrapped = (
    text: string,
    x: number,
    maxW: number,
    size: number,
    color: readonly number[],
    style: "normal" | "bold" = "normal",
    lineH = size * 1.35,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    setText(color);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
  };

  data.questions.forEach((q, idx) => {
    const isKft = (q.examType || "").toUpperCase() === "KFT" || (q.examType || "").toUpperCase() === "KFP";
    const correctSet = new Set(q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [q.correctIndex]);
    const chosenSet = new Set(q.selectedIndices || (q.selectedIndex != null ? [q.selectedIndex] : []));
    const attempted = chosenSet.size > 0;
    const isFullyCorrect = attempted && chosenSet.size === correctSet.size && Array.from(chosenSet).every(i => correctSet.has(i));

    ensure(46);
    y += idx === 0 ? 0 : 6;

    // Q number + status chip on the left, topic/difficulty on the right
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Q${q.number}`, PAGE.margin, y);

    let statusText = "";
    let statusColor: readonly number[] = C.slate500;
    let chipBg: readonly number[] = C.slate100;

    if (!attempted) {
      statusText = "Not Attempted";
      statusColor = C.slate500;
      chipBg = C.slate100;
    } else if (isKft) {
      const earned = q.earnedMarks ?? 0;
      const max = q.maxMarks ?? 1;
      statusText = `${earned}/${max} Marks (${isFullyCorrect ? "Full" : earned > 0 ? "Partial" : "Incorrect"})`;
      statusColor = isFullyCorrect ? C.green : earned > 0 ? C.slate700 : C.red;
      chipBg = isFullyCorrect ? C.emeraldBg : earned > 0 ? C.slate100 : C.redBg;
    } else {
      statusText = isFullyCorrect ? "Correct" : "Incorrect";
      statusColor = isFullyCorrect ? C.green : C.red;
      chipBg = isFullyCorrect ? C.emeraldBg : C.redBg;
    }

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    const chipW = doc.getTextWidth(statusText) + 14;
    setFill(chipBg);
    doc.roundedRect(PAGE.margin + 26, y - 8, chipW, 12, 3, 3, "F");
    setText(statusColor);
    doc.text(statusText, PAGE.margin + 26 + 7, y);

    setText(C.slate400);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const meta = `${isKft ? "KFT · " : "AKT · "}${q.topic} · ${q.difficulty}`;
    doc.text(meta, PAGE.w - PAGE.margin, y, { align: "right" });
    y += 16;

    // question stem
    let stem = q.text;
    if (q.hadImage) stem += "  [figure omitted]";
    writeWrapped(stem, PAGE.margin, CONTENT_W, 10, C.slate700, "normal");
    y += 4;

    // options
    q.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const isRight = correctSet.has(i);
      const isChosen = chosenSet.has(i);
      const isChosenWrong = isChosen && !isRight;
      let marker = "";
      let color: readonly number[] = C.slate700;
      let style: "normal" | "bold" = "normal";
      if (isRight && isChosen) {
        marker = "  (correct - your answer)";
        color = C.green;
        style = "bold";
      } else if (isRight) {
        marker = "  (correct answer)";
        color = C.green;
        style = "bold";
      } else if (isChosenWrong) {
        marker = "  (your answer - incorrect)";
        color = C.red;
        style = "bold";
      }
      writeWrapped(`${letter}.  ${opt}${marker}`, PAGE.margin + 12, CONTENT_W - 12, 9.5, color, style);
      y += 1;
    });

    // your answer summary line for unattempted / when chosen differs
    if (!attempted) {
      y += 2;
      const correctLetters = Array.from(correctSet).map(idx => String.fromCharCode(65 + idx)).join(", ");
      writeWrapped(
        `You did not attempt this question. Correct answer: ${correctLetters}.`,
        PAGE.margin + 12,
        CONTENT_W - 12,
        9,
        C.slate500,
        "normal",
      );
    }

    // explanation block
    if (q.rationale && q.rationale.trim()) {
      y += 6;
      ensure(24);
      const boxTop = y - 10;
      setText(C.emerald);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("EXPLANATION", PAGE.margin + 12, y);
      y += 12;
      writeWrapped(q.rationale.trim(), PAGE.margin + 12, CONTENT_W - 24, 9.5, C.slate700, "normal");
      // left accent bar spanning the explanation
      setFill(C.emerald);
      doc.rect(PAGE.margin + 4, boxTop, 2.5, y - boxTop - 3, "F");
    }

    y += 8;
    ensure(10);
    setFill(C.slate200);
    doc.rect(PAGE.margin, y, CONTENT_W, 0.6, "F");
    y += 12;
  });

  /* ── Footer page numbers ────────────────────────────────────────────── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setText(C.slate400);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Page ${p} of ${pageCount}`, PAGE.w - PAGE.margin, PAGE.h - 18, { align: "right" });
    doc.text("The GP Edge — Performance Report", PAGE.margin, PAGE.h - 18);
  }

  return doc.output("blob");
}
