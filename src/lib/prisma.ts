import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPgPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // `prisma init` / docs often leave this example in .env — it is not a real user.
  if (
    /\/\/johndoe:/i.test(connectionString) ||
    /:randompassword@/i.test(connectionString)
  ) {
    throw new Error(
      "DATABASE_URL still uses the Prisma placeholder (johndoe / randompassword). Replace it with your real Postgres URL from your host (Neon, Supabase, etc.) or create a local user and database.",
    );
  }

  const config: PoolConfig = {
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: 20_000,
  };

  return new Pool(config);
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pgPool ?? createPgPool();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
