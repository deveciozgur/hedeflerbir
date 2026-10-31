"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { generateToken, hashToken } from "@/server/auth/tokens";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  canRequestReset,
  requestResetSchema,
  RESET_REQUESTED_MESSAGE,
  RESET_TOKEN_TTL_MINUTES,
  resetPasswordSchema,
  tokenState,
  TOKEN_STATE_MESSAGES,
} from "../domain/password-reset";
import { PORTAL_LOGIN_PATH, portalFor } from "../domain/role";
import { sendPasswordChangedEmail, sendPasswordResetEmail } from "./password-reset.emails";

const HOUR = 3_600_000;

/** Issues a token and e-mails it. Runs after the response so timing never reveals whether the account exists. */
async function issueResetToken(email: string): Promise<void> {
  const user = await db.user.findFirst({
    where: { email, isActive: true },
    select: { id: true, name: true, email: true, _count: { select: { passwordResetTokens: { where: { createdAt: { gt: new Date(Date.now() - HOUR) } } } } } },
  });
  if (!user || !canRequestReset(user._count.passwordResetTokens)) return;

  const { token, hash } = generateToken();
  await db.$transaction([
    // Only the newest link works.
    db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000) },
    }),
  ]);
  await sendPasswordResetEmail(user, token);
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult<{ message: string }>> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const { email } = parsed.data;
  after(() => issueResetToken(email).catch((error: unknown) => console.error("Password reset request failed", error)));
  return ok({ message: RESET_REQUESTED_MESSAGE });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, expiresAt: true, usedAt: true, user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  const state = tokenState(record);
  if (state !== "valid") return fail(TOKEN_STATE_MESSAGES[state]);
  if (!record || !record.user.isActive) return fail(TOKEN_STATE_MESSAGES.missing);

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const now = new Date();
  const consumed = await db.$transaction(async (tx) => {
    // Conditional consume — two concurrent submissions can't both succeed.
    const claim = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claim.count !== 1) return false;
    await tx.user.update({
      where: { id: record.user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } }, // signs out every existing session
    });
    await tx.passwordResetToken.updateMany({ where: { userId: record.user.id, usedAt: null }, data: { usedAt: now } });
    return true;
  });
  if (!consumed) return fail(TOKEN_STATE_MESSAGES.used);
  await recordAudit({ action: "auth.password_reset", actorId: record.user.id, actorEmail: record.user.email });

  const loginPath = PORTAL_LOGIN_PATH[portalFor(record.user.role)];
  after(() => sendPasswordChangedEmail(record.user, loginPath).catch((e: unknown) => console.error("Password changed e-mail failed", e)));
  redirect(`${loginPath}?reset=success`);
}
