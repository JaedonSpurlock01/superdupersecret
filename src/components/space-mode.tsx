"use client";

import { useEffect, useRef, useState } from "react";
import { setSpaceAudioMuted, startSpaceAudio } from "@/lib/space-audio";
import { startSpaceSky } from "@/lib/space-sky";
import { useTheme } from "./theme-provider";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

const SOUND_KEY = "space-sound";

/**
 * Hidden space mode: the Konami code (or clicking my name) swaps the page
 * background for a 3D starfield with a supernova going off, a camera slowly
 * orbiting it, and generated music, like a game's main menu. Esc or the same trigger
 * turns it off; M mutes. Styles live in globals.css under "Space mode", the
 * 3D sky in lib/space-sky, sound in lib/space-audio.
 */
export function SpaceMode() {
  const { space, toggleSpace } = useTheme();
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);

  // The mute choice is remembered between visits.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOUND_KEY) === "off";
      mutedRef.current = stored;
      setMuted(stored);
    } catch {}
  }, []);

  const toggleMuted = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    setSpaceAudioMuted(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "off" : "on");
    } catch {}
  };

  // Sound runs for as long as the mode is on. ThemeProvider has already
  // unlocked audio inside the click or key press that got us here.
  useEffect(() => {
    if (!space) return;
    return startSpaceAudio(mutedRef.current);
  }, [space]);

  // The 3D sky: stars and debris drawn from a camera orbiting the supernova.
  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = scene?.querySelector<HTMLCanvasElement>(".sp-sky");
    const anchor = scene?.querySelector<HTMLElement>(".sp-anchor");
    if (!space || !scene || !canvas || !anchor) return;

    return startSpaceSky(canvas, anchor, [
      ...scene.querySelectorAll<HTMLElement>("[data-drift]"),
    ]);
  }, [space]);

  const toggleMutedRef = useRef(toggleMuted);
  toggleMutedRef.current = toggleMuted;

  useEffect(() => {
    let progress = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      if (
        event.key === "Escape" &&
        space &&
        !document.querySelector("dialog[open]")
      ) {
        toggleSpace();
        return;
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === "m" && space) {
        toggleMutedRef.current();
        return;
      }
      if (key === KONAMI[progress]) {
        progress += 1;
        if (progress === KONAMI.length) {
          progress = 0;
          toggleSpace();
        }
      } else {
        // A wrong key can still be the start of a new attempt.
        progress = key === KONAMI[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [space, toggleSpace]);

  if (!space) return null;

  return (
    <>
      <div ref={sceneRef} className="space-scene" aria-hidden>
        {/* Warps the remnant's rings, then erodes them into filaments. */}
        <svg width="0" height="0" className="absolute">
          <title>Supernova filter</title>
          <filter id="sp-warp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011"
              numOctaves="3"
              seed="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            {/* Finer noise, turned into an alpha mask, breaks the ring up
                into wisps. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves="4"
              seed="9"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.65"
              result="wisps"
            />
            <feComposite in="warped" in2="wisps" operator="in" />
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </svg>

        {/* Marks where the supernova sits and how big it is, for the canvas.
            Outside the camera so its box isn't scaled or rolled. */}
        <div className="sp-anchor" />

        <div className="sp-camera">
          <canvas className="sp-sky" />

          <div className="sp-haze" data-drift />

          <div className="sp-nova" data-drift>
            <div className="sp-nebula" />
            <div className="sp-shell sp-shell-outer" />
            <div className="sp-shell" />
            <div className="sp-wave" />
            <div className="sp-wave sp-wave-late" />
            <div className="sp-core" />
            <div className="sp-flash" />
          </div>
        </div>
      </div>

      <output className="sp-hud">
        <span className="sp-hud-prompt">&gt;</span>{" "}
        <span className="sp-hud-wide">observing </span>SN 2026js
        <span className="sp-hud-dim"> · </span>
        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={!muted}
          className="sp-hud-button"
        >
          [m] sound {muted ? "off" : "on"}
        </button>
        <span className="sp-hud-dim"> · </span>
        <button type="button" onClick={toggleSpace} className="sp-hud-button">
          [esc] exit
        </button>
      </output>
    </>
  );
}
