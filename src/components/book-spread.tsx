"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  BOOK_STATUS_LABEL,
  type Book,
  bookActivityTime,
} from "@/lib/book-utils";
import { cn } from "@/lib/utils";

/**
 * Clicking a book in a list lifts its cover out of the row (view transition),
 * and the cover swings open into a two-page spread: details on the left page,
 * notes on the right. The spread is a real 3D object that tilts when dragged.
 * Closing shuts the book and flies it back into its row.
 *
 * Styles live in globals.css under "Books".
 */

/** Shared by the row cover and the spread so the flight reuses one image. */
export const BOOK_COVER_SIZES = "300px";

const flightName = (id: string) => `book-flight-${id}`;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatDate(time: number | string) {
  return new Date(time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Wire a list of books to the spread. Put `coverProps(id)` on each row's
 * cover wrapper, call `open` from the row's button, and render `dialog`.
 */
export function useBookSpread(books: Book[]) {
  const [openId, setOpenId] = useState<string | null>(null);
  // The row cover is only named around a flight, so it stays out of
  // unrelated view transitions (theme toggle, music).
  const [armedId, setArmedId] = useState<string | null>(null);
  const spreadRef = useRef<SpreadHandle>(null);
  const busyRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (id: string, opener: HTMLElement) => {
    if (busyRef.current || openId) return;
    openerRef.current = opener;
    const show = () => flushSync(() => setOpenId(id));

    if (!document.startViewTransition || prefersReducedMotion()) {
      show();
      spreadRef.current?.open(true);
      return;
    }

    busyRef.current = true;
    flushSync(() => setArmedId(id));
    document.documentElement.dataset.bookFlight = "open";
    const transition = document.startViewTransition(async () => {
      show();
      // Wait for the cover to decode so the snapshot isn't blank, but never
      // long enough to stall the transition on a slow image.
      await Promise.race([
        document
          .querySelector<HTMLImageElement>(".book-cover-face img")
          ?.decode()
          .catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);
    });
    // The cover starts to open while the book is still in the air, so the
    // flight and the opening read as one move rather than two.
    transition.ready
      .then(() => setTimeout(() => spreadRef.current?.open(), 200))
      .catch(() => spreadRef.current?.open(true));
    transition.finished
      .catch(() => {})
      .finally(() => {
        delete document.documentElement.dataset.bookFlight;
        busyRef.current = false;
      });
  };

  const close = async () => {
    if (busyRef.current || !openId) return;
    busyRef.current = true;
    const hide = () => flushSync(() => setOpenId(null));

    if (!document.startViewTransition || prefersReducedMotion()) {
      hide();
    } else {
      // Shut the book first: a flat, closed cover is the shape the row has.
      await spreadRef.current?.close();
      document.documentElement.dataset.bookFlight = "close";
      await document.startViewTransition(hide).finished.catch(() => {});
      delete document.documentElement.dataset.bookFlight;
    }
    setArmedId(null);
    busyRef.current = false;
    openerRef.current?.focus({ preventScroll: true });
  };

  const openBook = books.find((book) => book.id === openId);

  return {
    open,
    coverProps: (id: string) => ({
      className: cn("book-flight", openId === id && "invisible"),
      style: {
        viewTransitionName:
          armedId === id && openId !== id ? flightName(id) : undefined,
      } as CSSProperties,
    }),
    dialog: openBook ? (
      <BookDialog book={openBook} spreadRef={spreadRef} onClose={close} />
    ) : null,
  };
}

function BookDialog({
  book,
  spreadRef,
  onClose,
}: {
  book: Book;
  spreadRef: Ref<SpreadHandle>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Layout effect so the dialog is already in the top layer when the view
  // transition takes its "after" snapshot.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    root.style.paddingRight = `${scrollbar}px`;
    ref.current?.showModal();
    return () => {
      root.style.overflow = "";
      root.style.paddingRight = "";
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="book-dialog"
      aria-label={`${book.title} by ${book.author}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/45 backdrop-blur-[3px] dark:bg-black/65" />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click; Esc and the close button cover keyboard */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
      <div
        className="relative flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <BookSpread ref={spreadRef} book={book} />
        <div
          className="flex items-center gap-3 text-xs text-white/70"
          style={{ viewTransitionName: "book-controls" }}
        >
          <span>Drag to tilt</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-white/10 text-white transition-[background-color,scale] duration-150 ease-(--ease-out) hover:bg-white/20 active:scale-95"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
              <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* The 3D book                                                          */
/* ------------------------------------------------------------------ */

type SpreadHandle = {
  /** Swing the cover open from the flat pose the flight lands in. */
  open: (instant?: boolean) => void;
  /** Shut the cover and level the book; resolves once it is all but flat. */
  close: () => Promise<void>;
};

type Spring = { x: number; v: number; t: number };

const SOFT = { k: 120, c: 14 }; // a little bounce: opening and tilting
const FIRM = { k: 700, c: 53 }; // critically damped: closing up
const OPEN_ANGLE = 180;

function BookSpread({ ref, book }: { ref: Ref<SpreadHandle>; book: Book }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const color = useCoverColor(book.image);

  // Tilt (rx, ry) and cover angle are springs written straight to
  // `transform` in one rAF loop: no React renders while it moves, and any
  // motion can be grabbed mid-flight.
  const sim = useRef({
    rx: { x: 0, v: 0, t: 0 } as Spring,
    ry: { x: 0, v: 0, t: 0 } as Spring,
    cover: { x: 0, v: 0, t: 0 } as Spring,
    tune: SOFT,
    held: false,
    raf: 0,
    last: 0,
    /** Fires once every spring is within a few degrees of its target. */
    onNear: null as null | (() => void),
  });

  const paint = () => {
    const s = sim.current;
    if (bookRef.current)
      bookRef.current.style.transform = `rotateX(${s.rx.x}deg) rotateY(${s.ry.x}deg)`;
    if (coverRef.current)
      coverRef.current.style.transform = `rotateY(${-s.cover.x}deg)`;
    if (shadeRef.current)
      shadeRef.current.style.opacity = String(Math.max(0, 1 - s.cover.x / 110));
  };

  const run = () => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();
    const frame = (now: number) => {
      let dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      const springs = s.held ? [s.cover] : [s.rx, s.ry, s.cover];
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120);
        for (const p of springs) {
          p.v += (-s.tune.k * (p.x - p.t) - s.tune.c * p.v) * h;
          p.x += p.v * h;
        }
        dt -= h;
      }
      let moving = s.held;
      for (const p of springs) {
        if (Math.abs(p.x - p.t) < 0.05 && Math.abs(p.v) < 0.5) {
          p.x = p.t;
          p.v = 0;
        } else moving = true;
      }
      paint();
      if (s.onNear && springs.every((p) => Math.abs(p.x - p.t) < 6)) {
        s.onNear();
        return;
      }
      s.raf = moving ? requestAnimationFrame(frame) : 0;
    };
    s.raf = requestAnimationFrame(frame);
  };

  const snap = () => {
    const s = sim.current;
    for (const p of [s.rx, s.ry, s.cover]) {
      p.x = p.t;
      p.v = 0;
    }
    paint();
  };

  useImperativeHandle(ref, () => ({
    open(instant) {
      const s = sim.current;
      s.tune = SOFT;
      s.cover.t = OPEN_ANGLE;
      if (instant) snap();
      else run();
    },
    close() {
      const s = sim.current;
      s.held = false;
      s.tune = FIRM;
      s.rx.t = s.ry.t = s.cover.t = 0;
      return new Promise<void>((resolve) => {
        // Hand over to the flight as soon as the book is all but shut; the
        // last few degrees of a damped spring are a long, invisible tail.
        const done = () => {
          clearTimeout(timer);
          cancelAnimationFrame(s.raf);
          s.raf = 0;
          s.onNear = null;
          snap();
          resolve();
        };
        const timer = setTimeout(done, 350);
        s.onNear = done;
        run();
      });
    },
  }));

  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  // Drag tilts the spread a few degrees, with resistance that grows the
  // further it is pulled; letting go springs it level again.
  const drag = useRef({ id: -1, x: 0, y: 0, moved: false, lastT: 0 });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      lastT: event.timeStamp,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const d = drag.current;
    if (event.pointerId !== d.id) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      d.moved = true;
      s.held = true;
      s.tune = SOFT;
      run();
    }
    const dt = Math.max((event.timeStamp - d.lastT) / 1000, 1 / 240);
    const ry = 14 * Math.tanh((dx * 0.12) / 14);
    const rx = 10 * Math.tanh((-dy * 0.12) / 10);
    s.ry.v = 0.6 * s.ry.v + 0.4 * ((ry - s.ry.x) / dt);
    s.rx.v = 0.6 * s.rx.v + 0.4 * ((rx - s.rx.x) / dt);
    s.ry.x = ry;
    s.rx.x = rx;
    d.lastT = event.timeStamp;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const d = drag.current;
    if (event.pointerId !== d.id) return;
    d.id = -1;
    if (!d.moved) return;
    s.held = false;
    // A pause before letting go means "set it down", not "flick it".
    if (event.timeStamp - d.lastT > 80) s.rx.v = s.ry.v = 0;
    run();
  };

  const notes = (book.summary ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const updated = formatDate(bookActivityTime(book));
  const added = formatDate(book.addedAt);

  return (
    // The closed book lands on the right half; the cover swings out left.
    <div className="flex w-[calc(var(--book-w)*2)] justify-end [--book-w:min(300px,44vw)]">
      <div
        className="book-stage book-flight"
        style={
          {
            "--book-color": color,
            viewTransitionName: flightName(book.id),
          } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={bookRef} className="book-body">
          <div className="book-back" />
          <div className="book-spine" />
          <div className="book-edge book-edge-fore" />
          <div className="book-edge book-edge-head" />
          <div className="book-edge book-edge-tail" />

          <div className="book-page book-page-text">
            <div className="h-full p-[9%]">
              <p className="text-[0.8em] font-medium tracking-widest uppercase opacity-50">
                Notes
              </p>
              <div className="mt-[0.9em] space-y-[0.8em] font-serif leading-[1.55]">
                {notes.length > 0 ? (
                  notes.map((note) => <p key={note}>{note}</p>)
                ) : (
                  <p className="opacity-50">No notes yet.</p>
                )}
              </div>
            </div>
            <div ref={shadeRef} className="book-page-shade" />
          </div>

          <div ref={coverRef} className="book-cover">
            <div className="book-cover-face">
              <Image
                src={book.image}
                alt=""
                fill
                sizes={BOOK_COVER_SIZES}
                loading="eager"
                draggable={false}
                className="object-cover"
              />
            </div>
            <div className="book-cover-face book-cover-inside book-page-text">
              <div className="flex h-full flex-col justify-between p-[9%]">
                <div>
                  <h2 className="font-serif text-[1.7em] leading-tight font-semibold tracking-tight">
                    {book.title}
                  </h2>
                  <p className="mt-[0.4em] opacity-70">{book.author}</p>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-[1.2em] gap-y-[0.35em] text-[0.9em]">
                  <dt className="opacity-50">Status</dt>
                  <dd>{BOOK_STATUS_LABEL[book.status]}</dd>
                  <dt className="opacity-50">Added</dt>
                  <dd>{added}</dd>
                  {updated !== added && (
                    <>
                      <dt className="opacity-50">Updated</dt>
                      <dd>{updated}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Spine and back cover take the cover art's average colour, darkened. */
function useCoverColor(src: string) {
  const [color, setColor] = useState("#26262b");
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setColor(`rgb(${r * 0.55} ${g * 0.55} ${b * 0.55})`);
      } catch {
        // Keep the neutral fallback.
      }
    };
    return () => {
      cancelled = true;
    };
  }, [src]);
  return color;
}
