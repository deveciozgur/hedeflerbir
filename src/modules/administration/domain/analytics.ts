/** Pure metric calculations for the admin analytics panel. */

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export interface WeekBucket {
  start: Date;
  end: Date;
}

/** The last `count` 7-day windows ending now, oldest first. */
export function trailingWeeks(now: Date, count: number): WeekBucket[] {
  return Array.from({ length: count }, (_, i) => {
    const end = new Date(now.getTime() - (count - 1 - i) * WEEK);
    return { start: new Date(end.getTime() - WEEK), end };
  });
}

export interface ActivityEvent {
  userId: string;
  at: Date;
}

/** Distinct active users per bucket. */
export function activeUsersPerWeek(events: readonly ActivityEvent[], buckets: readonly WeekBucket[]): number[] {
  return buckets.map((bucket) => {
    const users = new Set<string>();
    for (const e of events) if (e.at > bucket.start && e.at <= bucket.end) users.add(e.userId);
    return users.size;
  });
}

export const percentage = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 100) : null;

/** Share of students with any learning activity inside the window. */
export function retentionRate(events: readonly ActivityEvent[], totalStudents: number, since: Date): number | null {
  const active = new Set(events.filter((e) => e.at > since).map((e) => e.userId));
  return percentage(active.size, totalStudents);
}

export const SCORE_BANDS = [
  { label: "0–49", min: 0, max: 49 },
  { label: "50–69", min: 50, max: 69 },
  { label: "70–84", min: 70, max: 84 },
  { label: "85–100", min: 85, max: 100 },
] as const;

/** Histogram of graded submissions by score percentage. */
export function scoreDistribution(percentages: readonly number[]): Array<{ label: string; value: number }> {
  return SCORE_BANDS.map((band) => ({
    label: band.label,
    value: percentages.filter((p) => Math.round(p) >= band.min && Math.round(p) <= band.max).length,
  }));
}

export interface MentoringTally {
  completed: number;
  cancelled: number;
  /** Confirmed sessions whose time has passed but were never marked completed. */
  unmarked: number;
}

/** Completion over every session that should have happened (cancelled ones included as not completed). */
export const mentoringCompletionRate = (t: MentoringTally) => percentage(t.completed, t.completed + t.cancelled + t.unmarked);
