/**
 * Recording sources. Direct video files get the native player with watch-progress tracking;
 * YouTube/Vimeo links are embedded (their iframes don't expose playback position to us).
 */

export type RecordingSource =
  | { kind: "file"; src: string }
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string };

const YOUTUBE_ID = /^[\w-]{11}$/;

export function parseRecordingSource(rawUrl: string | null | undefined, startAt = 0): RecordingSource | null {
  if (!rawUrl) return null;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");
  const start = Math.max(0, Math.floor(startAt));

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? url.pathname.slice(1) : (url.searchParams.get("v") ?? url.pathname.split("/").at(-1) ?? "");
    if (!YOUTUBE_ID.test(id)) return null;
    return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&start=${start}` };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    if (!id) return null;
    return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}#t=${start}s` };
  }

  return { kind: "file", src: url.toString() };
}

/** A recording counts as watched once 90% has been played — nobody watches the closing small talk. */
export const COMPLETION_THRESHOLD = 0.9;

export const isWatched = (positionSeconds: number, durationSeconds: number) =>
  durationSeconds > 0 && positionSeconds / durationSeconds >= COMPLETION_THRESHOLD;

/** How often the player persists the playback position while playing. */
export const PROGRESS_SAVE_INTERVAL_MS = 15_000;
