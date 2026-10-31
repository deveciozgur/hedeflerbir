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

export interface NextAssignment {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: Date;
  returned: boolean;
}

/** "Resume learning" target: the last unfinished recording, otherwise the most pressing assignment. */
export type ResumeTarget = { kind: "recording"; item: ContinueWatching } | { kind: "assignment"; item: NextAssignment } | null;

export interface StudentDashboard {
  firstName: string;
  overall: number;
  projects: ProjectProgressSnapshot[];
  agenda: AgendaItem[];
  resume: ResumeTarget;
  announcements: AnnouncementSummary[];
}

/** Longest session we consider when looking back for one that is live right now. */
const MAX_SESSION_MS = 8 * 3_600_000;

export async function getStudentDashboard(studentId: string): Promise<StudentDashboard> {
  const now = new Date();
  const horizon = new Date(now.getTime() + AGENDA_HORIZON_DAYS * 86_400_000);
  const enrolledIn = { course: { enrollments: { some: { studentId } } } };

  const [student, progress, sessions, assignments, appointments, lastView, announcements, pending] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: studentId }, select: { name: true } }),
    db.studentProjectProgress.findMany({
      where: { studentId },
      select: { completionPercentage: true, project: { select: { id: true, title: true, endDate: true } } },
      orderBy: { project: { endDate: "asc" } },
    }),
    db.courseSession.findMany({
      // Look back far enough to catch a session that started but hasn't ended (live now).
      where: { ...enrolledIn, scheduleDate: { gte: new Date(now.getTime() - MAX_SESSION_MS), lte: horizon } },
      select: { id: true, title: true, scheduleDate: true, durationMinutes: true, course: { select: { title: true, slug: true } } },
      orderBy: { scheduleDate: "asc" },
      take: 8,
    }),
    db.assignment.findMany({
      where: { ...enrolledIn, dueDate: { gte: now, lte: horizon }, submissions: { none: { studentId } } },
      select: { id: true, title: true, dueDate: true, course: { select: { title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.appointment.findMany({
      where: { studentId, status: "CONFIRMED", slot: { endTime: { gt: now } } },
      select: { id: true, slot: { select: { startTime: true, endTime: true } }, mentor: { select: { id: true, name: true, surname: true } } },
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
      // Platform-wide announcements plus those of the student's own courses.
      where: { OR: [{ courseId: null }, { course: { enrollments: { some: { studentId } } } }] },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, content: true, pinned: true, publishedAt: true },
    }),
    // Most pressing open work: a revision request first, then the nearest open deadline.
    db.assignment.findMany({
      where: {
        ...enrolledIn,
        OR: [
          { dueDate: { gte: now }, submissions: { none: { studentId } } },
          { submissions: { some: { studentId, status: "RETURNED" } } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        course: { select: { title: true } },
        submissions: { where: { studentId }, select: { status: true }, take: 1 },
      },
    }),
  ]);

  const projects: ProjectProgressSnapshot[] = progress.map((p) => ({
    projectId: p.project.id,
    title: p.project.title,
    endDate: p.project.endDate,
    completionPercentage: p.completionPercentage,
  }));

  const agenda = buildAgenda([
    sessions
      .map((s) => ({
        id: s.id,
        kind: "session" as const,
        title: s.title,
        context: s.course.title,
        date: s.scheduleDate,
        endsAt: new Date(s.scheduleDate.getTime() + s.durationMinutes * 60_000),
        href: `/courses/${s.course.slug}?session=${s.id}`,
      }))
      .filter((s) => s.endsAt > now),
    assignments.map((a) => ({
      id: a.id,
      kind: "assignment" as const,
      title: a.title,
      context: a.course.title,
      date: a.dueDate,
      endsAt: null,
      href: `/assignments/${a.id}`,
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

  return {
    firstName: student.name,
    overall: overallCompletion(projects),
    projects,
    agenda,
    resume: resumeTarget(lastView, pending),
    announcements,
  };
}

type LastView = {
  positionSeconds: number;
  session: { id: string; title: string; durationMinutes: number; course: { title: string; slug: string } };
} | null;

type PendingAssignment = { id: string; title: string; dueDate: Date; course: { title: string }; submissions: Array<{ status: string }> };

function resumeTarget(lastView: LastView, pending: PendingAssignment[]): ResumeTarget {
  if (lastView) {
    return {
      kind: "recording",
      item: {
        sessionId: lastView.session.id,
        sessionTitle: lastView.session.title,
        courseTitle: lastView.session.course.title,
        courseSlug: lastView.session.course.slug,
        positionSeconds: lastView.positionSeconds,
        durationMinutes: lastView.session.durationMinutes,
      },
    };
  }
  const next = pending.find((a) => a.submissions[0]?.status === "RETURNED") ?? pending[0];
  if (!next) return null;
  return {
    kind: "assignment",
    item: {
      id: next.id,
      title: next.title,
      courseTitle: next.course.title,
      dueDate: next.dueDate,
      returned: next.submissions[0]?.status === "RETURNED",
    },
  };
}
