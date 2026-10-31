"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TRAINING_BADGES } from "@/modules/engagement/domain/badges";
import { createTrainingAction, updateTrainingAction } from "../application/training-admin.actions";

const formSchema = z.object({
  courseId: z.string().min(1, { error: "Bir program seçin." }),
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(160),
  instructorId: z.string().min(1, { error: "Bir eğitmen seçin." }),
  topics: z.string().max(5000),
  durationMinutes: z.number({ error: "Süre girin." }).int().min(15, { error: "En az 15 dk." }).max(480, { error: "En fazla 480 dk." }),
  scheduleDate: z.string().min(1, { error: "Tarih ve saat seçin." }),
  meetingUrl: z.string().min(1, { error: "Canlı eğitim bağlantısını girin." }),
  badgeCode: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

/** Date → value for <input type="datetime-local"> in the browser's zone. */
const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export interface EditableTraining {
  id: string;
  courseId: string;
  title: string;
  instructorId: string | null;
  topicsText: string;
  durationMinutes: number;
  scheduleDate: Date;
  meetingUrl: string | null;
  badgeCode: string | null;
}

interface TrainingFormDialogProps {
  training?: EditableTraining;
  courses: Array<{ id: string; title: string }>;
  instructors: Array<{ id: string; name: string; surname: string }>;
  trigger: ReactNode;
}

const defaultsFor = (training: EditableTraining | undefined, courses: TrainingFormDialogProps["courses"], instructors: TrainingFormDialogProps["instructors"]): FormValues => ({
  courseId: training?.courseId ?? courses[0]?.id ?? "",
  title: training?.title ?? "",
  instructorId: training?.instructorId ?? instructors[0]?.id ?? "",
  topics: training?.topicsText ?? "",
  durationMinutes: training?.durationMinutes ?? 90,
  scheduleDate: training ? toLocalInput(training.scheduleDate) : "",
  meetingUrl: training?.meetingUrl ?? "",
  badgeCode: training?.badgeCode ?? "",
});

export function TrainingFormDialog({ training, courses, instructors, trigger }: TrainingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaultsFor(training, courses, instructors) });

  const onSubmit = handleSubmit((values) => {
    const payload = { ...values, scheduleDate: new Date(values.scheduleDate).toISOString() };
    startTransition(async () => {
      const result = training ? await updateTrainingAction(training.id, payload) : await createTrainingAction(payload);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof FormValues, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success(training ? "Eğitim güncellendi" : "Eğitim eklendi", training ? undefined : { description: "Kayıtlı katılımcılara bildirim gönderildi." });
      setOpen(false);
    });
  });

  const describedBy = (field: keyof FormValues) => (errors[field] ? `${field}-message` : undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) reset(defaultsFor(training, courses, instructors));
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{training ? "Eğitimi düzenle" : "Yeni canlı eğitim"}</DialogTitle>
          <DialogDescription>Eğitim, seçilen programa kayıtlı katılımcıların takvimine eklenir.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-0.5">
          <FormField id="title" label="Eğitim başlığı" error={errors.title?.message}>
            <Input id="title" aria-invalid={Boolean(errors.title)} aria-describedby={describedBy("title")} {...register("title")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="instructorId" label="Eğitmen" error={errors.instructorId?.message}>
              <NativeSelect id="instructorId" aria-describedby={describedBy("instructorId")} {...register("instructorId")}>
                {instructors.length === 0 ? <option value="">Önce bir eğitmen hesabı oluşturun</option> : null}
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.surname}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="courseId" label="Program" error={errors.courseId?.message}>
              <NativeSelect id="courseId" disabled={Boolean(training)} aria-describedby={describedBy("courseId")} {...register("courseId")}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <FormField id="topics" label="Konu / içerik başlıkları" error={errors.topics?.message} hint="Her satıra bir başlık">
            <Textarea id="topics" rows={4} aria-describedby="topics-message" {...register("topics")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FormField id="scheduleDate" label="Tarih ve saat" error={errors.scheduleDate?.message}>
              <Input id="scheduleDate" type="datetime-local" aria-describedby={describedBy("scheduleDate")} {...register("scheduleDate")} />
            </FormField>
            <FormField id="durationMinutes" label="Süre (dk)" error={errors.durationMinutes?.message}>
              <Input id="durationMinutes" type="number" min={15} max={480} aria-describedby={describedBy("durationMinutes")} {...register("durationMinutes", { valueAsNumber: true })} />
            </FormField>
          </div>
          <FormField id="meetingUrl" label="Canlı eğitim bağlantısı" error={errors.meetingUrl?.message}>
            <Input id="meetingUrl" type="url" placeholder="https://meet.google.com/…" aria-describedby={describedBy("meetingUrl")} {...register("meetingUrl")} />
          </FormField>
          <FormField id="badgeCode" label="Katılımcılara verilecek rozet" error={errors.badgeCode?.message} hint="Yoklamada 'Katıldı' işaretlenenler kazanır">
            <NativeSelect id="badgeCode" aria-describedby="badgeCode-message" {...register("badgeCode")}>
              <option value="">Rozet yok</option>
              {TRAINING_BADGES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {training ? "Kaydet" : "Eğitimi ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
