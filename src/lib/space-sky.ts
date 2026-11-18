/**
 * The 3D part of space mode (see SpaceMode): a cloud of stars and the
 * supernova's remnant, drawn on a canvas from a camera that slowly orbits the
 * supernova. Stars in front of it sweep one way and stars behind it the other,
 * while the supernova itself stays put, which is what makes it read as depth.
 *
 * World units are CSS pixels at the supernova's distance; +y is up.
 */

/** Seconds for the camera to go once around the supernova. */
const ORBIT_SECONDS = 300;
/** Camera distance from the supernova, and the focal length (1:1 there). */
const CAMERA_DISTANCE = 1400;
/** Stars closer to the lens than this are dropped; they fade in past it. */
const NEAR = 450;
const NEAR_FADE = 500;
/** Radius of the star cloud. The camera travels inside it. */
const CLOUD_RADIUS = 4200;
const STAR_COUNT = 4500;

const TINTS = ["rgb(255 255 255)", "rgb(219 234 254)", "rgb(191 219 254)"];
const REMNANT_TINTS = [
  "rgb(147 197 253)",
  "rgb(191 219 254)",
  "rgb(129 140 248)",
];

/** Small seeded PRNG so the sky is the same every time. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  tint: number;
  /** Twinkle speed (rad/s) and phase; 0 speed means steady. */
  rate: number;
  phase: number;
};

/** A random direction, uniform over the sphere. */
function direction(random: () => number) {
  const y = random() * 2 - 1;
  const around = random() * Math.PI * 2;
  const flat = Math.sqrt(1 - y * y);
  return { x: flat * Math.cos(around), y, z: flat * Math.sin(around) };
}

function createStars(): Point[] {
  const random = mulberry32(11);
  const stars: Point[] = [];
  while (stars.length < STAR_COUNT) {
    const d = direction(random);
    // Cube root spreads them evenly through the volume; keep the middle clear.
    const r = CLOUD_RADIUS * Math.cbrt(random());
    if (r < 340) continue;

    const kind = random();
    const bright = kind > 0.97;
    const medium = kind > 0.8;
    stars.push({
      x: d.x * r,
      y: d.y * r,
      z: d.z * r,
      size: bright ? 2.1 : medium ? 1.4 : 1,
      alpha: bright ? 1 : medium ? 0.8 : 0.35 + random() * 0.3,
      tint: Math.floor(random() * TINTS.length),
      rate: medium ? 0.6 + random() * 1.2 : 0,
      phase: random() * Math.PI * 2,
    });
  }
  return stars;
}

/**
 * The remnant, in units of the supernova's on-screen size: two clumpy shells
 * of debris and a tilted inner ring. A sphere looks the same from every side,
 * so the clumps and the ring are what show the camera moving around it.
 */
function createRemnant(): Point[] {
  const random = mulberry32(29);
  const points: Point[] = [];

  const shell = (count: number, radius: number, alpha: number) => {
    let made = 0;
    while (made < count) {
      const d = direction(random);
      // Cheap lumpy noise: keep only where it's high, so debris gathers
      // into filaments and leaves gaps.
      const lump =
        Math.sin(d.x * 5.1 + 1.3) * Math.sin(d.y * 4.3 + 0.4) +
        Math.sin(d.z * 6.2 + 2.2) * Math.sin(d.x * 3.4 + d.y * 2.9);
      if (lump < 0.15 && random() > 0.12) continue;

      const r = radius * (0.9 + random() * 0.2);
      points.push({
        x: d.x * r,
        y: d.y * r,
        z: d.z * r,
        size: 0.9 + random() * 0.9,
        alpha: alpha * (0.5 + random() * 0.5),
        tint: Math.floor(random() * REMNANT_TINTS.length),
        rate: 0,
        phase: 0,
      });
      made += 1;
    }
  };

  shell(520, 0.36, 0.75);
  shell(380, 0.56, 0.45);

  // Inner ring, tipped over so it opens and closes as the camera circles.
  const tilt = 1.12;
  const lean = 0.35;
  for (let i = 0; i < 260; i++) {
    const around = random() * Math.PI * 2;
    const r = 0.22 * (0.96 + random() * 0.08);
    const x0 = Math.cos(around) * r;
    const z0 = Math.sin(around) * r;
    const y0 = (random() - 0.5) * 0.012;
    // Tilt about x, then lean about z.
    const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    points.push({
      x: x0 * Math.cos(lean) - y1 * Math.sin(lean),
      y: x0 * Math.sin(lean) + y1 * Math.cos(lean),
      z: z1,
      size: 1 + random() * 0.8,
      alpha: 0.6 + random() * 0.4,
      tint: 1,
      rate: 0,
      phase: 0,
    });
  }

  return points;
}

