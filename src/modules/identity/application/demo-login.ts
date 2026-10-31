import "server-only";
import { DEMO_ACCOUNTS, demoPassword } from "../domain/demo-accounts";
import type { Portal } from "../domain/role";

export interface DemoCredential {
  label: string;
  email: string;
  password: string;
}

/**
 * Demo fill buttons are a development convenience: off in production unless DEMO_LOGIN_ENABLED=true
 * (e.g. a public demo deployment). Resolved on the server so the password never ships in the bundle
 * of a deployment that does not show the buttons.
 */
export function demoCredentialsFor(portal: Portal): DemoCredential[] {
  const enabled = process.env.NODE_ENV !== "production" || process.env.DEMO_LOGIN_ENABLED === "true";
  if (!enabled) return [];
  const password = demoPassword();
  return DEMO_ACCOUNTS.filter((a) => a.portal === portal).map(({ label, email }) => ({ label, email, password }));
}
