import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { demoCredentialsFor } from "@/modules/identity/application/demo-login";
import { LoginForm } from "@/modules/identity/ui/login-form";
import { KvkkNotice } from "@/modules/identity/ui/kvkk-notice";
import { ForgotPasswordLink, ResetSuccessNotice } from "@/modules/identity/ui/login-notices";

export const metadata: Metadata = { title: "Uzman Girişi" };

export default async function ExpertLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const { callbackUrl, reset } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex gap-2 text-muted-foreground" aria-hidden>
          <GraduationCap className="size-5" />
          <Sparkles className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Uzman Portalı</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Eğitmen ve mentorlar için ortak giriş. Rolüne göre doğru panele yönlendirileceksin.
        </p>
      </div>
      <ResetSuccessNotice show={reset === "success"} />
      <div className="flex flex-col gap-3">
        <LoginForm portal="expert" callbackUrl={callbackUrl} demoAccounts={demoCredentialsFor("expert")} />
        <ForgotPasswordLink />
        <KvkkNotice />
      </div>
      <p className="text-sm text-muted-foreground">
        Katılımcı mısın?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Katılımcı girişi
        </Link>
      </p>
    </div>
  );
}
