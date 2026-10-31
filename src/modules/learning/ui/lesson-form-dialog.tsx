"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createLessonAction, updateLessonAction } from "../application/curriculum-admin.actions";
import type { CurriculumEditor, EditableLesson } from "../application/instructor-curriculum.queries";
import { LESSON_TYPE_LABELS, LESSON_TYPES, type LessonType } from "../domain/lessons";

const formSchema = z.object({
  title: z.string().trim().min(3, { error: "Ders adı en az 3 karakter olmalı." }).max(160),
  type: z.enum(LESSON_TYPES),
  durationMinutes: z.string().regex(/^\d{0,3}$/, { error: "Dakika olarak girin." }),
  content: z.string().max(50_000),
  videoUrl: z.string(),
  resources: z.string().max(10_000),
  sessionId: z.string(),
  assignmentId: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

const defaultsFor = (lesson: EditableLesson | undefined, type: LessonType): FormValues => ({
  title: lesson?.title ?? "",
  type: lesson?.type ?? type,
  durationMinutes: lesson?.durationMinutes?.toString() ?? "",
  content: lesson?.content ?? "",
  videoUrl: lesson?.videoUrl ?? "",
  resources: lesson?.resources ?? "",
  sessionId: lesson?.sessionId ?? "",
  assignmentId: lesson?.assignmentId ?? "",
});

const CONTENT_LABEL: Record<LessonType, string> = {
  VIDEO: "Ders notları (Markdown, isteğe bağlı)",
  ARTICLE: "İçerik (Markdown)",
  QUIZ: "Açıklama (Markdown, isteğe bağlı)",
  ASSIGNMENT: "Açıklama (Markdown, isteğe bağlı)",
  LIVE_SESSION: "Ders notları (Markdown, isteğe bağlı)",
};

interface LessonFormDialogProps {
  moduleId: string;
  lesson?: EditableLesson;
  editor: Pick<CurriculumEditor, "sessions" | "assignments">;
  trigger: ReactNode;
}

export function LessonFormDialog({ moduleId, lesson, editor, trigger }: LessonFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaultsFor(lesson, "VIDEO") });
  const type = watch("type");
  const content = watch("content");

  const onSubmit = handleSubmit((values) => {
    const payload = {
      ...values,
      durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
      sessionId: values.sessionId || null,
      assignmentId: values.assignmentId || null,
    };
    startTransition(async () => {
      const result = lesson ? await updateLessonAction(lesson.id, payload) : await createLessonAction(moduleId, payload);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof FormValues, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success(lesson ? "Ders güncellendi" : "Ders eklendi", type === "QUIZ" && !lesson ? { description: "Soruları quiz düzenleyicisinden ekleyebilirsin." } : undefined);
      setOpen(false);
      if (!lesson) reset(defaultsFor(undefined, type));
    });
  });

  const describedBy = (field: keyof FormValues) => (errors[field] ? `${field}-message` : undefined);
  const linkable = (items: CurriculumEditor["sessions"]) => items.filter((item) => !item.lessonId || item.lessonId === lesson?.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset(defaultsFor(lesson, type));
          setPreview(false);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson ? "Dersi düzenle" : "Yeni ders"}</DialogTitle>
          <DialogDescription>Video, okuma, quiz, ödev veya canlı ders ekleyebilirsin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-0.5">
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem_7rem]">
            <FormField id="title" label="Ders adı" error={errors.title?.message}>
              <Input id="title" aria-invalid={Boolean(errors.title)} aria-describedby={describedBy("title")} {...register("title")} />
            </FormField>
            <FormField id="type" label="Tür" hint={lesson ? "Sonradan değiştirilemez" : undefined}>
              <NativeSelect id="type" disabled={Boolean(lesson)} aria-describedby={lesson ? "type-message" : undefined} {...register("type")}>
                {LESSON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LESSON_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="durationMinutes" label="Süre (dk)" error={errors.durationMinutes?.message}>
              <Input id="durationMinutes" inputMode="numeric" placeholder="15" aria-describedby={describedBy("durationMinutes")} {...register("durationMinutes")} />
            </FormField>
          </div>

          {type === "VIDEO" ? (
            <FormField id="videoUrl" label="Video bağlantısı" error={errors.videoUrl?.message} hint="MP4 dosyası, YouTube veya Vimeo bağlantısı">
              <Input id="videoUrl" type="url" placeholder="https://" aria-invalid={Boolean(errors.videoUrl)} aria-describedby="videoUrl-message" {...register("videoUrl")} />
            </FormField>
          ) : null}
          {type === "LIVE_SESSION" ? (
            <FormField id="sessionId" label="Canlı ders" error={errors.sessionId?.message} hint="Oturumlar sekmesinde planlanan canlı derslerden biri">
              <NativeSelect id="sessionId" aria-invalid={Boolean(errors.sessionId)} aria-describedby="sessionId-message" {...register("sessionId")}>
                <option value="">Seçin</option>
                {linkable(editor.sessions).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}
          {type === "ASSIGNMENT" ? (
            <FormField id="assignmentId" label="Ödev" error={errors.assignmentId?.message} hint="Ödev & Puanlama sayfasında oluşturulan ödevlerden biri">
              <NativeSelect id="assignmentId" aria-invalid={Boolean(errors.assignmentId)} aria-describedby="assignmentId-message" {...register("assignmentId")}>
                <option value="">Seçin</option>
                {linkable(editor.assignments).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="text-sm font-medium">
                {CONTENT_LABEL[type]}
              </label>
              <div role="group" aria-label="Editör görünümü" className="flex gap-1 rounded-md border border-border p-0.5">
                {[
                  { value: false, label: "Yaz", icon: PencilLine },
                  { value: true, label: "Önizle", icon: Eye },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={preview === value}
                    onClick={() => setPreview(value)}
                    className={cn(
                      "inline-flex h-6 items-center gap-1 rounded px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      preview === value ? "bg-chip-active text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3" aria-hidden /> {label}
                  </button>
                ))}
              </div>
            </div>
            {preview ? (
              <div className="min-h-40 rounded-md border border-border p-4">
                {content.trim() ? <Markdown>{content}</Markdown> : <p className="text-sm text-muted-foreground">Önizlenecek içerik yok.</p>}
              </div>
            ) : (
              <Textarea
                id="content"
                rows={type === "ARTICLE" ? 12 : 5}
                className="font-mono text-[13px]"
                placeholder={"## Başlık\n\nParagraf, **kalın**, `kod`, - liste…"}
                aria-invalid={Boolean(errors.content)}
                aria-describedby={describedBy("content")}
                {...register("content")}
              />
            )}
            {errors.content ? (
              <p id="content-message" className="text-xs text-destructive">
                {errors.content.message}
              </p>
            ) : null}
          </div>

          <FormField id="resources" label="Kaynaklar" error={errors.resources?.message} hint={'Her satıra bir kaynak: "Başlık | https://..."'}>
            <Textarea id="resources" rows={3} className="font-mono text-[13px]" aria-describedby="resources-message" {...register("resources")} />
          </FormField>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {lesson ? "Kaydet" : "Dersi ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
