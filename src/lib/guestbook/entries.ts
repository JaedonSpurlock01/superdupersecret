import { isDatabaseAvailable } from "@/lib/database-availability";
import type { GuestbookEntryJson } from "@/lib/guestbook/types";
import { getPrismaClient } from "@/lib/prisma";

/** Cap list size to bound read cost and payload size. */
export const GUESTBOOK_LIST_MAX = 2000;

export const guestbookSelect = {
  id: true,
  dotId: true,
  name: true,
  message: true,
  createdAt: true,
} as const;

export function toGuestbookJson(row: {
  id: string;
  dotId: string;
  name: string;
  message: string;
  createdAt: Date;
}): GuestbookEntryJson {
  return {
    id: row.id,
    dotId: row.dotId,
    name: row.name,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Every entry, newest first, or null when the database can't be reached. */
export async function getGuestbookEntries(): Promise<
  GuestbookEntryJson[] | null
> {
  if (!(await isDatabaseAvailable())) return null;
  const prisma = getPrismaClient();
  if (!prisma) return null;
  try {
    const rows = await prisma.guestbookEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: GUESTBOOK_LIST_MAX,
      select: guestbookSelect,
    });
    return rows.map(toGuestbookJson);
  } catch (err) {
    console.error("[getGuestbookEntries]", err);
    return null;
  }
}
