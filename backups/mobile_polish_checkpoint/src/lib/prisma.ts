import { PrismaClient } from "../generated/client";
import { resolve } from "path";

// Point to the correct database file in the prisma directory
const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;

const globalForPrisma = globalThis as unknown as { db_v2?: PrismaClient };

export const db = globalForPrisma.db_v2 ?? new PrismaClient({
    datasources: {
        db: {
            url,
        },
    },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.db_v2 = db;
