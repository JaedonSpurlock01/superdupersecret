"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GuestbookComposer } from "@/components/guestbook-composer";
import { GuestbookMap } from "@/components/guestbook-map";
import { StaggerContainer } from "@/components/stagger-container";
import { Button } from "@/components/ui/button";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";
import type {
  GuestbookEntryJson,
  GuestbookListJson,
} from "@/lib/guestbook/types";
import { cn } from "@/lib/utils";

const GUEST_NAME_KEY = "guestbook:guestName";
const CLIENT_ID_KEY = "presence:clientId";

function formatPostedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function GuestbookPageIntro() {
  return (
    <div>
      <AnimatedTextLink href="/" arrowSide="left">
        Guestbook
      </AnimatedTextLink>
      <p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        Explore the world map of visitors and the notes they&apos;ve left
        behind.
      </p>
    </div>
  );
}

function EntryCard({
  entry,
  onSelect,
  showDelete,
  onDelete,
  deleting,
  mineLabel,
}: {
  entry: GuestbookEntryJson;
  onSelect?: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
  mineLabel?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium leading-tight line-clamp-1">
          {entry.name}
        </p>
        <time
          className="max-w-[min(100%,12rem)] shrink-0 text-right text-xs text-muted-foreground tabular-nums line-clamp-1"
          dateTime={entry.createdAt}
        >
          {formatPostedAt(entry.createdAt)}
        </time>
      </div>
      {mineLabel && (
        <p className="mt-1 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
          (you)
        </p>
      )}
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        {entry.message}
      </p>
    </>
  );

  if (showDelete && onDelete) {
    return (
      <div
        className={cn(
          "flex w-full items-stretch overflow-hidden rounded-md border transition-colors",
          "hover:bg-muted/50 hover:border-border/80",
          mineLabel
            ? "border-primary/30 bg-muted/15 hover:bg-muted/35"
            : "border-border/60",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "min-w-0 flex-1 px-3 py-2.5 text-left outline-none",
            "focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          )}
        >
          {inner}
        </button>
        <div
          className="flex shrink-0 items-stretch border-l border-border/50"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-auto min-h-9 w-10 shrink-0 rounded-none text-muted-foreground hover:bg-transparent hover:text-destructive"
            disabled={deleting}
            aria-label="Delete your entry"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-md border border-border/60 px-3 py-2.5 text-left transition-colors",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border/60 px-3 py-2.5">
      {inner}
    </div>
  );
}

export default function GuestbookPage() {
  const [activeDotId, setActiveDotId] = useState<string | null>(null);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isEntryVisible, setIsEntryVisible] = useState(false);
  const [guestName, setGuestName] = useState<string>("");
  const [draftMessage, setDraftMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [entries, setEntries] = useState<GuestbookEntryJson[]>([]);
  const [myEntry, setMyEntry] = useState<GuestbookEntryJson | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(false);

  const loadGuestbook = useCallback(async (id: string) => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const res = await fetch(
        `/api/guestbook?deviceId=${encodeURIComponent(id)}`,
      );
      const raw = (await res.json()) as GuestbookListJson & {
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        const msg = [raw.error, raw.detail].filter(Boolean).join(" — ");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      setEntries(raw.entries ?? []);
      const mine = raw.mine ?? null;
      setMyEntry(mine);
      if (mine) {
        setGuestName(mine.name);
        window.localStorage.setItem(GUEST_NAME_KEY, mine.name);
        setDraftMessage(mine.message);
      }
    } catch (e) {
      setEntriesError(
        e instanceof Error ? e.message : "Could not load guestbook.",
      );
      setEntries([]);
      setMyEntry(null);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const storageKey = CLIENT_ID_KEY;
    const existing = window.localStorage.getItem(storageKey);
    const id =
      existing ??
      (() => {
        const generated =
          typeof window.crypto?.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(storageKey, generated);
        return generated;
      })();
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    void loadGuestbook(deviceId);
  }, [deviceId, loadGuestbook]);

  useEffect(() => {
    const stored = window.localStorage.getItem(GUEST_NAME_KEY);
    if (stored) {
      setGuestName(stored);
      return;
    }
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const generated = `Guest ${suffix}`;
    window.localStorage.setItem(GUEST_NAME_KEY, generated);
    setGuestName(generated);
  }, []);

  const entriesByDotId = useMemo(
    () =>
      entries.reduce<Record<string, GuestbookEntryJson[]>>((acc, entry) => {
        if (!acc[entry.dotId]) acc[entry.dotId] = [];
        acc[entry.dotId].push(entry);
        return acc;
      }, {}),
    [entries],
  );

  const activeEntries =
    activeDotId && entriesByDotId[activeDotId]
      ? entriesByDotId[activeDotId]
      : [];

  const dotCommentCounts = useMemo(
    () =>
      entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.dotId] = (acc[entry.dotId] ?? 0) + 1;
        return acc;
      }, {}),
    [entries],
  );

  const sidebarEntries = useMemo(() => {
    if (!myEntry) return entries;
    const rest = entries.filter((e) => e.id !== myEntry.id);
    return [myEntry, ...rest];
  }, [entries, myEntry]);

  useEffect(() => {
    if (isEntryOpen) {
      const t = window.setTimeout(() => setIsEntryVisible(true), 15);
      return () => window.clearTimeout(t);
    }
    setIsEntryVisible(false);
  }, [isEntryOpen]);

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientId: deviceId }),
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
          JSON.stringify({ clientId: deviceId, disconnect: true }),
        );
      } catch {
        // ignore
      }
    };
  }, [deviceId]);

  const submitEntry = async () => {
    const message = draftMessage.trim();
    const name = guestName.trim();
    if (!deviceId || !activeDotId || !message || !name || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          dotId: activeDotId,
          name,
          message,
        }),
      });
      const raw = (await res.json()) as { error?: string; entry?: GuestbookEntryJson };
      if (!res.ok) {
        setEntriesError(raw.error ?? "Could not save entry.");
        return;
      }
      window.localStorage.setItem(GUEST_NAME_KEY, name);
      setDraftMessage("");
      setEntriesError(null);
      await loadGuestbook(deviceId);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMyEntry = async () => {
    if (!deviceId || deletingEntry) return;
    if (
      !confirm(
        "Remove your guestbook entry? You can leave a new one afterward.",
      )
    ) {
      return;
    }
    setDeletingEntry(true);
    setEntriesError(null);
    try {
      const res = await fetch(
        `/api/guestbook?deviceId=${encodeURIComponent(deviceId)}`,
        { method: "DELETE" },
      );
      const raw = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEntriesError(raw.error ?? "Could not delete entry.");
        return;
      }
      setDraftMessage("");
      await loadGuestbook(deviceId);
    } finally {
      setDeletingEntry(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl grid-cols-1 gap-y-10 px-4 pt-20 pb-20 md:grid-cols-6 lg:px-0">
      <StaggerContainer
        className="order-1 md:hidden"
        delayStep={100}
      >
        <GuestbookPageIntro />
      </StaggerContainer>

      <StaggerContainer
        className="order-2 flex min-w-0 flex-col gap-4 md:order-0 md:col-span-4 md:col-start-3 md:row-start-1 md:pl-4"
        delayStep={100}
      >
        <div className="space-y-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Map
          </h2>
          <p className="text-sm text-muted-foreground">
            Pan, zoom, and tap a pin to read notes from that spot.
          </p>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <GuestbookMap
            dotCommentCounts={dotCommentCounts}
            onDotClick={(dotId) => {
              setActiveDotId(dotId);
              setIsEntryOpen(true);
            }}
          />
        </div>
      </StaggerContainer>

      <StaggerContainer
        className="order-3 flex h-fit flex-col gap-10 md:sticky md:top-6 md:order-0 md:col-span-2 md:col-start-1 md:row-start-1"
        delayStep={100}
      >
        <div className="hidden md:block">
          <GuestbookPageIntro />
        </div>

        <section aria-labelledby="guestbook-active-heading">
          <h2
            id="guestbook-active-heading"
            className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wider uppercase font-medium"
          >
            Active on this page
          </h2>
          <div className="mt-4 flex items-start gap-3 rounded-md border border-border p-4">
            <div
              className="relative mt-0.5 grid h-2.5 w-2.5 shrink-0 place-items-center"
              aria-label={`Visitors online: ${onlineCount ?? "—"}`}
              title={`Visitors online: ${onlineCount ?? "—"}`}
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/35 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium tabular-nums text-foreground">
                {onlineCount === null ? (
                  <span className="font-normal text-muted-foreground">
                    Connecting…
                  </span>
                ) : (
                  <>
                    {onlineCount}{" "}
                    <span className="font-normal text-muted-foreground">
                      {onlineCount === 1 ? "visitor" : "visitors"}
                    </span>
                  </>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Updates every few seconds while you&apos;re here.
              </p>
            </div>
          </div>
        </section>

        <section
          className="flex min-h-0 flex-col gap-4"
          aria-labelledby="guestbook-entries-heading"
        >
          <div>
            <h2
              id="guestbook-entries-heading"
              className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wider uppercase font-medium"
            >
              Entries
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select an entry to open its location on the map.
            </p>
          </div>
          <div className="flex max-h-[min(420px,calc(100vh-14rem))] md:max-h-[min(520px,calc(100vh-12rem))] flex-col gap-3 overflow-y-auto pr-1">
            {entriesLoading && (
              <p className="text-sm text-muted-foreground">Loading entries…</p>
            )}
            {entriesError && !entriesLoading && (
              <p className="text-sm text-destructive">{entriesError}</p>
            )}
            {!entriesLoading &&
              !entriesError &&
              sidebarEntries.map((entry) => {
                const isMine = Boolean(myEntry && entry.id === myEntry.id);
                return (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    mineLabel={isMine}
                    showDelete={isMine}
                    onDelete={isMine ? deleteMyEntry : undefined}
                    deleting={isMine ? deletingEntry : undefined}
                    onSelect={() => {
                      setActiveDotId(entry.dotId);
                      setIsEntryOpen(true);
                    }}
                  />
                );
              })}
            {!entriesLoading && !entriesError && entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No guestbook entries yet. Be the first to leave a note.
              </p>
            )}
          </div>
        </section>
      </StaggerContainer>

      {isEntryOpen && (
        <div
          className={`fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
            isEntryVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsEntryOpen(false)}
        >
          <div
            className={`mx-4 w-full max-w-md overflow-hidden rounded-md border border-border bg-background p-5 shadow-lg transform-gpu transition-all duration-200 ease-out ${
              isEntryVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-1"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wider uppercase font-medium">
                  Guestbook entry
                </p>
                <p className="text-base font-medium tracking-tight text-foreground">
                  {activeEntries.length > 0
                    ? `Pinned at ${activeDotId}`
                    : "No entries yet"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 rounded-sm px-2 text-xs"
                onClick={() => setIsEntryOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
              {activeEntries.length > 0 ? (
                activeEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nobody has left a note on this location yet.
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 tracking-wider uppercase font-medium">
                {myEntry ? "Your note" : "Add your note"}
              </p>
              {myEntry && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  You&apos;ve already signed the guestbook. Delete your entry in
                  the sidebar to leave a new one.
                </p>
              )}
              {!activeDotId ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Select a location on the map to leave a note.
                </p>
              ) : (
                <div className="mt-4">
                  <GuestbookComposer
                    name={guestName}
                    onNameChange={(v) => {
                      setGuestName(v);
                      window.localStorage.setItem(GUEST_NAME_KEY, v);
                    }}
                    value={draftMessage}
                    onChange={setDraftMessage}
                    onSubmit={submitEntry}
                    disabled={submitting || !deviceId || Boolean(myEntry)}
                    submitLabel="Post entry"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
