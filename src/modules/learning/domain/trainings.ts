/**
 * Live trainings (CourseSession rows): the programme is run as scheduled live classes.
 * A training counts as completed for a participant once an admin marks them PRESENT.
 */

export type TrainingTiming = "upcoming" | "live" | "past";

export function trainingTiming(start: Date, durationMinutes: number, now: Date = new Date()): TrainingTiming {
  if (start > now) return "upcoming";
  return start.getTime() + durationMinutes * 60_000 > now.getTime() ? "live" : "past";
}

/** Topic headings are stored one per line. */
export const parseTopics = (topics: string | null | undefined): string[] =>
  (topics ?? "")
    .split(/\r?\n/)
    .map((t) => t.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

/** Share of the programme's trainings the participant has completed (attended). */
export function trainingCompletion(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
