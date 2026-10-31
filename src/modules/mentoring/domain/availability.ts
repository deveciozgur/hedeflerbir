/**
 * Mentor availability rules — pure functions over time ranges.
 * Turkey has observed fixed UTC+3 since 2016, so weekly repetition is a plain 7×24h offset.
 */

export interface TimeRange {
  start: Date;
  end: Date;
}

export const SLOT_LENGTHS = [30, 45, 60, 90] as const;
export type SlotLength = (typeof SLOT_LENGTHS)[number];

export const MAX_REPEAT_WEEKS = 8;
export const MAX_WINDOW_HOURS = 12;
/** How far ahead students can see and book slots. */
export const BOOKING_HORIZON_DAYS = 30;

const MINUTE = 60_000;
const WEEK = 7 * 24 * 60 * MINUTE;

export const overlaps = (a: TimeRange, b: TimeRange) => a.start < b.end && b.start < a.end;

export function validateWindow(window: TimeRange, slotMinutes: number, now: Date = new Date()): string | null {
  const minutes = (window.end.getTime() - window.start.getTime()) / MINUTE;
  if (minutes <= 0) return "Bitiş saati başlangıçtan sonra olmalı.";
  if (window.start <= now) return "Geçmiş bir zamana müsaitlik eklenemez.";
  if (minutes > MAX_WINDOW_HOURS * 60) return `Tek seferde en fazla ${MAX_WINDOW_HOURS} saatlik aralık eklenebilir.`;
  if (minutes < slotMinutes) return "Seçilen aralık en az bir seans süresi kadar olmalı.";
  return null;
}

/** Splits a working window into consecutive slots and repeats it weekly. Leftover minutes are dropped. */
export function generateSlots(window: TimeRange, slotMinutes: number, repeatWeeks: number): TimeRange[] {
  const slots: TimeRange[] = [];
  const step = slotMinutes * MINUTE;
  for (let week = 0; week <= repeatWeeks; week++) {
    const offset = week * WEEK;
    for (let t = window.start.getTime(); t + step <= window.end.getTime(); t += step) {
      slots.push({ start: new Date(t + offset), end: new Date(t + offset + step) });
    }
  }
  return slots;
}

export function partitionConflicts(candidates: readonly TimeRange[], existing: readonly TimeRange[]) {
  const accepted: TimeRange[] = [];
  let skipped = 0;
  for (const slot of candidates) {
    if (existing.some((e) => overlaps(e, slot))) skipped++;
    else accepted.push(slot);
  }
  return { accepted, skipped };
}

export interface DayGroup<T> {
  key: string;
  date: Date;
  items: T[];
}

/** Groups chronologically sorted items by calendar day (key provided by the caller's time zone formatter). */
export function groupByDay<T>(items: readonly T[], startOf: (item: T) => Date, keyOf: (date: Date) => string): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();
  for (const item of items) {
    const date = startOf(item);
    const key = keyOf(date);
    const group = groups.get(key) ?? { key, date, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}
