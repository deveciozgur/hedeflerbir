"use server";

import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { homeFor, resolveAccess } from "../domain/access-policy";
import { loginSchema } from "../domain/credentials";
import type { Portal, Role } from "../domain/role";

const ERROR_MESSAGES: Record<string, string> = {
  portal_mismatch: "Bu hesap farklı bir giriş kapısı kullanıyor. Lütfen doğru giriş sayfasını seçin.",
  inactive_account: "Hesabınız askıya alınmış. Destek ekibiyle iletişime geçin.",
  default: "E-posta adresi veya şifre hatalı.",
};

/**
 * Smart routing: honour a same-origin callbackUrl only if the role may open it,
 * otherwise land on the role's home. Redirecting straight there (rather than via "/")
 * keeps the address bar in sync with the page.
 */
function destinationFor(role: Role, callbackUrl: string | undefined): string {
  const safe = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;
  if (safe && safe !== "/" && resolveAccess(new URL(safe, "http://x").pathname, role).type === "allow") return safe;
  return homeFor(role);
}

export async function loginAction(portal: Portal, input: unknown, callbackUrl?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("Lütfen alanları kontrol edin.", z.flattenError(parsed.error).fieldErrors);

  try {
    await signIn("credentials", { ...parsed.data, portal, redirect: false });
  } catch (error) {
    if (error instanceof CredentialsSignin) return fail(ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.default!);
    if (error instanceof AuthError) {
      console.error("[auth] signIn failed", { type: error.type, email: parsed.data.email, portal });
      return fail("Giriş sırasında bir sorun oluştu. Lütfen tekrar deneyin.");
    }
    throw error;
  }

  // Credentials were just verified by authorize(); this only reads the role for routing.
  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { role: true } });
  redirect(user ? destinationFor(user.role, callbackUrl) : "/");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
