/**
 * Item Performance Analytics & Defect Detection Engine
 *
 * Rules:
 * 1. Difficulty: proportion of attempts answered correctly.
 * 2. Discrimination: whether top-scoring cohort performs worse on this item than bottom-scoring cohort.
 *    (Primary defect signal — broken items have negative discrimination).
 * 3. Distractor Distribution: where an incorrect option is chosen more often than the correct answer,
 *    flag as ambiguous or accidentally correct.
 * 4. Threshold Auto-flagging: Minimum 20 attempts before any auto-flag.
 *    Crossing threshold auto-flags item and creates a remediation task in the single pipeline task queue.
 * 5. Privacy: Aggregates suppressed below minimum group size (< 5) to protect subscriber identity.
 */

import { query, queryOne, execute } from "@/lib/db";
import { recordAuditLog } from "@/lib/relationalPermissions";

export interface DistractorStats {
  optionIndex: number;
  optionText?: string;
  count: number;
  percentage: number;
  isCorrect: boolean;
}

export interface ItemAnalyticsResult {
  itemId: string;
  itemType: string;
  totalAttempts: number;
  difficultyPercent: number; // 0 - 100%
  discriminationIndex: number; // -1.00 to +1.00
  distractorDistribution: DistractorStats[];
  isDefective: boolean;
  defectReason?: string | null;
  autoRemediationTriggered: boolean;
  suppressedForPrivacy: boolean;
}

/**
 * Calculates item performance metrics and triggers single-queue remediation tasks when defective.
 */
