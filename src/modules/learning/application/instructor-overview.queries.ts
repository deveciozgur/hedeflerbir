import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { parseTopics } from "../domain/trainings";

export interface InstructorSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  trainingTitle: string | null;
  student: { id: string; name: string; surname: string; avatarUrl: string | null };
  fileName: string | null;
  note: string | null;
  maxScore: number;
  submittedAt: Date;
}

export interface InstructorNextSession {
  id: string;
  title: string;
  scheduleDate: Date;
  durationMinutes: number;
  topics: string[];
  /** Session description: the instructor's presentation notes. */
  notes: string | null;
  meetingUrl: string | null;
  participantCount: number;
  /** Roll calls are taken on the course page ("Oturumlar"). */
  courseId: string;
}

export interface InstructorOverview {
  /** deliveredMinutes: total length of the live trainings already held. */
  kpis: { delivered: number; deliveredMinutes: number; attendances: number; awaitingReview: number; nextAt: Date | null };
  recentSubmissions: InstructorSubmission[];
  next: InstructorNextSession | null;
  upcoming: Array<{ id: string; title: string; scheduleDate: Date }>;
}

/** Trainings the instructor gives: assigned directly, or (legacy) sessions of courses they own without an override. */
const taughtBy = (instructorId: string): Prisma.CourseSessionWhereInput => ({
  course: { status: { not: "DRAFT" } },
  OR: [{ instructorId }, { instructorId: null, course: { instructorId } }],
});

export async function getInstructorOverview(instructorId: string): Promise<InstructorOverview> {
  const now = new Date();
  const mine = taughtBy(instructorId);
  // Grading follows course ownership (the grading desk's access rule) or the training the assignment belongs to.
  const gradable: Prisma.AssignmentWhereInput = { OR: [{ course: { instructorId } }, { session: { instructorId } }] };

  const [delivered, attendances, awaitingReview, submissions, upcoming] = await Promise.all([
    db.courseSession.aggregate({ where: { ...mine, scheduleDate: { lt: now } }, _count: { _all: true }, _sum: { durationMinutes: true } }),
    db.sessionAttendance.count({ where: { status: "PRESENT", session: mine } }),
    db.submission.count({ where: { status: "SUBMITTED", assignment: gradable } }),
    db.submission.findMany({
      where: { status: "SUBMITTED", assignment: gradable },
      orderBy: { submittedAt: "desc" },
      take: 6,
      select: {
        id: true,
        fileName: true,
        note: true,
        submittedAt: true,
        assignment: { select: { id: true, title: true, maxScore: true, session: { select: { title: true } } } },
        student: { select: { id: true, name: true, surname: true, avatarUrl: true } },
      },
    }),
    db.courseSession.findMany({
      where: { ...mine, scheduleDate: { gt: new Date(now.getTime() - 4 * 3_600_000) } },
      orderBy: { scheduleDate: "asc" },
      take: 4,
      select: {
        id: true,
        title: true,
        description: true,
        topics: true,
        scheduleDate: true,
        durationMinutes: true,
        meetingUrl: true,
        course: { select: { id: true, _count: { select: { enrollments: true } } } },
      },
    }),
  ]);

  // Still running counts as "next" (the class is live now).
  const live = upcoming.filter((s) => s.scheduleDate.getTime() + s.durationMinutes * 60_000 > now.getTime());
  const first = live[0];

  return {
    kpis: {
      delivered: delivered._count._all,
      deliveredMinutes: delivered._sum.durationMinutes ?? 0,
      attendances,
      awaitingReview,
      nextAt: first?.scheduleDate ?? null,
    },
    recentSubmissions: submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignment.id,
      assignmentTitle: s.assignment.title,
      trainingTitle: s.assignment.session?.title ?? null,
      student: s.student,
      fileName: s.fileName,
      note: s.note,
      maxScore: s.assignment.maxScore,
      submittedAt: s.submittedAt,
    })),
    next: first
      ? {
          id: first.id,
          title: first.title,
          scheduleDate: first.scheduleDate,
          durationMinutes: first.durationMinutes,
          topics: parseTopics(first.topics),
          notes: first.description,
          meetingUrl: first.meetingUrl,
          participantCount: first.course._count.enrollments,
          courseId: first.course.id,
        }
      : null,
    upcoming: live.slice(1).map((s) => ({ id: s.id, title: s.title, scheduleDate: s.scheduleDate })),
  };
}