/**
 * Start drawing. `anchor` marks where the supernova sits and how big it is
 * (its left/top/width come from CSS). `drifters` are the DOM pieces of the
 * supernova, which get the same scroll drift as the canvas via `--sp-p`.
 * Returns a function that stops everything.
 */
export function startSpaceSky(
  canvas: HTMLCanvasElement,
  anchor: HTMLElement,
  drifters: HTMLElement[],
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const stars = createStars();
  const remnant = createRemnant();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pivotX = 0;
  let pivotY = 0;
  let novaSize = 400;
  let drift = 0;

  const measure = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const box = anchor.getBoundingClientRect();
    pivotX = box.left;
    pivotY = box.top;
    novaSize = box.width;
    drift =
      Number.parseFloat(
        getComputedStyle(anchor).getPropertyValue("--sp-drift"),
      ) || 0;
  };

  /** Scroll, eased to 0..1: it lifts the camera and drifts the supernova up. */
  let progress = 0;
  let applied = -1;
  const scrollTarget = () => 1 - Math.exp(-window.scrollY / 700);
  const applyProgress = () => {
    if (progress === applied) return;
    applied = progress;
    const value = progress.toFixed(4);
    for (const el of drifters) el.style.setProperty("--sp-p", value);
  };

  const draw = (seconds: number) => {
    // The orbit. On opening, the camera swings in from the side and settles.
    const swing = still ? 0 : -0.45 * Math.exp(-seconds / 1.1);
    const angle = 0.6 + (seconds / ORBIT_SECONDS) * Math.PI * 2 + swing;
    // Looking slightly down; it bobs slowly, and scrolling lifts it further.
    const pitch =
      0.16 + 0.07 * Math.sin((seconds / 97) * Math.PI * 2) + progress * 0.24;

    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const sinP = Math.sin(pitch);
    const cosP = Math.cos(pitch);
    const centerX = pivotX;
    const centerY = pivotY - progress * drift;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const plot = (
      points: Point[],
      unit: number,
      tints: string[],
      isRemnant: boolean,
    ) => {
      for (const p of points) {
        // Turn the world by the orbit, then tip it by the pitch.
        const x = (p.x * cosA - p.z * sinA) * unit;
        const zTurned = (p.x * sinA + p.z * cosA) * unit;
        const yWorld = p.y * unit;
        const y = yWorld * cosP - zTurned * sinP;
        const toward = yWorld * sinP + zTurned * cosP;

        const depth = CAMERA_DISTANCE - toward;
        if (depth < NEAR) continue;
        const scale = CAMERA_DISTANCE / depth;
        const sx = centerX + x * scale;
        const sy = centerY - y * scale;
        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;

        let alpha = p.alpha;
        if (depth < NEAR + NEAR_FADE) alpha *= (depth - NEAR) / NEAR_FADE;
        if (isRemnant) {
          // The far side of the shell is dimmer than the near side.
          alpha *= 0.55 + 0.45 * (toward / (novaSize * 0.6));
        } else if (p.rate && !still) {
          alpha *= 0.72 + 0.28 * Math.sin(seconds * p.rate + p.phase);
        }
        if (alpha <= 0.02) continue;

        const size = p.size * Math.min(1.9, Math.max(0.65, scale));
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = tints[p.tint];
        if (size < 1.7) {
          ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, size / 2, 0, Math.PI * 2);
          ctx.fill();
          // A soft halo on the brightest ones.
          ctx.globalAlpha = Math.min(1, alpha) * 0.18;
          ctx.beginPath();
          ctx.arc(sx, sy, size * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    ctx.globalCompositeOperation = "source-over";
    plot(stars, 1, TINTS, false);
    // Debris adds up where it overlaps, so dense filaments glow.
    ctx.globalCompositeOperation = "lighter";
    plot(remnant, novaSize, REMNANT_TINTS, true);
    ctx.globalAlpha = 1;
  };

  measure();

  // Reduced motion: one still frame, redrawn only when the page changes.
  if (still) {
    const redraw = () => {
      measure();
      progress = scrollTarget();
      applyProgress();
      draw(30);
    };
    redraw();
    window.addEventListener("scroll", redraw, { passive: true });
    window.addEventListener("resize", redraw);
    return () => {
      window.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
    };
  }

  let frame = 0;
  let startedAt = 0;
  let previous = 0;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    startedAt ||= now;
    const elapsed = Math.min(now - (previous || now), 100);
    previous = now;

    // Ease toward the scroll position so the camera has a little weight.
    // Time-based, so it settles equally fast at any refresh rate.
    const target = scrollTarget();
    progress += (target - progress) * (1 - Math.exp(-elapsed / 180));
    if (Math.abs(target - progress) < 0.0005) progress = target;
    applyProgress();

    draw((now - startedAt) / 1000);
  };
  frame = requestAnimationFrame(tick);
  window.addEventListener("resize", measure);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", measure);
  };
}
