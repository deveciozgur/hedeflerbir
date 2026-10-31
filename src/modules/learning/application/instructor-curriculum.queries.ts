import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import type { QuestionType } from "@/modules/assessment/domain/quiz";
import type { LessonType } from "../domain/lessons";
import { formatResourceLines, parseResources } from "../domain/resources";

export interface EditableQuiz {
  passingScore: number;
  timeLimitMinutes: number | null;
  retriesAllowed: number;
  questions: Array<{
    id: string;
    prompt: string;
    type: QuestionType;
    points: number;
    explanation: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
  attemptCount: number;
}

export interface EditableLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  content: string;
  videoUrl: string;
  /** "Başlık | https://..." lines, the instructor-facing resource format. */
  resources: string;
  sessionId: string | null;
  assignmentId: string | null;
  completedCount: number;
  quiz: EditableQuiz | null;
}

export interface EditableModule {
  id: string;
  title: string;
  lessons: EditableLesson[];
}

export interface CurriculumEditor {
  courseId: string;
  modules: EditableModule[];
  /** Linkable live sessions / assignments (with the lesson they are already linked to, if any). */
  sessions: Array<{ id: string; label: string; lessonId: string | null }>;
  assignments: Array<{ id: string; label: string; lessonId: string | null }>;
  enrolledCount: number;
}

export async function getCurriculumEditor(instructorId: string, courseId: string): Promise<CurriculumEditor> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: {
      id: true,
      _count: { select: { enrollments: true } },
      sessions: { orderBy: { order: "asc" }, select: { id: true, order: true, title: true, lesson: { select: { id: true } } } },
      assignments: { orderBy: { dueDate: "asc" }, select: { id: true, title: true, lesson: { select: { id: true } } } },
      modules: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              durationMinutes: true,
              content: true,
              videoUrl: true,
              resources: true,
              sessionId: true,
              assignmentId: true,
              _count: { select: { progress: { where: { isCompleted: true } } } },
              quiz: {
                select: {
                  passingScore: true,
                  timeLimitMinutes: true,
                  retriesAllowed: true,
                  _count: { select: { attempts: { where: { finishedAt: { not: null } } } } },
                  questions: {
                    orderBy: { orderIndex: "asc" },
                    select: {
                      id: true,
                      prompt: true,
                      type: true,
                      points: true,
                      explanation: true,
                      options: { orderBy: { orderIndex: "asc" }, select: { id: true, text: true, isCorrect: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  return {
    courseId: course.id,
    enrolledCount: course._count.enrollments,
    sessions: course.sessions.map((s) => ({ id: s.id, label: `${s.order}. ${s.title}`, lessonId: s.lesson?.id ?? null })),
    assignments: course.assignments.map((a) => ({ id: a.id, label: a.title, lessonId: a.lesson?.id ?? null })),
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map(({ _count, quiz, content, videoUrl, resources, ...lesson }) => ({
        ...lesson,
        content: content ?? "",
        videoUrl: videoUrl ?? "",
        resources: formatResourceLines(parseResources(resources)),
        completedCount: _count.progress,
        quiz: quiz && {
          passingScore: quiz.passingScore,
          timeLimitMinutes: quiz.timeLimitMinutes,
          retriesAllowed: quiz.retriesAllowed,
          attemptCount: quiz._count.attempts,
          questions: quiz.questions.map((q) => ({ ...q, explanation: q.explanation ?? "" })),
        },
      })),
    })),
  };
}
