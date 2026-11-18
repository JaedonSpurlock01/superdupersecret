"use client";

import { useEffect, useRef, useState } from "react";
import { type Climb, gradeRank } from "@/lib/data/climbs";
import { createRope, type Rope } from "@/lib/rope";
import { cn } from "@/lib/utils";
import { useClimbDialog } from "./climb-dialog";

/**
 * The climbing logbook as a rope. Each row is a climb, newest first, and the
 * rope clips it at its grade: further right is harder, so the rope's wander
 * down the page is a chart of how hard the climbing has been. A climber
 * leads off the top; a belayer stands at the bottom, wherever the bottom is.
 *
 * The rope is a small simulation (see lib/rope): it has slack, moves when a
 * row is hovered or the pointer brushes it, then settles and stops.
 *
 * Long lists show the newest few and open in place. Clicking a row opens it
 * (see ClimbDialog). Styles live in globals.css under "Climbing".
 */

const ON_PAGE = 8;
const ROW = 36;
/** Room above the first row for the climber, and below the last for the belayer. */
const HEAD = 30;
const FOOT = 38;
const X0 = 14;
const STEP = 13;
const AXIS = ["5.8", "5.10a", "5.11a", "5.12a"];
/** Where the belayer stands, from the left. */
const BELAY_X = 30;

const xOf = (grade: string) => X0 + gradeRank(grade) * STEP;
const yOf = (row: number) => HEAD + ROW * row + ROW / 2;

