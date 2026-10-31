"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ListChecks, Loader2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { announceCertificate } from "@/modules/learning/ui/lesson-video";
import { startQuizAttemptAction, submitQuizAttemptAction, type AttemptResult } from "../application/quiz.actions";
import type { StudentQuiz, StudentQuizQuestion } from "../application/student-quiz.queries";
import { maxAttempts, QUESTION_TYPE_LABELS, type QuizAnswers } from "../domain/quiz";

type Phase = { kind: "intro" } | { kind: "running"; attemptId: string; deadline: Date | null } | { kind: "result"; result: AttemptResult; answers: QuizAnswers };

const isAnswered = (q: StudentQuizQuestion, answers: QuizAnswers) => {
  const value = answers[q.id];
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
};

export function QuizRunner({ quiz }: { quiz: StudentQuiz }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(() =>
    quiz.inProgress ? { kind: "running", attemptId: quiz.inProgress.id, deadline: quiz.inProgress.deadline } : { kind: "intro" },
  );
  const [pending, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      const result = await startQuizAttemptAction(quiz.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPhase({ kind: "running", attemptId: result.data.attemptId, deadline: result.data.deadline });
    });

  if (phase.kind === "running") {
    return (
      <QuizAttempt
        quiz={quiz}
        attemptId={phase.attemptId}
        deadline={phase.deadline}
        onSubmitted={(result, answers) => {
          setPhase({ kind: "result", result, answers });
          announceCertificate(result.certificateCode);
          router.refresh();
        }}
      />
    );
  }

  if (phase.kind === "result") {
    return <QuizResult quiz={quiz} result={phase.result} answers={phase.answers} onRetry={quiz.attemptsRemaining > 0 ? start : undefined} pending={pending} />;
  }

  const last = quiz.attempts[0];
  return (
    <div className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-surface-raised" aria-hidden>
          <ListChecks className="size-5 text-muted-foreground" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Quiz</h2>
          <p className="text-sm text-muted-foreground">
            Geçmek için en az <span className="font-medium text-foreground">%{quiz.passingScore}</span> gerekiyor.
          </p>
        </div>
        {quiz.passed ? (
          <Badge variant="success" className="ml-auto">
            <CheckCircle2 aria-hidden /> Geçtin
          </Badge>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Soru", value: String(quiz.questions.length) },
          { label: "Süre", value: quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} dk` : "Sınırsız" },
          { label: "Kalan hak", value: `${quiz.attemptsRemaining}/${maxAttempts(quiz.retriesAllowed)}` },
          { label: "En iyi skor", value: quiz.bestScore === null ? "-" : `%${quiz.bestScore}` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-surface-sunken px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      {last ? (
        <p className="text-sm text-muted-foreground">
          Son deneme: <span className="font-mono tabular-nums text-foreground">%{last.score}</span> ({last.isPassed ? "geçti" : "geçemedi"}),{" "}
          {formatDateTime(last.finishedAt)}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={start} disabled={pending || quiz.attemptsRemaining === 0 || quiz.questions.length === 0}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : quiz.attempts.length > 0 ? <RotateCcw aria-hidden /> : null}
          {quiz.attempts.length > 0 ? "Yeniden dene" : "Quize başla"}
        </Button>
        {quiz.attemptsRemaining === 0 ? <p className="text-sm text-muted-foreground">Deneme hakkın kalmadı.</p> : null}
        {quiz.questions.length === 0 ? <p className="text-sm text-muted-foreground">Eğitmen henüz soru eklemedi.</p> : null}
      </div>
    </div>
  );
}

function useCountdown(deadline: Date | null, onExpire: () => void) {
  const [remaining, setRemaining] = useState(() => (deadline ? deadline.getTime() - Date.now() : null));
  const expired = useRef(false);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const left = deadline.getTime() - Date.now();
      setRemaining(left);
      if (left <= 0 && !expired.current) {
        expired.current = true;
        onExpire();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, onExpire]);
  return remaining;
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function QuizAttempt({
  quiz,
  attemptId,
  deadline,
  onSubmitted,
}: {
  quiz: StudentQuiz;
  attemptId: string;
  deadline: Date | null;
  onSubmitted: (result: AttemptResult, answers: QuizAnswers) => void;
}) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [pending, startTransition] = useTransition();
  // The timeout callback must submit the latest answers, not the ones captured when the timer started.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(() => {
    startTransition(async () => {
      const submitted = answersRef.current;
      const result = await submitQuizAttemptAction({ attemptId, answers: submitted });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onSubmitted(result.data, submitted);
    });
  }, [attemptId, onSubmitted]);

  const onExpire = useCallback(() => {
    toast.warning("Süre doldu, cevapların gönderiliyor.");
    submit();
  }, [submit]);
  const remaining = useCountdown(deadline, onExpire);

  const answered = quiz.questions.filter((q) => isAnswered(q, answers)).length;
  const setChoice = (q: StudentQuizQuestion, optionId: string) =>
    setAnswers((prev) => {
      if (q.type === "MULTIPLE_CHOICE") return { ...prev, [q.id]: [optionId] };
      const current = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
      return { ...prev, [q.id]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] };
    });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (answered < quiz.questions.length && !window.confirm(`${quiz.questions.length - answered} soru boş. Yine de gönderilsin mi?`)) return;
        submit();
      }}
    >
      <div className={cn(surfaceClass, "sticky top-16 z-10 flex items-center justify-between gap-4 px-4 py-3")}>
        <p className="text-sm">
          <span className="font-mono tabular-nums">{answered}</span>
          <span className="text-muted-foreground">/{quiz.questions.length} cevaplandı</span>
        </p>
        {remaining !== null ? (
          <p
            className={cn("flex items-center gap-1.5 font-mono text-sm tabular-nums", remaining < 60_000 ? "text-destructive" : "text-muted-foreground")}
            role="timer"
            aria-label="Kalan süre"
          >
            <Clock className="size-4" aria-hidden /> {formatClock(remaining)}
          </p>
        ) : null}
      </div>

      <ol className="flex flex-col gap-4">
        {quiz.questions.map((q, index) => (
          <li key={q.id} className={cn(surfaceClass, "flex flex-col gap-4 p-5")}>
            <fieldset className="flex flex-col gap-4">
              <legend className="flex w-full items-start justify-between gap-4">
                <span className="text-sm font-medium text-pretty">
                  <span className="mr-1.5 font-mono text-muted-foreground tabular-nums">{index + 1}.</span>
                  {q.prompt}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {QUESTION_TYPE_LABELS[q.type]} · {q.points} puan
                </span>
              </legend>
              {q.type === "OPEN_ENDED" ? (
                <Textarea
                  rows={4}
                  maxLength={5000}
                  aria-label={`Soru ${index + 1} cevabı`}
                  value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Cevabını yaz"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {q.options.map((option) => {
                    const selected = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                          selected ? "border-brand/60 bg-brand/10" : "border-border hover:bg-accent/60",
                        )}
                      >
                        <input
                          type={q.type === "MULTIPLE_CHOICE" ? "radio" : "checkbox"}
                          name={q.id}
                          checked={selected}
                          onChange={() => setChoice(q, option.id)}
                          className="size-4 accent-[var(--brand)]"
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </li>
        ))}
      </ol>

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Cevapları gönder
      </Button>
    </form>
  );
}

function QuizResult({
  quiz,
  result,
  answers,
  onRetry,
  pending,
}: {
  quiz: StudentQuiz;
  result: AttemptResult;
  answers: QuizAnswers;
  onRetry?: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div role="status" className={cn(surfaceClass, "flex flex-col items-center gap-3 px-6 py-8 text-center")}>
        <span
          className={cn("grid size-12 place-items-center rounded-full border", result.isPassed ? "border-success/30 text-success" : "border-destructive/30 text-destructive")}
          aria-hidden
        >
          {result.isPassed ? <Trophy className="size-5" /> : <XCircle className="size-5" />}
        </span>
        <p className="font-mono text-3xl font-semibold tabular-nums">%{result.score}</p>
        <p className="text-sm text-muted-foreground">
          {result.late
            ? "Süre dolduktan sonra gönderildi."
            : result.isPassed
              ? `Tebrikler, quizi geçtin (${result.earnedPoints}/${result.maxPoints} puan).`
              : `Geçme notu %${quiz.passingScore}. ${result.earnedPoints}/${result.maxPoints} puan aldın.`}
        </p>
        {onRetry && !result.isPassed ? (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={pending}>
            <RotateCcw aria-hidden /> Yeniden dene
          </Button>
        ) : null}
      </div>

      <ol className="flex flex-col gap-3" aria-label="Cevap anahtarı">
        {quiz.questions.map((q, index) => {
          const review = result.review.find((r) => r.questionId === q.id);
          const chosen = answers[q.id];
          return (
            <li key={q.id} className={cn(surfaceClass, "flex flex-col gap-3 p-5")}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-pretty">
                  <span className="mr-1.5 font-mono text-muted-foreground tabular-nums">{index + 1}.</span>
                  {q.prompt}
                </p>
                {review?.correct === null ? (
                  <Badge variant="outline">Eğitmen değerlendirir</Badge>
                ) : review?.correct ? (
                  <Badge variant="success">
                    <CheckCircle2 aria-hidden /> Doğru
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle aria-hidden /> Yanlış
                  </Badge>
                )}
              </div>
              {q.type === "OPEN_ENDED" ? (
                <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {typeof chosen === "string" && chosen.trim() ? chosen : "Boş bırakıldı"}
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {q.options.map((option) => {
                    const isCorrect = review?.correctOptionIds.includes(option.id) ?? false;
                    const picked = Array.isArray(chosen) && chosen.includes(option.id);
                    return (
                      <li
                        key={option.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                          isCorrect ? "bg-success/10 text-success" : picked ? "bg-destructive/10 text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {isCorrect ? <CheckCircle2 className="size-4 shrink-0" aria-label="Doğru seçenek" /> : picked ? <XCircle className="size-4 shrink-0" aria-label="Senin seçimin" /> : <span className="size-4 shrink-0" />}
                        {option.text}
                      </li>
                    );
                  })}
                </ul>
              )}
              {review?.explanation ? <p className="border-l-2 border-border-strong pl-3 text-sm text-muted-foreground">{review.explanation}</p> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
