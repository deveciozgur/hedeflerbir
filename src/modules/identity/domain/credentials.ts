import { z } from "zod";

/** What Auth.js `authorize()` verifies. */
export const credentialsSchema = z.object({
  email: z.email({ error: "Geçerli bir e-posta adresi girin." }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Şifre en az 8 karakter olmalı." }).max(128),
});

/** The login form: credentials plus the KVKK açık rıza checkbox (login is refused without it). */
export const loginSchema = credentialsSchema.extend({
  kvkkConsent: z.boolean().refine((v) => v, { error: "Devam etmek için KVKK metnini onaylamalısın." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const portalSchema = z.enum(["student", "expert"]);
