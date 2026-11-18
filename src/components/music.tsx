"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Track } from "@/lib/music";
import { cn } from "@/lib/utils";
import Section from "./section";

/**
 * Favorite songs as a record sleeve. The selected song's cover sits up top
 * and its vinyl slides out and spins while the 30s preview plays. Picking a
 * song from the row below swaps covers with a view transition: the picked
 * cover flies up into the sleeve and the previous one flies back into its
 * slot in the row.
 */
export default function Music({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const selectRef = useRef<(index: number) => void>(() => {});
  const latestRef = useRef(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.6;
    audioRef.current = audio;
    const onTime = () =>
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => selectRef.current(-1);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const play = (index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src.endsWith(tracks[index].previewUrl)) {
      audio.src = tracks[index].previewUrl;
    }
    audio.play().catch(() => {});
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play(selected);
    else audio.pause();
  };

  /** Select a song (or -1 for "the next one") and start it once it lands. */
  const select = (requested: number) => {
    const index = requested === -1 ? (selected + 1) % tracks.length : requested;
    if (index === selected) {
      toggle();
      return;
    }
    audioRef.current?.pause();
    latestRef.current = index;

    const update = () =>
      flushSync(() => {
        setSelected(index);
        setProgress(0);
      });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || reduceMotion) {
      update();
      play(index);
      return;
    }

    const transition = document.startViewTransition(async () => {
      update();
      // Wait for the new cover to decode so the snapshot isn't blank.
      await heroRef.current
        ?.querySelector("img")
        ?.decode()
        .catch(() => {});
    });
    // A quick second pick skips this transition; only start the latest song.
    transition.finished.finally(() => {
      if (latestRef.current === index) play(index);
    });
  };
  selectRef.current = select;

  const track = tracks[selected];
  if (!track) return null;

  return (
    <Section title="MUSIC">
      <div className="@container mt-8 space-y-6">
        <div className="flex flex-col gap-4 @sm:flex-row @sm:items-center @sm:gap-5">
          <div className="relative mr-14 size-32 shrink-0">
            <div
              className={cn(
                "absolute inset-1.5 transition-transform duration-700 ease-(--ease-out) motion-reduce:transition-none",
                playing ? "translate-x-[44%]" : "translate-x-0",
              )}
            >
              <div
                className="music-vinyl music-spin relative size-full rounded-full"
                data-playing={playing}
              >
                <div className="absolute inset-[33%] overflow-hidden rounded-full ring-2 ring-black">
                  <Image
                    src={track.artwork}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-[48%] rounded-full bg-neutral-900" />
              </div>
              <div className="music-vinyl-sheen pointer-events-none absolute inset-0 rounded-full" />
            </div>

            <div
              ref={heroRef}
              key={selected}
              className="music-cover relative z-10 size-full overflow-hidden rounded-md shadow-lg ring-1 ring-black/10"
              style={{ viewTransitionName: `music-cover-${selected}` }}
            >
              <Image
                src={track.artwork}
                alt={`${track.album} cover`}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          </div>

          <div className="min-w-0 @sm:flex-1">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-6">
                  {track.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {track.artist} · {track.album}
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                aria-label={
                  playing ? `Pause ${track.title}` : `Play ${track.title}`
                }
                className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-[scale] duration-150 ease-(--ease-out) hover:scale-105 active:scale-95"
              >
                <PlayPauseIcon playing={playing} />
              </button>
            </div>
            <ProgressBar
              progress={progress}
              onSeek={(fraction) => {
                const audio = audioRef.current;
                if (audio?.duration)
                  audio.currentTime = fraction * audio.duration;
              }}
              className="mt-3"
            />
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {tracks.map((t, i) =>
            i === selected ? null : (
              <li key={t.previewUrl}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`Play ${t.title} by ${t.artist}`}
                  className="music-cover relative block size-11 overflow-hidden rounded-[5px] opacity-80 ring-1 ring-black/10 transition-[translate,opacity] duration-200 ease-(--ease-out) hover:-translate-y-0.5 hover:opacity-100 focus-visible:opacity-100"
                  style={{ viewTransitionName: `music-cover-${i}` }}
                >
                  {/* Same `sizes` as the sleeve so the morph reuses the cached image. */}
                  <Image
                    src={t.artwork}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </button>
              </li>
            ),
          )}
        </ul>
      </div>
    </Section>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  const icon =
    "col-start-1 row-start-1 size-3.5 transition-[opacity,scale] duration-200 ease-(--ease-out)";
  return (
    <span className="grid place-items-center">
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={cn(
          icon,
          "translate-x-px",
          playing ? "scale-50 opacity-0" : "scale-100 opacity-100",
        )}
      >
        <path
          fill="currentColor"
          d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z"
        />
      </svg>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={cn(
          icon,
          playing ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <rect fill="currentColor" x="4" y="3" width="3" height="10" rx="0.8" />
        <rect fill="currentColor" x="9" y="3" width="3" height="10" rx="0.8" />
      </svg>
    </span>
  );
}

function ProgressBar({
  progress,
  onSeek,
  className,
}: {
  progress: number;
  onSeek: (fraction: number) => void;
  className?: string;
}) {
  const seekFrom = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "group/bar relative flex h-3 cursor-pointer items-center",
        className,
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFrom(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          seekFrom(event);
      }}
    >
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10 transition-[height] duration-200 group-hover/bar:h-[5px]">
        <div
          className="h-full w-full origin-left rounded-full bg-foreground transition-transform duration-300 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}
