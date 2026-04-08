"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Section from "./section";
import { Button } from "./ui/button";

type Photo = {
  id: number;
  src: string;
  title: string;
  description: string;
  initialRotation: number;
};

const PHOTOS: Photo[] = [
  {
    id: 1,
    src: "https://picsum.photos/id/1015/400/400",
    title: "Mountain Lake",
    description: "A quiet lake tucked between steep mountain walls.",
    initialRotation: -6,
  },
  {
    id: 2,
    src: "https://picsum.photos/id/1025/400/400",
    title: "Best Friend",
    description: "A candid snapshot of a very good dog.",
    initialRotation: 4,
  },
  {
    id: 3,
    src: "https://picsum.photos/id/1035/400/400",
    title: "Forest Path",
    description: "A shaded trail winding through dense forest.",
    initialRotation: -3,
  },
  {
    id: 4,
    src: "https://picsum.photos/id/1044/400/400",
    title: "Coastal Cliffs",
    description: "Evening light spilling over rocky sea cliffs.",
    initialRotation: 7,
  },
  {
    id: 5,
    src: "https://picsum.photos/id/1056/400/400",
    title: "City Lights",
    description: "Neon reflections across a rainy city street.",
    initialRotation: -8,
  },
  {
    id: 6,
    src: "https://picsum.photos/id/1069/400/400",
    title: "Open Road",
    description: "A long road stretching into distant hills.",
    initialRotation: 5,
  },
];

