import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { attendanceRate, type AttendanceStatus } from "../domain/attendance";
import { sessionEnd } from "../domain/curriculum";
import { parseResources, type SessionResource } from "../domain/resources";

export interface InstructorCourseSummary {
  id: string;
  title: string;
  description: string;
  enrolled: number;
  sessionCount: number;
  nextSession: Date | null;
  missingRecordings: number;
}

export async function getInstructorCourseSummaries(instructorId: string): Promise<InstructorCourseSummary[]> {
  const now = new Date();
  const courses = await db.course.findMany({
    where: { instructorId },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { enrollments: true } },
      sessions: { orderBy: { scheduleDate: "asc" }, select: { scheduleDate: true, durationMinutes: true, recordingUrl: true } },
    },
  });

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    enrolled: c._count.enrollments,
    sessionCount: c.sessions.length,
    nextSession: c.sessions.find((s) => s.scheduleDate > now)?.scheduleDate ?? null,
    missingRecordings: c.sessions.filter((s) => sessionEnd(s) <= now && !s.recordingUrl).length,
  }));
}

export interface InstructorSession {
  id: string;
  order: number;
  title: string;
  description: string | null;
  scheduleDate: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: SessionResource[];
  attendance: Array<{ studentId: string; status: AttendanceStatus }>;
  watchedCount: number;
}

export interface RosterStudent {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  watched: number;
  attendanceRate: number | null;
  averageScore: number | null;
}

export interface InstructorCourseDetail {
  id: string;
  title: string;
  description: string;
  recordedCount: number;
  sessions: InstructorSession[];
  roster: RosterStudent[];
}

export async function getInstructorCourse(instructorId: string, courseId: string): Promise<InstructorCourseDetail> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: {
      id: true,
      title: true,
      description: true,
      sessions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          description: true,
          scheduleDate: true,
          durationMinutes: true,
          meetingUrl: true,
          recordingUrl: true,
          resources: true,
          attendances: { select: { studentId: true, status: true } },
          _count: { select: { lessonViews: { where: { completed: true } } } },
        },
      },
      enrollments: {
        orderBy: { student: { name: "asc" } },
        select: {
          student: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
              avatarUrl: true,
              lessonViews: { where: { completed: true, session: { courseId } }, select: { sessionId: true } },
              attendances: { where: { session: { courseId } }, select: { status: true } },
              submissions: {
                where: { status: "GRADED", assignment: { courseId } },
                select: { grade: true, assignment: { select: { maxScore: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const roster = course.enrollments.map(({ student }) => {
    const scores = student.submissions.filter((s) => s.grade !== null).map((s) => ((s.grade ?? 0) / s.assignment.maxScore) * 100);
    return {
      id: student.id,
      name: student.name,
      surname: student.surname,
      email: student.email,
      avatarUrl: student.avatarUrl,
      watched: student.lessonViews.length,
      attendanceRate: attendanceRate(student.attendances.map((a) => a.status)),
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  });

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    recordedCount: course.sessions.filter((s) => s.recordingUrl).length,
    sessions: course.sessions.map(({ attendances, _count, resources, ...session }) => ({
      ...session,
      resources: parseResources(resources),
      attendance: attendances,
      watchedCount: _count.lessonViews,
    })),
    roster,
  };
}
