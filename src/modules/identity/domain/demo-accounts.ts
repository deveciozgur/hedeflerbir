import type { Portal, Role } from "./role";

/**
 * Demo accounts - single source of truth for prisma/seed.ts and the dev-only
 * "fill demo account" buttons on the login pages. Passwords are never stored here:
 * every demo account uses SEED_PASSWORD, falling back to DEFAULT_DEMO_PASSWORD.
 */
export const DEFAULT_DEMO_PASSWORD = "HedeflerBir2026!";

export interface DemoAccount {
  email: string;
  role: Role;
  /** Login page this account must use (experts share /expert-login). */
  portal: Portal;
  /** Button label, e.g. "Demo Admin Doldur". */
  label: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: "admin@hedeflerbir.com", role: "ADMIN", portal: "student", label: "Demo Admin Doldur" },
  { email: "egitmen@hedeflerbir.com", role: "INSTRUCTOR", portal: "expert", label: "Demo Eğitmen Doldur" },
  { email: "mentor@hedeflerbir.com", role: "MENTOR", portal: "expert", label: "Demo Mentor Doldur" },
  { email: "ogrenci@hedeflerbir.com", role: "STUDENT", portal: "student", label: "Demo Öğrenci Doldur" },
];

export const demoPassword = (env: Record<string, string | undefined> = process.env) =>
  env.SEED_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD;
