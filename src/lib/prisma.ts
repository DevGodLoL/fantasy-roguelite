import { PrismaClient } from "../generated/client";
import { resolve } from "path";

// --- DATABASE PATH UNIFICATION ---
// We check for env variable first, then fallback to the same prisma/dev.db location
const root = process.cwd();
const defaultDbPath = resolve(root, "prisma/dev.db");
const url = process.env.DATABASE_URL || `file:${defaultDbPath}`;

const globalForPrisma = globalThis as unknown as { db_v2?: PrismaClient };

export const db = globalForPrisma.db_v2 ?? new PrismaClient({
    datasources: {
        db: {
            url,
        },
    },
    // log: ['query', 'error', 'warn'], // Toggle for deep debugging
});

if (process.env.NODE_ENV !== "production") globalForPrisma.db_v2 = db;
