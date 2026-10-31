import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getStudentQuiz, type StudentQuiz } from "@/modules/assessment/application/student-quiz.queries";
import { sessionState } from "../domain/curriculum";
import { adjacentLessons, defaultLessonId, flattenLessons, lessonCompletion, type LessonType, type OutlineModule } from "../domain/lessons";
import { parseResources, type SessionResource } from "../domain/resources";
import type { CurriculumSession } from "./student-courses.queries";

export interface PlayerAssignment {
  id: string;
  title: string;
  dueDate: Date;
  maxScore: number;
  submission: { status: "SUBMITTED" | "GRADED" | "RETURNED"; grade: number | null } | null;
}

export interface ActiveLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  content: string | null;
  videoUrl: string | null;
  resources: SessionResource[];
  isCompleted: boolean;
  lastWatchedSecond: number;
  session: CurriculumSession | null;
  assignment: PlayerAssignment | null;
  quiz: StudentQuiz | null;
}

export interface CourseAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  publishedAt: Date;
}

export interface CoursePlayer {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: { id: string; name: string; surname: string; avatarUrl: string | null; title: string | null };
  modules: OutlineModule[];
  completion: number;
  certificateCode: string | null;
  active: ActiveLesson | null;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  announcements: CourseAnnouncement[];
}

/** Whether the course uses the module/lesson outline (otherwise the legacy session list is shown). */
export async function courseHasLessons(slug: string): Promise<boolean> {
  return (await db.lesson.count({ where: { module: { course: { slug } } } })) > 0;
}

export async function getCoursePlayer(studentId: string, slug: string, requestedLessonId?: string): Promise<CoursePlayer> {
  const course = await db.course.findFirst({
    where: { slug, status: { not: "DRAFT" }, enrollments: { some: { studentId } } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      instructor: { select: { id: true, name: true, surname: true, avatarUrl: true, profile: { select: { title: true } } } },
      modules: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, title: true, type: true, durationMinutes: true, progress: { where: { userId: studentId }, select: { isCompleted: true } } },
          },
        },
      },
      certificates: { where: { userId: studentId }, select: { verificationCode: true } },
      announcements: {
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 5,
        select: { id: true, title: true, content: true, priority: true, publishedAt: true },
      },
    },
  });
  if (!course) notFound();

  const modules: OutlineModule[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    lessons: m.lessons.map(({ progress, ...lesson }) => ({ ...lesson, isCompleted: progress[0]?.isCompleted ?? false })),
  }));
  const lessons = flattenLessons(modules);
  const activeId = lessons.some((l) => l.id === requestedLessonId) ? requestedLessonId! : defaultLessonId(lessons);
  const { previous, next } = activeId ? adjacentLessons(lessons, activeId) : { previous: null, next: null };
  const { profile, ...instructor } = course.instructor;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    instructor: { ...instructor, title: profile?.title ?? null },
    modules,
    completion: lessonCompletion(lessons),
    certificateCode: course.certificates[0]?.verificationCode ?? null,
    active: activeId ? await getActiveLesson(studentId, activeId) : null,
    previous: previous && { id: previous.id, title: previous.title },
    next: next && { id: next.id, title: next.title },
    announcements: course.announcements,
  };
}

async function getActiveLesson(studentId: string, lessonId: string): Promise<ActiveLesson> {
  const lesson = await db.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      type: true,
      durationMinutes: true,
      content: true,
      videoUrl: true,
      resources: true,
      progress: { where: { userId: studentId }, select: { isCompleted: true, lastWatchedSecond: true } },
      session: {
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
          lessonViews: { where: { userId: studentId }, select: { positionSeconds: true, completed: true } },
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          maxScore: true,
          submissions: { where: { studentId }, select: { status: true, grade: true } },
        },
      },
    },
  });

  const progress = lesson.progress[0];
  let session: CurriculumSession | null = null;
  if (lesson.session) {
    const { lessonViews, resources, ...s } = lesson.session;
    const watch = lessonViews[0] ?? null;
    session = { ...s, resources: parseResources(resources), state: sessionState(s, watch), positionSeconds: watch?.positionSeconds ?? 0 };
  }

  return {
    id: lesson.id,
    title: lesson.title,
    type: lesson.type,
    durationMinutes: lesson.durationMinutes,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    resources: parseResources(lesson.resources),
    isCompleted: progress?.isCompleted ?? false,
    lastWatchedSecond: progress?.lastWatchedSecond ?? 0,
    session,
    assignment: lesson.assignment && {
      id: lesson.assignment.id,
      title: lesson.assignment.title,
      dueDate: lesson.assignment.dueDate,
      maxScore: lesson.assignment.maxScore,
      submission: lesson.assignment.submissions[0] ?? null,
    },
    quiz: lesson.type === "QUIZ" ? await getStudentQuiz(studentId, lesson.id) : null,
  };
}
