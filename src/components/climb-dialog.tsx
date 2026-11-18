"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { type Climb, mountainProjectUrl } from "@/lib/data/climbs";
import { cn } from "@/lib/utils";

/**
 * A climb's row flies into a dialog (view transition): a strip of photos,
 * where it was, the notes, and a link out to Mountain Project. Same shape as
 * the book and About photo dialogs.
 *
 * Styles live in globals.css under "Climbing".
 */

const FLIGHT_NAME = "climb-flight";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useClimbDialog(climbs: Climb[]) {
  const [open, setOpen] = useState<string | null>(null);
  // A row is only named around its own flight, so it stays out of unrelated
  // view transitions (theme toggle, music, books).
  const [armed, setArmed] = useState<string | null>(null);
  const busy = useRef(false);

  const go = (next: string | null, id: string) => {
    if (busy.current) return;
    if (!document.startViewTransition || prefersReducedMotion()) {
      setOpen(next);
      return;
    }
    busy.current = true;
    flushSync(() => setArmed(id));
    const root = document.documentElement;
    root.dataset.climbFlight = next ? "open" : "close";
    const transition = document.startViewTransition(() => {
      flushSync(() => setOpen(next));
    });
    // A hidden tab skips the animation and rejects `ready`; the state change
    // still happens, so there is nothing to handle.
    transition.ready.catch(() => {});
    transition.finished.finally(() => {
      delete root.dataset.climbFlight;
      busy.current = false;
      setArmed(null);
    });
  };

  const climb = climbs.find((item) => item.id === open);

  return {
    show: (id: string) => go(id, id),
    /** Spread on the row's content. */
    rowProps: (id: string) => ({
      className: cn("climb-flight", open === id && "invisible"),
      style: {
        viewTransitionName:
          armed === id && open !== id ? FLIGHT_NAME : undefined,
      } as React.CSSProperties,
    }),
    dialog: climb ? (
      <ClimbDialog climb={climb} onClose={() => go(null, climb.id)} />
    ) : null,
  };
}

function ClimbDialog({
  climb,
  onClose,
}: {
  climb: Climb;
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

  return createPortal(
    <dialog
      ref={ref}
      className="climb-dialog"
      aria-label={climb.name}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="fixed inset-0 bg-black/45 backdrop-blur-[3px] dark:bg-black/65" />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click; Esc and the close button cover keyboard */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
      <div
        className="relative flex min-h-full items-center justify-center px-4 py-16"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <article
          className="climb-flight w-[min(92vw,30rem)] overflow-hidden rounded-xl bg-(--climb-paper) text-foreground shadow-2xl shadow-black/40 ring-1 ring-border"
          style={{ viewTransitionName: FLIGHT_NAME }}
        >
          {climb.photos.length > 0 && <PhotoStrip photos={climb.photos} />}

          <div className="p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {climb.name}
              </h2>
              <span className="font-mono text-base tabular-nums text-(--climb-accent)">
                {climb.grade}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
                <path
                  d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 0 0-9 0c0 3.6 4.5 7.8 4.5 7.8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="6.6" r="1.5" fill="currentColor" />
              </svg>
              {climb.crag} · {climb.location}
            </p>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground tabular-nums">
              {climb.style} · {climb.date}
            </p>

            <p className="climb-settle mt-4 text-base leading-6">
              {climb.notes}
            </p>

            <a
              href={mountainProjectUrl(climb)}
              target="_blank"
              rel="noopener noreferrer"
              className="climb-settle group mt-5 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition-colors duration-200 hover:text-black dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Open on Mountain Project
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="size-3.5 transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <path
                  d="M5 11l6-6M6 5h5v5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </article>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ viewTransitionName: "climb-close" }}
        className="climb-chrome fixed top-4 right-4 grid size-8 place-items-center rounded-full bg-white/10 text-white transition-[background-color,scale] duration-150 ease-(--ease-out) hover:bg-white/20 active:scale-95"
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
    </dialog>,
    document.body,
  );
}

/**
 * A row of photos that scrolls sideways. Touch and trackpads scroll it
 * natively; a mouse can drag it or use the arrows, which show only while
 * there is more in that direction.
 */
function PhotoStrip({ photos }: { photos: Climb["photos"] }) {
  const ref = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [more, setMore] = useState({ back: false, on: false });

  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      setMore({
        back: strip.scrollLeft > 4,
        on: strip.scrollLeft < max - 4,
      });
    };
    update();
    strip.addEventListener("scroll", update, { passive: true });
    const sizes = new ResizeObserver(update);
    sizes.observe(strip);
    return () => {
      strip.removeEventListener("scroll", update);
      sizes.disconnect();
    };
  }, []);

  const page = (by: number) => {
    const strip = ref.current;
    if (!strip) return;
    const step = (strip.firstElementChild?.clientWidth ?? 240) + 8;
    strip.scrollBy({
      left: by * step,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const release = () => {
    const strip = ref.current;
    if (!strip || !drag.current) return;
    const { moved } = drag.current;
    drag.current = null;
    if (!moved) return;
    // Glide to the nearest photo, then hand back to scroll snapping. Turning
    // snapping on first would jump there instead.
    const step = (strip.firstElementChild?.clientWidth ?? 240) + 8;
    const max = strip.scrollWidth - strip.clientWidth;
    // Rest points: the start of each photo, and the very end.
    const stops = [max];
    for (let left = 0; left < max; left += step) stops.push(left);
    const at = strip.scrollLeft;
    strip.scrollTo({
      left: stops.reduce((best, stop) =>
        Math.abs(stop - at) < Math.abs(best - at) ? stop : best,
      ),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    window.setTimeout(() => delete strip.dataset.dragging, 350);
  };

  return (
    <div className="group/strip relative">
      <ul
        ref={ref}
        className="climb-photos flex snap-x snap-mandatory gap-2 overflow-x-auto p-3 pb-0 select-none"
        onPointerDown={(event) => {
          // Touch and pen already scroll it; this is for the mouse.
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          drag.current = {
            x: event.clientX,
            left: event.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (!start.moved) {
            if (Math.abs(dx) < 4) return;
            start.moved = true;
            // Capture so the drag carries on outside the strip.
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = "true";
          }
          event.currentTarget.scrollLeft = start.left - dx;
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {photos.map((photo, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: a photo can repeat
            key={i}
            className="relative h-44 w-60 shrink-0 snap-start overflow-hidden rounded-md bg-muted"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="240px"
              draggable={false}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
      {(
        [
          ["Previous photos", -1, more.back, "left-5", "M9.5 3.5L5 8l4.5 4.5"],
          ["More photos", 1, more.on, "right-5", "M6.5 3.5L11 8l-4.5 4.5"],
        ] as const
      ).map(([label, by, on, side, d]) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          data-on={on}
          tabIndex={on ? 0 : -1}
          onClick={() => page(by)}
          className={cn(
            "climb-photos-arrow absolute top-[calc(50%+6px)] grid size-7 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-white",
            side,
          )}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
            <path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
