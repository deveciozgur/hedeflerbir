import "server-only";

/**
 * Optional integrations (Resend, S3/R2) are switched on only by real values.
 * Hosting panels that force every variable to be non-empty can use "disabled"
 * (or leave the value empty) — the app then falls back instead of failing.
 */
const PLACEHOLDERS = new Set(["", "disabled", "none", "changeme", "-"]);

export function configured(value: string | undefined): value is string {
  return value !== undefined && !PLACEHOLDERS.has(value.trim().toLowerCase());
}

const DEFAULT_APP_URL = "https://app.hedeflerbir.com";

/** Public base URL. Tolerates a missing or malformed AUTH_URL instead of crashing the request. */
export function appBaseUrl(): URL {
  const raw = process.env.AUTH_URL;
  if (configured(raw)) {
    try {
      return new URL(raw);
    } catch {
      console.warn(`[config] AUTH_URL is not a valid URL ("${raw}"); falling back to ${DEFAULT_APP_URL}.`);
    }
  }
  return new URL(DEFAULT_APP_URL);
}

const warned = new Set<string>();

/** Logs a configuration warning once per process. */
export function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[config] ${message}`);
}
