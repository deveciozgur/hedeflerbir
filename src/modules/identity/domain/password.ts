import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 10;

/** Shared by password change and password reset. */
export const strongPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` })
  .max(128, { error: "Şifre en fazla 128 karakter olabilir." })
  .refine((v) => /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(v) && /\d/.test(v), { error: "Şifre en az bir harf ve bir rakam içermeli." });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Mevcut şifrenizi girin." }),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], error: "Şifreler eşleşmiyor." })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], error: "Yeni şifre mevcut şifreden farklı olmalı." });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
