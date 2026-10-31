import "server-only";
import { db } from "@/server/db";
import { hashToken } from "@/server/auth/tokens";
import { tokenState, type TokenState } from "../domain/password-reset";

/** Read-only check used to decide whether to render the reset form. */
export async function inspectResetToken(token: string | undefined): Promise<TokenState> {
  if (!token || token.length < 32 || token.length > 128) return "missing";
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, usedAt: true, user: { select: { isActive: true } } },
  });
  if (record && !record.user.isActive) return "missing";
  return tokenState(record);
}
