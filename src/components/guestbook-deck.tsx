"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_PATH,
  type Dot,
  dotById,
  guessDot,
  HOME,
  nearestDot,
  placeNear,
  toMap,
  VIEWBOX,
} from "@/lib/guestbook/map";
import {
  GUESTBOOK_MESSAGE_MAX,
  GUESTBOOK_NAME_MAX,
  type GuestbookEntryJson,
  type GuestbookListJson,
} from "@/lib/guestbook/types";
import { cn } from "@/lib/utils";

/**
 * The guestbook as a deck of postcards. Each note is a card addressed to
 * Orlando, stamped with the patch of map it came from. The card on top can be
 * dragged, clicked or stepped away to the back; the map underneath draws its
 * route. Signing means writing on a blank card and sending it.
 *
 * A visitor is one device (an id kept in localStorage) and gets one card,
 * which they can rewrite or remove. Their spot starts as a guess from their
 * time zone; tapping the map moves it.
 *
 * Styles live in globals.css under "Guestbook".
 */

/** Shared with the presence beacon, so one visitor is one id site-wide. */
const DEVICE_ID_KEY = "presence:clientId";
const NAME_KEY = "guestbook:guestName";

/** Cards visible in the deck; the rest wait underneath, unrendered. */
const DEPTH = 3;
/** How far (px) or fast (px/ms) the top card must be pulled to leave. */
const SWIPE = { distance: 70, velocity: 0.5 };
/** A click on the map picks the closest card within this many map units. */
const REACH = 5;

type Card = {
  id: string;
  name: string;
  message: string;
  place: string;
  x: number;
  y: number;
  date: string;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const toCard = (e: GuestbookEntryJson): Card | null => {
  const dot = dotById(e.dotId);
  if (!dot) return null;
  return {
    id: e.id,
    name: e.name,
    message: e.message,
    place: placeNear(dot),
    x: dot.x,
    y: dot.y,
    date: dateFormat.format(new Date(e.createdAt)),
  };
};

/** A small, stable tilt per card so the deck looks handled. */
const tilt = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return ((h % 9) - 4) * 0.6;
};

const stackTransform = (pos: number, rot: number) =>
  `translateY(${pos * 9}px) scale(${1 - pos * 0.045}) rotate(${pos === 0 ? rot * 0.4 : rot}deg)`;

