import "server-only";
import { db } from "@/server/db";
import { dayKey } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { trainingCompletion } from "@/modules/learning/domain/trainings";

const DAY = 86_400_000;
const ISTANBUL_OFFSET_MS = 3 * 3_600_000;

export interface WeekItem {
  id: string;
  kind: "training" | "mentoring";
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  href: string;
}

export interface WeekDay {
  key: string;
  date: Date;
  items: WeekItem[];
}

export interface ProgramOverview {
  trainings: { held: number; total: number; percent: number };
  week: WeekDay[];
}

/** Monday 00:00 (Europe/Istanbul) of the week containing `now`, as a UTC instant. */
function weekStart(now: Date): Date {
  const local = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const isoWeekday = (local.getUTCDay() + 6) % 7; // 0 = Monday
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - isoWeekday * DAY;
  return new Date(midnight - ISTANBUL_OFFSET_MS);
}

export async function getProgramOverview(now: Date = new Date()): Promise<ProgramOverview> {
  const start = weekStart(now);
  const end = new Date(start.getTime() + 7 * DAY);

  // Draft programmes (e.g. the hidden self-paced course) aren't part of the live calendar.
  const live = { course: { status: { not: "DRAFT" as const } } };
  const [total, held, trainings, sessions] = await Promise.all([
    db.courseSession.count({ where: live }),
    db.courseSession.count({ where: { ...live, scheduleDate: { lt: now } } }),
    db.courseSession.findMany({
      where: { ...live, scheduleDate: { gte: start, lt: end } },
      orderBy: { scheduleDate: "asc" },
      select: {
        id: true,
        title: true,
        scheduleDate: true,
        durationMinutes: true,
        instructor: { select: { name: true, surname: true } },
        course: { select: { instructor: { select: { name: true, surname: true } } } },
      },
    }),
    db.appointment.findMany({
      where: { status: { not: "CANCELLED" }, slot: { startTime: { gte: start, lt: end } } },
      orderBy: { slot: { startTime: "asc" } },
      select: {
        id: true,
        slot: { select: { startTime: true, endTime: true } },
        mentor: { select: { name: true, surname: true } },
        team: { select: { name: true } },
        student: { select: { name: true, surname: true } },
      },
    }),
  ]);

  const items: WeekItem[] = [
    ...trainings.map((t) => ({
      id: t.id,
      kind: "training" as const,
      title: t.title,
      subtitle: fullName(t.instructor ?? t.course.instructor),
      start: t.scheduleDate,
      end: new Date(t.scheduleDate.getTime() + t.durationMinutes * 60_000),
      href: "/admin/trainings",
    })),
    ...sessions.map((s) => ({
      id: s.id,
      kind: "mentoring" as const,
      title: `Mentorluk · ${s.team?.name ?? fullName(s.student)}`,
      subtitle: fullName(s.mentor),
      start: s.slot.startTime,
      end: s.slot.endTime,
      href: "/admin/mentors",
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY + 12 * 3_600_000);
    const key = dayKey(date);
    return { key, date, items: items.filter((item) => dayKey(item.start) === key) };
  });

  return { trainings: { held, total, percent: trainingCompletion(held, total) }, week };
}