type DragState = {
  id: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
};

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export default function Photos() {
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>(
    () =>
      PHOTOS.reduce(
        (acc, photo, index) => ({
          ...acc,
          [photo.id]: {
            x: randomInRange(-180, 180),
            y: randomInRange(-120, 120),
          },
        }),
        {} as Record<number, { x: number; y: number }>,
      ),
  );

  const dragRef = useRef<DragState | null>(null);
  const momentumRef = useRef<number | null>(null);
  const [topPhotoId, setTopPhotoId] = useState<number | null>(null);
  const [isScattering, setIsScattering] = useState(false);
  const [focusedPhotoId, setFocusedPhotoId] = useState<number | null>(null);
  const [isFocusedVisible, setIsFocusedVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, id: number) => {
      if (momentumRef.current !== null) {
        cancelAnimationFrame(momentumRef.current);
        momentumRef.current = null;
      }

      event.currentTarget.setPointerCapture(event.pointerId);

      const current = positions[id] ?? { x: 0, y: 0 };
      const now = performance.now();

      dragRef.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        originX: current.x,
        originY: current.y,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: now,
        velocityX: 0,
        velocityY: 0,
      };

      setTopPhotoId(id);
    },
    [positions],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || event.buttons === 0) return;

    event.preventDefault();

    const { id, startX, startY, originX, originY, lastX, lastY, lastTime } = dragRef.current;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    const now = performance.now();
    const dt = Math.max(now - lastTime, 16);
    const frameDx = event.clientX - lastX;
    const frameDy = event.clientY - lastY;
    const velocityX = frameDx / dt;
    const velocityY = frameDy / dt;

    dragRef.current = {
      ...dragRef.current,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX,
      velocityY,
    };

    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: originX + deltaX,
        y: originY + deltaY,
      },
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) {
      return;
    }

    const state = dragRef.current;
    dragRef.current = null;

    const speed = Math.hypot(state.velocityX, state.velocityY);
    if (speed < 0.02) {
      return;
    }

    const friction = 0.92;
    const scale = 600;

    let vx = state.velocityX * scale;
    let vy = state.velocityY * scale;

    const currentPos = positions[state.id] ?? {
      x: state.originX,
      y: state.originY,
    };

    let x = currentPos.x;
    let y = currentPos.y;

    const animate = () => {
      vx *= friction;
      vy *= friction;

      x += vx * (1 / 60);
      y += vy * (1 / 60);

      if (Math.hypot(vx, vy) < 2) {
        if (momentumRef.current !== null) {
          cancelAnimationFrame(momentumRef.current);
          momentumRef.current = null;
        }
        return;
      }

      setPositions((prev) => ({
        ...prev,
        [state.id]: { x, y },
      }));

      momentumRef.current = requestAnimationFrame(animate);
    };

    momentumRef.current = requestAnimationFrame(animate);
  }, [positions, setPositions]);

  const handleScatter = () => {
    setIsScattering(true);
    window.setTimeout(() => {
      setIsScattering(false);
    }, 450);
    setPositions(
      PHOTOS.reduce(
        (acc, photo) => ({
          ...acc,
          [photo.id]: {
            x: randomInRange(-300, 300),
            y: randomInRange(-120, 120),
          },
        }),
        {} as Record<number, { x: number; y: number }>,
      ),
    );
    dragRef.current = null;
  };

  const handlePhotoDoubleClick = (id: number) => {
    setFocusedPhotoId(id);
  };

  const handleCloseFocused = () => {
    setIsFocusedVisible(false);
    window.setTimeout(() => {
      setFocusedPhotoId(null);
    }, 200);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (focusedPhotoId !== null) {
      // Slight delay lets the browser apply initial styles before transition.
      const id = window.setTimeout(() => setIsFocusedVisible(true), 15);
      return () => window.clearTimeout(id);
    }
    setIsFocusedVisible(false);
  }, [focusedPhotoId]);

  return (
    <Section>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-semibold">My Photos</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleScatter}
        >
          Scatter
        </Button>
      </div>

      <div className="relative h-[420px] sm:h-[460px] md:h-[480px] overflow-hidden border-border bg-neutral-50/80 dark:bg-neutral-900/60 rounded-b-sm">
        <div className="absolute inset-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div
          className="relative h-full w-full"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {PHOTOS.map((photo, index) => {
            const pos = positions[photo.id] ?? { x: 0, y: 0 };

            const isDraggingThis = dragRef.current?.id === photo.id;

            return (
              <div
                key={photo.id}
                className="absolute left-1/2 top-1/2 w-40 sm:w-44 md:w-48 cursor-grab active:cursor-grabbing select-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${photo.initialRotation}deg)`,
                  transition:
                    isScattering && !isDraggingThis
                      ? "transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                      : undefined,
                  zIndex: (topPhotoId === photo.id ? 100 : 0) + 10 + index,
                }}
                onPointerDown={(event) => handlePointerDown(event, photo.id)}
                onDoubleClick={() => handlePhotoDoubleClick(photo.id)}
              >
                <div className="flex flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-md shadow-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-950 dark:shadow-black/40">
                  <div className="relative aspect-square w-full bg-neutral-200/80 dark:bg-neutral-800/80">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      fill
                      sizes="192px"
                      className="object-cover pointer-events-none"
                    />
                  </div>
                  <div className="space-y-0.5 px-3 pb-3 pt-2">
                    <p className="text-xs font-semibold leading-tight">{photo.title}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {photo.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isMounted &&
        focusedPhotoId !== null &&
        createPortal(
          <div
            className={`fixed inset-0 z-999 flex min-h-dvh items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200 ${isFocusedVisible ? "opacity-100" : "opacity-0"
              }`}
            onClick={handleCloseFocused}
          >
            <div
              className={`relative w-full max-w-3xl cursor-default overflow-hidden rounded-md bg-white/95 shadow-2xl shadow-black/40 transform-gpu transition-all duration-200 ease-out dark:bg-neutral-950/95 ${isFocusedVisible
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-1"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const photo = PHOTOS.find((p) => p.id === focusedPhotoId)!;
                return (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Close image preview"
                      className="absolute right-3 top-3 z-10 rounded-full bg-black/35 text-white hover:bg-black/50 focus-visible:ring-white/30 dark:bg-black/45 dark:hover:bg-black/65"
                      onClick={handleCloseFocused}
                    >
                      <span aria-hidden className="text-lg leading-none">
                        ×
                      </span>
                    </Button>

                    <div className="relative w-full bg-neutral-200/80 dark:bg-neutral-800/80">
                      <div className="relative h-[75dvh] w-full">
                        <Image
                          src={photo.src}
                          alt={photo.title}
                          fill
                          sizes="(min-width: 768px) 900px, 100vw"
                          className="object-cover"
                        />
                      </div>

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/25 to-transparent p-4 pt-10 text-white">
                        <p className="text-sm font-semibold leading-tight">{photo.title}</p>
                        <p className="mt-1 text-xs leading-snug text-white/80">
                          {photo.description}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>,
          document.body,
        )}
    </Section>
  );
}

