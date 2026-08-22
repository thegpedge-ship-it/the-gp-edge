"use server";

import { query, queryOne, execute } from "@/lib/db";
import {
  PermissionUser,
  evaluateRelationalPermission,
  recordAuditLog,
} from "@/lib/relationalPermissions";

export type ReviewOutcome =
  | "no_changes_required"
  | "minor_revisions"
  | "major_revisions"
  | "unable_to_verify";

export interface GuidelineInfo {
  name: string;
  version: string;
  date: string;
}

export interface ReviewRubric {
  guidelineConsulted: GuidelineInfo;
  doseVerificationSource?: string;
  reviewOutcome: ReviewOutcome;
  redFlagCheck: boolean;
  signOffDeclaration: boolean;
  comments: string;
  rubricVersion?: number;
}

export interface ReviewRecord {
  id: string;
  itemId: string;
  itemType: string;
  reviewerId: string;
  reviewerName?: string;
  status: "draft" | "submitted";
  outcome: ReviewOutcome;
  rubricVersion: number;
  rubricData: ReviewRubric;
  isCorrection: boolean;
  originalReviewId?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const REVIEW_OUTCOME_DEFINITIONS: Record<
  ReviewOutcome,
  { label: string; meaning: string; badgeColor: string }
> = {
  no_changes_required: {
    label: "No changes required",
    meaning: "Content verified as correct against current sources",
    badgeColor: "emerald",
  },
  minor_revisions: {
    label: "Minor revisions",
    meaning: "Wording, clarity or emphasis; no clinical error",
    badgeColor: "amber",
  },
  major_revisions: {
    label: "Major revisions",
    meaning: "Clinical error, omission or outdated content",
    badgeColor: "rose",
  },
  unable_to_verify: {
    label: "Unable to verify / clinically contested",
    meaning: "Guidelines are silent, conflict, or the position is genuinely disputed",
    badgeColor: "purple",
  },
};

/**
 * Validates that all required rubric structured fields are completed before submission.
 * Submission is strictly blocked where required fields are incomplete — not merely discouraged.
 */
export function validateRubricSubmission(rubric: ReviewRubric): { valid: boolean; error?: string } {
  if (!rubric) {
    return { valid: false, error: "Review rubric structured data is required." };
  }
  if (
    !rubric.guidelineConsulted ||
    !rubric.guidelineConsulted.name?.trim() ||
    !rubric.guidelineConsulted.version?.trim() ||
    !rubric.guidelineConsulted.date?.trim()
  ) {
    return {
      valid: false,
      error: "Guideline consulted with name, version, and date is required.",
    };
  }
  if (!rubric.reviewOutcome) {
    return { valid: false, error: "Review outcome is required." };
  }
  const validOutcomes: ReviewOutcome[] = [
    "no_changes_required",
    "minor_revisions",
    "major_revisions",
    "unable_to_verify",
  ];
  if (!validOutcomes.includes(rubric.reviewOutcome)) {
    return { valid: false, error: "Invalid review outcome selected." };
  }
  if (rubric.redFlagCheck !== true) {
    return { valid: false, error: "Red-flag check verification is required." };
  }
  if (rubric.signOffDeclaration !== true) {
    return { valid: false, error: "Clinical sign-off declaration is required." };
  }
  if (!rubric.comments || rubric.comments.trim().length < 5) {
    return { valid: false, error: "Review comments are required (minimum 5 characters)." };
  }
  return { valid: true };
}

/**
 * Saves partial review work as a draft rubric.
 * Scope S: Reviewer can edit their own unsubmitted draft freely.
 */
export async function saveDraftRubricAction(params: {
  reviewId?: string;
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  rubric: Partial<ReviewRubric>;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const { reviewId, itemId, itemType, rubric, adminUser } = params;

    // Relational check: Self-review prohibition (Rule R12)
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "save_draft_rubric",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const currentRubricVersion = rubric.rubricVersion || 1;
    const rubricJson = JSON.stringify(rubric);
    let targetReviewId = reviewId;

    if (targetReviewId) {
      // Ensure existing record is still in draft state (Rule R13 Immutability check)
      const existing = await queryOne<any>(
        `SELECT id, status, reviewer_id FROM item_reviews WHERE id = $1`,
        [targetReviewId]
      );

      if (existing) {
        if (existing.status === "submitted") {
          return {
            success: false,
            error: "Rule R13 Violation: Submitted review rubrics are strictly immutable and cannot be edited.",
          };
        }
        if (existing.reviewer_id !== adminUser.id && adminUser.role !== "SA") {
          return {
            success: false,
            error: "Scope Violation: You can only edit your own unsubmitted draft rubric.",
          };
        }
        await execute(
          `UPDATE item_reviews
              SET rubric_data = $1::jsonb, updated_at = NOW()
            WHERE id = $2`,
          [rubricJson, targetReviewId]
        );
      }
    } else {
      // Create table if not exists safely
      await execute(`
        CREATE TABLE IF NOT EXISTS item_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          item_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          reviewer_id TEXT NOT NULL,
          reviewer_name TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          outcome TEXT,
          rubric_version INT NOT NULL DEFAULT 1,
          rubric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
          is_correction BOOLEAN NOT NULL DEFAULT FALSE,
          original_review_id UUID,
          submitted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO item_reviews
          (item_id, item_type, reviewer_id, reviewer_name, status, outcome, rubric_version, rubric_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7::jsonb, NOW(), NOW())
         RETURNING id`,
        [
          itemId,
          itemType,
          adminUser.id,
          adminUser.name || adminUser.email,
          rubric.reviewOutcome || null,
          currentRubricVersion,
          rubricJson,
        ]
      );
      if (inserted) targetReviewId = inserted.id;
    }

    return { success: true, reviewId: targetReviewId };
  } catch (err: any) {
    console.error("Error saving draft rubric:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Submits a completed review rubric.
 * FIXATIVE EVENT: Submission is blocked if required fields are incomplete.
 * Once submitted, record becomes STRICTLY IMMUTABLE (Rule R13).
 * Outcome 'unable_to_verify' routes item to SA and prevents publication.
 */
export async function submitRubricAction(params: {
  reviewId?: string;
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  rubric: ReviewRubric;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const { reviewId, itemId, itemType, rubric, adminUser } = params;

    // 1. Relational check: Self-review prohibition (Rule R12)
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "complete_rubric",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // 2. Validate required structured fields (Strict Blocking)
    const validation = validateRubricSubmission(rubric);
    if (!validation.valid) {
      return { success: false, error: `Submission Blocked: ${validation.error}` };
    }

    // 3. Immutability check if updating existing review
    if (reviewId) {
      const existing = await queryOne<any>(
        `SELECT id, status FROM item_reviews WHERE id = $1`,
        [reviewId]
      );
      if (existing && existing.status === "submitted") {
        return {
          success: false,
          error: "Rule R13 Violation: A submitted review rubric is strictly immutable and cannot be re-submitted or edited.",
        };
      }
    }

    const currentRubricVersion = rubric.rubricVersion || 1;
    const rubricJson = JSON.stringify(rubric);
    let finalReviewId = reviewId;

    if (finalReviewId) {
      await execute(
        `UPDATE item_reviews
            SET status = 'submitted',
                outcome = $1,
                rubric_version = $2,
                rubric_data = $3::jsonb,
                submitted_at = NOW(),
                updated_at = NOW()
          WHERE id = $4`,
        [rubric.reviewOutcome, currentRubricVersion, rubricJson, finalReviewId]
      );
    } else {
      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO item_reviews
          (item_id, item_type, reviewer_id, reviewer_name, status, outcome, rubric_version, rubric_data, submitted_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'submitted', $5, $6, $7::jsonb, NOW(), NOW(), NOW())
         RETURNING id`,
        [
          itemId,
          itemType,
          adminUser.id,
          adminUser.name || adminUser.email,
          rubric.reviewOutcome,
          currentRubricVersion,
          rubricJson,
        ]
      );
      if (inserted) finalReviewId = inserted.id;
    }

    // 4. Handle Review Outcome & Routing
    if (rubric.reviewOutcome === "unable_to_verify") {
      // Route item to SA resolution required & prevent publication
      if (itemType === "medical_condition" || itemType === "approach") {
        await execute(
          `UPDATE medical_conditions
              SET status = 'sa_resolution_required',
                  sa_review_requested = TRUE,
                  updated_at = NOW()
            WHERE id = $1`,
          [itemId]
        );
      } else if (itemType === "question") {
        await execute(
          `UPDATE questions
              SET status = 'sa_resolution_required',
                  updated_at = NOW()
            WHERE id = $1`,
          [itemId]
        );
      }
    } else if (rubric.reviewOutcome === "no_changes_required") {
      if (itemType === "medical_condition" || itemType === "approach") {
        await execute(
          `UPDATE medical_conditions SET status = 'reviewed', updated_at = NOW() WHERE id = $1`,
          [itemId]
        );
      } else if (itemType === "question") {
        await execute(
          `UPDATE questions SET status = 'review', updated_at = NOW() WHERE id = $1`,
          [itemId]
        );
      }
    }

    // 5. Record Immutable Audit Log
    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "submit_rubric",
      category: "peer_review",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        reviewId: finalReviewId,
        outcome: rubric.reviewOutcome,
        rubricVersion: currentRubricVersion,
        reviewer: adminUser.name || adminUser.email,
        routedToSA: rubric.reviewOutcome === "unable_to_verify",
      },
    });

    return { success: true, reviewId: finalReviewId };
  } catch (err: any) {
    console.error("Error submitting review rubric:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Submits a routine, blameless correcting review record.
 * Retains original review record intact while adding correcting review record to history.
 */
export async function submitCorrectingReviewAction(params: {
  originalReviewId: string;
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  rubric: ReviewRubric;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const { originalReviewId, itemId, itemType, rubric, adminUser } = params;

    // Relational check: Self-review prohibition (Rule R12)
    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "submit_correcting_review",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const validation = validateRubricSubmission(rubric);
    if (!validation.valid) {
      return { success: false, error: `Correction Blocked: ${validation.error}` };
    }

    const currentRubricVersion = rubric.rubricVersion || 1;
    const rubricJson = JSON.stringify(rubric);

    // Insert new correcting review record
    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO item_reviews
        (item_id, item_type, reviewer_id, reviewer_name, status, outcome, rubric_version, rubric_data, is_correction, original_review_id, submitted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'submitted', $5, $6, $7::jsonb, TRUE, $8, NOW(), NOW(), NOW())
       RETURNING id`,
      [
        itemId,
        itemType,
        adminUser.id,
        adminUser.name || adminUser.email,
        rubric.reviewOutcome,
        currentRubricVersion,
        rubricJson,
        originalReviewId,
      ]
    );

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "submit_correcting_review",
      category: "peer_review",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        originalReviewId,
        correctingReviewId: inserted?.id,
        outcome: rubric.reviewOutcome,
        reviewer: adminUser.name || adminUser.email,
      },
    });

    return { success: true, reviewId: inserted?.id };
  } catch (err: any) {
    console.error("Error submitting correcting review:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Reopens a completed review.
 * SA & CE ONLY! Creates a new review task while original review record remains intact.
 */
export async function reopenReviewAction(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template";
  reason: string;
  adminUser: PermissionUser;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { itemId, itemType, reason, adminUser } = params;

    const check = await evaluateRelationalPermission({
      user: adminUser,
      capability: "reopen_review",
      item: { id: itemId, type: itemType },
    });

    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // Reset item status to 'review' or 'in_review'
    if (itemType === "medical_condition" || itemType === "approach") {
      await execute(
        `UPDATE medical_conditions SET status = 'in_review', sa_review_requested = FALSE, updated_at = NOW() WHERE id = $1`,
        [itemId]
      );
    } else if (itemType === "question") {
      await execute(
        `UPDATE questions SET status = 'review', updated_at = NOW() WHERE id = $1`,
        [itemId]
      );
    }

    await recordAuditLog({
      adminUserId: adminUser.id,
      action: "reopen_review",
      category: "peer_review",
      entityType: itemType,
      entityId: itemId,
      metadata: {
        reopenedBy: adminUser.name || adminUser.email,
        reason,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error reopening review:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all review records for an item (including original and correcting records).
 */
export async function getItemReviewsAction(itemId: string): Promise<ReviewRecord[]> {
  try {
    const rows = await query<any>(
      `SELECT id, item_id, item_type, reviewer_id, reviewer_name, status, outcome, rubric_version, rubric_data, is_correction, original_review_id, submitted_at, created_at, updated_at
         FROM item_reviews
        WHERE item_id = $1
        ORDER BY created_at DESC`,
      [itemId]
    );

    return rows.map((r) => ({
      id: r.id,
      itemId: r.item_id,
      itemType: r.item_type,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name,
      status: r.status,
      outcome: r.outcome,
      rubricVersion: r.rubric_version,
      rubricData: typeof r.rubric_data === "string" ? JSON.parse(r.rubric_data) : r.rubric_data,
      isCorrection: r.is_correction,
      originalReviewId: r.original_review_id,
      submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : null,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching item reviews:", err);
    return [];
  }
}
