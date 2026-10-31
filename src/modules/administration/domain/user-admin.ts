import { z } from "zod";
import { ROLES, type Role } from "@/modules/identity/domain/role";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Ad en az 2 karakter olmalı." }).max(60),
  surname: z.string().trim().min(2, { error: "Soyad en az 2 karakter olmalı." }).max(60),
  email: z.email({ error: "Geçerli bir e-posta girin." }).trim().toLowerCase(),
  role: z.enum(ROLES, { error: "Bir rol seçin." }),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const roleChangeSchema = z.object({ userId: z.string().min(1), role: z.enum(ROLES) });
export const activationSchema = z.object({ userId: z.string().min(1), active: z.boolean() });

export type Eligibility = { allowed: true } | { allowed: false; reason: string };

interface AdminGuardContext {
  actorId: string;
  target: { id: string; role: Role; isActive: boolean };
  /** Active admins on the platform, including the target if applicable. */
  activeAdminCount: number;
}

const removesAnAdmin = (ctx: AdminGuardContext) => ctx.target.role === "ADMIN" && ctx.target.isActive;

/** Admins can't lock themselves out, and the platform always keeps at least one active admin. */
export function canChangeRole(ctx: AdminGuardContext, nextRole: Role): Eligibility {
  if (ctx.target.role === nextRole) return { allowed: false, reason: "Kullanıcı zaten bu rolde." };
  if (ctx.actorId === ctx.target.id) return { allowed: false, reason: "Kendi rolünüzü değiştiremezsiniz." };
  if (removesAnAdmin(ctx) && ctx.activeAdminCount <= 1) return { allowed: false, reason: "Platformda en az bir aktif yönetici kalmalı." };
  return { allowed: true };
}

export function canSetActive(ctx: AdminGuardContext, active: boolean): Eligibility {
  if (ctx.target.isActive === active) return { allowed: false, reason: active ? "Hesap zaten aktif." : "Hesap zaten askıda." };
  if (!active && ctx.actorId === ctx.target.id) return { allowed: false, reason: "Kendi hesabınızı askıya alamazsınız." };
  if (!active && removesAnAdmin(ctx) && ctx.activeAdminCount <= 1) {
    return { allowed: false, reason: "Platformda en az bir aktif yönetici kalmalı." };
  }
  return { allowed: true };
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Unambiguous 14-char temporary password from a CSPRNG (no 0/O, 1/l/I). */
export function generateTemporaryPassword(length = 14): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
}
