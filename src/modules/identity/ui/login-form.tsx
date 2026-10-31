"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "../application/auth.actions";
import type { DemoCredential } from "../application/demo-login";
import { loginSchema, type LoginInput } from "../domain/credentials";
import type { Portal } from "../domain/role";

interface LoginFormProps {
  portal: Portal;
  callbackUrl?: string;
  /** Dev-only quick fill; empty in production (see demoCredentialsFor). */
  demoAccounts?: DemoCredential[];
}

export function LoginForm({ portal, callbackUrl, demoAccounts = [] }: LoginFormProps) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(portal, values, callbackUrl);
      if (!result.ok) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? (
        <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ad@ornek.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>

      {demoAccounts.length > 0 ? (
        <div role="group" aria-label="Demo hesaplar" className="flex flex-col gap-2 border-t border-dashed border-border pt-4">
          <p className="text-xs text-subtle">Geliştirme ortamı: demo hesap bilgilerini doldur</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setServerError(null);
                  setValue("email", account.email, { shouldValidate: true });
                  setValue("password", account.password, { shouldValidate: true });
                }}
              >
                <UserRoundCheck aria-hidden /> {account.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
