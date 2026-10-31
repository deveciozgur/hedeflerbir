"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth/guards";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { completeLesson } from "@/modules/learning/application/course-completion.service";
import { attemptDeadline, attemptsRemaining, isLate, questionProblem, scoreAttempt, type QuizAnswers } from "../domain/quiz";
import { quizInputSchema, submitAttemptSchema } from "../domain/schemas";

// ───────────────────────────── Student ─────────────────────────────

export interface StartedAttempt {
  attemptId: string;
  startedAt: Date;
  deadline: Date | null;
}

export async function startQuizAttemptAction(quizId: unknown): Promise<ActionResult<StartedAttempt>> {
  const student = await requireRole("STUDENT");
  const quiz = await db.quiz.findFirst({
    where: { id: String(quizId), lesson: { module: { course: { status: { not: "DRAFT" }, enrollments: { some: { studentId: student.id } } } } } },
    select: { id: true, timeLimitMinutes: true, retriesAllowed: true, attempts: { where: { userId: student.id }, select: { id: true, startedAt: true, finishedAt: true } } },
  });
  if (!quiz) return fail("Quiz bulunamadı.");

  // Resume an attempt that is still running; time out the ones whose window has closed.
  const open = quiz.attempts.filter((a) => !a.finishedAt);
  const running = open.find((a) => !isLate(a.startedAt, quiz.timeLimitMinutes));
  if (running) return ok({ attemptId: running.id, startedAt: running.startedAt, deadline: attemptDeadline(running.startedAt, quiz.timeLimitMinutes) });
  for (const expired of open) {
    await db.quizAttempt.update({
      where: { id: expired.id },
      data: { finishedAt: attemptDeadline(expired.startedAt, quiz.timeLimitMinutes) ?? new Date(), score: 0, earnedPoints: 0, isPassed: false },
    });
  }

  if (attemptsRemaining(quiz.retriesAllowed, quiz.attempts.length) === 0) return fail("Deneme hakkın kalmadı.");
  const attempt = await db.quizAttempt.create({ data: { quizId: quiz.id, userId: student.id }, select: { id: true, startedAt: true } });
  return ok({ attemptId: attempt.id, startedAt: attempt.startedAt, deadline: attemptDeadline(attempt.startedAt, quiz.timeLimitMinutes) });
}

export interface AttemptResult {
  score: number;
  isPassed: boolean;
  earnedPoints: number;
  maxPoints: number;
  late: boolean;
  review: Array<{ questionId: string; correct: boolean | null; correctOptionIds: string[]; explanation: string | null }>;
  certificateCode: string | null;
}

export async function submitQuizAttemptAction(input: unknown): Promise<ActionResult<AttemptResult>> {
  const student = await requireRole("STUDENT");
  const parsed = submitAttemptSchema.safeParse(input);
  if (!parsed.success) return fail("Geçersiz cevap verisi.");

  const attempt = await db.quizAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId: student.id },
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      quiz: {
        select: {
          passingScore: true,
          timeLimitMinutes: true,
          lesson: { select: { id: true, module: { select: { course: { select: { slug: true } } } } } },
          questions: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, type: true, points: true, explanation: true, options: { select: { id: true, isCorrect: true } } },
          },
        },
      },
    },
  });
  if (!attempt) return fail("Deneme bulunamadı.");
  if (attempt.finishedAt) return fail("Bu deneme zaten gönderildi.");

  const { quiz } = attempt;
  const late = isLate(attempt.startedAt, quiz.timeLimitMinutes);
  const answers: QuizAnswers = parsed.data.answers;
  const scored = scoreAttempt(quiz.questions, answers);
  // A submission after the time window closes scores zero (the client auto-submits on time).
  const score = late ? 0 : scored.percent;
  const isPassed = !late && score >= quiz.passingScore;

  await db.quizAttempt.update({
    where: { id: attempt.id },
    data: { answers, score, earnedPoints: late ? 0 : scored.earnedPoints, maxPoints: scored.maxPoints, isPassed, finishedAt: new Date() },
  });

  const completion = isPassed ? await completeLesson(student.id, quiz.lesson.id) : null;
  revalidatePath(`/courses/${quiz.lesson.module.course.slug}`);

  return ok({
    score,
    isPassed,
    earnedPoints: late ? 0 : scored.earnedPoints,
    maxPoints: scored.maxPoints,
    late,
    review: scored.results.map((r) => ({ ...r, explanation: quiz.questions.find((q) => q.id === r.questionId)?.explanation ?? null })),
    certificateCode: completion?.certificateCode ?? null,
  });
}

// ───────────────────────────── Instructor ─────────────────────────────

/** Creates or replaces a QUIZ lesson's quiz. Questions/options keep their ids so past attempts stay readable. */
export async function saveQuizAction(lessonId: unknown, input: unknown): Promise<ActionResult> {
  const instructor = await requireRole("INSTRUCTOR");
  const parsed = quizInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Lütfen soruları kontrol edin.");

  const problems = parsed.data.questions.flatMap((q, i) => {
    const problem = questionProblem(q);
    return problem ? [`Soru ${i + 1}: ${problem}`] : [];
  });
  if (problems.length > 0) return fail(problems[0]!);

  const lesson = await db.lesson.findFirst({
    where: { id: String(lessonId), type: "QUIZ", module: { course: { instructorId: instructor.id } } },
    select: { id: true, module: { select: { courseId: true } }, quiz: { select: { id: true, questions: { select: { id: true, options: { select: { id: true } } } } } } },
  });
  if (!lesson) return fail("Quiz dersi bulunamadı.");

  const { questions, ...settings } = parsed.data;
  await db.$transaction(async (tx) => {
    const quiz = await tx.quiz.upsert({ where: { lessonId: lesson.id }, create: { lessonId: lesson.id, ...settings }, update: settings, select: { id: true } });

    const existingQuestionIds = new Set(lesson.quiz?.questions.map((q) => q.id) ?? []);
    const keptQuestionIds = questions.flatMap((q) => (q.id && existingQuestionIds.has(q.id) ? [q.id] : []));
    await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id, id: { notIn: keptQuestionIds } } });

    for (const [orderIndex, { id, options, explanation, ...question }] of questions.entries()) {
      const data = { ...question, explanation: explanation || null, orderIndex };
      const saved =
        id && existingQuestionIds.has(id)
          ? await tx.quizQuestion.update({ where: { id }, data, select: { id: true } })
          : await tx.quizQuestion.create({ data: { ...data, quizId: quiz.id }, select: { id: true } });

      const existingOptionIds = new Set(lesson.quiz?.questions.find((q) => q.id === saved.id)?.options.map((o) => o.id) ?? []);
      const usedOptions = question.type === "OPEN_ENDED" ? [] : options;
      const keptOptionIds = usedOptions.flatMap((o) => (o.id && existingOptionIds.has(o.id) ? [o.id] : []));
      await tx.quizOption.deleteMany({ where: { questionId: saved.id, id: { notIn: keptOptionIds } } });
      for (const [optionIndex, option] of usedOptions.entries()) {
        const optionData = { text: option.text, isCorrect: option.isCorrect, orderIndex: optionIndex };
        if (option.id && existingOptionIds.has(option.id)) await tx.quizOption.update({ where: { id: option.id }, data: optionData });
        else await tx.quizOption.create({ data: { ...optionData, questionId: saved.id } });
      }
    }
  });

  revalidatePath(`/instructor/courses/${lesson.module.courseId}`);
  return ok(undefined);
}
