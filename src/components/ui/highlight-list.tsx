"use client";

import type React from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A `<ul>` with a single hover highlight that slides between its rows.
 * Mouse only; touch and keyboard users see the list unchanged.
 */
export function HighlightList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const highlightRef = useRef<HTMLLIElement>(null);
  const visibleRef = useRef(false);

  const handlePointerOver = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse") return;
    const highlight = highlightRef.current;
    const row = (event.target as HTMLElement).closest("li");
    if (!highlight || !row || row.parentElement !== event.currentTarget) return;

    const place = () => {
      highlight.style.transform = `translateY(${row.offsetTop}px)`;
      highlight.style.height = `${row.offsetHeight}px`;
    };

    if (!visibleRef.current) {
      // First appearance fades in place instead of sliding in from elsewhere.
      highlight.style.transition = "opacity 150ms ease";
      place();
      void highlight.offsetHeight;
      highlight.style.transition = "";
    }
    place();
    highlight.style.opacity = "1";
    visibleRef.current = true;
  };

  const handlePointerLeave = () => {
    if (highlightRef.current) highlightRef.current.style.opacity = "0";
    visibleRef.current = false;
  };

  return (
    <ul
      className={cn("relative isolate", className)}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
    >
      <li
        ref={highlightRef}
        aria-hidden="true"
        role="presentation"
        className="hover-highlight"
      />
      {children}
    </ul>
  );
}
