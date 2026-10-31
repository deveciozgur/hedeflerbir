import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/modules/identity/ui/login-form";
import { ForgotPasswordLink, ResetSuccessNotice } from "@/modules/identity/ui/login-notices";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const { callbackUrl, reset } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tekrar hoş geldin</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Katılımcı hesabınla giriş yap.</p>
      </div>
      <ResetSuccessNotice show={reset === "success"} />
      <div className="flex flex-col gap-3">
        <LoginForm portal="student" callbackUrl={callbackUrl} />
        <ForgotPasswordLink />
      </div>
      <p className="text-sm text-muted-foreground">
        Eğitmen veya mentor musun?{" "}
        <Link href="/expert-login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Uzman girişi
        </Link>
      </p>
    </div>
  );
}
