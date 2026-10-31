"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSessionAction, updateSessionAction } from "../application/learning.actions";
import type { InstructorSession } from "../application/instructor-courses.queries";
import { formatResourceLines } from "../domain/resources";

const formSchema = z.object({
  title: z.string().trim().min(3, { error: "Başlık en az 3 karakter olmalı." }).max(160),
  description: z.string().max(5000),
  scheduleDate: z.string().min(1, { error: "Tarih seçin." }),
  durationMinutes: z.number({ error: "Süre girin." }).int().min(15, { error: "En az 15 dk." }).max(480, { error: "En fazla 480 dk." }),
  meetingUrl: z.string(),
  recordingUrl: z.string(),
  resources: z.string().max(10_000),
});
type FormValues = z.infer<typeof formSchema>;

/** Date → value for <input type="datetime-local"> in the browser's zone. */
const toLocalInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const defaultsFor = (session?: InstructorSession): FormValues => ({
  title: session?.title ?? "",
  description: session?.description ?? "",
  scheduleDate: session ? toLocalInput(session.scheduleDate) : "",
  durationMinutes: session?.durationMinutes ?? 90,
  meetingUrl: session?.meetingUrl ?? "",
  recordingUrl: session?.recordingUrl ?? "",
  resources: session ? formatResourceLines(session.resources) : "",
});

interface SessionFormDialogProps {
  courseId: string;
  session?: InstructorSession;
  trigger: ReactNode;
}

export function SessionFormDialog({ courseId, session, trigger }: SessionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaultsFor(session) });

  const onSubmit = handleSubmit((values) => {
    const payload = { ...values, scheduleDate: new Date(values.scheduleDate).toISOString() };
    startTransition(async () => {
      const result = session ? await updateSessionAction(session.id, payload) : await createSessionAction(courseId, payload);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof FormValues, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success(session ? "Oturum güncellendi" : "Oturum eklendi");
      setOpen(false);
      if (!session) reset(defaultsFor());
    });
  });

  const a11y = (field: keyof FormValues) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-message` : undefined,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) reset(defaultsFor(session));
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{session ? "Oturumu düzenle" : "Yeni oturum"}</DialogTitle>
          <DialogDescription>
            Kayıt bağlantısı eklendiğinde kayıtlı katılımcılara bildirim gönderilir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField id="title" label="Başlık" error={errors.title?.message}>
            <Input id="title" {...a11y("title")} {...register("title")} />
          </FormField>
          <FormField id="description" label="Açıklama (isteğe bağlı)" error={errors.description?.message}>
            <Textarea id="description" rows={3} {...a11y("description")} {...register("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FormField id="scheduleDate" label="Tarih ve saat" error={errors.scheduleDate?.message}>
              <Input id="scheduleDate" type="datetime-local" {...a11y("scheduleDate")} {...register("scheduleDate")} />
            </FormField>
            <FormField id="durationMinutes" label="Süre (dk)" error={errors.durationMinutes?.message}>
              <Input
                id="durationMinutes"
                type="number"
                inputMode="numeric"
                min={15}
                max={480}
                {...a11y("durationMinutes")}
                {...register("durationMinutes", { valueAsNumber: true })}
              />
            </FormField>
          </div>
          <FormField id="meetingUrl" label="Canlı ders bağlantısı" error={errors.meetingUrl?.message}>
            <Input id="meetingUrl" type="url" placeholder="https://meet.google.com/…" {...a11y("meetingUrl")} {...register("meetingUrl")} />
          </FormField>
          <FormField
            id="recordingUrl"
            label="Kayıt bağlantısı"
            hint="MP4 dosya bağlantısı (ilerleme takipli), YouTube veya Vimeo."
            error={errors.recordingUrl?.message}
          >
            <Input id="recordingUrl" type="url" placeholder="https://…" aria-describedby="recordingUrl-message" aria-invalid={Boolean(errors.recordingUrl)} {...register("recordingUrl")} />
          </FormField>
          <FormField
            id="resources"
            label="Kaynaklar"
            hint="Her satıra bir kaynak: Başlık | https://bağlantı"
            error={errors.resources?.message}
          >
            <Textarea
              id="resources"
              rows={4}
              className="font-mono text-xs"
              placeholder={"Ders slaytları | https://…/slaytlar.pdf\nÖrnek proje | https://github.com/…"}
              aria-describedby="resources-message"
              aria-invalid={Boolean(errors.resources)}
              {...register("resources")}
            />
          </FormField>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {session ? "Kaydet" : "Oturum ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
