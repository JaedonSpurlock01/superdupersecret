"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A word in the About copy that reveals a photo on hover/focus. Clicking it
 * lifts the photo out of the text and flies it into a dialog (view
 * transition), with a caption saying what it is and where/when it was taken.
 *
 * Two things fly, in step: the frame (the thumbnail's border, which grows
 * into the print the photo sits on) and the photo itself. The photo
 * is never crossfaded: the dialog's copy is shown for the whole flight, so it
 * stays sharp and can't ghost.
 *
 * Styles live in globals.css under "About photos".
 */

export type AboutPhoto = {
  src: string;
  alt: string;
  caption: string;
  place: string;
  date: string;
};

const FRAME_NAME = "about-photo-frame";
const PHOTO_NAME = "about-photo";

/** The thumbnail's file. The dialog paints it first: it is already cached. */
const THUMB_SIZES = "144px";
const FULL_SIZES = "(min-width: 640px) 640px, 92vw";

const decoded = (img: HTMLImageElement | null | undefined) =>
  img?.decode().catch(() => {});

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AboutPhotoWord({
  word,
  photo,
}: {
  word: string;
  photo: AboutPhoto;
}) {
  const [open, setOpen] = useState(false);
  // Only named around a flight, so the thumbnail stays out of unrelated view
  // transitions (theme toggle, music, books). While armed it is also pinned
  // fully visible with no CSS transition, so both snapshots are crisp.
  const [armed, setArmed] = useState(false);
  // Fetch the full-size file as soon as the word is hovered or focused, so
  // it is usually ready before the click.
  const [warm, setWarm] = useState(false);
  const busyRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const preloadRef = useRef<HTMLImageElement>(null);

  const show = () => {
    if (busyRef.current || open) return;
    const reveal = () => flushSync(() => setOpen(true));

    if (!document.startViewTransition || prefersReducedMotion()) {
      reveal();
      return;
    }

    busyRef.current = true;
    flushSync(() => setArmed(true));
    document.documentElement.dataset.aboutPhoto = "open";
    const fullReady = Boolean(preloadRef.current?.complete);
    const transition = document.startViewTransition(async () => {
      reveal();
      // The page is frozen while this runs, so only wait on what is already
      // downloaded: the thumbnail's file, and the full one if it was warmed.
      const [base, full] = document.querySelectorAll<HTMLImageElement>(
        ".about-photo-dialog .about-photo img",
      );
      await Promise.race([
        Promise.all([decoded(base), fullReady && decoded(full)]),
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]);
    });
    transition.finished
      .catch(() => {})
      .finally(() => {
        delete document.documentElement.dataset.aboutPhoto;
        busyRef.current = false;
      });
  };

  const hide = async () => {
    if (busyRef.current || !open) return;
    busyRef.current = true;
    // Focus after the commit: until the modal dialog is gone, the page behind
    // it is inert and can't take focus.
    const conceal = () => {
      flushSync(() => setOpen(false));
      buttonRef.current?.focus({ preventScroll: true });
    };

    if (!document.startViewTransition || prefersReducedMotion()) {
      conceal();
    } else {
      document.documentElement.dataset.aboutPhoto = "close";
      await document.startViewTransition(conceal).finished.catch(() => {});
      delete document.documentElement.dataset.aboutPhoto;
    }
    // Unpinning hands the thumbnail back to hover/focus: unless the word is
    // still hovered or keyboard-focused, it fades out the way it always does.
    setArmed(false);
    busyRef.current = false;
  };

  const flying = armed && !open;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        onClick={show}
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        className="group relative cursor-zoom-in text-foreground underline decoration-neutral-400 decoration-dotted underline-offset-4 outline-none transition-colors duration-200 hover:decoration-foreground focus-visible:decoration-foreground"
      >
        {word}
        <span
          aria-hidden="true"
          style={{ viewTransitionName: flying ? FRAME_NAME : undefined }}
          className={cn(
            "about-photo-frame pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 block size-36 origin-bottom -translate-x-1/2 -rotate-3 rounded-md border-2 border-neutral-100 bg-muted shadow-md dark:border-neutral-900",
            armed
              ? "translate-y-0 scale-100 opacity-100 transition-none"
              : "translate-y-1 scale-90 opacity-0 transition-[opacity,scale,translate] duration-200 ease-(--ease-out) group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-[opacity]",
            open && "invisible",
          )}
        >
          {/* Clips itself: a named element isn't clipped by its parent. */}
          <span
            style={{ viewTransitionName: flying ? PHOTO_NAME : undefined }}
            className="about-photo relative block size-full overflow-hidden rounded-[4px]"
          >
            <Image
              src={photo.src}
              alt=""
              fill
              sizes={THUMB_SIZES}
              className="object-cover"
            />
          </span>
        </span>
        {warm && (
          <Image
            ref={preloadRef}
            src={photo.src}
            alt=""
            width={600}
            height={600}
            sizes={FULL_SIZES}
            loading="eager"
            className="hidden"
          />
        )}
      </button>
      {open && <AboutPhotoDialog photo={photo} onClose={hide} />}
    </>
  );
}

function AboutPhotoDialog({
  photo,
  onClose,
}: {
  photo: AboutPhoto;
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

  // Portalled: the word sits inside a <p>, which can't contain a dialog.
  return createPortal(
    <dialog
      ref={ref}
      className="about-photo-dialog"
      aria-label={photo.caption}
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
        {/* A print: the photo with its caption on the bottom margin. */}
        <figure
          className="about-photo-frame w-[min(88vw,26rem)] rounded-md bg-white p-3 pb-4 text-neutral-900 shadow-2xl shadow-black/40 dark:bg-neutral-900 dark:text-neutral-100"
          style={{ viewTransitionName: FRAME_NAME }}
        >
          <div
            className="about-photo relative aspect-square w-full overflow-hidden rounded-sm bg-muted"
            style={{ viewTransitionName: PHOTO_NAME }}
          >
            {/* The thumbnail's file paints at once; the full one covers it
                whenever it arrives. */}
            <Image
              src={photo.src}
              alt=""
              fill
              sizes={THUMB_SIZES}
              loading="eager"
              className="object-cover"
            />
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes={FULL_SIZES}
              loading="eager"
              className="object-cover"
            />
          </div>
          <figcaption
            className="about-photo-chrome px-1 pt-3"
            style={{ viewTransitionName: "about-photo-caption" }}
          >
            <p className="text-sm leading-snug">{photo.caption}</p>
            <p className="mt-1 text-xs text-neutral-500 tabular-nums">
              {photo.place} · {photo.date}
            </p>
          </figcaption>
        </figure>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{ viewTransitionName: "about-photo-close" }}
        className="about-photo-chrome fixed top-4 right-4 grid size-8 place-items-center rounded-full bg-white/10 text-white transition-[background-color,scale] duration-150 ease-(--ease-out) hover:bg-white/20 active:scale-95"
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
