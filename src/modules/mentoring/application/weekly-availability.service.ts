import "server-only";
import { db } from "@/server/db";
import { partitionConflicts } from "../domain/availability";
import { materializeTemplate, TEMPLATE_WINDOW_DAYS, type WeeklyRange } from "../domain/weekly-template";

export interface WeeklyTemplate {
  ranges: WeeklyRange[];
  slotMinutes: number;
}

export async function getWeeklyTemplate(mentorId: string): Promise<WeeklyTemplate> {
  const rows = await db.mentorAvailability.findMany({
    where: { mentorId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    select: { dayOfWeek: true, startMinute: true, endMinute: true, slotDurationMinutes: true },
  });
  return {
    ranges: rows.map((r) => ({ dayOfWeek: r.dayOfWeek, startMinute: r.startMinute, endMinute: r.endMinute })),
    slotMinutes: rows[0]?.slotDurationMinutes ?? 60,
  };
}

/**
 * Brings generated slots in line with the template for the rolling window.
 * Creates missing slots (skipping any that overlap a manual or booked slot); with `prune`,
 * also removes future generated slots the template no longer covers, unless booked or
 * referenced by an appointment (history is kept).
 */
export async function syncTemplateSlots(mentorId: string, { prune }: { prune: boolean }): Promise<{ created: number; removed: number }> {
  const now = new Date();
  const { ranges, slotMinutes } = await getWeeklyTemplate(mentorId);
  const wanted = materializeTemplate(ranges, slotMinutes, now);
  const windowEnd = new Date(now.getTime() + (TEMPLATE_WINDOW_DAYS + 1) * 86_400_000);

  let removed = 0;
  if (prune) {
    const wantedStarts = wanted.map((s) => s.start);
    ({ count: removed } = await db.mentorSlot.deleteMany({
      where: {
        mentorId,
        generated: true,
        isBooked: false,
        appointments: { none: {} },
        startTime: { gt: now, notIn: wantedStarts },
      },
    }));
  }

  const existing = await db.mentorSlot.findMany({
    where: { mentorId, startTime: { lt: windowEnd }, endTime: { gt: now } },
    select: { startTime: true, endTime: true },
  });
  const { accepted } = partitionConflicts(wanted, existing.map((s) => ({ start: s.startTime, end: s.endTime })));
  if (accepted.length === 0) return { created: 0, removed };

  const { count } = await db.mentorSlot.createMany({
    data: accepted.map((s) => ({ mentorId, startTime: s.start, endTime: s.end, generated: true })),
    skipDuplicates: true,
  });
  return { created: count, removed };
}

/** Keeps every templated mentor's slots filled up to the rolling window (called when students browse mentors). */
export async function topUpTemplateSlots(mentorIds?: readonly string[]): Promise<void> {
  const mentors = await db.mentorAvailability.findMany({
    where: mentorIds ? { mentorId: { in: [...mentorIds] } } : {},
    distinct: ["mentorId"],
    select: { mentorId: true },
  });
  await Promise.all(mentors.map((m) => syncTemplateSlots(m.mentorId, { prune: false })));
}
