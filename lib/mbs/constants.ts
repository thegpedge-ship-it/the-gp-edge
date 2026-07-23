/**
 * Shared MBS constants.
 *
 * Kept out of actions/mbs.actions.ts because a "use server" module may only
 * export async functions — a plain `export const` there makes Next.js reject
 * the entire module, and every action in it silently stops existing.
 */

/** Cards in the billing grid: 3 columns x 5 rows. */
export const MBS_RESULT_LIMIT = 15;

/**
 * How many ranked matches a search returns in total — 8 pages of results.
 *
 * Must stay a multiple of MBS_RESULT_LIMIT, and larger than it, or search
 * results fill a single page and the pagination control has nothing to show.
 *
 * The whole pool arrives in one request and is paged through on the client, so
 * moving between pages of results costs no further embedding call. Capped
 * because cosine similarity flattens out: past this depth the ordering carries
 * no real relevance signal and would present noise as ranking.
 */
export const MBS_SEARCH_POOL = MBS_RESULT_LIMIT * 8;
