export type ContentType = "youtube" | "article";

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_PLAYLIST_ID = /^(?:PL|UU|LL|FL|RD|UL|PU|OLAK5uy_)[A-Za-z0-9_-]{8,92}$/;
const TRACKING_PARAMETERS = new Set(["si", "fbclid", "gclid"]);

function parseHttpUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  return url;
}

export function extractYouTubeVideoId(value: string): string | null {
  let url: URL;

  try {
    url = parseHttpUrl(value);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  let candidate: string | null = null;

  if (hostname === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else {
      const [kind, id] = url.pathname.split("/").filter(Boolean);
      if (kind === "shorts" || kind === "embed") candidate = id ?? null;
    }
  }

  return candidate && YOUTUBE_VIDEO_ID.test(candidate) ? candidate : null;
}

export function canonicalizeUrl(value: string): string {
  const url = parseHttpUrl(value);
  const youtubeId = extractYouTubeVideoId(value);

  if (youtubeId) {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");

  const path = url.pathname === "/" ? "" : url.pathname;
  return `${url.origin}${path}${url.search}`;
}

export function detectContentType(value: string): ContentType {
  return extractYouTubeVideoId(value) ? "youtube" : "article";
}

export function extractYouTubePlaylistId(value: string): string | null {
  const candidate = value.trim();
  if (YOUTUBE_PLAYLIST_ID.test(candidate)) return candidate;

  let url: URL;
  try {
    url = parseHttpUrl(candidate);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!new Set(["youtube.com", "m.youtube.com", "music.youtube.com"]).has(hostname)) {
    return null;
  }

  const playlistId = url.searchParams.get("list");
  return playlistId && YOUTUBE_PLAYLIST_ID.test(playlistId) ? playlistId : null;
}
