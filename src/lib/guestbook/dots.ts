import mapData from "@/lib/data/map.json";

const VALID_DOT_IDS = new Set(Object.keys(mapData.points));

export function isValidGuestbookDotId(dotId: string): boolean {
  return VALID_DOT_IDS.has(dotId);
}
