/**
 * Curriculum read model: where each session stands for one student.
 *
 *   upcoming ──(start)──▶ live ──(end)──▶ awaitingRecording ──(recording added)──▶ available ─▶ inProgress ─▶ watched
 */

export type SessionState = "upcoming" | "live" | "awaitingRecording" | "available" | "inProgress" | "watched";

export interface SessionTiming {
  scheduleDate: Date;
  durationMinutes: number;
  recordingUrl: string | null;
}

export interface WatchState {
  positionSeconds: number;
  completed: boolean;
}

export const sessionEnd = (s: Pick<SessionTiming, "scheduleDate" | "durationMinutes">) =>
  new Date(s.scheduleDate.getTime() + s.durationMinutes * 60_000);

export function sessionState(session: SessionTiming, watch: WatchState | null, now: Date = new Date()): SessionState {
  if (session.scheduleDate > now) return "upcoming";
  if (sessionEnd(session) > now) return "live";
  if (!session.recordingUrl) return "awaitingRecording";
  if (watch?.completed) return "watched";
  if (watch && watch.positionSeconds > 0) return "inProgress";
  return "available";
}

export const SESSION_STATE_LABELS: Record<SessionState, string> = {
  upcoming: "Yaklaşan canlı ders",
  live: "Şu an canlı",
  awaitingRecording: "Kayıt hazırlanıyor",
  available: "Kayıt hazır",
  inProgress: "İzlemeye devam et",
  watched: "İzlendi",
};

/** Share of published recordings the student has finished. Sessions without a recording don't count. */
export function courseCompletion(states: readonly SessionState[]): number {
  const watchable = states.filter((s) => s === "available" || s === "inProgress" || s === "watched");
  if (watchable.length === 0) return 0;
  return Math.round((watchable.filter((s) => s === "watched").length / watchable.length) * 100);
}

/** Session to open by default: first unfinished recording, else the next live/upcoming one, else the first. */
export function defaultSessionId<T extends { id: string; state: SessionState }>(sessions: readonly T[]): string | null {
  const pick =
    sessions.find((s) => s.state === "live") ??
    sessions.find((s) => s.state === "inProgress" || s.state === "available") ??
    sessions.find((s) => s.state === "upcoming") ??
    sessions[0];
  return pick?.id ?? null;
}
