"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GradeDecision } from "../domain/schemas";

const formSchema = z.object({
  grade: z.string().regex(/^\d*$/, { error: "Tam sayı girin." }),
  feedback: z.string().trim().min(10, { error: "Geri bildirim en az 10 karakter olmalı." }).max(5000),
});
type FormValues = z.infer<typeof formSchema>;

export interface GradingFormSubmit {
  decision: GradeDecision;
  grade: number | null;
  feedback: string;
}

interface GradingFormProps {
  maxScore: number;
  defaultGrade: number | null;
  defaultFeedback: string | null;
  pending: boolean;
  onSubmit: (values: GradingFormSubmit) => void;
}

export function GradingForm({ maxScore, defaultGrade, defaultFeedback, pending, onSubmit }: GradingFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { grade: defaultGrade?.toString() ?? "", feedback: defaultFeedback ?? "" },
  });

  const submitWith = (decision: GradeDecision) =>
    handleSubmit(({ grade, feedback }) => {
      if (decision === "RETURNED") return onSubmit({ decision, grade: null, feedback });

      const score = grade === "" ? Number.NaN : Number(grade);
      if (Number.isNaN(score)) return setError("grade", { message: "Bir puan girin." });
      if (score > maxScore) return setError("grade", { message: `En fazla ${maxScore} olabilir.` });
      onSubmit({ decision, grade: score, feedback });
    });

  return (
    <form onSubmit={submitWith("GRADED")} noValidate className="flex flex-col gap-4">
      <FormField id="grade" label={`Puan (0–${maxScore})`} error={errors.grade?.message}>
        <Input
          id="grade"
          inputMode="numeric"
          className="w-32 tabular-nums"
          aria-invalid={Boolean(errors.grade)}
          aria-describedby={errors.grade ? "grade-message" : undefined}
          {...register("grade")}
        />
      </FormField>
      <FormField id="feedback" label="Geri bildirim" error={errors.feedback?.message}>
        <Textarea
          id="feedback"
          rows={6}
          placeholder="Güçlü yönler, geliştirilebilecek noktalar ve sonraki adımlar…"
          aria-invalid={Boolean(errors.feedback)}
          aria-describedby={errors.feedback ? "feedback-message" : undefined}
          {...register("feedback")}
        />
      </FormField>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={pending} onClick={submitWith("RETURNED")}>
          <RotateCcw aria-hidden /> Revizyon iste
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}
          Puanla ve gönder
        </Button>
      </div>
    </form>
  );
}
