import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/** Success banner shown after a password reset redirects to a login page. */
export function ResetSuccessNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div role="status" className="flex gap-2 rounded-lg border border-success/30 bg-success/8 p-3 text-sm">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.
    </div>
  );
}

export function ForgotPasswordLink() {
  return (
    <Link
      href="/forgot-password"
      className="w-fit rounded-md text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Şifremi unuttum
    </Link>
  );
}
