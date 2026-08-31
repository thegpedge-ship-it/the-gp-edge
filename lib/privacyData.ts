import prisma from "@/lib/prisma";
import { query } from "@/lib/db";

export interface UserDataExportPayload {
  exportTimestamp: string;
  account: {
    id: string;
    clerkUserId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roleTitle: string | null;
    location: string | null;
    examTarget: string | null;
    postgraduateYear: number | null;
    country: string | null;
    stateTerritory: string | null;
    fellowshipStatus: string | null;
    userRole: string;
    trainingStage: string;
    status: string;
    joinedAt: string | null;
    createdAt: string;
  };
  subscriptionAndPayments: {
    subscription: {
      planName: string | null;
      cycle: string;
      status: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAt: string | null;
      canceledAt: string | null;
      createdAt: string;
    } | null;
    payments: Array<{
      id: string;
      amount: string;
      currency: string;
      status: string;
      providerRef: string | null;
      paidAt: string | null;
      createdAt: string;
      refunds: Array<{
        amount: string;
        reason: string | null;
        status: string;
        createdAt: string;
      }>;
    }>;
  };
  derivedScoresAndPerformance: {
    summary: {
      totalAttempts: number;
      totalQuestions: number;
      totalCorrect: number;
      overallAccuracy: number | null;
      currentStreakDays: number;
      longestStreakDays: number;
      lastActiveDate: string | null;
    } | null;
    subjectMastery: Array<{
      subjectName: string;
      examTypeCode: string;
      correctCount: number;
      incorrectCount: number;
      totalAnswered: number;
      masteryPercent: number | null;
      strength: string | null;
    }>;
    badgeProgress: Array<{
      badgeName: string;
      currentValue: number;
      targetValue: number;
    }>;
    earnedBadges: Array<{
      badgeName: string;
      earnedAt: string;
    }>;
    recentTestAttempts: Array<{
      id: string;
      titleSnapshot: string | null;
      source: string;
      status: string;
      totalQuestions: number;
      correctCount: number;
      scorePercent: number | null;
      durationSeconds: number | null;
      startedAt: string;
      submittedAt: string | null;
      subjectStats: Array<{
        subjectName: string;
        correct: number;
        incorrect: number;
        unanswered: number;
      }>;
    }>;
  };
  textAndCorrespondence: {
    cancellationFeedbacks: Array<{
      reason: string;
      feedback: string | null;
      createdAt: string;
    }>;
    errorReports: Array<{
      id: string;
      itemId: string;
      itemType: string;
      errorCategory: string;
      description: string;
      status: string;
      triageOutcome: string | null;
      triagedBy: string | null;
      triagedAt: string | null;
      createdAt: string;
    }>;
    questionFeedbacks: Array<{
      id: string;
      questionId: string;
      examType: string | null;
      issueType: string | null;
      comment: string | null;
      status: string;
      adminReply: string | null;
      repliedAt: string | null;
      createdAt: string;
      messages: Array<{
        senderRole: string;
        message: string;
        createdAt: string;
      }>;
    }>;
    templateFeedbacks: Array<{
      templateName: string;
      severity: string;
      whatsWrong: string;
      sectionWhere: string;
      issueType: string;
      wrongDetail: string | null;
      status: string;
      createdAt: string;
    }>;
    libraryFeedbacks: Array<{
      conditionName: string;
      feedback: string;
      createdAt: string;
    }>;
    bookmarkedQuestions: Array<{
      questionId: string;
      kind: string;
      note: string | null;
      createdAt: string;
    }>;
  };
  savedAndFavorites: {
    savedTemplates: Array<{ templateId: string; createdAt: string }>;
    favoriteMbsItems: Array<{ itemNum: number; createdAt: string }>;
    quizConfigs: Array<{ label: string | null; difficulty: string | null; questionCount: number; createdAt: string }>;
    promoRedemptions: Array<{ promoCodeId: string; redeemedAt: string }>;
  };
  activityAndNotifications: {
    activeDaysCount: number;
    activityEventsCount: number;
    notificationsCount: number;
  };
  quotas: {
    freeQuestionsLeft: number;
    freeTemplatesLeft: number;
    freeTopicsLeft: number;
    hasPurchasedRegistrar: boolean;
  };
  preferences: {
    theme: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
    timezone: string;
  } | null;
}

