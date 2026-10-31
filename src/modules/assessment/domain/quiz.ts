/**
 * Quiz rules, framework-free:
 *  - MULTIPLE_CHOICE: one option; full points if it is the correct one.
 *  - MULTIPLE_SELECT: all-or-nothing; the selected set must equal the correct set.
 *  - OPEN_ENDED: collected for the instructor, excluded from the auto-scored total.
 */

export const QUESTION_TYPES = ["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "OPEN_ENDED"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Tek seçim",
  MULTIPLE_SELECT: "Çoklu seçim",
  OPEN_ENDED: "Açık uçlu",
};

export interface ScorableQuestion {
  id: string;
  type: QuestionType;
  points: number;
  options: ReadonlyArray<{ id: string; isCorrect: boolean }>;
}

/** { questionId: optionIds } for choice questions, { questionId: text } for open-ended. */
export type QuizAnswers = Record<string, string[] | string>;

export interface QuestionResult {
  questionId: string;
  /** null for open-ended questions (not auto-scored). */
  correct: boolean | null;
  correctOptionIds: string[];
}

export interface ScoreResult {
  earnedPoints: number;
  maxPoints: number;
  /** 0-100; 100 when nothing is auto-scorable. */
  percent: number;
  results: QuestionResult[];
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function scoreAttempt(questions: readonly ScorableQuestion[], answers: QuizAnswers): ScoreResult {
  let earnedPoints = 0;
  let maxPoints = 0;
  const results = questions.map((q): QuestionResult => {
    const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    if (q.type === "OPEN_ENDED") return { questionId: q.id, correct: null, correctOptionIds };

    maxPoints += q.points;
    const raw = answers[q.id];
    const selected = Array.isArray(raw) ? raw.filter((id) => q.options.some((o) => o.id === id)) : [];
    const correct = q.type === "MULTIPLE_CHOICE" ? selected.length === 1 && correctOptionIds.includes(selected[0]!) : sameSet(selected, correctOptionIds);
    if (correct) earnedPoints += q.points;
    return { questionId: q.id, correct, correctOptionIds };
  });

  const percent = maxPoints === 0 ? 100 : Math.round((earnedPoints / maxPoints) * 100);
  return { earnedPoints, maxPoints, percent, results };
}

export const maxAttempts = (retriesAllowed: number) => 1 + Math.max(0, retriesAllowed);

export function attemptsRemaining(retriesAllowed: number, finishedAttempts: number): number {
  return Math.max(0, maxAttempts(retriesAllowed) - finishedAttempts);
}

/** Network latency allowance on top of the time limit before a submission counts as late. */
export const SUBMIT_GRACE_SECONDS = 30;

export function attemptDeadline(startedAt: Date, timeLimitMinutes: number | null): Date | null {
  return timeLimitMinutes ? new Date(startedAt.getTime() + timeLimitMinutes * 60_000) : null;
}

export function isLate(startedAt: Date, timeLimitMinutes: number | null, at: Date = new Date()): boolean {
  const deadline = attemptDeadline(startedAt, timeLimitMinutes);
  return deadline !== null && at.getTime() > deadline.getTime() + SUBMIT_GRACE_SECONDS * 1000;
}

/** A question is valid when choice types have ≥2 options and the right number of correct ones. */
export function questionProblem(q: { type: QuestionType; options: ReadonlyArray<{ isCorrect: boolean }> }): string | null {
  if (q.type === "OPEN_ENDED") return null;
  if (q.options.length < 2) return "En az iki seçenek ekleyin.";
  const correct = q.options.filter((o) => o.isCorrect).length;
  if (q.type === "MULTIPLE_CHOICE" && correct !== 1) return "Tek seçimli soruda tam bir doğru seçenek olmalı.";
  if (q.type === "MULTIPLE_SELECT" && correct < 1) return "En az bir doğru seçenek işaretleyin.";
  return null;
}
