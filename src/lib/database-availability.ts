import { isDatabaseUrlConfigured } from "@/lib/database-url";
import { getPrismaClient } from "@/lib/prisma";

const TTL_MS = 60_000;
const HEALTH_TIMEOUT_MS = 5_000;

type CacheEntry = { checkedAt: number; ok: boolean };

let cache: CacheEntry | null = null;

/**
 * Whether the app can use Postgres for comments, guestbook, and view counts.
 * Result is cached briefly to avoid hammering the DB on every request.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (!isDatabaseUrlConfigured()) {
    return false;
  }

  const now = Date.now();
  if (cache && now - cache.checkedAt < TTL_MS) {
    return cache.ok;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    cache = { checkedAt: now, ok: false };
    return false;
  }

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), HEALTH_TIMEOUT_MS);
      }),
    ]);
    cache = { checkedAt: now, ok: true };
    return true;
  } catch {
    cache = { checkedAt: now, ok: false };
    return false;
  }
}
