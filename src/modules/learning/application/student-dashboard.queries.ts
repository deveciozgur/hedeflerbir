import "server-only";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { buildAgenda, type AgendaItem } from "../domain/agenda";

const AGENDA_HORIZON_DAYS = 14;

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  publishedAt: Date;
}

export interface StudentDashboard {
  firstName: string;
  agenda: AgendaItem[];
  announcements: AnnouncementSummary[];
}

/** Longest session we consider when looking back for one that is live right now. */
const MAX_SESSION_MS = 8 * 3_600_000;

export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  const now = new Date();
  const horizon = new Date(now.getTime() + AGENDA_HORIZON_DAYS * 86_400_000);
  const enrolledIn = { course: { status: { not: "DRAFT" as const }, enrollments: { some: { studentId } } } };

  const student = await db.user.findUniqueOrThrow({ where: { id: studentId }, select: { name: true, teamId: true } });
  const [sessions, assignments, appointments, announcements] = await Promise.all([
    db.courseSession.findMany({
      // Look back far enough to catch a session that started but hasn't ended (live now).
      where: { ...enrolledIn, scheduleDate: { gte: new Date(now.getTime() - MAX_SESSION_MS), lte: horizon } },
      select: { id: true, title: true, scheduleDate: true, durationMinutes: true, course: { select: { title: true } } },
      orderBy: { scheduleDate: "asc" },
      take: 8,
    }),
    db.assignment.findMany({
      where: { ...enrolledIn, dueDate: { gte: now, lte: horizon }, submissions: { none: { studentId } } },
      select: { id: true, title: true, dueDate: true, sessionId: true, session: { select: { title: true } }, course: { select: { title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // The student's own sessions and those booked for their team.
    db.appointment.findMany({
      where: {
        status: "CONFIRMED",
        slot: { endTime: { gt: now } },
        OR: [{ studentId }, ...(student.teamId ? [{ teamId: student.teamId }] : [])],
      },
      select: { id: true, slot: { select: { startTime: true, endTime: true } }, mentor: { select: { id: true, name: true, surname: true } } },
      orderBy: { slot: { startTime: "asc" } },
      take: 5,
    }),
    db.announcement.findMany({
      // Platform-wide announcements plus those of the student's own courses.
      where: { OR: [{ courseId: null }, { course: { enrollments: { some: { studentId } } } }] },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, content: true, pinned: true, publishedAt: true },
    }),
  ]);

  const agenda = buildAgenda([
    sessions
      .map((s) => ({
        id: s.id,
        kind: "session" as const,
        title: s.title,
        context: s.course.title,
        date: s.scheduleDate,
        endsAt: new Date(s.scheduleDate.getTime() + s.durationMinutes * 60_000),
        href: `/trainings/${s.id}`,
      }))
      .filter((s) => s.endsAt > now),
    assignments.map((a) => ({
      id: a.id,
      kind: "assignment" as const,
      title: a.title,
      context: a.session?.title ?? a.course.title,
      date: a.dueDate,
      endsAt: null,
      href: a.sessionId ? `/trainings/${a.sessionId}` : `/assignments/${a.id}`,
    })),
    appointments.map((a) => ({
      id: a.id,
      kind: "appointment" as const,
      title: `${fullName(a.mentor)} ile görüşme`,
      context: "Mentorluk",
      date: a.slot.startTime,
      endsAt: a.slot.endTime,
      href: `/mentors/${a.mentor.id}`,
    })),
  ]);

  return { firstName: student.name, agenda, announcements };
}
