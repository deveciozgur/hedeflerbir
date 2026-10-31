"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createAssignmentAction } from "../application/assignment.actions";
import type { InstructorCourseOption } from "../application/instructor-assignments.queries";
import { FILE_TYPE_OPTIONS } from "../domain/file-policy";
import { assignmentInputSchema } from "../domain/schemas";

/** The form edits a local datetime string; it is converted to an ISO instant on submit. */
const formSchema = assignmentInputSchema.extend({
  dueDate: z.string().min(1, { error: "Bir teslim tarihi seçin." }),
});
type FormValues = z.infer<typeof formSchema>;

export function CreateAssignmentDialog({ courses }: { courses: InstructorCourseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { courseId: courses[0]?.id ?? "", title: "", description: "", dueDate: "", maxScore: 100, acceptedFileTypes: [] },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAssignmentAction({ ...values, dueDate: new Date(values.dueDate).toISOString() });
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof FormValues, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success("Ödev yayınlandı", { description: "Kayıtlı katılımcılara bildirim gönderildi." });
      reset();
      setOpen(false);
      router.push(`/instructor/assignments/${result.data.id}`);
    });
  });

  const describedBy = (field: keyof FormValues) => (errors[field] ? `${field}-message` : undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={courses.length === 0}>
          <Plus aria-hidden /> Yeni ödev
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni ödev tanımla</DialogTitle>
          <DialogDescription>Ödev, seçtiğin eğitime kayıtlı tüm katılımcılara bildirilir.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField id="courseId" label="Eğitim" error={errors.courseId?.message}>
            <NativeSelect id="courseId" aria-invalid={Boolean(errors.courseId)} aria-describedby={describedBy("courseId")} {...register("courseId")}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="title" label="Başlık" error={errors.title?.message}>
            <Input id="title" aria-invalid={Boolean(errors.title)} aria-describedby={describedBy("title")} {...register("title")} />
          </FormField>
          <FormField id="description" label="Açıklama" error={errors.description?.message}>
            <Textarea
              id="description"
              rows={5}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describedBy("description")}
              {...register("description")}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FormField id="dueDate" label="Teslim tarihi" error={errors.dueDate?.message}>
              <Input
                id="dueDate"
                type="datetime-local"
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={describedBy("dueDate")}
                {...register("dueDate")}
              />
            </FormField>
            <FormField id="maxScore" label="Maks. puan" error={errors.maxScore?.message}>
              <Input
                id="maxScore"
                type="number"
                min={1}
                max={1000}
                inputMode="numeric"
                aria-invalid={Boolean(errors.maxScore)}
                aria-describedby={describedBy("maxScore")}
                {...register("maxScore", { valueAsNumber: true })}
              />
            </FormField>
          </div>
          <Controller
            control={control}
            name="acceptedFileTypes"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium">Kabul edilen dosya türleri</legend>
                <p className="text-xs text-muted-foreground">
                  {field.value.length === 0 ? "Hiçbiri seçilmezse desteklenen tüm türler kabul edilir." : `${field.value.length} tür seçildi.`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FILE_TYPE_OPTIONS.map((type) => {
                    const selected = field.value.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => field.onChange(selected ? field.value.filter((t) => t !== type) : [...field.value, type])}
                        className={cn(
                          "h-7 rounded-full border px-2.5 font-mono text-xs uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                          selected ? "border-brand/60 bg-brand/10 text-foreground" : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          />
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Yayınla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
