/**
 * Shared MBS constants.
 *
 * Kept out of actions/mbs.actions.ts because a "use server" module may only
 * export async functions — a plain `export const` there makes Next.js reject
 * the entire module, and every action in it silently stops existing.
 */

/**
 * How many ranked search matches the grid shows: 15 — a 3-column x 5-row grid.
 *
 * Only used for search now; the default (no-query) listing shows the user's
 * saved items in full and is not capped by this. Doubles as the loading
 * skeleton count.
 */
export const MBS_RESULT_LIMIT = 15;

/**
 * How many ranked matches a search returns — a single page of top results.
 *
 * The billing page shows only the strongest matches with no pagination, so the
 * pool equals one page. searchMbsAction still over-fetches internally (3x) across
 * both vector scans before merging, so these top results are chosen from a much
 * wider candidate set even though only this many are returned. Capping here also
 * respects that cosine similarity flattens out — past the top handful the
 * ordering carries no real relevance signal.
 */
export const MBS_SEARCH_POOL = MBS_RESULT_LIMIT;
