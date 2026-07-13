/* Lightweight canvas chart renderers for the PDF report.

   Each function draws onto an off-screen canvas at 2x for crisp output and
   returns a PNG data URL that jsPDF embeds with addImage. Charts are drawn on
   a white background (the report is always light-themed). Client-only. */

const SCALE = 2; // render at 2x for sharp PDF output

/* Brand-consistent palette (emerald primary, matching the app). */
const COLORS = {
  correct: "#059669", // emerald-600
  incorrect: "#ef4444", // red-500
  unattempted: "#cbd5e1", // slate-300
  bar: "#059669",
  barTrack: "#e2e8f0", // slate-200
  text: "#334155", // slate-700
  subtext: "#94a3b8", // slate-400
  grid: "#e2e8f0",
};

function makeCanvas(cssWidth: number, cssHeight: number) {
  const canvas = document.createElement("canvas");
  canvas.width = cssWidth * SCALE;
  canvas.height = cssHeight * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

function font(ctx: CanvasRenderingContext2D, size: number, weight = "normal") {
  ctx.font = `${weight} ${size}px Helvetica, Arial, sans-serif`;
}

/* Truncate a label to fit a pixel width, appending an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, label: string, maxWidth: number): string {
  if (ctx.measureText(label).width <= maxWidth) return label;
  let s = label;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxWidth) s = s.slice(0, -1);
  return s + "…";
}

/* ── Donut: overall outcome split ─────────────────────────────────────── */
export function donutChart(
  segments: { label: string; value: number; color: string }[],
  centerLabel: string,
  centerSub: string,
  width = 260,
  height = 200,
): string {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const cx = height / 2 + 4;
  const cy = height / 2;
  const rOuter = height / 2 - 14;
  const rInner = rOuter * 0.62;

  let start = -Math.PI / 2;
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const angle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOuter, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  }
  // punch out the center
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // center text
  ctx.fillStyle = COLORS.correct;
  font(ctx, 26, "bold");
  ctx.textAlign = "center";
  ctx.fillText(centerLabel, cx, cy + 4);
  ctx.fillStyle = COLORS.subtext;
  font(ctx, 10);
  ctx.fillText(centerSub, cx, cy + 20);

  // legend to the right
  const lx = cx + rOuter + 20;
  let ly = cy - segments.length * 11 + 6;
  ctx.textAlign = "left";
  for (const seg of segments) {
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.arc(lx + 4, ly - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    font(ctx, 11);
    ctx.fillText(`${seg.label}: ${seg.value}`, lx + 14, ly);
    ly += 22;
  }
  return canvas.toDataURL("image/png");
}

/* ── Grouped vertical bars: correct vs total per category ─────────────── */
export function groupedBarChart(
  groups: { label: string; correct: number; total: number }[],
  width = 260,
  height = 200,
): string {
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const padL = 28;
  const padR = 12;
  const padT = 16;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxVal = Math.max(1, ...groups.map((g) => g.total));

  // y gridlines (0, mid, max)
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  font(ctx, 9);
  ctx.fillStyle = COLORS.subtext;
  ctx.textAlign = "right";
  for (let i = 0; i <= 2; i++) {
    const v = Math.round((maxVal / 2) * i);
    const y = padT + plotH - (v / maxVal) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(width - padR, y);
    ctx.stroke();
    ctx.fillText(String(v), padL - 4, y + 3);
  }

  const slot = plotW / groups.length;
  const barW = Math.min(26, slot * 0.5);
  ctx.textAlign = "center";
  groups.forEach((g, i) => {
    const x = padL + slot * i + slot / 2;
    const totalH = (g.total / maxVal) * plotH;
    const correctH = (g.correct / maxVal) * plotH;
    // total (track)
    ctx.fillStyle = COLORS.barTrack;
    ctx.fillRect(x - barW / 2, padT + plotH - totalH, barW, totalH);
    // correct (fill)
    ctx.fillStyle = COLORS.bar;
    ctx.fillRect(x - barW / 2, padT + plotH - correctH, barW, correctH);
    // value on top
    ctx.fillStyle = COLORS.text;
    font(ctx, 9, "bold");
    ctx.fillText(`${g.correct}/${g.total}`, x, padT + plotH - totalH - 4);
    // category label
    ctx.fillStyle = COLORS.subtext;
    font(ctx, 9);
    ctx.fillText(fit(ctx, g.label, slot - 2), x, height - 12);
  });
  return canvas.toDataURL("image/png");
}

/* ── Horizontal bars: accuracy % per topic ───────────────────────────── */
export function horizontalBarChart(
  rows: { label: string; correct: number; total: number }[],
  width = 540,
  rowHeight = 26,
): string {
  const padL = 150;
  const padR = 48;
  const padT = 10;
  const padB = 10;
  const height = padT + padB + rows.length * rowHeight;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const trackW = width - padL - padR;
  rows.forEach((r, i) => {
    const y = padT + i * rowHeight + rowHeight / 2;
    const pct = r.total > 0 ? r.correct / r.total : 0;

    // label
    ctx.fillStyle = COLORS.text;
    font(ctx, 10);
    ctx.textAlign = "right";
    ctx.fillText(fit(ctx, r.label, padL - 12), padL - 10, y + 3);

    // track
    ctx.fillStyle = COLORS.barTrack;
    roundRect(ctx, padL, y - 6, trackW, 12, 6);
    ctx.fill();
    // fill
    ctx.fillStyle = COLORS.bar;
    roundRect(ctx, padL, y - 6, Math.max(4, trackW * pct), 12, 6);
    ctx.fill();

    // % + count
    ctx.fillStyle = COLORS.text;
    font(ctx, 10, "bold");
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(pct * 100)}%`, padL + trackW + 8, y + 3);
    ctx.fillStyle = COLORS.subtext;
    font(ctx, 8);
    ctx.fillText(`${r.correct}/${r.total}`, padL + trackW + 8, y + 13);
  });
  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export { COLORS as CHART_COLORS };
