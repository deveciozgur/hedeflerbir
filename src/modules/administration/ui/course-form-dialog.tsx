"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { fullName } from "@/lib/utils";
import { createCourseAction, updateCourseAction } from "../application/course-admin.actions";
import type { PersonOption } from "../application/course-admin.queries";
import { courseInputSchema, slugify, type CourseInput } from "../domain/course-admin";

interface CourseFormDialogProps {
  instructors: PersonOption[];
  course?: CourseInput & { id: string };
  trigger: ReactNode;
}

export function CourseFormDialog({ instructors, course, trigger }: CourseFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Editing keeps the existing slug (links stay valid); new programmes derive it from the title.
  const slugTouched = Boolean(course);
  const defaults: CourseInput = course ?? { title: "", slug: "", description: "", instructorId: instructors[0]?.id ?? "" };
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CourseInput>({ resolver: zodResolver(courseInputSchema), defaultValues: defaults });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = course ? await updateCourseAction(course.id, values) : await createCourseAction(values);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof CourseInput, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success(course ? "Program güncellendi" : "Program oluşturuldu");
      setOpen(false);
      if (result.data && "id" in result.data) router.push(`/admin/courses/${result.data.id}`);
    }),
  );

  const a11y = (field: keyof CourseInput) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-message` : undefined,
  });

  const titleField = register("title");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) reset(defaults);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Programı düzenle" : "Yeni program"}</DialogTitle>
          <DialogDescription>Eğitmen, eğitimin oturumlarını ve ödevlerini kendi panelinden yönetir.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField id="title" label="Başlık" error={errors.title?.message}>
            <Input
              id="title"
              {...a11y("title")}
              {...titleField}
              onChange={(event) => {
                void titleField.onChange(event);
                if (!slugTouched) setValue("slug", slugify(event.target.value));
              }}
            />
          </FormField>
          {/* The URL slug is derived from the title; a slug clash is reported on the title field. */}
          {errors.slug?.message ? <p className="-mt-2 text-xs text-destructive">{errors.slug.message}</p> : null}
          <FormField id="instructorId" label="Eğitmen" error={errors.instructorId?.message}>
            <NativeSelect id="instructorId" {...a11y("instructorId")} {...register("instructorId")}>
              {instructors.length === 0 ? <option value="">Önce bir eğitmen hesabı oluşturun</option> : null}
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {fullName(instructor)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="description" label="Açıklama" error={errors.description?.message}>
            <Textarea id="description" rows={4} {...a11y("description")} {...register("description")} />
          </FormField>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || instructors.length === 0}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {course ? "Kaydet" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