/** Where the leader starts, relative to the top bolt. */
const LEAD = { above: 17, aside: 5 };
/** The fall (see `fall`). Per 60Hz step, in px. */
const FALL = {
  gravity: 0.32,
  /** Rope out between the top bolt and the climber, slack included. */
  rope: 50,
  spring: 0.14,
  damping: 0.22,
  /** Share of the rope's pull that makes it past the top bolt. */
  friction: 0.6,
  /** Belayer's weight relative to the climber's. */
  belayer: 1.15,
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ClimbRope({ climbs }: { climbs: Climb[] }) {
  const [all, setAll] = useState(false);
  const [seen, setSeen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  // How many rows the rope reaches right now. It follows the list's height
  // while that animates, so the belayer always holds the end.
  const [reach, setReach] = useState(Math.min(ON_PAGE, climbs.length));
  const clipRef = useRef<HTMLDivElement>(null);
  const ropeRef = useRef<SVGPathElement>(null);
  const weaveRef = useRef<SVGPathElement>(null);
  const rope = useRef<Rope | null>(null);
  const reachRef = useRef(reach);
  const climberRef = useRef<SVGGElement>(null);
  const belayerRef = useRef<SVGGElement>(null);
  const falling = useRef(false);
  const dialog = useClimbDialog(climbs);

  const shown = all ? climbs.length : Math.min(ON_PAGE, climbs.length);
  const top = climbs[0];

  useEffect(() => {
    const clip = clipRef.current;
    if (!clip || !ropeRef.current || !weaveRef.current || !climbs.length) {
      return;
    }
    const paths = [ropeRef.current, weaveRef.current];

    const build = () => {
      rope.current?.stop();
      const height = clip.clientHeight;
      const count = Math.max(
        1,
        Math.min(
          climbs.length,
          Math.floor((height - FOOT - HEAD) / ROW + 0.05),
        ),
      );
      reachRef.current = count;
      setReach(count);
      // Belayer's hands, then each bolt from the lowest up, then the climber.
      const anchors = [{ x: BELAY_X - 4, y: height - 19 }];
      for (let row = count - 1; row >= 0; row--) {
        anchors.push({ x: xOf(climbs[row].grade), y: yOf(row) });
      }
      anchors.push({
        x: xOf(climbs[0].grade) + LEAD.aside,
        y: yOf(0) - LEAD.above,
      });
      rope.current = createRope(anchors, paths);
    };

    build();
    const sizes = new ResizeObserver(build);
    sizes.observe(clip);
    const views = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        views.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    views.observe(clip);
    return () => {
      sizes.disconnect();
      views.disconnect();
      rope.current?.stop();
    };
  }, [climbs]);

  if (!top) return null;

  // Easter egg: click the climber and they come off. A small two-body model:
  // the climber free-falls until the rope runs out, the rope stretches and
  // catches them, and the pull through the top bolt hoists the belayer off
  // the ground for a moment. Then the climber gets back on the wall.
  const fall = () => {
    const clip = clipRef.current;
    const climber = climberRef.current;
    const belayer = belayerRef.current;
    if (falling.current || prefersReducedMotion()) return;
    if (!clip || !climber || !belayer) return;
    falling.current = true;

    const bolt = { x: xOf(top.grade), y: yOf(0) };
    let below = -LEAD.above; // climber: px below the top bolt
    let speed = 0;
    let lift = 0; // belayer: px off the ground
    let liftSpeed = 0;
    let caught = false;
    let calm = 0;
    let rest: { at: number; from: number } | null = null;
    let last = performance.now();
    let owed = 0;

    const place = () => {
      // Drifts under the bolt as the rope takes over from the wall.
      const out = Math.max(0, Math.min(1, 1 - (below + LEAD.above) / 30));
      const x = bolt.x + LEAD.aside * out;
      const y = bolt.y + below;
      const lean = rest ? 0 : Math.max(-22, -speed * 5);
      climber.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${lean.toFixed(1)}) scale(1.4)`,
      );
      belayer.setAttribute(
        "transform",
        `translate(${BELAY_X} ${(19 - lift).toFixed(1)}) scale(1.4)`,
      );
      const line = rope.current;
      if (!line) return;
      line.move(0, BELAY_X - 4, clip.clientHeight - 19 - lift);
      line.move(reachRef.current + 1, x, y);
    };

    const step = () => {
      // Taut once the climber is past the rope they had out, plus whatever
      // the belayer has given by being lifted.
      const stretch = below - (FALL.rope + lift);
      const tension =
        stretch > 0
          ? Math.max(
              0,
              FALL.spring * stretch + FALL.damping * (speed - liftSpeed),
            )
          : 0;
      if (stretch > 0) caught = true;
      speed += FALL.gravity - tension;
      below += speed;
      // The bolt's carabiner takes some of the force before it reaches the
      // belayer, who weighs a little more than the climber.
      const pull = tension * FALL.friction - FALL.belayer * FALL.gravity;
      if (lift > 0 || pull > 0) {
        liftSpeed += pull / FALL.belayer;
        lift += liftSpeed;
        if (lift <= 0) {
          lift = 0;
          liftSpeed = 0;
        }
      }
      const still =
        caught && lift === 0 && Math.abs(speed) < 0.03 && liftSpeed === 0;
      calm = still ? calm + 1 : 0;
    };

    const tick = (now: number) => {
      if (!clipRef.current) return;
      if (rest) {
        // Hang for a beat, then climb back to the high point.
        const k = Math.min(1, Math.max(0, (now - rest.at - 700) / 1100));
        const eased = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
        below = rest.from + (-LEAD.above - rest.from) * eased;
        place();
        if (k < 1) requestAnimationFrame(tick);
        else falling.current = false;
        return;
      }
      // Fixed steps, a touch slower than real time so it reads at this size.
      owed += Math.min(now - last, 50) * 0.7;
      last = now;
      while (owed >= 1000 / 60) {
        owed -= 1000 / 60;
        step();
      }
      if (calm > 12) rest = { at: now, from: below };
      place();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <div className="mt-8">
      {/* Grade axis. */}
      <div aria-hidden="true" className="relative h-5">
        {AXIS.map((grade) => (
          <span
            key={grade}
            className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground tabular-nums"
            style={{ left: xOf(grade) }}
          >
            {grade.replace(/[a-d]$/, "")}
          </span>
        ))}
      </div>

      {/* Height is animated because this is an accordion: nothing else
          reflows what sits below it. */}
      <div
        ref={clipRef}
        data-seen={seen}
        className="climb-rope relative -mr-3 overflow-hidden pr-3 transition-[height] duration-300 ease-(--ease-out) motion-reduce:transition-none"
        style={{ height: HEAD + ROW * shown + FOOT }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
          const box = event.currentTarget.getBoundingClientRect();
          rope.current?.push(event.clientX - box.left, event.clientY - box.top);
        }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-44 overflow-visible"
          style={{ height: HEAD + ROW * climbs.length + FOOT }}
        >
          {AXIS.map((grade) => (
            <line
              key={grade}
              x1={xOf(grade)}
              x2={xOf(grade)}
              y1={0}
              y2="100%"
              stroke="currentColor"
              strokeDasharray="1 5"
              opacity={0.25}
            />
          ))}

          <path
            ref={ropeRef}
            pathLength={1}
            className="climb-rope-line"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <path
            ref={weaveRef}
            className="climb-rope-weave"
            fill="none"
            stroke="var(--climb-accent)"
            strokeDasharray="2 6"
            strokeLinecap="round"
          />

          {climbs.map((climb, row) => {
            const x = xOf(climb.grade);
            const y = yOf(row);
            return (
              <g
                key={climb.id}
                className="climb-bolt"
                data-hot={hovered === row}
                data-off={row >= reach}
                style={
                  {
                    // The first rows wake as the rope reaches them.
                    "--clip-delay":
                      row < ON_PAGE
                        ? `${Math.round((1 - (row + 0.5) / ON_PAGE) * 1100)}ms`
                        : "0ms",
                    transformOrigin: `${x}px ${y}px`,
                  } as React.CSSProperties
                }
                stroke="currentColor"
                strokeWidth={1.25}
              >
                {climb.style === "boulder" ? (
                  <rect
                    x={x - 3.5}
                    y={y - 3.5}
                    width={7}
                    height={7}
                    rx={1}
                    transform={`rotate(45 ${x} ${y})`}
                    fill="var(--climb-paper)"
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={
                      climb.style === "trad"
                        ? "currentColor"
                        : "var(--climb-paper)"
                    }
                  />
                )}
              </g>
            );
          })}

          {/* Leading off the top: tied in at the waist, reaching for the next hold. */}
          <g className="climb-figure climb-figure-lead">
            <g
              ref={climberRef}
              transform={`translate(${xOf(top.grade) + LEAD.aside} ${yOf(0) - LEAD.above}) scale(1.4)`}
            >
              <Climber />
            </g>
          </g>
        </svg>

        {/* Belaying from the ground. Rides the bottom edge as the list opens. */}
        <svg
          aria-hidden="true"
          className="climb-figure pointer-events-none absolute bottom-0 left-0 h-9 w-14 overflow-visible"
        >
          <g ref={belayerRef} transform={`translate(${BELAY_X} 19) scale(1.4)`}>
            <Belayer />
          </g>
          <path
            d={`M${BELAY_X - 14} 33.5h30`}
            stroke="currentColor"
            strokeLinecap="round"
            opacity={0.3}
          />
        </svg>

        {/* Nothing says so, but the climber can be knocked off. */}
        <button
          type="button"
          aria-label="Make the climber fall"
          onClick={fall}
          className="absolute size-8 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-ring"
          style={{
            left: xOf(top.grade) + LEAD.aside - 16,
            top: yOf(0) - LEAD.above - 22,
          }}
        />

        <ul className="pl-44" style={{ paddingTop: HEAD }}>
          {climbs.map((climb, row) => {
            const visible = row < shown;
            const flight = dialog.rowProps(climb.id);
            return (
              <li
                key={climb.id}
                inert={!visible}
                className={cn(
                  "group relative transition-opacity duration-200 ease-(--ease-out)",
                  !visible && "opacity-0",
                )}
                style={{ height: ROW }}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  setHovered(row);
                  // Anchor 0 is the belayer; bolts count up from the lowest.
                  if (!prefersReducedMotion() && row < reachRef.current) {
                    rope.current?.tug(reachRef.current - row);
                  }
                }}
                onPointerLeave={() => setHovered(null)}
              >
                <div
                  {...flight}
                  className={cn(
                    "flex h-full items-center justify-between gap-3 transition-transform duration-150 ease-(--ease-out) has-[+button:active]:scale-[0.985]",
                    flight.className,
                  )}
                >
                  <span className="truncate text-sm font-medium">
                    {climb.name}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <span className="hidden text-sm text-muted-foreground sm:inline">
                      {climb.date}
                    </span>
                    <span className="w-10 text-right font-mono text-[11px] uppercase tracking-wide text-muted-foreground tabular-nums">
                      {climb.grade}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Open ${climb.name}`}
                  className="absolute -inset-x-2.5 inset-y-0.5 cursor-pointer rounded-md transition-colors duration-150 hover:bg-foreground/6 focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => dialog.show(climb.id)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-2 flex items-center justify-between pl-44">
        {climbs.length > ON_PAGE ? (
          <button
            type="button"
            aria-expanded={all}
            onClick={() => setAll((now) => !now)}
            className="-mx-2 cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-neutral-500 transition-[color,background-color,scale] duration-150 ease-(--ease-out) hover:bg-foreground/5 hover:text-black active:scale-[0.97] dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {all ? "Show fewer" : `Show all ${climbs.length}`}
          </button>
        ) : (
          <span />
        )}
        <span
          aria-hidden="true"
          className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
        >
          ○ sport · ● trad · ◇ boulder
        </span>
      </div>

      {dialog.dialog}
    </div>
  );
}

/* Both figures are drawn around the waist, where the rope meets them. */

const FIGURE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Climber() {
  return (
    <g {...FIGURE}>
      <circle cx={1.5} cy={-10.5} r={2.1} fill="var(--climb-paper)" />
      <path d="M0 0L1-7.5" />
      <path d="M1-7.5L-3-10.5L-2.5-14.5" />
      <path d="M1-7.5L5-9L5.5-13" />
      <path d="M0 0L-4.5 1L-3.5 5.5" />
      <path d="M0 0L2.5 5L2 10" />
    </g>
  );
}

function Belayer() {
  return (
    <g {...FIGURE}>
      {/* Head tipped back, watching the leader. */}
      <circle cx={0.8} cy={-10.5} r={2.1} fill="var(--climb-paper)" />
      <path d="M0 0L0-7.5" />
      <path d="M0-7.5L-3.2-11.5" />
      <path d="M0-7.5L-3.8-4.5L-3.3-1" />
      <path d="M0 0L-2.5 10.5" />
      <path d="M0 0L3 10.5" />
    </g>
  );
}
