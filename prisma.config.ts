import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 keeps the connection URL here (it was removed from schema.prisma).
// `prisma db pull` / `prisma studio` use this to reach Neon. We use DIRECT_URL
// (Neon's non-pooled connection) for introspection, falling back to DATABASE_URL.
// The app itself connects via the adapter in lib/prisma.ts, not this file.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});
