/** Cursor = oldest visible reply in chronological order (first in asc-sorted list). */
export function encodeReplyCursor(isoDate: string, id: string): string {
  return Buffer.from(JSON.stringify({ t: isoDate, i: id }), "utf8").toString(
    "base64url",
  );
}
