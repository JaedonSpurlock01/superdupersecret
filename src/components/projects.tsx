"use client";

import Image from "next/image";
import {
  type FocusEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Project, projects } from "@/lib/data/projects";
import { cn } from "@/lib/utils";
import Section from "./section";

function hostOf(url: string) {
  return new URL(url).host.replace(/^www\./, "");
}

/**
 * Shows one project at a time and moves to the next every 5s, looping.
 * The timer is the active dot's fill animation (`.carousel-fill`): its
 * `animationend` advances, so pausing the animation pauses the timer.
 * Pauses while hovered with a mouse, keyboard-focused, mostly off screen,
 * or while the tab is hidden. Clicking a dot jumps there and restarts it.
 */
function useAutoAdvance(count: number) {
  const [{ index, prev }, setState] = useState<{
    index: number;
    prev: number | null;
  }>({ index: 0, prev: null });
  const [run, setRun] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return {
    index,
    prev,
    run,
    paused: hovered || focused || !onScreen || tabHidden,
    next: () =>
      setState((s) => ({ index: (s.index + 1) % count, prev: s.index })),
    goTo: (i: number) => {
      setState((s) => (s.index === i ? s : { index: i, prev: s.index }));
      setRun((r) => r + 1);
    },
    rootProps: {
      ref,
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === "mouse") setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      // Only keyboard focus pauses; clicking a dot shouldn't freeze it.
      onFocus: (e: FocusEvent<HTMLElement>) =>
        setFocused(e.target.matches(":focus-visible")),
      onBlur: (e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setFocused(false);
      },
    },
  };
}

type Carousel = ReturnType<typeof useAutoAdvance>;

function slideState(i: number, c: Carousel) {
  return i === c.index ? "active" : i === c.prev ? "leaving" : "idle";
}

