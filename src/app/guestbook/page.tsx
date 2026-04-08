"use client";

import { useEffect, useMemo, useState } from "react";
import { GuestbookMap } from "@/components/guestbook-map";
import { StaggerContainer } from "@/components/stagger-container";
import { Button } from "@/components/ui/button";

type GuestbookEntry = {
  id: string;
  dotId: string;
  name: string;
  message: string;
  date: string;
};

const GUESTBOOK_ENTRIES: GuestbookEntry[] = [
  {
    id: "1",
    dotId: "73;0",
    name: "Alex",
    message: "Loved exploring your work – super inspiring portfolio.",
    date: "2025-11-12",
  },
  {
    id: "2",
    dotId: "37;0",
    name: "Taylor",
    message: "Dropping a pin from Berlin. Keep building cool things.",
    date: "2025-11-13",
  },
  {
    id: "3",
    dotId: "16;0",
    name: "Jordan",
    message: "Really enjoyed the writing style in your blog posts.",
    date: "2025-11-18",
  },
];

export default function GuestbookPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeDotId, setActiveDotId] = useState<string | null>(null);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isEntryVisible, setIsEntryVisible] = useState(false);
  const [guestName, setGuestName] = useState<string>("Guest");
  const [draftMessage, setDraftMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const entriesByDotId = useMemo(
    () =>
      GUESTBOOK_ENTRIES.reduce<Record<string, GuestbookEntry[]>>(
        (acc, entry) => {
          if (!acc[entry.dotId]) acc[entry.dotId] = [];
          acc[entry.dotId].push(entry);
          return acc;
        },
        {},
      ),
    [],
  );

  const activeEntries =
    activeDotId && entriesByDotId[activeDotId]
      ? entriesByDotId[activeDotId]
      : [];

  const dotCommentCounts = useMemo(
    () =>
      GUESTBOOK_ENTRIES.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.dotId] = (acc[entry.dotId] ?? 0) + 1;
        return acc;
      }, {}),
    [],
  );

  useEffect(() => {
    if (isEntryOpen) {
      const id = window.setTimeout(() => setIsEntryVisible(true), 15);
      return () => window.clearTimeout(id);
    }
    setIsEntryVisible(false);
  }, [isEntryOpen]);

  useEffect(() => {
    const storageKey = "guestbook:guestName";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      setGuestName(existing);
      return;
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    const generated = `Guest ${suffix}`;
    window.localStorage.setItem(storageKey, generated);
    setGuestName(generated);
  }, []);

  useEffect(() => {
    const storageKey = "presence:clientId";
    const clientId =
      window.localStorage.getItem(storageKey) ??
      (() => {
        const id =
          typeof window.crypto?.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(storageKey, id);
        return id;
      })();

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { online: number };
        if (!cancelled) setOnlineCount(data.online);
      } catch {
        // ignore; keep last known count
      }
    };

    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      try {
        navigator.sendBeacon(
          "/api/presence",
          JSON.stringify({ clientId, disconnect: true }),
        );
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center pt-10 pb-20 px-4">
      <StaggerContainer className="w-full max-w-3xl">
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Guestbook</h1>
            <p className="text-sm text-muted-foreground">
              Explore the world map of visitors and the notes they&apos;ve left
              behind.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white dark:bg-black">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="inline-flex items-center gap-2">
                <div
                  className="relative grid h-2.5 w-2.5 place-items-center"
                  aria-label={`Players online: ${onlineCount ?? "—"}`}
                  title={`Players online: ${onlineCount ?? "—"}`}
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/40 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
                  {onlineCount ?? "—"}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-0.5 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "map" ? "default" : "ghost"}
                  className={`h-7 rounded-full px-3 text-xs ${viewMode === "map"
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : ""
                    }`}
                  onClick={() => setViewMode("map")}
                >
                  Map
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className={`h-7 rounded-full px-3 text-xs ${viewMode === "list"
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : ""
                    }`}
                  onClick={() => setViewMode("list")}
                >
                  Entries
                </Button>
              </div>
            </div>

            <div className="p-4">
              {viewMode === "map" ? (
                <GuestbookMap
                  dotCommentCounts={dotCommentCounts}
                  onDotClick={(dotId) => {
                    setActiveDotId(dotId);
                    setIsEntryOpen(true);
                  }}
                />
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {GUESTBOOK_ENTRIES.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium leading-tight">
                          {entry.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.date}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-foreground">
                        {entry.message}
                      </p>
                    </div>
                  ))}
                  {GUESTBOOK_ENTRIES.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No guestbook entries yet. Be the first to leave a note.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </StaggerContainer>

      {isEntryOpen && (
        <div
          className={`fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isEntryVisible ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setIsEntryOpen(false)}
        >
          <div
            className={`mx-4 w-full max-w-md rounded-md border border-border bg-background/95 p-4 transform-gpu transition-all duration-200 ease-out ${isEntryVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-1"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Guestbook entry
                </p>
                <p className="text-sm font-medium">
                  {activeEntries.length > 0
                    ? `Pinned at ${activeDotId}`
                    : "No entries yet"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setIsEntryOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {activeEntries.length > 0 ? (
                activeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border bg-background px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium leading-tight">
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.date}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-foreground">
                      {entry.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nobody has left a note on this location yet.
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-border pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Add your note
              </p>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draftMessage.trim()) {
                    return;
                  }
                  // For now, just log; later this will persist to storage.
                  console.log("New guestbook entry", {
                    name: guestName,
                    message: draftMessage.trim(),
                    dotId: activeDotId,
                  });
                  setDraftMessage("");
                }}
              >
                <div className="flex gap-2">
                  <textarea
                    placeholder="Say hello or leave a short note…"
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-md border border-border bg-background px-2 py-1 text-xs leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-3 text-xs"
                    disabled={!draftMessage.trim()}
                  >
                    Post entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

