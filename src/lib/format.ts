const LOCALE = "tr-TR";
const TIME_ZONE = "Europe/Istanbul";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "long" });
const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: "short" });
const dayNumberFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric" });
const longDayFormatter = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });

/** Calendar day in the platform time zone, e.g. "2026-11-03" — stable grouping key. */
export const dayKey = (date: Date) => dayKeyFormatter.format(date);
export const formatWeekday = (date: Date) => weekdayFormatter.format(date);
export const formatDayNumber = (date: Date) => dayNumberFormatter.format(date);
export const formatLongDay = (date: Date) => longDayFormatter.format(date);

/** "Bugün" / "Yarın" / "3 Kasım Salı", in the platform time zone. */
export function relativeDayLabel(date: Date, now: Date = new Date()): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return "Bugün";
  if (key === dayKey(new Date(now.getTime() + 86_400_000))) return "Yarın";
  return formatLongDay(date);
}

/** "14:00 - 14:45" */
export const formatTimeRange = (start: Date, end: Date) => `${formatTime(start)} - ${formatTime(end)}`;

export const formatDate = (date: Date) => dateFormatter.format(date);
/** "31 Ekim 2026" — for documents that outlive the current year (certificates). */
export const formatFullDate = (date: Date) => fullDateFormatter.format(date);
export const formatDateTime = (date: Date) => dateTimeFormatter.format(date);
export const formatTime = (date: Date) => timeFormatter.format(date);

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function formatRelative(date: Date, now: Date = new Date()): string {
  const diff = date.getTime() - now.getTime();
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return relativeFormatter.format(Math.round(diff / ms), unit);
  }
  return relativeFormatter.format(0, "minute");
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} sa ${minutes % 60} dk` : `${minutes} dk`;
}
