import { NextResponse } from "next/server";

type PresenceStore = Map<string, number>;

function getStore(): PresenceStore {
  const g = globalThis as unknown as { __presenceStore?: PresenceStore };
  if (!g.__presenceStore) g.__presenceStore = new Map();
  return g.__presenceStore;
}

export async function POST(req: Request) {
  const store = getStore();
  const now = Date.now();
  const ttlMs = 30_000;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // ignore invalid json
  }

  const clientId =
    typeof body === "object" && body !== null && "clientId" in body
      ? (body as { clientId?: unknown }).clientId
      : null;
  const disconnect =
    typeof body === "object" && body !== null && "disconnect" in body
      ? Boolean((body as { disconnect?: unknown }).disconnect)
      : false;

  if (typeof clientId === "string" && clientId.trim()) {
    if (disconnect) store.delete(clientId);
    else store.set(clientId, now);
  }

  // prune stale
  for (const [id, lastSeen] of store.entries()) {
    if (now - lastSeen > ttlMs) store.delete(id);
  }

  return NextResponse.json({ online: store.size });
}

