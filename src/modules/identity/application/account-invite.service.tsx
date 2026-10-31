import "server-only";
import { db } from "@/server/db";
import { generateToken } from "@/server/auth/tokens";
import { appUrl, sendEmail } from "@/server/email";
import { TransactionalEmail } from "@/server/email/templates/transactional-email";

/** Invitations stay valid longer than password resets (30 min): people open them days later. */
export const INVITE_TOKEN_TTL_HOURS = 72;

interface Invitee {
  id: string;
  name: string;
  email: string;
}

/** Creates a one-time "set your password" link, reusing the password reset flow. */
export async function createInviteLink(user: Invitee): Promise<string> {
  const { token, hash } = generateToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_HOURS * 3_600_000) },
  });
  return appUrl(`/reset-password?token=${encodeURIComponent(token)}`);
}

export function sendAccountInviteEmail(to: Invitee, link: string) {
  return sendEmail({
    to: to.email,
    subject: "HedeflerBir hesabın oluşturuldu",
    react: (
      <TransactionalEmail
        preview="HedeflerBir hesabın için şifreni belirle"
        heading="Hesabın hazır"
        greeting={`Merhaba ${to.name},`}
        intro={`HedeflerBir LMS'te senin için bir hesap oluşturuldu. Aşağıdaki butonla şifreni belirleyip giriş yapabilirsin. Bağlantı ${INVITE_TOKEN_TTL_HOURS} saat geçerlidir ve yalnızca bir kez kullanılabilir.`}
        details={[{ label: "E-posta", value: to.email }]}
        cta={{ label: "Şifremi belirle", href: link }}
      />
    ),
  });
}
