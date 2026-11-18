"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type RailSection = { id: string; label: string };

/**
 * Ticks pinned to the right edge, one per page section. The tick for the
 * section being read is longer; labels appear when the rail is hovered or
 * focused. Desktop only.
 */
export function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let index = 0;
      sections.forEach((section, i) => {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line) index = i;
      });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY >= max - 2) index = sections.length - 1;
      setActive(index);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  return (
    <nav
      aria-label="Sections"
      className="group fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end lg:flex"
    >
      {sections.map((section, i) => (
        <button
          key={section.id}
          type="button"
          aria-current={i === active ? "location" : undefined}
          onClick={() =>
            document
              .getElementById(section.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="flex h-6 items-center gap-2 pl-6 text-xs outline-none"
        >
          <span
            className={cn(
              "translate-x-1 opacity-0 transition-[opacity,translate] duration-200 ease-(--ease-out) group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 motion-reduce:translate-x-0",
              i === active ? "text-foreground" : "text-muted-foreground",
            )}
            style={{ transitionDelay: `${i * 15}ms` }}
          >
            {section.label}
          </span>
          <span
            className={cn(
              "h-px w-6 origin-right transition-[scale,background-color] duration-300 ease-(--ease-out)",
              i === active
                ? "scale-x-100 bg-foreground"
                : "scale-x-50 bg-neutral-400 dark:bg-neutral-600",
            )}
          />
        </button>
      ))}
    </nav>
  );
}