export async function evaluateItemPerformanceAnalytics(params: {
  itemId: string;
  itemType: "question" | "medical_condition" | "approach" | "autofill_template" | "quiz" | "mock_test";
}): Promise<ItemAnalyticsResult> {
  const { itemId, itemType } = params;

  try {
    // 1. Fetch all completed attempts and user selections for this item
    const attemptRows = await query<any>(
      `SELECT ta.id as attempt_id, ta.user_id, ta.score_percent,
              (ta.answers->$1) as answer_payload
         FROM test_attempts ta
        WHERE (ta.answers->$1) IS NOT NULL
          AND (ta.status = 'completed' OR ta.score_percent IS NOT NULL)
        ORDER BY ta.created_at DESC`,
      [itemId]
    );

    const totalAttempts = attemptRows.length;

    // Minimum group size for aggregate reporting (Privacy protection)
    if (totalAttempts < 5) {
      return {
        itemId,
        itemType,
        totalAttempts,
        difficultyPercent: 0,
        discriminationIndex: 0,
        distractorDistribution: [],
        isDefective: false,
        autoRemediationTriggered: false,
        suppressedForPrivacy: true,
      };
    }

    // Parse answers
    let correctCount = 0;
    const optionCounts: Record<number, number> = {};
    const attemptsWithScores: { totalExamScore: number; isItemCorrect: boolean }[] = [];

    // Fetch question metadata for correct index
    let correctIndices: number[] = [0];
    if (itemType === "question") {
      const q = await queryOne<any>(
        `SELECT correct_index, correct_indices, options FROM questions WHERE id = $1::uuid OR id::text = $1`,
        [itemId]
      );
      if (q) {
        if (q.correct_indices && Array.isArray(q.correct_indices)) {
          correctIndices = q.correct_indices;
        } else if (q.correct_index !== null && q.correct_index !== undefined) {
          correctIndices = [Number(q.correct_index)];
        }
      }
    }

    for (const row of attemptRows) {
      let selectedIdx = -1;
      let isItemCorrect = false;

      if (row.answer_payload) {
        const payload =
          typeof row.answer_payload === "string"
            ? JSON.parse(row.answer_payload)
            : row.answer_payload;

        if (typeof payload === "number") {
          selectedIdx = payload;
          isItemCorrect = correctIndices.includes(selectedIdx);
        } else if (typeof payload === "object") {
          selectedIdx = payload.selectedIndex ?? payload.selectedOption ?? -1;
          isItemCorrect =
            payload.isCorrect === true ||
            correctIndices.includes(selectedIdx) ||
            (payload.selectedIndices &&
              payload.selectedIndices.some((idx: number) => correctIndices.includes(idx)));
        }
      }

      if (selectedIdx >= 0) {
        optionCounts[selectedIdx] = (optionCounts[selectedIdx] || 0) + 1;
      }

      if (isItemCorrect) {
        correctCount++;
      }

      attemptsWithScores.push({
        totalExamScore: Number(row.score_percent || 0),
        isItemCorrect,
      });
    }

    // 1. Difficulty: proportion of attempts answered correctly
    const difficultyPercent = Math.round((correctCount / totalAttempts) * 100);

    // 2. Discrimination: Upper 27% cohort vs Lower 27% cohort
    attemptsWithScores.sort((a, b) => b.totalExamScore - a.totalExamScore);
    const cohortSize = Math.max(1, Math.floor(attemptsWithScores.length * 0.27));
    const upperCohort = attemptsWithScores.slice(0, cohortSize);
    const lowerCohort = attemptsWithScores.slice(-cohortSize);

    const upperCorrect = upperCohort.filter((a) => a.isItemCorrect).length;
    const lowerCorrect = lowerCohort.filter((a) => a.isItemCorrect).length;

    const upperProp = upperCorrect / cohortSize;
    const lowerProp = lowerCorrect / cohortSize;
    const discriminationIndex = parseFloat((upperProp - lowerProp).toFixed(2));

    // 3. Distractor Distribution
    const distractorDistribution: DistractorStats[] = [];
    let mostSelectedDistractorIdx = -1;
    let mostSelectedDistractorCount = 0;

    for (let i = 0; i < 5; i++) {
      const count = optionCounts[i] || 0;
      const percentage = totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0;
      const isCorrect = correctIndices.includes(i);

      if (!isCorrect && count > mostSelectedDistractorCount) {
        mostSelectedDistractorCount = count;
        mostSelectedDistractorIdx = i;
      }

      distractorDistribution.push({
        optionIndex: i,
        count,
        percentage,
        isCorrect,
      });
    }

    // 4. Defect Detection & Threshold Auto-Flagging
    // Minimum 20 attempts before any auto-flag to prevent false positives
    let isDefective = false;
    let defectReason: string | null = null;
    let autoRemediationTriggered = false;

    if (totalAttempts >= 20) {
      // Primary Signal 1: Negative discrimination (top scorers perform worse than low scorers)
      if (discriminationIndex < -0.15) {
        isDefective = true;
        defectReason = `Negative discrimination index (${discriminationIndex}). Top-performing cohort scored worse than low-performing cohort.`;
      }
      // Primary Signal 2: Distractor inverted (an incorrect option is selected more often than correct answer)
      else if (mostSelectedDistractorCount > correctCount) {
        isDefective = true;
        defectReason = `Distractor inversion defect: Option #${mostSelectedDistractorIdx + 1} was selected by ${mostSelectedDistractorCount} users, exceeding correct answer count (${correctCount}).`;
      }

      // If defective, create a remediation task in the single queue
      if (isDefective) {
        await execute(
          `UPDATE questions SET status = 'review', updated_at = NOW() WHERE id::text = $1`,
          [itemId]
        ).catch(() => {});

        // Insert into pipeline_tasks single queue
        await execute(`
          INSERT INTO pipeline_tasks
            (item_id, item_type, task_type, assigned_to, assigned_to_name, status, rework_type, created_at, updated_at)
          VALUES ($1, $2, 'remediation', 'unassigned', 'Remediation Pool', 'offered', 'change_of_direction', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [itemId, itemType]).catch(() => {});

        autoRemediationTriggered = true;

        await recordAuditLog({
          adminUserId: null,
          action: "item_auto_flag_defect",
          category: "analytics",
          entityType: itemType,
          entityId: itemId,
          metadata: {
            totalAttempts,
            difficultyPercent,
            discriminationIndex,
            defectReason,
            autoRemediationTriggered: true,
          },
        });
      }
    }

    return {
      itemId,
      itemType,
      totalAttempts,
      difficultyPercent,
      discriminationIndex,
      distractorDistribution,
      isDefective,
      defectReason,
      autoRemediationTriggered,
      suppressedForPrivacy: false,
    };
  } catch (err: any) {
    console.error("[evaluateItemPerformanceAnalytics] Error:", err);
    return {
      itemId,
      itemType,
      totalAttempts: 0,
      difficultyPercent: 0,
      discriminationIndex: 0,
      distractorDistribution: [],
      isDefective: false,
      autoRemediationTriggered: false,
      suppressedForPrivacy: true,
    };
  }
}
