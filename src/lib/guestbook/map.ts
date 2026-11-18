/**
 * The guestbook's dot map: where each land dot sits, how a latitude and
 * longitude land on it, and which city a dot is near. Entries store only a
 * dot id; everything shown about a place is worked out from that here.
 */

import { currentLocation } from "@/lib/data/location";
import mapData from "@/lib/data/map.json";

export type Dot = { id: string; x: number; y: number };

const POINTS = mapData.points as Record<string, { x: number; y: number }>;

export const DOTS: Dot[] = Object.entries(POINTS).map(([id, p]) => ({
  id,
  x: p.x,
  y: p.y,
}));

export const dotById = (id: string): Dot | null =>
  POINTS[id] ? { id, ...POINTS[id] } : null;

/** The SVG viewBox the map is drawn in: the dot grid plus a margin. */
export const VB = { x: -2, y: -2, w: 109, h: 54 };
export const VIEWBOX = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;

const DOT_R = 0.27;
/** Every land dot as one path, so the base map is a single element. */
export const BASE_PATH = DOTS.map(
  (d) =>
    `M${(d.x - DOT_R).toFixed(2)} ${d.y.toFixed(2)}a${DOT_R} ${DOT_R} 0 1 0 ${DOT_R * 2} 0a${DOT_R} ${DOT_R} 0 1 0 ${-DOT_R * 2} 0`,
).join("");

const EARTH = 6378137;
const X_SPAN = 104.5;
const Y_SPAN = 57 * mapData.ystep;

/** Latitude/longitude to map units (web mercator, like the dot grid). */
export function project(lat: number, lng: number) {
  const rad = Math.PI / 180;
  const my = EARTH * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
  return {
    x: ((lng * rad * EARTH - mapData.X_MIN) / mapData.X_RANGE) * X_SPAN,
    y: ((mapData.Y_MAX - my) / mapData.Y_RANGE) * Y_SPAN,
  };
}

