// Single shared PrismaClient instance.
// Next.js hot-reloads modules in dev, which would otherwise open a new pool on
// every reload and exhaust Neon connections — so we cache the client on globalThis.
//
// NOTE: the import below resolves only after `npm run db:pull && npm run db:generate`
// has generated the client into lib/generated/prisma.
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // pg-connection-string warns that sslmode=require (and prefer/verify-ca) is
  // currently treated as verify-full but will adopt weaker libpq semantics in a
  // future major. We pin verify-full explicitly to preserve exact behavior.
  const connectionString = process.env.DATABASE_URL?.replace(
    /([?&])sslmode=(?:require|prefer|verify-ca)\b/i,
    "$1sslmode=verify-full",
  );

  // Prisma 7 driver adapter for Neon pooled connection string using node-postgres.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

