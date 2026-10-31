/**
 * Lesson curriculum read model: Course → modules → lessons, plus the rules for
 * what "done" means per lesson type and which lesson to open next.
 */

export const LESSON_TYPES = ["VIDEO", "ARTICLE", "QUIZ", "ASSIGNMENT", "LIVE_SESSION"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "Video",
  ARTICLE: "Okuma",
  QUIZ: "Quiz",
  ASSIGNMENT: "Ödev",
  LIVE_SESSION: "Canlı ders",
};

/**
 * How a lesson gets completed. Manual lessons have a "Tamamlandı" button; the others
 * complete themselves (video watched to 90%, quiz passed, assignment submitted).
 */
export const COMPLETION_RULE: Record<LessonType, "watch" | "manual" | "quizPassed" | "submitted"> = {
  VIDEO: "watch",
  ARTICLE: "manual",
  QUIZ: "quizPassed",
  ASSIGNMENT: "submitted",
  LIVE_SESSION: "manual",
};

export interface OutlineLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  isCompleted: boolean;
}

export interface OutlineModule {
  id: string;
  title: string;
  lessons: OutlineLesson[];
}

export const flattenLessons = <L>(modules: ReadonlyArray<{ lessons: readonly L[] }>): L[] => modules.flatMap((m) => m.lessons);

export function lessonCompletion(lessons: ReadonlyArray<{ isCompleted: boolean }>): number {
  if (lessons.length === 0) return 0;
  return Math.round((lessons.filter((l) => l.isCompleted).length / lessons.length) * 100);
}

/** Lesson to open by default: the first one not yet completed, else the very first. */
export function defaultLessonId(lessons: ReadonlyArray<{ id: string; isCompleted: boolean }>): string | null {
  return (lessons.find((l) => !l.isCompleted) ?? lessons[0])?.id ?? null;
}

export function adjacentLessons<L extends { id: string }>(lessons: readonly L[], currentId: string): { previous: L | null; next: L | null } {
  const index = lessons.findIndex((l) => l.id === currentId);
  if (index === -1) return { previous: null, next: null };
  return { previous: lessons[index - 1] ?? null, next: lessons[index + 1] ?? null };
}

export function totalDurationMinutes(lessons: ReadonlyArray<{ durationMinutes: number | null }>): number {
  return lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
}
