import "server-only";
import { appUrl, sendEmail } from "@/server/email";
import { TransactionalEmail } from "@/server/email/templates/transactional-email";
import { RESET_TOKEN_TTL_MINUTES } from "../domain/password-reset";

interface Recipient {
  name: string;
  email: string;
}

export function sendPasswordResetEmail(to: Recipient, token: string) {
  const link = appUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  return sendEmail({
    to: to.email,
    subject: "Şifre sıfırlama bağlantın",
    react: (
      <TransactionalEmail
        preview="HedeflerBir şifreni sıfırlamak için bağlantı"
        heading="Şifreni sıfırla"
        greeting={`Merhaba ${to.name},`}
        intro={`Hesabın için bir şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki butonu kullan. Bağlantı ${RESET_TOKEN_TTL_MINUTES} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`}
        details={[{ label: "Talebi sen yapmadıysan", value: "Bu e-postayı yok sayabilirsin; şifren değişmez." }]}
        cta={{ label: "Yeni şifre belirle", href: link }}
      />
    ),
  });
}

export function sendPasswordChangedEmail(to: Recipient, loginPath: string) {
  return sendEmail({
    to: to.email,
    subject: "Şifren değiştirildi",
    react: (
      <TransactionalEmail
        preview="HedeflerBir hesabının şifresi değiştirildi"
        heading="Şifren değiştirildi"
        greeting={`Merhaba ${to.name},`}
        intro="Hesabının şifresi az önce sıfırlandı ve tüm cihazlardaki oturumların kapatıldı."
        details={[{ label: "Bu işlemi sen yapmadıysan", value: "Hemen platform yöneticisiyle iletişime geç." }]}
        cta={{ label: "Giriş yap", href: appUrl(loginPath) }}
      />
    ),
  });
}
