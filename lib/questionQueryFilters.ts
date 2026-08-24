// Shared question-bank filter WHERE-clause builder, used by both the bulk-edit flow
// (actions/question.actions.ts) and the Query Explorer (actions/queryExplorer.actions.ts).
// Plain module (no "use server") because Next.js requires every export of a server-action
// file to be an async function — this is a sync helper, not a callable action.
export interface BulkQuestionFilters {
  examType?: string;
  status?: string;
  difficulty?: string;
  taskType?: string;
  depthTier?: string;
  volatilityTier?: string;
  batchId?: string;
  topicCode?: string; // subtopic slug, e.g. "t0142"
  writtenBy?: string; // admin_users.id
  createdFrom?: string; // ISO date
  createdTo?: string; // ISO date
  keyword?: string;
}

export function buildBulkQuestionWhereClause(filters: BulkQuestionFilters): { where: string; params: any[] } {
  const conditions: string[] = ["q.deleted_at IS NULL"];
  const params: any[] = [];
  if (filters.examType) {
    params.push(filters.examType.toUpperCase());
    conditions.push(`q.exam_type_code = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status.toLowerCase());
    conditions.push(`q.status = $${params.length}`);
  }
  if (filters.difficulty) {
    params.push(filters.difficulty.toLowerCase());
    conditions.push(`q.difficulty = $${params.length}`);
  }
  if (filters.taskType) {
    params.push(filters.taskType);
    conditions.push(`q.task_type = $${params.length}`);
  }
  if (filters.depthTier) {
    params.push(filters.depthTier);
    conditions.push(`q.depth_tier = $${params.length}`);
  }
  if (filters.volatilityTier) {
    params.push(filters.volatilityTier);
    conditions.push(`q.volatility_tier = $${params.length}`);
  }
  if (filters.batchId) {
    params.push(filters.batchId);
    conditions.push(`q.batch_id = $${params.length}`);
  }
  if (filters.topicCode) {
    params.push(filters.topicCode.toLowerCase());
    conditions.push(`st.slug = $${params.length}`);
  }
  if (filters.writtenBy) {
    params.push(filters.writtenBy);
    conditions.push(`q.created_by = $${params.length}`);
  }
  if (filters.createdFrom) {
    params.push(filters.createdFrom);
    conditions.push(`q.created_at >= $${params.length}`);
  }
  if (filters.createdTo) {
    params.push(filters.createdTo);
    conditions.push(`q.created_at <= $${params.length}`);
  }
  if (filters.keyword) {
    params.push(`%${filters.keyword}%`);
    const p = params.length;
    conditions.push(`(q.stem ILIKE $${p} OR q.lead_in ILIKE $${p} OR q.why_correct ILIKE $${p} OR q.knowledge_bank ILIKE $${p} OR q.pearl ILIKE $${p} OR q.testable_point ILIKE $${p})`);
  }
  return { where: conditions.join(" AND "), params };
}
