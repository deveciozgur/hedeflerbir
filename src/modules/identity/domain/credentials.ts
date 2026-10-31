import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const portalSchema = z.enum(["student", "expert"]);
