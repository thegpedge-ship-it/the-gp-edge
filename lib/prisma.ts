// Single shared PrismaClient instance.
// Next.js hot-reloads modules in dev, which would otherwise open a new pool on
// every reload and exhaust Neon connections — so we cache the client on globalThis.
//
// NOTE: the import below resolves only after `npm run db:pull && npm run db:generate`
// has generated the client into lib/generated/prisma.
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

// Prisma 7 uses a driver adapter at runtime. PrismaPg talks to Neon over the
// pooled connection string (the "-pooler" host) using node-postgres.
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