/** The route a card took: a shallow arc from its dot to Orlando. */
const arc = (from: { x: number; y: number }) => {
  const mx = (from.x + HOME.x) / 2;
  const my =
    (from.y + HOME.y) / 2 - Math.hypot(from.x - HOME.x, from.y - HOME.y) * 0.22;
  return `M${from.x} ${from.y}Q${mx} ${my} ${HOME.x} ${HOME.y}`;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const storage = {
  get: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
};

function deviceId() {
  const existing = storage.get(DEVICE_ID_KEY);
  if (existing) return existing;
  const id =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage.set(DEVICE_ID_KEY, id);
  return id;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
  return body;
}

function Stamp({ at }: { at: { x: number; y: number } }) {
  return (
    <div className="gb-stamp w-14 shrink-0 sm:w-16">
      <svg
        viewBox={`${at.x - 8} ${at.y - 9} 16 18`}
        aria-hidden="true"
        className="block w-full bg-card"
      >
        <path d={BASE_PATH} className="gb-land" />
        <circle cx={at.x} cy={at.y} r={1.1} fill="var(--gb-accent)" />
      </svg>
    </div>
  );
}

/** The layout every card shares: writing on the left, postage on the right. */
function CardFace({
  at,
  place,
  date,
  children,
}: {
  at: { x: number; y: number } | null;
  place: string;
  date: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col p-4">{children}</div>
      <div className="my-4 w-px bg-border" />
      <div className="flex w-[36%] shrink-0 flex-col items-end p-4 pl-3">
        <div className="relative">
          {at ? <Stamp at={at} /> : <div className="h-16 w-14 sm:w-16" />}
          <span className="absolute top-1/2 -left-7 flex size-11 -rotate-12 items-center justify-center rounded-full border border-foreground/25 text-center font-mono text-[8px] uppercase leading-tight text-muted-foreground">
            {date}
          </span>
        </div>
        <p className="mt-1.5 max-w-full truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {place || "Somewhere"}
        </p>
        <div className="mt-auto w-full space-y-1.5 text-xs text-muted-foreground">
          <p className="truncate border-b border-border pb-1">
            Jaedon Spurlock
          </p>
          <p className="truncate border-b border-border pb-1">Orlando, FL</p>
        </div>
      </div>
    </div>
  );
}

const stepClass =
  "flex size-7 cursor-pointer items-center justify-center rounded-md transition-[background-color,scale] duration-150 ease-(--ease-out) hover:bg-foreground/5 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40";

const quietClass =
  "-mx-2 inline-flex cursor-pointer items-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium text-neutral-500 transition-[color,background-color,scale] duration-150 ease-(--ease-out) hover:bg-foreground/5 hover:text-foreground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-400";

const sendClass =
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-[background-color,scale,opacity] duration-150 ease-(--ease-out) hover:bg-primary/85 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

export function GuestbookDeck({
  initialEntries,
}: {
  initialEntries: GuestbookEntryJson[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [entries, setEntries] = useState(initialEntries);
  const [mineId, setMineId] = useState<string | null>(null);
  const [seen, setSeen] = useState(false);

  // The deck. `orderState` only remembers how the visitor has shuffled it;
  // cards it has never heard of (new arrivals) go on top.
  const [orderState, setOrder] = useState<string[]>([]);
  const [leaving, setLeaving] = useState<{ id: string; dir: number } | null>(
    null,
  );
  const [arriving, setArriving] = useState<string | null>(null);
  const leaveTimer = useRef(0);
  const drag = useRef<{
    pointer: number;
    startX: number;
    dx: number;
    time: number;
    velocity: number;
  } | null>(null);

  // The blank card.
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [guess, setGuess] = useState<Dot | null>(null);
  const [moved, setMoved] = useState<Dot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const cards = useMemo(
    () => entries.map(toCard).filter((c): c is Card => c !== null),
    [entries],
  );
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const order = useMemo(() => {
    const known = new Set(orderState);
    return [
      ...cards.filter((c) => !known.has(c.id)).map((c) => c.id),
      ...orderState.filter((id) => byId.has(id)),
    ];
  }, [cards, byId, orderState]);

  const top = byId.get(order[0]) ?? null;
  const mine = mineId ? (byId.get(mineId) ?? null) : null;
  const places = useMemo(
    () => new Set(cards.map((c) => c.place || `${c.x},${c.y}`)).size,
    [cards],
  );
  const spot = moved ?? (mine ? nearestDot(mine.x, mine.y) : guess);
  const today = useMemo(() => dateFormat.format(new Date()), []);

  // The server sent the cards; only this device knows which one is its own.
  useEffect(() => {
    let stale = false;
    setGuess(guessDot());
    request<GuestbookListJson>(
      `/api/guestbook?deviceId=${encodeURIComponent(deviceId())}`,
    )
      .then((data) => {
        if (stale) return;
        setEntries(data.entries);
        setMineId(data.mine?.id ?? null);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  /** Send the top card to the back; it leaves towards `dir` (-1 left, 1 right). */
  const advance = (dir: number) => {
    if (order.length < 2) return;
    setConfirming(false);
    setArriving(null);
    setLeaving({ id: order[0], dir });
    setOrder([...order.slice(1), order[0]]);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setLeaving(null), 320);
  };

  /** Bring a card to the top; if it wasn't in sight it slides in. */
  const bringToTop = (id: string) => {
    if (id === order[0]) return;
    setConfirming(false);
    setLeaving(null);
    setArriving(id);
    setOrder([id, ...order.filter((other) => other !== id)]);
  };

  const startComposing = () => {
    setName(mine?.name ?? storage.get(NAME_KEY) ?? "");
    setMessage(mine?.message ?? "");
    setMoved(null);
    setError(null);
    setConfirming(false);
    setComposing(true);
  };

  const ready = Boolean(spot && name.trim() && message.trim()) && !busy;

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!spot || !ready) return;
    setBusy(true);
    setError(null);
    try {
      const { entry } = await request<{ entry: GuestbookEntryJson }>(
        "/api/guestbook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: deviceId(),
            dotId: spot.id,
            name: name.trim(),
            message: message.trim(),
          }),
        },
      );
      storage.set(NAME_KEY, entry.name);
      setEntries((prev) => [entry, ...prev.filter((p) => p.id !== entry.id)]);
      setMineId(entry.id);
      setArriving(null);
      setLeaving(null);
      setOrder([entry.id, ...order.filter((id) => id !== entry.id)]);
      setComposing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send it.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!mineId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await request(
        `/api/guestbook?deviceId=${encodeURIComponent(deviceId())}`,
        { method: "DELETE" },
      );
      setEntries((prev) => prev.filter((p) => p.id !== mineId));
      setMineId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const p = toMap(e, svgRef.current);
    if (composing) {
      setMoved(nearestDot(p.x, p.y));
      return;
    }
    let hit: Card | null = null;
    let best = REACH ** 2;
    for (const c of cards) {
      const dist = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (dist < best) {
        best = dist;
        hit = c;
      }
    }
    if (hit) bringToTop(hit.id);
  };

  // Dragging the top card. It follows the pointer 1:1 with no transition; on
  // release a long or fast enough pull sends it to the back from wherever it
  // is, and anything less lets it settle. A press that never moved is a click.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointer: e.pointerId,
      startX: e.clientX,
      dx: 0,
      time: e.timeStamp,
      velocity: 0,
    };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>, rot: number) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    d.velocity = (dx - d.dx) / Math.max(e.timeStamp - d.time, 1);
    d.dx = dx;
    d.time = e.timeStamp;
    if (Math.abs(dx) < 4) return;
    const el = e.currentTarget;
    el.dataset.dragging = "true";
    el.style.transform = `translateX(${dx}px) rotate(${rot * 0.4 + dx * 0.04}deg)`;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>, rot: number) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    const el = e.currentTarget;
    delete el.dataset.dragging;
    const cancelled = e.type === "pointercancel";
    const flung =
      Math.abs(d.dx) > SWIPE.distance ||
      (Math.abs(d.dx) > 12 && Math.abs(d.velocity) > SWIPE.velocity);
    if (!cancelled && order.length > 1 && Math.abs(d.dx) < 4) advance(-1);
    else if (!cancelled && order.length > 1 && flung) advance(Math.sign(d.dx));
    else el.style.transform = stackTransform(0, rot);
  };

  // Only the cards near the top exist in the DOM; with a blank card on the
  // deck everything sits one place lower.
  const offset = composing ? 1 : 0;
  const shown = [
    ...order.slice(0, DEPTH + 1),
    ...(leaving && !order.slice(0, DEPTH + 1).includes(leaving.id)
      ? [leaving.id]
      : []),
  ];

  return (
    <div
      ref={rootRef}
      data-seen={seen}
      className="mt-8 rounded-md border border-border bg-card p-5"
    >
      <div className="relative mx-auto aspect-[3/2] w-full max-w-sm">
        {cards.length === 0 && !composing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            No postcards yet. Send the first one.
          </div>
        )}

        <div aria-hidden="true">
          {shown.map((id) => {
            const card = byId.get(id);
            if (!card) return null;
            const pos = order.indexOf(id) + offset;
            const rot = tilt(id);
            const isLeaving = leaving?.id === id;
            const isTop = pos === 0 && !isLeaving;
            return (
              <div
                key={id}
                className={cn(
                  "gb-card absolute inset-0 rounded-md border border-border bg-card shadow-sm select-none",
                  isTop && "cursor-grab active:cursor-grabbing",
                  !isTop && "pointer-events-none",
                )}
                data-arriving={arriving === id}
                style={{
                  zIndex: isLeaving ? 60 : 50 - pos,
                  opacity: isLeaving || pos >= DEPTH ? 0 : undefined,
                  transform:
                    isLeaving && !prefersReducedMotion()
                      ? `translateX(${leaving.dir * 115}%) rotate(${leaving.dir * 12}deg)`
                      : stackTransform(Math.min(pos, DEPTH), rot),
                }}
                onPointerDown={isTop ? onDown : undefined}
                onPointerMove={isTop ? (e) => onMove(e, rot) : undefined}
                onPointerUp={isTop ? (e) => onUp(e, rot) : undefined}
                onPointerCancel={isTop ? (e) => onUp(e, rot) : undefined}
              >
                <CardFace at={card} place={card.place} date={card.date}>
                  <p className="line-clamp-5 text-sm leading-relaxed wrap-break-word">
                    {card.message}
                  </p>
                  <p className="mt-auto truncate pt-2 text-sm font-medium">
                    — {card.name}
                  </p>
                </CardFace>
              </div>
            );
          })}
        </div>

        {composing && (
          <form
            onSubmit={send}
            className="gb-card gb-card-blank absolute inset-0 z-[70] rounded-md border border-border bg-card shadow-md"
          >
            <CardFace
              at={spot}
              place={spot ? placeNear(spot) : ""}
              date={today}
            >
              <textarea
                // biome-ignore lint/a11y/noAutofocus: the card was just asked for
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={GUESTBOOK_MESSAGE_MAX}
                placeholder="Wish you were here…"
                aria-label="Your note"
                className="min-h-0 w-full flex-1 resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground sm:text-sm"
              />
              <label className="flex items-baseline gap-1.5 border-t border-border pt-2 text-sm font-medium">
                —
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={GUESTBOOK_NAME_MAX}
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="given-name"
                  className="w-full min-w-0 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground sm:text-sm"
                />
              </label>
            </CardFace>
            <button type="submit" hidden />
          </form>
        )}
      </div>

      {/* What the deck shows, for anyone not looking at it. */}
      <p className="sr-only" aria-live="polite">
        {!composing && top
          ? `Postcard from ${top.name}${top.place ? `, near ${top.place}` : ""}, ${top.date}: ${top.message}`
          : ""}
      </p>

      <div className="mt-7 flex min-h-8 items-center justify-between gap-3">
        {composing ? (
          <>
            <p
              className={cn(
                "min-w-0 text-xs",
                error ? "text-destructive" : "text-muted-foreground",
              )}
              role={error ? "alert" : undefined}
            >
              {error ?? "Wrong stamp? Tap the map to move your pin."}
            </p>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => setComposing(false)}
                className={quietClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={() => send()}
                className={sendClass}
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <button
                type="button"
                aria-label="Previous postcard"
                disabled={order.length < 2}
                onClick={() => bringToTop(order[order.length - 1])}
                className={stepClass}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next postcard"
                disabled={order.length < 2}
                onClick={() => advance(-1)}
                className={stepClass}
              >
                →
              </button>
              {error ? (
                <span
                  role="alert"
                  className="ml-1 truncate normal-case text-destructive"
                >
                  {error}
                </span>
              ) : cards.length === 0 ? null : (
                <span className="ml-1 hidden tabular-nums sm:inline">
                  {cards.length} {cards.length === 1 ? "card" : "cards"} ·{" "}
                  {places} {places === 1 ? "place" : "places"}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className={quietClass}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={remove}
                    className={cn(quietClass, "text-destructive!")}
                  >
                    {busy ? "Removing…" : "Remove for good"}
                  </button>
                </>
              ) : (
                <>
                  {mine && top?.id === mine.id && (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className={quietClass}
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startComposing}
                    className={quietClass}
                  >
                    {mine ? "Rewrite my card" : "Write a postcard"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the deck's buttons are the keyboard path */}
      <svg
        ref={svgRef}
        viewBox={VIEWBOX}
        role="img"
        aria-label={`World map of where ${cards.length} postcards came from`}
        className={cn(
          "-mx-2 mt-3 block w-[calc(100%+1rem)] max-w-none touch-manipulation select-none",
          composing && "cursor-crosshair",
        )}
        onClick={onMapClick}
      >
        <path d={BASE_PATH} className="gb-land" />
        {cards.map((c) => (
          <path key={c.id} d={arc(c)} className="gb-route" />
        ))}
        {seen && !composing && top && (
          <path
            key={top.id}
            d={arc(top)}
            pathLength={1}
            className="gb-route-top"
          />
        )}
        <circle cx={HOME.x} cy={HOME.y} r={0.7} className="gb-home" />
        {cards.map((c, i) => (
          <circle
            key={c.id}
            cx={c.x}
            cy={c.y}
            r={0.62}
            className="gb-pin"
            data-top={!composing && c.id === top?.id}
            data-dim={composing}
            style={
              {
                "--d": `${200 + Math.min(i, 40) * 40}ms`,
              } as React.CSSProperties
            }
          />
        ))}
        {composing && spot && (
          <g
            className="gb-you"
            style={{ transform: `translate(${spot.x}px, ${spot.y}px)` }}
          >
            <g className="gb-you-drop">
              <circle r={1.7} className="gb-you-ring" />
              <circle r={0.7} fill="var(--gb-accent)" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
