/**
 * Shared pg connection pool — replaces Prisma.
 * Uses the same DATABASE_URL already in .env.local.
 */
import { Pool } from "pg";

const globalForPool = globalThis as unknown as { pgPool: Pool | undefined };

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // 5 was too tight to let bulk operations (e.g. question import) run per-item work
    // concurrently instead of one round trip at a time — bumped to give that headroom
    // without approaching Neon's connection ceiling.
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

/** Run a parameterised query and return all rows. */
export async function query<T = Record<string, any>>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

/** Run a parameterised query and return the first row (or null). */
export async function queryOne<T = Record<string, any>>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const { rows } = await pool.query(sql, params);
  return (rows[0] as T) ?? null;
}

/** Run a statement (INSERT/UPDATE/DELETE) and return rowCount. */
export async function execute(sql: string, params?: any[]): Promise<number> {
  const { rowCount } = await pool.query(sql, params);
  return rowCount ?? 0;
}
