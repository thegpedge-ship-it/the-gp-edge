/* Client-side PDF generator for User Personal Data Export.
   Builds a structured report with:
   - Intro page (heading, username, account details, privacy disclosure)
   - Centered platform logo watermark (0.15 opacity) on page 2+
   - Structured sections for Account, Subscription/Payments, Performance/Scores, and User-Written Text/Correspondence. */

import type { UserDataExportPayload } from "@/lib/privacyData";
import { getWatermarkLogoInfo, getLogoInfo } from "./watermark";

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
  white: [255, 255, 255] as const,
};

const PAGE = { w: 595.28, h: 841.89, margin: 40 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;
const BOTTOM = PAGE.h - PAGE.margin;

export async function generateDataExportPdfBlob(data: UserDataExportPayload): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const setFill = (c: readonly number[]) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);

  let y = PAGE.margin;

  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
    }
  };

  const sanitizeText = (t: string) =>
    t
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/–/g, "-")
      .replace(/—/g, "--")
      .replace(/…/g, "...")
      .replace(/≥/g, ">=")
      .replace(/≤/g, "<=")
      .replace(/±/g, "+/-")
      .replace(/[└─│├]/g, "->");

  const writeWrapped = (
    text: string,
    x: number,
    maxW: number,
    size: number,
    color: readonly number[],
    style: "normal" | "bold" = "normal",
    lineH = size * 1.35
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    setText(color);
    const lines = doc.splitTextToSize(sanitizeText(text), maxW);
    for (const line of lines) {
      ensure(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
  };

  const sectionHeading = (title: string) => {
    ensure(36);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, PAGE.margin, y);
    y += 6;
    setFill(C.emerald);
    doc.rect(PAGE.margin, y, 40, 2, "F");
    setFill(C.slate200);
    doc.rect(PAGE.margin + 40, y + 0.6, CONTENT_W - 40, 0.8, "F");
    y += 18;
  };

  /* ════════════════════════════════════════════════════════════════════════
     PAGE 1 — INTRO PAGE (Heading, Username, Export Metadata)
     ════════════════════════════════════════════════════════════════════════ */
  // Top header band
  setFill(C.emerald);
  doc.rect(0, 0, PAGE.w, 130, "F");
  setFill(C.emeraldDark);
  doc.rect(0, 130, PAGE.w, 4, "F");

  // Logo in a white rounded badge card at top right corner of green background
  const logoInfo = await getLogoInfo();
  if (logoInfo) {
    const badgeSize = 64;
    const badgeX = PAGE.w - PAGE.margin - badgeSize;
    const badgeY = 24;
    setFill(C.white);
    doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 12, 12, "F");

    const pad = 6;
    const imgW = badgeSize - pad * 2;
    const imgH = imgW / logoInfo.aspectRatio;
    const imgY = badgeY + (badgeSize - imgH) / 2;
    doc.addImage(logoInfo.dataUrl, "PNG", badgeX + pad, imgY, imgW, imgH);
  }

  // Platform title & report type
  setText(C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("THE GP EDGE — PRIVACY DATA EXPORT", PAGE.margin, 36);

  doc.setFontSize(22);
  doc.text("Personal User Data Report", PAGE.margin, 68);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Export Timestamp: ${new Date(data.exportTimestamp).toLocaleString("en-AU")}`, PAGE.margin, 96);

  y = 160;

  // Username & Primary Identity Card
  const fullName =
    data.account.firstName || data.account.lastName
      ? `${data.account.firstName || ""} ${data.account.lastName || ""}`.trim()
      : "GP Candidate / Subscriber";

  setFill(C.emeraldBg);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, 100, 8, 8, "F");

  setText(C.emeraldDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ACCOUNT HOLDER IDENTIFIER", PAGE.margin + 20, y + 24);

  setText(C.slate800);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(fullName, PAGE.margin + 20, y + 48);

  setText(C.slate500);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Email: ${data.account.email}`, PAGE.margin + 20, y + 68);
  doc.text(`Clerk User ID: ${data.account.clerkUserId}`, PAGE.margin + 20, y + 84);

  y += 124;

  // Executive Summary Box
  sectionHeading("Export Overview & Data Inventory");
  writeWrapped(
    "This document contains a complete human-readable extract of all personal data, performance metrics, subscription records, and correspondence associated with your account on The GP Edge platform. A machine-readable JSON copy is provided alongside this report.",
    PAGE.margin,
    CONTENT_W,
    9.5,
    C.slate700
  );
  y += 12;

  const invRows = [
    ["1. Account & Profile", "Identity, contact information, clinical role, and onboarding details."],
    ["2. Subscriptions & Payments", "Current plan tier, status, billing history, and transaction records."],
    ["3. Derived Scores & Metrics", "Overall accuracy, streak stats, subject mastery, and badges."],
    ["4. Detailed Test Results", "Complete history of test attempts, scores, durations, and subject breakdowns."],
    ["5. User Written Content", "Cancellation feedback, error reports, support threads, and notes."],
    ["6. Saved & System Activity", "Saved templates, favorites, activity counts, and quota balances."],
  ];

  invRows.forEach(([title, desc]) => {
    ensure(22);
    setText(C.emerald);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(title, PAGE.margin + 10, y);
    setText(C.slate500);
    doc.setFont("helvetica", "normal");
    doc.text(desc, PAGE.margin + 160, y);
    y += 18;
  });

  /* ════════════════════════════════════════════════════════════════════════
     PAGE 2+ — DETAILED SECTIONS
     ════════════════════════════════════════════════════════════════════════ */
  doc.addPage();
  y = PAGE.margin;

  // SECTION 1: ACCOUNT & PROFILE
  sectionHeading("1. Account & Profile Information");

  const accountDetails: [string, string][] = [
    ["Database ID", data.account.id],
    ["Clerk ID", data.account.clerkUserId],
    ["Email Address", data.account.email],
    ["Full Name", fullName],
    ["Role Title / Level", data.account.roleTitle || "—"],
    ["Practice / Hospital", data.account.hospital || "—"],
    ["Location", data.account.location || "—"],
    ["RACGP Number", data.account.racgpId || "—"],
    ["Exam Target", data.account.examTarget || "—"],
    ["User Role Kind", data.account.userRole],
    ["Training Stage", data.account.trainingStage],
    ["Account Status", data.account.status],
    ["Joined Date", data.account.joinedAt ? new Date(data.account.joinedAt).toLocaleDateString("en-AU") : "—"],
    ["Account Created", new Date(data.account.createdAt).toLocaleString("en-AU")],
  ];

  accountDetails.forEach(([label, val]) => {
    ensure(18);
    setText(C.slate500);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, PAGE.margin, y);
    setText(C.slate800);
    doc.setFont("helvetica", "normal");
    doc.text(val, PAGE.margin + 160, y);
    y += 16;
  });

  y += 12;

  // SECTION 2: SUBSCRIPTION & PAYMENTS
  sectionHeading("2. Subscription & Transaction Records");

  if (data.subscriptionAndPayments.subscription) {
    const sub = data.subscriptionAndPayments.subscription;
    writeWrapped(`Active/Recorded Plan: ${sub.planName || "Standard Plan"} (${sub.cycle.toUpperCase()})`, PAGE.margin, CONTENT_W, 10, C.slate800, "bold");
    y += 2;
    writeWrapped(`Status: ${sub.status.toUpperCase()}`, PAGE.margin, CONTENT_W, 9, C.emerald, "bold");
    y += 4;
    if (sub.currentPeriodStart && sub.currentPeriodEnd) {
      writeWrapped(`Billing Period: ${new Date(sub.currentPeriodStart).toLocaleDateString("en-AU")} to ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-AU")}`, PAGE.margin, CONTENT_W, 9, C.slate500);
    }
    if (sub.canceledAt) {
      writeWrapped(`Canceled On: ${new Date(sub.canceledAt).toLocaleString("en-AU")}`, PAGE.margin, CONTENT_W, 9, C.red, "bold");
    }
    y += 10;
  } else {
    writeWrapped("No active recurring subscription on file.", PAGE.margin, CONTENT_W, 9.5, C.slate500);
    y += 10;
  }

  ensure(24);
  setText(C.slate800);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Transaction History", PAGE.margin, y);
  y += 14;

  if (data.subscriptionAndPayments.payments.length === 0) {
    writeWrapped("No payment transactions recorded.", PAGE.margin, CONTENT_W, 9, C.slate500);
    y += 12;
  } else {
    data.subscriptionAndPayments.payments.forEach((p) => {
      ensure(32);
      const line = `${new Date(p.createdAt).toLocaleDateString("en-AU")}  |  ${p.currency} $${p.amount}  |  Status: ${p.status.toUpperCase()} ${p.providerRef ? `(${p.providerRef})` : ""}`;
      writeWrapped(line, PAGE.margin, CONTENT_W, 9, C.slate700, "normal");
      if (p.refunds && p.refunds.length > 0) {
        p.refunds.forEach((r) => {
          writeWrapped(`   -> Refund: $${r.amount} (${r.status}) - Reason: ${r.reason || "N/A"}`, PAGE.margin + 10, CONTENT_W - 10, 8.5, C.amber);
        });
      }
      y += 4;
    });
  }

  y += 12;

  // SECTION 3: DERIVED SCORES & PERFORMANCE
  sectionHeading("3. Performance Summaries & Metrics");

  if (data.derivedScoresAndPerformance.summary) {
    const s = data.derivedScoresAndPerformance.summary;
    const tiles = [
      { l: "TOTAL ATTEMPTS", v: String(s.totalAttempts) },
      { l: "TOTAL QUESTIONS", v: String(s.totalQuestions) },
      { l: "OVERALL ACCURACY", v: s.overallAccuracy != null ? `${s.overallAccuracy.toFixed(1)}%` : "0%" },
      { l: "STUDY STREAK", v: `${s.currentStreakDays} Days` },
    ];
    const tileW = (CONTENT_W - 30) / 4;
    tiles.forEach((t, i) => {
      const x = PAGE.margin + i * (tileW + 10);
      setFill(C.slate100);
      doc.roundedRect(x, y, tileW, 40, 4, 4, "F");
      setText(C.emeraldDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(t.v, x + tileW / 2, y + 20, { align: "center" });
      setText(C.slate500);
      doc.setFontSize(6.5);
      doc.text(t.l, x + tileW / 2, y + 32, { align: "center" });
    });
    y += 50;
  }

  // Subject Mastery Table
  if (data.derivedScoresAndPerformance.subjectMastery.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Subject Mastery Breakdown", PAGE.margin, y);
    y += 14;

    data.derivedScoresAndPerformance.subjectMastery.forEach((m) => {
      ensure(16);
      const row = `${m.examTypeCode} · ${m.subjectName}: ${m.correctCount} Correct / ${m.totalAnswered} Total (${m.masteryPercent != null ? m.masteryPercent.toFixed(1) : 0}%) — Strength: ${m.strength || "Developing"}`;
      writeWrapped(row, PAGE.margin + 6, CONTENT_W - 6, 8.5, C.slate700);
    });
    y += 8;
  }

  // Earned Badges
  if (data.derivedScoresAndPerformance.earnedBadges.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Earned Badges & Achievements", PAGE.margin, y);
    y += 14;
    const badgeText = data.derivedScoresAndPerformance.earnedBadges
      .map((b) => `${b.badgeName} (${new Date(b.earnedAt).toLocaleDateString("en-AU")})`)
      .join("  •  ");
    writeWrapped(badgeText, PAGE.margin + 6, CONTENT_W - 6, 8.5, C.emeraldDark);
    y += 10;
  }

  // SECTION 4: DETAILED TEST RESULTS & EXAM ATTEMPTS HISTORY
  sectionHeading("4. Detailed Test Results & Exam Attempts History");

  if (data.derivedScoresAndPerformance.recentTestAttempts.length === 0) {
    writeWrapped("No test attempts or exam results recorded on file.", PAGE.margin, CONTENT_W, 9, C.slate500);
    y += 10;
  } else {
    data.derivedScoresAndPerformance.recentTestAttempts.forEach((t, i) => {
      ensure(28);
      const title = t.titleSnapshot || `${t.source.toUpperCase()} Attempt`;
      const dateStr = new Date(t.startedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const scoreStr = t.scorePercent != null ? `${t.scorePercent.toFixed(1)}% (${t.correctCount}/${t.totalQuestions} correct)` : `${t.correctCount}/${t.totalQuestions} answered`;
      const durStr = t.durationSeconds ? `${Math.floor(t.durationSeconds / 60)}m ${t.durationSeconds % 60}s` : "—";
      
      const lineMain = `${i + 1}. ${title}  |  ${dateStr}  |  Status: ${t.status.toUpperCase()}  |  Score: ${scoreStr}  |  Duration: ${durStr}`;
      writeWrapped(lineMain, PAGE.margin + 4, CONTENT_W - 4, 8.5, t.status === "completed" ? C.slate800 : C.slate500, t.status === "completed" ? "bold" : "normal");

      if (t.subjectStats && t.subjectStats.length > 0) {
        const subLine = t.subjectStats.map(s => `${s.subjectName}: ${s.correct}/${s.correct + s.incorrect + s.unanswered}`).join("  •  ");
        writeWrapped(`   -> Subject Breakdown: ${subLine}`, PAGE.margin + 14, CONTENT_W - 14, 8, C.slate500);
      }
      y += 4;
    });
    y += 10;
  }

  // SECTION 5: TEXT THE USER WROTE & CORRESPONDENCE
  sectionHeading("5. User Written Text & Support Correspondence");

  // A. Cancellation Feedback
  if (data.textAndCorrespondence.cancellationFeedbacks.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Cancellation Feedback", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.cancellationFeedbacks.forEach((cf) => {
      writeWrapped(
        `[${new Date(cf.createdAt).toLocaleDateString("en-AU")}] Reason: ${cf.reason}${cf.feedback ? ` | Note: ${cf.feedback}` : ""}`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate700
      );
      y += 2;
    });
    y += 8;
  }

  // B. Error Reports
  if (data.textAndCorrespondence.errorReports.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Submitted Error Reports", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.errorReports.forEach((er) => {
      writeWrapped(
        `[${new Date(er.createdAt).toLocaleDateString("en-AU")}] ${er.itemType.toUpperCase()} (${er.errorCategory}): "${er.description}"`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate700,
        "bold"
      );
      if (er.triageOutcome) {
        writeWrapped(`   -> Staff Reply / Outcome: "${er.triageOutcome}" (by ${er.triagedBy || "Admin"})`, PAGE.margin + 16, CONTENT_W - 16, 8, C.emeraldDark);
      }
      y += 4;
    });
    y += 8;
  }

  // C. Question Feedbacks & Thread Correspondence
  if (data.textAndCorrespondence.questionFeedbacks.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Question Feedback & Support Correspondence Threads", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.questionFeedbacks.forEach((qf) => {
      writeWrapped(
        `[${new Date(qf.createdAt).toLocaleDateString("en-AU")}] Question ID: ${qf.questionId} (${qf.examType || "General"}) - Status: ${qf.status.toUpperCase()}`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate800,
        "bold"
      );
      if (qf.comment) {
        writeWrapped(`User Comment: "${qf.comment}"`, PAGE.margin + 12, CONTENT_W - 12, 8.5, C.slate700);
      }
      if (qf.adminReply) {
        writeWrapped(`Admin Reply: "${qf.adminReply}"`, PAGE.margin + 12, CONTENT_W - 12, 8.5, C.emeraldDark);
      }
      if (qf.messages && qf.messages.length > 0) {
        qf.messages.forEach((msg) => {
          writeWrapped(
            `   -> [${msg.senderRole.toUpperCase()}] ${new Date(msg.createdAt).toLocaleDateString("en-AU")}: "${msg.message}"`,
            PAGE.margin + 16,
            CONTENT_W - 16,
            8,
            msg.senderRole === "admin" ? C.emeraldDark : C.slate700
          );
        });
      }
      y += 6;
    });
    y += 8;
  }

  // D. Note Template Feedbacks
  if (data.textAndCorrespondence.templateFeedbacks.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Note Template Reviews", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.templateFeedbacks.forEach((tf) => {
      writeWrapped(
        `[${new Date(tf.createdAt).toLocaleDateString("en-AU")}] Template: ${tf.templateName} (${tf.sectionWhere}) - "${tf.whatsWrong}"`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate700
      );
      y += 2;
    });
    y += 8;
  }

  // E. Library Feedbacks
  if (data.textAndCorrespondence.libraryFeedbacks.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Medical Library Feedback", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.libraryFeedbacks.forEach((lf) => {
      writeWrapped(
        `[${new Date(lf.createdAt).toLocaleDateString("en-AU")}] Condition: ${lf.conditionName} - "${lf.feedback}"`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate700
      );
      y += 2;
    });
    y += 8;
  }

  // F. Bookmarked Questions & Notes Written
  if (data.textAndCorrespondence.bookmarkedQuestions && data.textAndCorrespondence.bookmarkedQuestions.length > 0) {
    ensure(20);
    setText(C.slate800);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Bookmarked Questions & Personal Notes", PAGE.margin, y);
    y += 12;

    data.textAndCorrespondence.bookmarkedQuestions.forEach((bm) => {
      writeWrapped(
        `[${new Date(bm.createdAt).toLocaleDateString("en-AU")}] Question ID: ${bm.questionId} (${bm.kind.toUpperCase()})${bm.note ? ` - Personal Note: "${bm.note}"` : ""}`,
        PAGE.margin + 6,
        CONTENT_W - 6,
        8.5,
        C.slate700
      );
      y += 2;
    });
    y += 8;
  }

  // SECTION 6: SAVED TEMPLATES, FAVORITES & QUIZ CONFIGURATIONS
  if (data.savedAndFavorites) {
    sectionHeading("6. Saved Templates, Favorites & Configurations");

    const sf = data.savedAndFavorites;
    writeWrapped(`• Saved Clinical Note Templates: ${sf.savedTemplates.length}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    writeWrapped(`• Favorite MBS Item Numbers: ${sf.favoriteMbsItems.length > 0 ? sf.favoriteMbsItems.map(m => m.itemNum).join(", ") : "None"}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    writeWrapped(`• Saved Custom Quiz Configs: ${sf.quizConfigs.length}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    if (sf.promoRedemptions.length > 0) {
      writeWrapped(`• Redeemed Promo Codes: ${sf.promoRedemptions.length}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    }
    y += 10;
  }

  // SECTION 7: SYSTEM ACTIVITY LOGS & QUOTAS
  if (data.activityAndNotifications && data.quotas) {
    sectionHeading("7. System Activity & Account Quotas");

    const act = data.activityAndNotifications;
    const q = data.quotas;

    writeWrapped(`• Recorded Active Study Days: ${act.activeDaysCount} Days`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    writeWrapped(`• Total System Activity Log Events: ${act.activityEventsCount}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    writeWrapped(`• In-App Notifications History Count: ${act.notificationsCount}`, PAGE.margin + 6, CONTENT_W - 6, 9, C.slate700);
    writeWrapped(`• Remaining Free Quotas: ${q.freeQuestionsLeft} Questions, ${q.freeTemplatesLeft} Templates, ${q.freeTopicsLeft} Topics`, PAGE.margin + 6, CONTENT_W - 6, 9, C.emeraldDark, "bold");
    y += 10;
  }

  /* ════════════════════════════════════════════════════════════════════════
     WATERMARK & PAGE NUMBERS (PAGE 2+)
     ════════════════════════════════════════════════════════════════════════ */
  const watermarkInfo = await getWatermarkLogoInfo();
  const pageCount = doc.getNumberOfPages();

  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);

    // Render 0.15 opacity logo watermark starting from page 2 (proportional, un-stretched)
    if (p >= 2 && watermarkInfo) {
      const wmW = 320;
      const wmH = wmW / watermarkInfo.aspectRatio;
      const wmX = (PAGE.w - wmW) / 2;
      const wmY = (PAGE.h - wmH) / 2;
      doc.addImage(watermarkInfo.dataUrl, "PNG", wmX, wmY, wmW, wmH);
    }

    setText(C.slate400);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Page ${p} of ${pageCount}`, PAGE.w - PAGE.margin, PAGE.h - 18, { align: "right" });
    doc.text("The GP Edge — Personal Data Access Export", PAGE.margin, PAGE.h - 18);
  }

  return doc.output("blob");
}
