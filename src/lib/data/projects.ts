export type Project = {
  title: string;
  description: string;
  /** Public site. Without one the card isn't a link. */
  websiteUrl?: string;
  githubUrl?: string;
  /** Still image. With `videoSrc` it's the poster shown until the video plays. */
  imageSrc: string;
  /** Looping, muted demo video played in place of the image. */
  videoSrc?: string;
  /** Screenshot for dark mode. Falls back to `imageSrc`. */
  imageSrcDark?: string;
  /** Logo beside the title, one file per theme (brand colours differ on light and dark). */
  logo?: { light: string; dark: string };
  /** One-colour mark in the card's address bar, drawn in the text colour (used as a mask). */
  faviconSrc?: string;
  date: string;
  tags: readonly string[];
  features?: readonly string[];
};

export const projects: Project[] = [
  {
    title: "Somna",
    description:
      "Private, local-first dream journal that does two things well: recording dreams and analyzing them. No AI.",
    imageSrc: "/projects/somna-light.webp",
    imageSrcDark: "/projects/somna-dark.webp",
    logo: {
      light: "/projects/somna-logo-light.svg",
      dark: "/projects/somna-logo-dark.svg",
    },
    faviconSrc: "/projects/somna-symbol.svg",
    date: "Nov 2026",
    tags: [
      "TypeScript",
      "React",
      "SQLite WASM",
      "Cloudflare Workers",
      "Protobuf",
    ],
    features: [
      "Record a dream in one action from launch",
      "Statistics computed from your own data, never guessed by AI",
      "Works fully offline on one device, with no account",
      "Optional end-to-end encrypted sync between devices",
    ],
  },
  {
    title: "Routify",
    description:
      "City pathfinding visualizer website used to visualize pathfinding algorithms",
    websiteUrl: "https://www.routify.cc",
    githubUrl: "https://www.github.com/jaedonspurlock01/routify",
    imageSrc: "/projects/routify-poster.webp",
    videoSrc: "/projects/routify.mp4",
    logo: {
      light: "/projects/routify-logo-light.svg",
      dark: "/projects/routify-logo-dark.svg",
    },
    faviconSrc: "/projects/routify-symbol.svg",
    date: "Nov 2025",
    tags: [
      "TypeScript",
      "React",
      "GoLang",
      "Nominatim API",
      "Overpass API",
      "Amazon S3",
    ],
    features: [
      "Search any city in the world",
      "Choose between DFS, BFS, A*, and Dijkstra algorithms",
      "Customize the color scheme",
      "Change animation speed realtime",
    ],
  },
];
