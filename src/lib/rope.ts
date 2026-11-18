/**
 * A small rope for the Climbing section: a chain of points held at a list of
 * anchors, with a little slack between each pair so it hangs instead of
 * running dead straight. It settles under gravity and then stops; a tug or a
 * push from the pointer wakes it until it settles again.
 */

export type RopePoint = { x: number; y: number };

export type Rope = {
  /** A small pull either side of an anchor. */
  tug: (anchor: number) => void;
  /** Nudge the rope away from a point (the pointer). */
  push: (x: number, y: number) => void;
  /** Carry an anchor somewhere else; the rope follows. */
  move: (anchor: number, x: number, y: number) => void;
  stop: () => void;
};

const SEGMENTS = 9;
const SLACK = 1.045;
const REACH = 26;

/** `anchors` run from the belayer up to the climber. Each path gets the same `d`. */
export function createRope(
  anchors: RopePoint[],
  paths: SVGPathElement[],
): Rope {
  const count = (anchors.length - 1) * SEGMENTS + 1;
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const px = new Float32Array(count);
  const py = new Float32Array(count);
  const rest = new Float32Array(count);

  for (let span = 0; span < anchors.length - 1; span++) {
    const a = anchors[span];
    const b = anchors[span + 1];
    const length = (Math.hypot(b.x - a.x, b.y - a.y) * SLACK) / SEGMENTS;
    for (let k = 0; k < SEGMENTS; k++) {
      const i = span * SEGMENTS + k;
      const f = k / SEGMENTS;
      x[i] = a.x + (b.x - a.x) * f;
      y[i] = a.y + (b.y - a.y) * f + Math.sin(f * Math.PI) * 3;
      rest[i] = length;
    }
  }
  const last = anchors[anchors.length - 1];
  x[count - 1] = last.x;
  y[count - 1] = last.y;
  px.set(x);
  py.set(y);

  const pinned = (i: number) => i % SEGMENTS === 0;

  const step = () => {
    let energy = 0;
    for (let i = 0; i < count; i++) {
      if (pinned(i)) continue;
      const vx = (x[i] - px[i]) * 0.9;
      const vy = (y[i] - py[i]) * 0.9;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx;
      y[i] += vy + 0.1;
      energy += Math.abs(vx) + Math.abs(vy);
    }
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 0; i < count - 1; i++) {
        const dx = x[i + 1] - x[i];
        const dy = y[i + 1] - y[i];
        const distance = Math.hypot(dx, dy) || 1;
        const diff = (distance - rest[i]) / distance;
        const a = pinned(i) ? 0 : pinned(i + 1) ? 1 : 0.5;
        const b = pinned(i + 1) ? 0 : pinned(i) ? 1 : 0.5;
        x[i] += dx * diff * a;
        y[i] += dy * diff * a;
        x[i + 1] -= dx * diff * b;
        y[i + 1] -= dy * diff * b;
      }
    }
    return energy;
  };

  const render = () => {
    let d = `M${x[0].toFixed(1)} ${y[0].toFixed(1)}`;
    for (let i = 1; i < count - 1; i++) {
      const mx = (x[i] + x[i + 1]) / 2;
      const my = (y[i] + y[i + 1]) / 2;
      d += `Q${x[i].toFixed(1)} ${y[i].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += `L${x[count - 1].toFixed(1)} ${y[count - 1].toFixed(1)}`;
    for (const path of paths) path.setAttribute("d", d);
  };

  let frame = 0;
  let calm = 0;
  const tick = () => {
    frame = 0;
    calm = step() < 0.05 ? calm + 1 : 0;
    render();
    if (calm < 20) frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    calm = 0;
    if (!frame) frame = requestAnimationFrame(tick);
  };

  // Settle before the first paint so it doesn't visibly drop into place.
  for (let i = 0; i < 240; i++) step();
  render();

  return {
    stop: () => cancelAnimationFrame(frame),
    move: (anchor, ax, ay) => {
      const i = Math.min(anchor * SEGMENTS, count - 1);
      x[i] = px[i] = ax;
      y[i] = py[i] = ay;
      wake();
    },
    tug: (anchor) => {
      const at = anchor * SEGMENTS;
      for (const i of [at - 4, at - 3, at + 3, at + 4]) {
        if (i > 0 && i < count && !pinned(i)) px[i] += i < at ? 2.2 : -2.2;
      }
      wake();
    },
    push: (cx, cy) => {
      let moved = false;
      for (let i = 0; i < count; i++) {
        if (pinned(i)) continue;
        const dx = x[i] - cx;
        const dy = y[i] - cy;
        const distance = Math.hypot(dx, dy);
        if (distance > REACH) continue;
        x[i] += (dx / (distance || 1)) * (1 - distance / REACH) * 0.9;
        moved = true;
      }
      if (moved) wake();
    },
  };
}
