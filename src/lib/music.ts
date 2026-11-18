import musicJson from "@/lib/data/music.json";

export type Track = {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
  durationMs: number;
  appleMusicUrl: string;
  spotifyUrl: string;
};

type ItunesSong = {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackTimeMillis: number;
  trackViewUrl: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type FavoriteSong = {
  title: string;
  artist: string;
  /** Album to prefer when the song is on several (e.g. a greatest-hits). */
  album?: string;
  /** Exact Apple Music title to prefer, e.g. "Humanity (feat. Audrey Callahan)". */
  version?: string;
};

/** "Hope (feat. Aaron Burke)" → title "Hope", featured artists moved to the artist line. */
function splitFeature(trackName: string, artistName: string) {
  const match = trackName.match(/^(.*?)\s*[([]feat\.?\s+([^)\]]+)[)\]]\s*$/i);
  if (!match) return { title: trackName, artist: artistName };
  return { title: match[1], artist: `${artistName}, ${match[2]}` };
}

/**
 * Looks a song up in Apple's public iTunes Search API (no key needed) for
 * artwork and a 30-second preview. Matches title and artist exactly so
 * covers, remixes and karaoke versions are skipped. Cached for a day.
 */
async function findTrack(song: FavoriteSong): Promise<Track | null> {
  const { title, artist, album, version } = song;
  const term = encodeURIComponent(
    [title, artist, album].filter(Boolean).join(" "),
  );
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=25`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return null;
    const { results } = (await res.json()) as { results: ItunesSong[] };
    const matches = results.filter(
      (r) =>
        r.previewUrl &&
        normalize(r.trackName) === normalize(title) &&
        // "FM-84 & Ollie Wride" matches "FM-84"; "Riddle The Roar" doesn't match "Roar".
        `${normalize(r.artistName)} `.startsWith(`${normalize(artist)} `),
    );
    const wanted = (version ?? title).toLowerCase();
    // Prefer the requested album and exact title over "(Remix)" / "(Live)" variants.
    const found =
      matches.find(
        (r) =>
          r.trackName.toLowerCase() === wanted &&
          (!album || r.collectionName.toLowerCase() === album.toLowerCase()),
      ) ??
      matches.find((r) => r.trackName.toLowerCase() === wanted) ??
      matches[0];
    if (!found?.previewUrl) return null;
    const display = splitFeature(found.trackName, found.artistName);
    return {
      title: display.title,
      artist: display.artist,
      album: found.collectionName,
      artwork: found.artworkUrl100.replace("100x100bb", "600x600bb"),
      previewUrl: found.previewUrl,
      durationMs: found.trackTimeMillis,
      appleMusicUrl: found.trackViewUrl.replace(/[?&]uo=\d+/, ""),
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${display.title} ${found.artistName}`)}`,
    };
  } catch {
    return null;
  }
}

/** Favorite songs from music.json, resolved in order; unknown ones are dropped. */
export async function getFavoriteTracks(): Promise<Track[]> {
  const songs: FavoriteSong[] = musicJson.tracks;
  const tracks = await Promise.all(songs.map(findTrack));
  return tracks.filter((t): t is Track => t !== null);
}
