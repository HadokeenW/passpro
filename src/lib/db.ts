import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
 
// Optimize SQLite on-disk performance (WAL mode, memory cache, fast sync)
if (process.env.DATABASE_URL?.includes("file:")) {
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA cache_size = -64000;").catch(() => {});
  prisma.$queryRawUnsafe("PRAGMA temp_store = MEMORY;").catch(() => {});
}
