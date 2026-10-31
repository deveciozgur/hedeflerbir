"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction, resetPasswordAction } from "../application/password-reset.actions";
import { MIN_PASSWORD_LENGTH } from "../domain/password";
import { requestResetSchema, resetPasswordSchema, type ResetPasswordInput } from "../domain/password-reset";

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      setServerError(null);
      const result = await requestPasswordResetAction(values);
      if (result.ok) setSent(result.data.message);
      else setServerError(result.error);
    }),
  );

  if (sent) {
    return (
      <div role="status" className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
        <p className="text-pretty">{sent}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? <ErrorAlert message={serverError} /> : null}
      <FormField id="email" label="E-posta" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ad@ornek.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-message" : undefined}
          {...register("email")}
        />
      </FormField>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Sıfırlama bağlantısı gönder
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      setServerError(null);
      // On success the action redirects to the right login page.
      const result = await resetPasswordAction(values);
      if (result.ok) return;
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0] && field !== "token") setError(field as keyof ResetPasswordInput, { message: messages[0] });
      }
      setServerError(result.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? <ErrorAlert message={serverError} /> : null}
      <input type="hidden" {...register("token")} />
      <FormField
        id="newPassword"
        label="Yeni şifre"
        hint={`En az ${MIN_PASSWORD_LENGTH} karakter, harf ve rakam içermeli.`}
        error={errors.newPassword?.message}
      >
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.newPassword)}
          aria-describedby="newPassword-message"
          {...register("newPassword")}
        />
      </FormField>
      <FormField id="confirmPassword" label="Yeni şifre (tekrar)" error={errors.confirmPassword?.message}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirmPassword-message" : undefined}
          {...register("confirmPassword")}
        />
      </FormField>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Şifreyi güncelle
      </Button>
    </form>
  );
}