export async function fetchUserDataForExport(userId: string): Promise<UserDataExportPayload | null> {
  const dbUser = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: {
          plans: true,
        },
      },
      payments: {
        include: {
          refunds: true,
        },
        orderBy: { created_at: "desc" },
      },
      user_performance_summary: true,
      user_subject_mastery: {
        include: {
          subjects: true,
        },
      },
      user_badge_progress: {
        include: {
          badges: true,
        },
      },
      user_badges: {
        include: {
          badges: true,
        },
      },
      cancellationFeedbacks: {
        orderBy: { created_at: "desc" },
      },
      user_preferences: true,
      user_question_bookmarks: {
        orderBy: { created_at: "desc" },
      },
      user_saved_templates: true,
      user_favourite_mbs_items: true,
      quiz_configs: true,
      promo_redemptions: true,
    },
  });

  if (!dbUser) return null;

  // Fetch count of active days, activity events, and notifications
  const [activeDaysCount, activityEventsCount, notificationsCount] = await Promise.all([
    prisma.user_active_days.count({ where: { user_id: userId } }),
    prisma.user_activity_events.count({ where: { user_id: userId } }),
    prisma.user_notifications.count({ where: { user_id: userId } }),
  ]);

  // Fetch test attempts
  const testAttempts = await prisma.test_attempts.findMany({
    where: { user_id: userId },
    orderBy: { started_at: "desc" },
    take: 200, // Most recent 200 attempts for full history
    select: {
      id: true,
      title_snapshot: true,
      source: true,
      status: true,
      total_questions: true,
      correct_count: true,
      score_percent: true,
      duration_seconds: true,
      started_at: true,
      submitted_at: true,
      attempt_subject_stats: {
        include: {
          subjects: true,
        },
      },
    },
  });

  // Query raw tables for error reports, question feedbacks, thread messages, template feedbacks, and library feedbacks
  const [errorReportRows, questionFeedbackRows, templateFeedbackRows, libraryFeedbackRows] = await Promise.all([
    query(
      `SELECT id, item_id, item_type, error_category, description, status, triage_outcome, triaged_by, triaged_at, created_at
         FROM item_error_reports
        WHERE reporter_user_id = $1 OR reporter_user_id = $2
        ORDER BY created_at DESC`,
      [userId, dbUser.clerk_user_id]
    ).catch(() => []),

    query(
      `SELECT id, question_id, exam_type, issue_type, comment, status, admin_reply, replied_at, created_at
         FROM question_feedback
        WHERE user_id = $1::uuid
        ORDER BY created_at DESC`,
      [userId]
    ).catch(() => []),

    query(
      `SELECT template_name, severity, whats_wrong, section_where, issue_type, wrong_detail, status, created_at
         FROM note_template_feedback
        WHERE user_id = $1::uuid
        ORDER BY created_at DESC`,
      [userId]
    ).catch(() => []),

    query(
      `SELECT condition_name, feedback, created_at
         FROM medical_library_feedback
        WHERE user_id = $1::uuid
        ORDER BY created_at DESC`,
      [userId]
    ).catch(() => []),
  ]);

  // Fetch thread messages for question feedback rows if any exist
  const feedbackIds = questionFeedbackRows.map((qf: any) => qf.id);
  let feedbackMessagesMap = new Map<string, Array<{ senderRole: string; message: string; createdAt: string }>>();
  if (feedbackIds.length > 0) {
    const threadRows = await query(
      `SELECT feedback_id, sender_role, message, created_at
         FROM feedback_messages
        WHERE feedback_id = ANY($1::uuid[])
        ORDER BY created_at ASC`,
      [feedbackIds]
    ).catch(() => []);

    for (const msg of threadRows) {
      const existing = feedbackMessagesMap.get(msg.feedback_id) || [];
      existing.push({
        senderRole: msg.sender_role,
        message: msg.message,
        createdAt: msg.created_at instanceof Date ? msg.created_at.toISOString() : String(msg.created_at),
      });
      feedbackMessagesMap.set(msg.feedback_id, existing);
    }
  }

  const fmtDate = (d: Date | null | undefined) => (d ? d.toISOString() : null);

  return {
    exportTimestamp: new Date().toISOString(),
    account: {
      id: dbUser.id,
      clerkUserId: dbUser.clerk_user_id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      roleTitle: dbUser.role_title,
      location: dbUser.location,
      examTarget: dbUser.exam_target,
      postgraduateYear: dbUser.postgraduate_year,
      country: dbUser.country,
      stateTerritory: dbUser.state_territory,
      fellowshipStatus: dbUser.fellowship_status,
      userRole: dbUser.user_role,
      trainingStage: dbUser.training_stage,
      status: dbUser.status,
      joinedAt: fmtDate(dbUser.joined_at),
      createdAt: dbUser.created_at.toISOString(),
    },
    subscriptionAndPayments: {
      subscription: dbUser.subscriptions
        ? {
            planName: dbUser.subscriptions.plan_name || dbUser.subscriptions.plans?.name || "Standard Plan",
            cycle: dbUser.subscriptions.cycle,
            status: dbUser.subscriptions.status,
            currentPeriodStart: fmtDate(dbUser.subscriptions.current_period_start),
            currentPeriodEnd: fmtDate(dbUser.subscriptions.current_period_end),
            cancelAt: fmtDate(dbUser.subscriptions.cancel_at),
            canceledAt: fmtDate(dbUser.subscriptions.canceled_at),
            createdAt: dbUser.subscriptions.created_at.toISOString(),
          }
        : null,
      payments: dbUser.payments.map((p) => ({
        id: p.id,
        amount: String(p.amount),
        currency: p.currency,
        status: p.status,
        providerRef: p.provider_ref,
        paidAt: fmtDate(p.paid_at),
        createdAt: p.created_at.toISOString(),
        refunds: p.refunds.map((r) => ({
          amount: String(r.amount),
          reason: r.reason,
          status: r.status,
          createdAt: r.created_at.toISOString(),
        })),
      })),
    },
    derivedScoresAndPerformance: {
      summary: dbUser.user_performance_summary
        ? {
            totalAttempts: dbUser.user_performance_summary.total_attempts,
            totalQuestions: dbUser.user_performance_summary.total_questions,
            totalCorrect: dbUser.user_performance_summary.total_correct,
            overallAccuracy: dbUser.user_performance_summary.overall_accuracy
              ? Number(dbUser.user_performance_summary.overall_accuracy)
              : null,
            currentStreakDays: dbUser.user_performance_summary.current_streak_days,
            longestStreakDays: dbUser.user_performance_summary.longest_streak_days,
            lastActiveDate: fmtDate(dbUser.user_performance_summary.last_active_date),
          }
        : null,
      subjectMastery: dbUser.user_subject_mastery.map((m) => ({
        subjectName: m.subjects.name,
        examTypeCode: m.exam_type_code,
        correctCount: m.correct_count,
        incorrectCount: m.incorrect_count,
        totalAnswered: m.total_answered,
        masteryPercent: m.mastery_percent ? Number(m.mastery_percent) : null,
        strength: m.strength,
      })),
      badgeProgress: dbUser.user_badge_progress.map((bp) => ({
        badgeName: bp.badges.name,
        currentValue: bp.current_value,
        targetValue: bp.target_value,
      })),
      earnedBadges: dbUser.user_badges.map((b) => ({
        badgeName: b.badges.name,
        earnedAt: b.earned_at.toISOString(),
      })),
      recentTestAttempts: testAttempts.map((t) => ({
        id: t.id,
        titleSnapshot: t.title_snapshot,
        source: t.source,
        status: t.status,
        totalQuestions: t.total_questions,
        correctCount: t.correct_count,
        scorePercent: t.score_percent ? Number(t.score_percent) : null,
        durationSeconds: t.duration_seconds,
        startedAt: t.started_at.toISOString(),
        submittedAt: fmtDate(t.submitted_at),
        subjectStats: t.attempt_subject_stats.map((s) => ({
          subjectName: s.subjects.name,
          correct: s.correct,
          incorrect: s.incorrect,
          unanswered: s.unanswered,
        })),
      })),
    },
    textAndCorrespondence: {
      cancellationFeedbacks: dbUser.cancellationFeedbacks.map((cf) => ({
        reason: cf.reason,
        feedback: cf.feedback,
        createdAt: cf.created_at.toISOString(),
      })),
      errorReports: errorReportRows.map((r: any) => ({
        id: r.id,
        itemId: r.item_id,
        itemType: r.item_type,
        errorCategory: r.error_category,
        description: r.description,
        status: r.status,
        triageOutcome: r.triage_outcome ?? null,
        triagedBy: r.triaged_by ?? null,
        triagedAt: r.triaged_at instanceof Date ? r.triaged_at.toISOString() : r.triaged_at ? String(r.triaged_at) : null,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      })),
      questionFeedbacks: questionFeedbackRows.map((qf: any) => ({
        id: qf.id,
        questionId: qf.question_id,
        examType: qf.exam_type ?? null,
        issueType: qf.issue_type ?? null,
        comment: qf.comment ?? null,
        status: qf.status ?? "open",
        adminReply: qf.admin_reply ?? null,
        repliedAt: qf.replied_at instanceof Date ? qf.replied_at.toISOString() : qf.replied_at ? String(qf.replied_at) : null,
        createdAt: qf.created_at instanceof Date ? qf.created_at.toISOString() : String(qf.created_at),
        messages: feedbackMessagesMap.get(qf.id) || [],
      })),
      templateFeedbacks: templateFeedbackRows.map((tf: any) => ({
        templateName: tf.template_name,
        severity: tf.severity,
        whatsWrong: tf.whats_wrong,
        sectionWhere: tf.section_where,
        issueType: tf.issue_type,
        wrongDetail: tf.wrong_detail ?? null,
        status: tf.status ?? "open",
        createdAt: tf.created_at instanceof Date ? tf.created_at.toISOString() : String(tf.created_at),
      })),
      libraryFeedbacks: libraryFeedbackRows.map((lf: any) => ({
        conditionName: lf.condition_name,
        feedback: lf.feedback,
        createdAt: lf.created_at instanceof Date ? lf.created_at.toISOString() : String(lf.created_at),
      })),
      bookmarkedQuestions: dbUser.user_question_bookmarks.map((bm) => ({
        questionId: bm.question_id,
        kind: bm.kind,
        note: bm.note,
        createdAt: bm.created_at.toISOString(),
      })),
    },
    savedAndFavorites: {
      savedTemplates: dbUser.user_saved_templates.map((st) => ({
        templateId: st.template_id,
        createdAt: st.created_at.toISOString(),
      })),
      favoriteMbsItems: dbUser.user_favourite_mbs_items.map((mbs) => ({
        itemNum: mbs.item_num,
        createdAt: mbs.created_at.toISOString(),
      })),
      quizConfigs: dbUser.quiz_configs.map((qc) => ({
        label: qc.label,
        difficulty: qc.difficulty,
        questionCount: qc.question_count,
        createdAt: qc.created_at.toISOString(),
      })),
      promoRedemptions: dbUser.promo_redemptions.map((pr) => ({
        promoCodeId: pr.promo_code_id,
        redeemedAt: pr.redeemed_at.toISOString(),
      })),
    },
    activityAndNotifications: {
      activeDaysCount,
      activityEventsCount,
      notificationsCount,
    },
    quotas: {
      freeQuestionsLeft: dbUser.free_questions_left,
      freeTemplatesLeft: dbUser.free_templates_left,
      freeTopicsLeft: dbUser.free_topics_left,
      hasPurchasedRegistrar: dbUser.has_purchased_registrar,
    },
    preferences: dbUser.user_preferences
      ? {
          theme: dbUser.user_preferences.theme,
          notificationsEnabled: dbUser.user_preferences.notifications_enabled,
          emailNotifications: dbUser.user_preferences.email_notifications,
          pushNotifications: dbUser.user_preferences.push_notifications,
          language: dbUser.user_preferences.language,
          timezone: dbUser.user_preferences.timezone,
        }
      : null,
  };
}

