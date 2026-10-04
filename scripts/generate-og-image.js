const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

async function generateOgImage() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Base Gradient Background (Deep Navy to Forest Green / Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#08101E");
  bgGrad.addColorStop(0.5, "#0A2022");
  bgGrad.addColorStop(1, "#031417");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Radial Glow Accents (Teal / Emerald)
  // Top-right glow
  const trGlow = ctx.createRadialGradient(950, 120, 0, 950, 120, 480);
  trGlow.addColorStop(0, "rgba(20, 184, 166, 0.28)");
  trGlow.addColorStop(0.5, "rgba(13, 148, 136, 0.12)");
  trGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = trGlow;
  ctx.fillRect(0, 0, width, height);

  // Bottom-left glow
  const blGlow = ctx.createRadialGradient(200, 520, 0, 200, 520, 420);
  blGlow.addColorStop(0, "rgba(16, 185, 129, 0.20)");
  blGlow.addColorStop(0.6, "rgba(13, 148, 136, 0.08)");
  blGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = blGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle Technical Grid Pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.028)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 4. Subtle Outer Border / Frame
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 5. Category Pill / Badge at Top
  const badgeX = 80;
  const badgeY = 66;
  const badgeW = 440;
  const badgeH = 38;
  const badgeR = 19;

  ctx.fillStyle = "rgba(13, 148, 136, 0.18)";
  ctx.strokeStyle = "rgba(20, 184, 166, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fill();
  ctx.stroke();

  // Green active pulse dot
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(badgeX + 22, badgeY + 19, 5, 0, Math.PI * 2);
  ctx.fill();

  // Badge Text
  ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#2DD4BF";
  ctx.fillText("RACGP & ACRRM EXAM PREPARATION & CLINICAL HUB", badgeX + 36, badgeY + 24);

  // 6. Logo Container & Logo
  const logoPath = path.join(process.cwd(), "public/assets/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoImg = await loadImage(logoPath);
    const logoBoxX = 80;
    const logoBoxY = 130;
    const logoBoxW = 200;
    const logoBoxH = 74;
    const logoBoxR = 16;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, logoBoxR);
    ctx.fill();
    ctx.stroke();

    const aspect = logoImg.width / logoImg.height;
    const drawH = 54;
    const drawW = drawH * aspect;
    const drawX = logoBoxX + (logoBoxW - drawW) / 2;
    const drawY = logoBoxY + (logoBoxH - drawH) / 2;
    ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
  }

  // Brand Name alongside logo
  ctx.font = "bold 44px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("The", 305, 185);
  ctx.fillStyle = "#14B8A6";
  ctx.fillText("GP Edge", 395, 185);

  // 7. Main Hero Headline
  ctx.font = "bold 52px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#F8FAFC";
  ctx.fillText("Smart Exam Prep & Clinical Tools", 80, 276);
  ctx.fillStyle = "#2DD4BF";
  ctx.fillText("for GP Registrars in Australia", 80, 338);

  // 8. Subtitle description
  ctx.font = "400 21px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText(
    "High-yield AKT & KFP mock exams, clinical consult autofills, and MBS billing compliance.",
    80,
    392
  );

  // 9. Feature Badges (3 horizontal cards) with vector-drawn icons
  const features = [
    { title: "AKT & KFP Mock Exams", desc: "Adaptive timer & rationales", type: "exam" },
    { title: "Clinical Consult Autofills", desc: "Evidence-based templates", type: "consult" },
    { title: "6,000+ MBS Items", desc: "Item selector & billing rules", type: "mbs" }
  ];

  const featY = 438;
  const featH = 78;
  const featW = 320;
  const featGap = 20;

  features.forEach((feat, index) => {
    const featX = 80 + index * (featW + featGap);

    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(featX, featY, featW, featH, 14);
    ctx.fill();
    ctx.stroke();

    // Icon Circle
    const iconCenterX = featX + 34;
    const iconCenterY = featY + 39;
    ctx.fillStyle = "rgba(20, 184, 166, 0.2)";
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Draw Vector Icon inside Circle
    ctx.strokeStyle = "#2DD4BF";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (feat.type === "exam") {
      // Checkmark icon
      ctx.beginPath();
      ctx.moveTo(iconCenterX - 7, iconCenterY);
      ctx.lineTo(iconCenterX - 2, iconCenterY + 5);
      ctx.lineTo(iconCenterX + 7, iconCenterY - 5);
      ctx.stroke();
    } else if (feat.type === "consult") {
      // Document / clinical note icon
      ctx.beginPath();
      ctx.roundRect(iconCenterX - 6, iconCenterY - 8, 12, 16, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(iconCenterX - 3, iconCenterY - 3);
      ctx.lineTo(iconCenterX + 3, iconCenterY - 3);
      ctx.moveTo(iconCenterX - 3, iconCenterY + 1);
      ctx.lineTo(iconCenterX + 3, iconCenterY + 1);
      ctx.moveTo(iconCenterX - 3, iconCenterY + 5);
      ctx.lineTo(iconCenterX + 1, iconCenterY + 5);
      ctx.stroke();
    } else if (feat.type === "mbs") {
      // Dollar / currency symbol
      ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#2DD4BF";
      ctx.textAlign = "center";
      ctx.fillText("$", iconCenterX, iconCenterY + 6);
      ctx.textAlign = "left";
    }

    // Text
    ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#F1F5F9";
    ctx.fillText(feat.title, featX + 62, featY + 34);

    ctx.font = "400 13px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(feat.desc, featX + 62, featY + 55);
  });

  // 10. Bottom Footer Bar
  const footerY = 565;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, footerY);
  ctx.lineTo(width - 80, footerY);
  ctx.stroke();

  // URL on Left with globe dot
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(88, footerY + 25, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#2DD4BF";
  ctx.fillText("thegpedge.com.au", 102, footerY + 31);

  // Tagline on Right
  ctx.font = "italic 16px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.textAlign = "right";
  ctx.fillText("Study smarter. Pass with confidence.", width - 80, footerY + 31);
  ctx.textAlign = "left";

  // 11. Save Buffer to public/og-image.png
  const buffer = canvas.toBuffer("image/png");
  const outputPath = path.join(process.cwd(), "public/og-image.png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Open Graph image generated at: ${outputPath} (${buffer.length} bytes, 1200x630)`);
}

generateOgImage().catch(console.error);
