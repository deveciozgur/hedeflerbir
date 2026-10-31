import type { TimeRange } from "./availability";

/**
 * Weekly availability template: hour cells a mentor switches on in a Mon-Sun grid,
 * stored as merged ranges and turned into concrete slots on a rolling window.
 * Times are Europe/Istanbul wall-clock (fixed UTC+3 since 2016).
 */

const ISTANBUL_OFFSET_MS = 3 * 60 * 60_000;
const DAY_MS = 86_400_000;

/** Grid rows: 08:00 to 22:00. */
export const TEMPLATE_FIRST_HOUR = 8;
export const TEMPLATE_LAST_HOUR = 22;
export const TEMPLATE_HOURS = Array.from({ length: TEMPLATE_LAST_HOUR - TEMPLATE_FIRST_HOUR }, (_, i) => TEMPLATE_FIRST_HOUR + i);

/** ISO weekday 1 = Monday ... 7 = Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const WEEKDAY_LABELS: Record<number, string> = { 1: "Pzt", 2: "Sal", 3: "Çar", 4: "Per", 5: "Cum", 6: "Cmt", 7: "Paz" };

/** Generated slots reach this far ahead; refreshed whenever the template or the directory is read. */
export const TEMPLATE_WINDOW_DAYS = 28;

export interface WeeklyCell {
  day: number;
  hour: number;
}

export interface WeeklyRange {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export const cellKey = (cell: WeeklyCell) => `${cell.day}-${cell.hour}`;

/** Merges adjacent hour cells per day into ranges, e.g. Mon 9, 10, 11 → Mon 09:00-12:00. */
export function cellsToRanges(cells: readonly WeeklyCell[]): WeeklyRange[] {
  const ranges: WeeklyRange[] = [];
  for (const day of WEEKDAYS) {
    const hours = [...new Set(cells.filter((c) => c.day === day).map((c) => c.hour))].sort((a, b) => a - b);
    let start: number | null = null;
    hours.forEach((hour, i) => {
      start ??= hour;
      if (hours[i + 1] !== hour + 1) {
        ranges.push({ dayOfWeek: day, startMinute: start * 60, endMinute: (hour + 1) * 60 });
        start = null;
      }
    });
  }
  return ranges;
}

export function rangesToCells(ranges: readonly WeeklyRange[]): WeeklyCell[] {
  return ranges.flatMap((r) =>
    Array.from({ length: Math.ceil((r.endMinute - r.startMinute) / 60) }, (_, i) => ({ day: r.dayOfWeek, hour: Math.floor(r.startMinute / 60) + i })),
  );
}

/** Istanbul calendar day (as a UTC-midnight Date) and ISO weekday for an instant. */
function istanbulDay(instant: Date): { midnightUtc: number; weekday: number } {
  const shifted = new Date(instant.getTime() + ISTANBUL_OFFSET_MS);
  const midnightUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return { midnightUtc, weekday: ((shifted.getUTCDay() + 6) % 7) + 1 };
}

/** Concrete future slots for the template over the next `days` days (Istanbul wall-clock → UTC instants). */
export function materializeTemplate(ranges: readonly WeeklyRange[], slotMinutes: number, now: Date = new Date(), days = TEMPLATE_WINDOW_DAYS): TimeRange[] {
  const slots: TimeRange[] = [];
  const step = slotMinutes * 60_000;
  const today = istanbulDay(now);
  for (let offset = 0; offset < days; offset++) {
    const midnight = today.midnightUtc + offset * DAY_MS;
    const weekday = ((today.weekday - 1 + offset) % 7) + 1;
    for (const range of ranges.filter((r) => r.dayOfWeek === weekday)) {
      const rangeStart = midnight + range.startMinute * 60_000 - ISTANBUL_OFFSET_MS;
      const rangeEnd = midnight + range.endMinute * 60_000 - ISTANBUL_OFFSET_MS;
      for (let t = rangeStart; t + step <= rangeEnd; t += step) {
        if (t > now.getTime()) slots.push({ start: new Date(t), end: new Date(t + step) });
      }
    }
  }
  return slots;
}

export const weeklyHours = (ranges: readonly WeeklyRange[]) => ranges.reduce((sum, r) => sum + (r.endMinute - r.startMinute) / 60, 0);

export const weeklySlotCount = (ranges: readonly WeeklyRange[], slotMinutes: number) =>
  ranges.reduce((sum, r) => sum + Math.floor((r.endMinute - r.startMinute) / slotMinutes), 0);