export function nearestDot(x: number, y: number): Dot {
  let best = DOTS[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const d of DOTS) {
    const dist = (d.x - x) ** 2 + (d.y - y) ** 2;
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

/** A pointer position over the map's SVG, in map units. */
export function toMap(
  e: { clientX: number; clientY: number },
  svg: SVGSVGElement,
) {
  const r = svg.getBoundingClientRect();
  return {
    x: VB.x + ((e.clientX - r.left) / r.width) * VB.w,
    y: VB.y + ((e.clientY - r.top) / r.height) * VB.h,
  };
}

const home = project(
  currentLocation.coordinates.lat,
  currentLocation.coordinates.lng,
);
/** Where every postcard is headed. */
export const HOME = nearestDot(home.x, home.y);

/** Time zone to a city. Doubles as the list of places a dot can be "near". */
const CITIES: Record<string, [string, number, number]> = {
  "America/Anchorage": ["Anchorage", 61.2, -149.9],
  "America/Los_Angeles": ["Los Angeles", 34.05, -118.24],
  "America/Vancouver": ["Vancouver", 49.28, -123.12],
  "America/Phoenix": ["Phoenix", 33.45, -112.07],
  "America/Denver": ["Denver", 39.74, -104.99],
  "America/Chicago": ["Chicago", 41.88, -87.63],
  "America/Mexico_City": ["Mexico City", 19.43, -99.13],
  "America/New_York": ["New York", 40.71, -74.01],
  "America/Toronto": ["Toronto", 43.65, -79.38],
  "America/Bogota": ["Bogotá", 4.71, -74.07],
  "America/Lima": ["Lima", -12.05, -77.04],
  "America/Santiago": ["Santiago", -33.45, -70.67],
  "America/Sao_Paulo": ["São Paulo", -23.55, -46.63],
  "America/Argentina/Buenos_Aires": ["Buenos Aires", -34.6, -58.38],
  "Europe/London": ["London", 51.51, -0.13],
  "Europe/Dublin": ["Dublin", 53.35, -6.26],
  "Europe/Lisbon": ["Lisbon", 38.72, -9.14],
  "Europe/Madrid": ["Madrid", 40.42, -3.7],
  "Europe/Paris": ["Paris", 48.86, 2.35],
  "Europe/Amsterdam": ["Amsterdam", 52.37, 4.9],
  "Europe/Berlin": ["Berlin", 52.52, 13.4],
  "Europe/Rome": ["Rome", 41.9, 12.5],
  "Europe/Stockholm": ["Stockholm", 59.33, 18.07],
  "Europe/Oslo": ["Oslo", 59.91, 10.75],
  "Europe/Helsinki": ["Helsinki", 60.17, 24.94],
  "Europe/Warsaw": ["Warsaw", 52.23, 21.01],
  "Europe/Athens": ["Athens", 37.98, 23.73],
  "Europe/Istanbul": ["Istanbul", 41.01, 28.98],
  "Europe/Kyiv": ["Kyiv", 50.45, 30.52],
  "Europe/Moscow": ["Moscow", 55.76, 37.62],
  "Africa/Cairo": ["Cairo", 30.04, 31.24],
  "Africa/Lagos": ["Lagos", 6.52, 3.38],
  "Africa/Nairobi": ["Nairobi", -1.29, 36.82],
  "Africa/Johannesburg": ["Johannesburg", -26.2, 28.05],
  "Asia/Dubai": ["Dubai", 25.2, 55.27],
  "Asia/Karachi": ["Karachi", 24.86, 67.0],
  "Asia/Kolkata": ["Kolkata", 22.57, 88.36],
  "Asia/Dhaka": ["Dhaka", 23.81, 90.41],
  "Asia/Bangkok": ["Bangkok", 13.76, 100.5],
  "Asia/Jakarta": ["Jakarta", -6.21, 106.85],
  "Asia/Singapore": ["Singapore", 1.35, 103.82],
  "Asia/Manila": ["Manila", 14.6, 120.98],
  "Asia/Hong_Kong": ["Hong Kong", 22.32, 114.17],
  "Asia/Shanghai": ["Shanghai", 31.23, 121.47],
  "Asia/Taipei": ["Taipei", 25.03, 121.57],
  "Asia/Seoul": ["Seoul", 37.57, 126.98],
  "Asia/Tokyo": ["Tokyo", 35.68, 139.69],
  "Australia/Perth": ["Perth", -31.95, 115.86],
  "Australia/Melbourne": ["Melbourne", -37.81, 144.96],
  "Australia/Sydney": ["Sydney", -33.87, 151.21],
  "Pacific/Auckland": ["Auckland", -36.85, 174.76],
};

const CITY_DOTS = Object.values(CITIES).map(([name, lat, lng]) => {
  const p = project(lat, lng);
  return { name, dot: nearestDot(p.x, p.y) };
});

/** How far, in map units, a dot can be from a city and still be "near" it. */
const NEAR = 7;

/** The known city closest to a dot, or "" when it is out in the sticks. */
export function placeNear(dot: { x: number; y: number }): string {
  let place = "";
  let bestD = NEAR ** 2;
  for (const c of CITY_DOTS) {
    const dist = (c.dot.x - dot.x) ** 2 + (c.dot.y - dot.y) ** 2;
    if (dist < bestD) {
      bestD = dist;
      place = c.name;
    }
  }
  return place;
}

/**
 * The dot the visitor is probably nearest, from their time zone alone: no
 * permission prompt, no IP lookup. Good to a city for common zones, to a
 * longitude otherwise. Browser only.
 */
export function guessDot(): Dot {
  const city = CITIES[Intl.DateTimeFormat().resolvedOptions().timeZone];
  const p = city
    ? project(city[1], city[2])
    : project(35, (-new Date().getTimezoneOffset() / 60) * 15);
  return nearestDot(p.x, p.y);
}
