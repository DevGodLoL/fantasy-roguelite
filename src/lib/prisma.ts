import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// NOTE: In Next.js, process.env is configured automatically.

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("DATABASE_URL is missing. Ensure .env exists.");
}

const adapter = new PrismaBetterSqlite3({ url });

// Avoid creating many adapters/clients during Next dev hot reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
