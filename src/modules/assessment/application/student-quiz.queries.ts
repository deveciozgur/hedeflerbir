import "server-only";
import { db } from "@/server/db";
import { attemptDeadline, attemptsRemaining, isLate, type QuestionType } from "../domain/quiz";

export interface StudentQuizQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  /** Options without the isCorrect flag — answers are only revealed after submitting. */
  options: Array<{ id: string; text: string }>;
}

export interface StudentQuizAttempt {
  id: string;
  score: number;
  isPassed: boolean;
  finishedAt: Date;
}

export interface StudentQuiz {
  id: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  retriesAllowed: number;
  questions: StudentQuizQuestion[];
  attempts: StudentQuizAttempt[];
  /** Unfinished attempt still inside its time window (resume after a reload). */
  inProgress: { id: string; startedAt: Date; deadline: Date | null } | null;
  attemptsRemaining: number;
  bestScore: number | null;
  passed: boolean;
}

export async function getStudentQuiz(userId: string, lessonId: string): Promise<StudentQuiz | null> {
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      passingScore: true,
      timeLimitMinutes: true,
      retriesAllowed: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, prompt: true, type: true, points: true, options: { orderBy: { orderIndex: "asc" }, select: { id: true, text: true } } },
      },
      attempts: { where: { userId }, orderBy: { startedAt: "desc" }, select: { id: true, score: true, isPassed: true, startedAt: true, finishedAt: true } },
    },
  });
  if (!quiz) return null;

  const finished = quiz.attempts.flatMap((a) => (a.finishedAt ? [{ id: a.id, score: a.score ?? 0, isPassed: a.isPassed, finishedAt: a.finishedAt }] : []));
  // An unfinished attempt past its deadline counts as used (submitted later as a timeout).
  const open = quiz.attempts.find((a) => !a.finishedAt);
  const openExpired = open ? isLate(open.startedAt, quiz.timeLimitMinutes) : false;
  const used = finished.length + (open && openExpired ? 1 : 0);

  return {
    id: quiz.id,
    passingScore: quiz.passingScore,
    timeLimitMinutes: quiz.timeLimitMinutes,
    retriesAllowed: quiz.retriesAllowed,
    questions: quiz.questions,
    attempts: finished,
    inProgress: open && !openExpired ? { id: open.id, startedAt: open.startedAt, deadline: attemptDeadline(open.startedAt, quiz.timeLimitMinutes) } : null,
    attemptsRemaining: attemptsRemaining(quiz.retriesAllowed, used),
    bestScore: finished.length ? Math.max(...finished.map((a) => a.score)) : null,
    passed: finished.some((a) => a.isPassed),
  };
}
