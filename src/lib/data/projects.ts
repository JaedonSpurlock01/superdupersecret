export const projects = [
  {
    title: "Routify",
    description:
      "City pathfinding visualizer website used to visualize pathfinding algorithms",
    websiteUrl: "https://www.routify.cc",
    githubUrl: "https://www.github.com/jaedonspurlock01/routify",
    imageSrc: "/projects/routify.gif",
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
] as const;
