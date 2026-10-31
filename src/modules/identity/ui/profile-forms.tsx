"use client";

import { useTransition, type ReactNode } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";
import { updateAdminProfileAction, updateExpertProfileAction, updateStudentProfileAction } from "../application/profile.actions";
import {
  adminProfileSchema,
  expertProfileSchema,
  SOCIAL_LABELS,
  SOCIAL_NETWORKS,
  studentProfileSchema,
  type AdminProfileInput,
  type ExpertProfileInput,
  type StudentProfileInput,
} from "../domain/profile";

function applyServerErrors<T extends FieldValues>(result: ActionResult, setError: UseFormSetError<T>) {
  if (result.ok) return;
  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (messages?.[0]) setError(field as Path<T>, { message: messages[0] });
  }
  toast.error(result.error);
}

function ProfileCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      Kaydet
    </Button>
  );
}

const describe = (name: string, error: unknown, hint = false) => ({
  "aria-invalid": Boolean(error),
  "aria-describedby": error || hint ? `${name}-message` : undefined,
});

// ───────────────────────────── Student ─────────────────────────────

export function StudentProfileForm({ defaults }: { defaults: StudentProfileInput }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateStudentProfileAction(values);
      if (result.ok) toast.success("Profilin güncellendi");
      else applyServerErrors(result, setError);
    }),
  );

  return (
    <ProfileCard title="Kişisel bilgiler" description="Bölümün ve Hakkımda yazın kişi kartında görünür; hedeflerin mentorlarınla paylaşılır.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Ad" error={errors.name?.message}>
            <Input id="name" autoComplete="given-name" {...describe("name", errors.name)} {...register("name")} />
          </FormField>
          <FormField id="surname" label="Soyad" error={errors.surname?.message}>
            <Input id="surname" autoComplete="family-name" {...describe("surname", errors.surname)} {...register("surname")} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="department" label="Okuduğun bölüm" error={errors.department?.message}>
            <Input id="department" placeholder="Örn. Bilgisayar Mühendisliği" {...describe("department", errors.department)} {...register("department")} />
          </FormField>
          <FormField id="city" label="Şehir" error={errors.city?.message}>
            <Input id="city" autoComplete="address-level2" {...describe("city", errors.city)} {...register("city")} />
          </FormField>
        </div>
        <FormField id="goals" label="Hedeflerim" error={errors.goals?.message} hint="Örn. ilk oyunumu yayınlamak, junior pozisyon bulmak.">
          <Textarea id="goals" rows={3} {...describe("goals", errors.goals, true)} {...register("goals")} />
        </FormField>
        <FormField id="bio" label="Hakkımda" error={errors.bio?.message}>
          <Textarea id="bio" rows={4} {...describe("bio", errors.bio)} {...register("bio")} />
        </FormField>
        <SaveButton pending={pending} />
      </form>
    </ProfileCard>
  );
}

// ───────────────────────────── Expert ─────────────────────────────

export function ExpertProfileForm({ defaults, isMentor }: { defaults: ExpertProfileInput; isMentor: boolean }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ExpertProfileInput>({
    resolver: zodResolver(expertProfileSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateExpertProfileAction(values);
      if (result.ok) toast.success("Profilin güncellendi");
      else applyServerErrors(result, setError);
    }),
  );

  return (
    <ProfileCard
      title={isMentor ? "Mentor profili" : "Eğitmen profili"}
      description="Katılımcılar dizinde ve detay sayfanda bu bilgileri görür."
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Ad" error={errors.name?.message}>
            <Input id="name" autoComplete="given-name" {...describe("name", errors.name)} {...register("name")} />
          </FormField>
          <FormField id="surname" label="Soyad" error={errors.surname?.message}>
            <Input id="surname" autoComplete="family-name" {...describe("surname", errors.surname)} {...register("surname")} />
          </FormField>
          <FormField id="title" label="Unvan" error={errors.title?.message}>
            <Input id="title" placeholder="Örn. Kıdemli Oyun Geliştirici" {...describe("title", errors.title)} {...register("title")} />
          </FormField>
          <FormField id="expertiseArea" label="Uzmanlık alanı" error={errors.expertiseArea?.message}>
            <Input id="expertiseArea" placeholder="Örn. Unity · C# · Oyun Mimarisi" {...describe("expertiseArea", errors.expertiseArea)} {...register("expertiseArea")} />
          </FormField>
        </div>
        <FormField id="bio" label="Biyografi" error={errors.bio?.message}>
          <Textarea id="bio" rows={5} {...describe("bio", errors.bio)} {...register("bio")} />
        </FormField>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">Sosyal bağlantılar</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((network) => {
              const id = `social-${network}`;
              const error = errors.socialLinks?.[network]?.message;
              return (
                <FormField key={network} id={id} label={SOCIAL_LABELS[network]} error={error}>
                  <Input id={id} type="url" placeholder="https://…" {...describe(id, error)} {...register(`socialLinks.${network}`)} />
                </FormField>
              );
            })}
          </div>
        </fieldset>
        <SaveButton pending={pending} />
      </form>
    </ProfileCard>
  );
}

// ───────────────────────────── Admin ─────────────────────────────

export function AdminProfileForm({ defaults }: { defaults: AdminProfileInput }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<AdminProfileInput>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateAdminProfileAction(values);
      if (result.ok) toast.success("Profilin güncellendi");
      else applyServerErrors(result, setError);
    }),
  );

  return (
    <ProfileCard title="Kişisel bilgiler" description="Adın, mesajlarda ve destek yanıtlarında görünür.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Ad" error={errors.name?.message}>
            <Input id="name" autoComplete="given-name" {...describe("name", errors.name)} {...register("name")} />
          </FormField>
          <FormField id="surname" label="Soyad" error={errors.surname?.message}>
            <Input id="surname" autoComplete="family-name" {...describe("surname", errors.surname)} {...register("surname")} />
          </FormField>
        </div>
        <SaveButton pending={pending} />
      </form>
    </ProfileCard>
  );
}
