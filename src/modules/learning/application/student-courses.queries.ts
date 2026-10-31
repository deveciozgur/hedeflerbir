import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { courseCompletion, sessionState, type SessionState } from "../domain/curriculum";
import { lessonCompletion } from "../domain/lessons";
import { parseResources, type SessionResource } from "../domain/resources";

const sessionTimingSelect = { id: true, scheduleDate: true, durationMinutes: true, recordingUrl: true } as const;

const watchOf = (views: ReadonlyArray<{ positionSeconds: number; completed: boolean }>) => views[0] ?? null;

export interface StudentCourseCard {
  slug: string;
  title: string;
  description: string;
  instructorName: string;
  sessionCount: number;
  lessonCount: number;
  completion: number;
  nextSession: Date | null;
}

export async function getStudentCourses(studentId: string): Promise<StudentCourseCard[]> {
  const now = new Date();
  const enrollments = await db.enrollment.findMany({
    where: { studentId, course: { status: { not: "DRAFT" } } },
    orderBy: { enrolledAt: "desc" },
    select: {
      course: {
        select: {
          slug: true,
          title: true,
          description: true,
          instructor: { select: { name: true, surname: true } },
          sessions: {
            orderBy: { order: "asc" },
            select: { ...sessionTimingSelect, lessonViews: { where: { userId: studentId }, select: { positionSeconds: true, completed: true } } },
          },
          modules: { select: { lessons: { select: { progress: { where: { userId: studentId }, select: { isCompleted: true } } } } } },
        },
      },
    },
  });

  return enrollments.map(({ course }) => {
    const states = course.sessions.map((s) => sessionState(s, watchOf(s.lessonViews), now));
    const lessons = course.modules.flatMap((m) => m.lessons.map((l) => ({ isCompleted: l.progress[0]?.isCompleted ?? false })));
    return {
      slug: course.slug,
      title: course.title,
      description: course.description,
      instructorName: fullName(course.instructor),
      sessionCount: course.sessions.length,
      lessonCount: lessons.length,
      // Lesson-based courses measure lesson completion; session-only courses measure watched recordings.
      completion: lessons.length > 0 ? lessonCompletion(lessons) : courseCompletion(states),
      nextSession: course.sessions.find((s) => s.scheduleDate > now)?.scheduleDate ?? null,
    };
  });
}

export interface CurriculumSession {
  id: string;
  order: number;
  title: string;
  description: string | null;
  scheduleDate: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: SessionResource[];
  state: SessionState;
  positionSeconds: number;
}

export interface StudentCourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: { id: string; name: string; surname: string; avatarUrl: string | null; title: string | null };
  completion: number;
  sessions: CurriculumSession[];
}

export async function getStudentCourse(studentId: string, slug: string): Promise<StudentCourseDetail> {
  const now = new Date();
  const course = await db.course.findFirst({
    where: { slug, status: { not: "DRAFT" }, enrollments: { some: { studentId } } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      instructor: { select: { id: true, name: true, surname: true, avatarUrl: true, profile: { select: { title: true } } } },
      sessions: {
        orderBy: { order: "asc" },
        select: {
          ...sessionTimingSelect,
          order: true,
          title: true,
          description: true,
          meetingUrl: true,
          resources: true,
          lessonViews: { where: { userId: studentId }, select: { positionSeconds: true, completed: true } },
        },
      },
    },
  });
  if (!course) notFound();

  const sessions = course.sessions.map(({ lessonViews, resources, ...session }) => {
    const watch = watchOf(lessonViews);
    return {
      ...session,
      resources: parseResources(resources),
      state: sessionState(session, watch, now),
      positionSeconds: watch?.positionSeconds ?? 0,
    };
  });
  const { profile, ...instructor } = course.instructor;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    instructor: { ...instructor, title: profile?.title ?? null },
    completion: courseCompletion(sessions.map((s) => s.state)),
    sessions,
  };
}
