"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EditableQuiz } from "@/modules/learning/application/instructor-curriculum.queries";
import { saveQuizAction } from "../application/quiz.actions";
import { QUESTION_TYPE_LABELS, QUESTION_TYPES, questionProblem, type QuestionType } from "../domain/quiz";
import type { QuizQuestionInput } from "../domain/schemas";

type DraftQuestion = QuizQuestionInput & { key: string };

const nextKey = () => crypto.randomUUID();

const blankQuestion = (): DraftQuestion => ({
  key: nextKey(),
  prompt: "",
  type: "MULTIPLE_CHOICE",
  points: 1,
  explanation: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

const toDraft = (quiz: EditableQuiz | null): DraftQuestion[] =>
  quiz?.questions.length ? quiz.questions.map((q) => ({ ...q, key: q.id })) : [blankQuestion()];

interface QuizEditorDialogProps {
  lessonId: string;
  lessonTitle: string;
  quiz: EditableQuiz | null;
  trigger: ReactNode;
}

export function QuizEditorDialog({ lessonId, lessonTitle, quiz, trigger }: QuizEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [passingScore, setPassingScore] = useState(String(quiz?.passingScore ?? 70));
  const [timeLimit, setTimeLimit] = useState(quiz?.timeLimitMinutes ? String(quiz.timeLimitMinutes) : "");
  const [retries, setRetries] = useState(String(quiz?.retriesAllowed ?? 2));
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => toDraft(quiz));

  const update = (key: string, patch: Partial<DraftQuestion>) => setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  const move = (index: number, delta: number) =>
    setQuestions((qs) => {
      const next = [...qs];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item!);
      return next;
    });

  const setType = (q: DraftQuestion, type: QuestionType) => {
    // Switching to single choice keeps only the first correct option marked.
    const firstCorrect = q.options.findIndex((o) => o.isCorrect);
    const options = type === "MULTIPLE_CHOICE" ? q.options.map((o, i) => ({ ...o, isCorrect: i === Math.max(0, firstCorrect) })) : q.options;
    update(q.key, { type, options });
  };

  const toggleCorrect = (q: DraftQuestion, index: number) =>
    update(q.key, {
      options: q.options.map((o, i) =>
        q.type === "MULTIPLE_CHOICE" ? { ...o, isCorrect: i === index } : i === index ? { ...o, isCorrect: !o.isCorrect } : o,
      ),
    });

  const save = () => {
    const payload = {
      passingScore: Number(passingScore),
      timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
      retriesAllowed: Number(retries),
      questions: questions.map(({ prompt, type, points, explanation, options, id }) => ({ id, prompt, type, points, explanation, options })),
    };
    startTransition(async () => {
      const result = await saveQuizAction(lessonId, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Quiz kaydedildi");
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPassingScore(String(quiz?.passingScore ?? 70));
          setTimeLimit(quiz?.timeLimitMinutes ? String(quiz.timeLimitMinutes) : "");
          setRetries(String(quiz?.retriesAllowed ?? 2));
          setQuestions(toDraft(quiz));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz düzenleyici</DialogTitle>
          <DialogDescription>{lessonTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[68dvh] flex-col gap-5 overflow-y-auto px-0.5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="passingScore">Geçme notu (%)</Label>
              <Input id="passingScore" inputMode="numeric" value={passingScore} onChange={(e) => setPassingScore(e.target.value.replace(/\D/g, "").slice(0, 3))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timeLimit">Süre sınırı (dk)</Label>
              <Input id="timeLimit" inputMode="numeric" placeholder="Sınırsız" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value.replace(/\D/g, "").slice(0, 3))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="retries">Ek deneme hakkı</Label>
              <Input id="retries" inputMode="numeric" value={retries} onChange={(e) => setRetries(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </div>
          </div>

          {quiz && quiz.attemptCount > 0 ? (
            <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
              Bu quiz {quiz.attemptCount} kez çözüldü. Doğru cevapları değiştirmek eski skorları yeniden hesaplamaz.
            </p>
          ) : null}

          <ol className="flex flex-col gap-4">
            {questions.map((q, index) => {
              const problem = questionProblem(q);
              return (
                <li key={q.key} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground tabular-nums">{index + 1}.</span>
                    <NativeSelect aria-label={`Soru ${index + 1} türü`} value={q.type} onChange={(e) => setType(q, e.target.value as QuestionType)} className="h-8 w-40 text-sm">
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </NativeSelect>
                    <Input
                      aria-label={`Soru ${index + 1} puanı`}
                      inputMode="numeric"
                      value={String(q.points)}
                      onChange={(e) => update(q.key, { points: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) })}
                      className="h-8 w-16 text-center tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">puan</span>
                    <div className="ml-auto flex gap-1">
                      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Yukarı taşı" disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Aşağı taşı" disabled={index === questions.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-destructive"
                        aria-label="Soruyu sil"
                        disabled={questions.length === 1}
                        onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <Textarea aria-label={`Soru ${index + 1} metni`} rows={2} placeholder="Soru metni" value={q.prompt} onChange={(e) => update(q.key, { prompt: e.target.value })} />

                  {q.type !== "OPEN_ENDED" ? (
                    <div className="flex flex-col gap-2">
                      {q.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-pressed={option.isCorrect}
                            aria-label={`Seçenek ${optionIndex + 1} doğru`}
                            onClick={() => toggleCorrect(q, optionIndex)}
                            className={cn(
                              "grid size-7 shrink-0 place-items-center border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                              q.type === "MULTIPLE_CHOICE" ? "rounded-full" : "rounded-md",
                              option.isCorrect ? "border-success/50 bg-success/15 text-success" : "border-border text-transparent hover:border-border-strong",
                            )}
                          >
                            <Check className="size-3.5" aria-hidden />
                          </button>
                          <Input
                            aria-label={`Seçenek ${optionIndex + 1}`}
                            placeholder={`Seçenek ${optionIndex + 1}`}
                            value={option.text}
                            onChange={(e) => update(q.key, { options: q.options.map((o, i) => (i === optionIndex ? { ...o, text: e.target.value } : o)) })}
                            className="h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            aria-label="Seçeneği sil"
                            disabled={q.options.length <= 2}
                            onClick={() => update(q.key, { options: q.options.filter((_, i) => i !== optionIndex) })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}
                      {q.options.length < 10 ? (
                        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => update(q.key, { options: [...q.options, { text: "", isCorrect: false }] })}>
                          <Plus aria-hidden /> Seçenek
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Açık uçlu cevaplar otomatik puanlanmaz; sonuçlar ekranında okuyabilirsin.</p>
                  )}

                  <Input aria-label={`Soru ${index + 1} açıklaması`} placeholder="Cevap açıklaması (isteğe bağlı, sonuçta gösterilir)" value={q.explanation} onChange={(e) => update(q.key, { explanation: e.target.value })} className="h-8 text-sm" />
                  {problem ? <p className="text-xs text-warning">{problem}</p> : null}
                </li>
              );
            })}
          </ol>

          <Button type="button" variant="outline" className="self-start" onClick={() => setQuestions((qs) => [...qs, blankQuestion()])} disabled={questions.length >= 100}>
            <Plus aria-hidden /> Soru ekle
          </Button>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Vazgeç
            </Button>
          </DialogClose>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Quizi kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
