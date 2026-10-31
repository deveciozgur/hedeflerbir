import "server-only";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { buildAgenda, type AgendaItem } from "../domain/agenda";
import { overallCompletion, type ProjectProgressSnapshot } from "../domain/progress";

const AGENDA_HORIZON_DAYS = 14;

export interface ContinueWatching {
  sessionId: string;
  sessionTitle: string;
  courseTitle: string;
  courseSlug: string;
  positionSeconds: number;
  durationMinutes: number;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  publishedAt: Date;
}

export interface StudentDashboard {
  firstName: string;
  overall: number;
  projects: ProjectProgressSnapshot[];
  agenda: AgendaItem[];
  continueWatching: ContinueWatching | null;
  announcements: AnnouncementSummary[];
}

export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  const now = new Date();
  const horizon = new Date(now.getTime() + AGENDA_HORIZON_DAYS * 86_400_000);
  const enrolledIn = { course: { enrollments: { some: { studentId } } } };

  const [student, progress, sessions, assignments, appointments, lastView, announcements] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: studentId }, select: { name: true } }),
    db.studentProjectProgress.findMany({
      where: { studentId },
      select: { completionPercentage: true, project: { select: { id: true, title: true, endDate: true } } },
      orderBy: { project: { endDate: "asc" } },
    }),
    db.courseSession.findMany({
      where: { ...enrolledIn, scheduleDate: { gte: now, lte: horizon } },
      select: { id: true, title: true, scheduleDate: true, course: { select: { title: true, slug: true } } },
      orderBy: { scheduleDate: "asc" },
      take: 5,
    }),
    db.assignment.findMany({
      where: { ...enrolledIn, dueDate: { gte: now, lte: horizon }, submissions: { none: { studentId } } },
      select: { id: true, title: true, dueDate: true, course: { select: { title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.appointment.findMany({
      where: { studentId, status: "CONFIRMED", slot: { startTime: { gte: now } } },
      select: { id: true, slot: { select: { startTime: true } }, mentor: { select: { id: true, name: true, surname: true } } },
      orderBy: { slot: { startTime: "asc" } },
      take: 5,
    }),
    db.lessonView.findFirst({
      where: { userId: studentId, completed: false },
      orderBy: { updatedAt: "desc" },
      select: {
        positionSeconds: true,
        session: {
          select: { id: true, title: true, durationMinutes: true, course: { select: { title: true, slug: true } } },
        },
      },
    }),
    db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, content: true, pinned: true, publishedAt: true },
    }),
  ]);

  const projects: ProjectProgressSnapshot[] = progress.map((p) => ({
    projectId: p.project.id,
    title: p.project.title,
    endDate: p.project.endDate,
    completionPercentage: p.completionPercentage,
  }));

  const agenda = buildAgenda([
    sessions.map((s) => ({
      id: s.id,
      kind: "session" as const,
      title: s.title,
      context: s.course.title,
      date: s.scheduleDate,
      href: `/courses/${s.course.slug}`,
    })),
    assignments.map((a) => ({
      id: a.id,
      kind: "assignment" as const,
      title: a.title,
      context: a.course.title,
      date: a.dueDate,
      href: `/assignments/${a.id}`,
    })),
    appointments.map((a) => ({
      id: a.id,
      kind: "appointment" as const,
      title: `${fullName(a.mentor)} ile görüşme`,
      context: "Mentorluk",
      date: a.slot.startTime,
      href: `/mentors/${a.mentor.id}`,
    })),
  ]);

  return {
    firstName: student.name,
    overall: overallCompletion(projects),
    projects,
    agenda,
    continueWatching: lastView
      ? {
          sessionId: lastView.session.id,
          sessionTitle: lastView.session.title,
          courseTitle: lastView.session.course.title,
          courseSlug: lastView.session.course.slug,
          positionSeconds: lastView.positionSeconds,
          durationMinutes: lastView.session.durationMinutes,
        }
      : null,
    announcements,
  };
}