export default function Projects() {
  const c = useAutoAdvance(projects.length);
  const multiple = projects.length > 1;

  return (
    <Section title="PROJECTS">
      <div {...c.rootProps} className="mt-8">
        <div className="grid">
          {projects.map((project, i) => {
            const state = slideState(i, c);
            return (
              <div
                key={project.title}
                inert={state !== "active"}
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,scale] ease-(--ease-out) motion-reduce:scale-100",
                  // The entering card fades in on top of the leaving one, which
                  // stays opaque until the fade ends, so there's no see-through dip.
                  state === "active" &&
                    "z-10 scale-100 opacity-100 duration-500",
                  state !== "active" &&
                    "z-0 scale-[0.985] opacity-0 duration-0",
                  state === "leaving" && "delay-500",
                )}
              >
                <BrowserCard project={project} />
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-4">
          <div className="grid flex-1">
            {projects.map((project, i) => {
              const state = slideState(i, c);
              return (
                <div
                  key={project.title}
                  inert={state !== "active"}
                  className={cn(
                    "col-start-1 row-start-1 transition-[opacity,translate] ease-(--ease-out) motion-reduce:translate-y-0",
                    state === "active" &&
                      "translate-y-0 opacity-100 duration-500 delay-100",
                    state === "leaving" &&
                      "-translate-y-1 opacity-0 duration-200",
                    state === "idle" && "translate-y-1.5 opacity-0 duration-0",
                  )}
                >
                  <ProjectText project={project} />
                </div>
              );
            })}
          </div>

          {/* First dot sits on the title line; the negative margin puts the pill on the card's right edge. */}
          {multiple && <Dots c={c} className="mt-4 -mr-2.25" />}
        </div>
      </div>
    </Section>
  );
}

/** Vertical dots. The active one opens into a pill that fills over the 5s interval. */
function Dots({ c, className }: { c: Carousel; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col", className)}>
      {projects.map((project, i) => {
        const active = i === c.index;
        return (
          <button
            key={project.title}
            type="button"
            aria-label={`Show ${project.title}`}
            aria-current={active ? "true" : undefined}
            onClick={() => c.goTo(i)}
            className="group/dot grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                "relative h-5 w-1.5 overflow-hidden rounded-full transition-[clip-path,background-color] duration-300 ease-(--ease-out)",
                active
                  ? "bg-neutral-300 [clip-path:inset(0_round_999px)] dark:bg-neutral-700"
                  : "bg-neutral-400 [clip-path:inset(7px_0_round_999px)] group-hover/dot:bg-neutral-500 dark:bg-neutral-600 dark:group-hover/dot:bg-neutral-500",
              )}
            >
              {active && (
                <span
                  key={`${c.index}-${c.run}`}
                  aria-hidden="true"
                  className="carousel-fill absolute inset-0 bg-foreground"
                  style={{
                    animationPlayState: c.paused ? "paused" : "running",
                  }}
                  onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) c.next();
                  }}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BrowserCard({ project }: { project: Project }) {
  const label = project.websiteUrl
    ? hostOf(project.websiteUrl)
    : project.title.toLowerCase();

  const content = (
    <>
      <div className="relative flex h-10 items-center gap-1.5 border-b border-border px-3.5">
        <span className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md bg-muted py-1 font-mono text-[11px] font-semibold text-muted-foreground",
            project.faviconSrc ? "pl-2.5 pr-6" : "px-6",
            project.websiteUrl &&
              "transition-[scale,color] duration-300 ease-(--ease-out) group-hover:scale-110 group-hover:text-foreground group-focus-visible:scale-110 group-focus-visible:text-foreground motion-reduce:transition-[color] motion-reduce:group-hover:scale-100",
          )}
        >
          {project.faviconSrc && (
            <span
              aria-hidden="true"
              className="size-3 shrink-0 bg-current"
              style={{
                mask: `url(${project.faviconSrc}) center / contain no-repeat`,
              }}
            />
          )}
          {label}
          {project.websiteUrl && (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="absolute right-1.5 size-2.5 -translate-x-1 translate-y-1 opacity-0 transition-[translate,opacity] duration-300 ease-(--ease-out) group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
            >
              <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
            </svg>
          )}
        </span>
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {project.videoSrc ? (
          <video
            src={project.videoSrc}
            poster={project.imageSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={project.title}
            className={cn(
              "absolute inset-0 size-full object-cover object-top",
              project.websiteUrl &&
                "transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.02]",
            )}
          />
        ) : (
          [
            { src: project.imageSrc, theme: project.imageSrcDark && "light" },
            project.imageSrcDark && {
              src: project.imageSrcDark,
              theme: "dark",
            },
          ].map(
            (img) =>
              img && (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={project.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={cn(
                    "object-cover object-top",
                    img.theme === "light" && "dark:hidden",
                    img.theme === "dark" && "hidden dark:block",
                    project.websiteUrl &&
                      "transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.02]",
                  )}
                />
              ),
          )
        )}
      </div>
    </>
  );

  const frame = "block overflow-hidden rounded-md border border-border bg-card";

  if (!project.websiteUrl) return <div className={frame}>{content}</div>;

  return (
    <a
      href={project.websiteUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${label}`}
      className={cn(
        frame,
        "group outline-none transition-[border-color,box-shadow] duration-300 hover:border-foreground/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {content}
    </a>
  );
}

function ProjectText({ project }: { project: Project }) {
  return (
    <div className="flex items-start gap-3 py-4">
      {project.logo && (
        <>
          <ProjectLogo src={project.logo.light} className="dark:hidden" />
          <ProjectLogo src={project.logo.dark} className="hidden dark:block" />
        </>
      )}
      <div>
        <h3 className="text-base font-semibold leading-6">{project.title}</h3>
        <p className="text-base leading-6 text-muted-foreground">
          {project.description}
        </p>
      </div>
    </div>
  );
}

function ProjectLogo({ src, className }: { src: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      unoptimized
      className={cn("size-10 shrink-0", className)}
    />
  );
}
