// ============================================================
// lib/db.js — Prisma Client Singleton
// ============================================================
// Next.js hot-reloads in dev, which creates multiple Prisma
// clients. This singleton prevents "too many connections" errors.
// In production, a single instance is used per serverless function.
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
