/**
 * TODO: SAMPLE DATA. Every climb below is invented (names, grades, dates,
 * notes), and the photos are stand-ins from /public/photos. Replace with the
 * real logbook before this section goes live. Newest first.
 */

export type ClimbStyle = "sport" | "trad" | "boulder";

export type Climb = {
  id: string;
  name: string;
  grade: string;
  style: ClimbStyle;
  /** The crag or area, e.g. "Golden Cliffs". */
  crag: string;
  /** Town and state, e.g. "Golden, CO". */
  location: string;
  /** "Jun 2025" */
  date: string;
  notes: string;
  photos: { src: string; alt: string }[];
  /** The route's Mountain Project page. Falls back to a search for the name. */
  mountainProject?: string;
};

const STAND_INS = [
  { src: "/photos/climbing.jpg", alt: "Lead climbing a sunlit rock spire" },
  { src: "/photos/hiking.jpg", alt: "On a summit" },
  { src: "/photos/travel.jpg", alt: "On the road" },
];

const CRAGS: Record<string, string> = {
  "Golden Cliffs": "Golden, CO",
  "Clear Creek Canyon": "Golden, CO",
  "Red Rock": "Las Vegas, NV",
  "Joshua Tree": "Joshua Tree, CA",
  Buttermilks: "Bishop, CA",
  "Mission Gorge": "San Diego, CA",
};

let made = 0;
const climb = (
  name: string,
  grade: string,
  style: ClimbStyle,
  crag: keyof typeof CRAGS,
  date: string,
  notes: string,
): Climb => {
  made += 1;
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    grade,
    style,
    crag,
    location: CRAGS[crag],
    date,
    notes,
    photos: [0, 1, 2].map((n) => STAND_INS[(made + n) % STAND_INS.length]),
  };
};

export const climbs: Climb[] = [
  climb(
    "Basalt Daydream",
    "5.11b",
    "sport",
    "Golden Cliffs",
    "Jun 2025",
    "Sustained column climbing with a thin crux at the fifth bolt. Fell there twice before trusting the left foot.",
  ),
  climb(
    "Table Manners",
    "5.10a",
    "sport",
    "Golden Cliffs",
    "Jun 2025",
    "Juggy start, then a thin step left at the fourth bolt. Warm-up of the day.",
  ),
  climb(
    "Late for Dinner",
    "5.9",
    "trad",
    "Golden Cliffs",
    "Jun 2025",
    "Hand crack between two columns. Placed more gear than it needed.",
  ),
  climb(
    "The Long Way Up",
    "5.8",
    "trad",
    "Red Rock",
    "Apr 2025",
    "Five pitches, one chimney, and one very good sandwich on top.",
  ),
  climb(
    "Sun Spire",
    "5.10c",
    "trad",
    "Joshua Tree",
    "Mar 2025",
    "Short, exposed, and the summit fits two people.",
  ),
  climb(
    "Paper Weather",
    "5.11a",
    "sport",
    "Red Rock",
    "Mar 2025",
    "Crimps on varnish. Sent as the wind picked up.",
  ),
  climb(
    "Quiet Corner",
    "V3",
    "boulder",
    "Joshua Tree",
    "Feb 2025",
    "Friction slab. All feet, no hands.",
  ),
  climb(
    "Slow Burn",
    "V5",
    "boulder",
    "Buttermilks",
    "Nov 2024",
    "Three sessions for six moves. The last one is a heel hook I still don't understand.",
  ),
  climb(
    "Borrowed Thunder",
    "V4",
    "boulder",
    "Buttermilks",
    "Nov 2024",
    "Big throw to a sloper, off a borrowed pad.",
  ),
  climb(
    "Second Opinion",
    "5.10d",
    "sport",
    "Clear Creek Canyon",
    "Sep 2024",
    "The fourth clip is the whole route.",
  ),
  climb(
    "Morning Coffee",
    "5.9",
    "sport",
    "Clear Creek Canyon",
    "Sep 2024",
    "Warm-up by the river.",
  ),
  climb(
    "Crooked Arete",
    "5.10b",
    "sport",
    "Mission Gorge",
    "Jul 2024",
    "Barn-door arete in the afternoon heat.",
  ),
  climb(
    "Loose Change",
    "5.8",
    "trad",
    "Joshua Tree",
    "May 2024",
    "First trad lead. Every nut placed twice.",
  ),
  climb(
    "Golden Hour",
    "5.10a",
    "sport",
    "Red Rock",
    "Apr 2024",
    "Topped out as the canyon went orange.",
  ),
  climb(
    "Hand Jam Sandwich",
    "5.9",
    "trad",
    "Joshua Tree",
    "Mar 2024",
    "Learned to jam. Lost some skin.",
  ),
  climb(
    "Short Fuse",
    "V2",
    "boulder",
    "Mission Gorge",
    "Jan 2024",
    "Two moves and a mantle.",
  ),
  climb(
    "Plan B",
    "5.10b",
    "sport",
    "Mission Gorge",
    "Nov 2023",
    "The backup route that turned out better than plan A.",
  ),
  climb(
    "Thin Ice",
    "5.10a",
    "sport",
    "Clear Creek Canyon",
    "Sep 2023",
    "First 5.10 outside.",
  ),
  climb(
    "Tourist Trap",
    "5.9",
    "sport",
    "Red Rock",
    "Jun 2023",
    "Popular for a reason.",
  ),
  climb(
    "Easy Does It",
    "5.8",
    "sport",
    "Mission Gorge",
    "Apr 2023",
    "Second lead, far less shaking.",
  ),
  climb(
    "Training Wheels",
    "5.8",
    "sport",
    "Mission Gorge",
    "Feb 2023",
    "First lead outside. Clipped every bolt like it owed me money.",
  ),
  climb(
    "First Knot",
    "5.8",
    "sport",
    "Mission Gorge",
    "Jan 2023",
    "Top rope. Where it started.",
  ),
];

/** Rough difficulty on one scale: 0 (5.8) to 10 (5.12a), boulders slotted in. */
const ROPED = [
  "5.8",
  "5.9",
  "5.10a",
  "5.10b",
  "5.10c",
  "5.10d",
  "5.11a",
  "5.11b",
  "5.11c",
  "5.11d",
  "5.12a",
];
const BOULDER: Record<string, number> = {
  V0: 0,
  V1: 1.5,
  V2: 3,
  V3: 4.5,
  V4: 6,
  V5: 7.5,
  V6: 9,
  V7: 10,
};

export const gradeRank = (grade: string) =>
  BOULDER[grade] ?? Math.max(0, ROPED.indexOf(grade));

export const mountainProjectUrl = (climb: Climb) =>
  climb.mountainProject ??
  `https://www.mountainproject.com/search?q=${encodeURIComponent(climb.name)}`;
