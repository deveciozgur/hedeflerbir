import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RESET_TOKEN_TTL_MINUTES } from "@/modules/identity/domain/password-reset";
import { ForgotPasswordForm } from "@/modules/identity/ui/password-reset-forms";

export const metadata: Metadata = { title: "Şifremi Unuttum" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şifreni mi unuttun?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Hesabına kayıtlı e-postayı gir; {RESET_TOKEN_TTL_MINUTES} dakika geçerli bir sıfırlama bağlantısı gönderelim.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link
        href="/login"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Girişe dön
      </Link>
    </div>
  );
}
