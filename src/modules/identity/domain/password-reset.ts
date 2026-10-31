import { z } from "zod";
import { strongPassword } from "./password";

export const RESET_TOKEN_TTL_MINUTES = 30;
/** Per-account throttle — limits mailbox flooding and token spraying. */
export const MAX_RESET_REQUESTS_PER_HOUR = 3;

export const requestResetSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }).trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(128),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], error: "Şifreler eşleşmiyor." });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type TokenState = "valid" | "expired" | "used" | "missing";

export function tokenState(token: { expiresAt: Date; usedAt: Date | null } | null, now: Date = new Date()): TokenState {
  if (!token) return "missing";
  if (token.usedAt) return "used";
  if (token.expiresAt <= now) return "expired";
  return "valid";
}

export const TOKEN_STATE_MESSAGES: Record<Exclude<TokenState, "valid">, string> = {
  missing: "Bu sıfırlama bağlantısı geçersiz.",
  used: "Bu sıfırlama bağlantısı daha önce kullanılmış.",
  expired: `Bu sıfırlama bağlantısının süresi dolmuş (bağlantılar ${RESET_TOKEN_TTL_MINUTES} dakika geçerlidir).`,
};

export const canRequestReset = (requestsInLastHour: number) => requestsInLastHour < MAX_RESET_REQUESTS_PER_HOUR;

/** Identical response whether or not the account exists — prevents e-mail enumeration. */
export const RESET_REQUESTED_MESSAGE =
  "Bu e-posta adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı birkaç dakika içinde gelen kutuna ulaşacak.";
