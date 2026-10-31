import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectResetToken } from "@/modules/identity/application/password-reset.queries";
import { TOKEN_STATE_MESSAGES } from "@/modules/identity/domain/password-reset";
import { ResetPasswordForm } from "@/modules/identity/ui/password-reset-forms";

export const metadata: Metadata = { title: "Yeni Şifre", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const state = await inspectResetToken(token);

  if (state !== "valid" || !token) {
    return (
      <div className="flex flex-col gap-6">
        <span className="grid size-11 place-items-center rounded-lg border bg-card shadow-xs" aria-hidden>
          <LinkIcon className="size-5 text-muted-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bağlantı kullanılamıyor</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{TOKEN_STATE_MESSAGES[state === "valid" ? "missing" : state]}</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Yeni bağlantı iste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni şifre belirle</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Şifren güncellendiğinde tüm cihazlardaki oturumların kapatılır.</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
