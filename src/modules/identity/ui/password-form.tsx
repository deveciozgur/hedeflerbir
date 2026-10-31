"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "../application/profile.actions";
import { changePasswordSchema, MIN_PASSWORD_LENGTH, type ChangePasswordInput } from "../domain/password";

const EMPTY: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) setError(field as keyof ChangePasswordInput, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success("Şifren güncellendi");
      reset(EMPTY);
    }),
  );

  const field = (name: keyof ChangePasswordInput, label: string, autoComplete: string, hint?: string) => (
    <FormField id={name} label={label} error={errors[name]?.message} hint={hint}>
      <Input
        id={name}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] || hint ? `${name}-message` : undefined}
        {...register(name)}
      />
    </FormField>
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" aria-hidden /> Şifre
          </CardTitle>
          <CardDescription>Yönetici tarafından verilen geçici şifreni ilk girişte değiştir.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {field("currentPassword", "Mevcut şifre", "current-password")}
          {field("newPassword", "Yeni şifre", "new-password", `En az ${MIN_PASSWORD_LENGTH} karakter, harf ve rakam içermeli.`)}
          {field("confirmPassword", "Yeni şifre (tekrar)", "new-password")}
          <Button type="submit" variant="outline" disabled={pending} className="self-start">
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Şifreyi güncelle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
