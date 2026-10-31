import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";

export interface EmailMessage {
  to: string;
  subject: string;
  react: ReactElement;
}

let client: Resend | undefined;

/**
 * Transactional e-mail port. Without RESEND_API_KEY (local development) messages are logged instead of sent.
 * Callers should schedule this with `after()` so delivery never blocks or fails the user's request.
 */
export async function sendEmail({ to, subject, react }: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured.");
    // Development: print the plain-text body so links (e.g. password reset) are usable locally.
    const text = await render(react, { plainText: true });
    console.info(`[email:dev] → ${to} · ${subject}\n${text}\n[/email:dev]`);
    return;
  }

  client ??= new Resend(apiKey);
  const { error } = await client.emails.send({
    from: process.env.EMAIL_FROM ?? "HedeflerBir <noreply@hedeflerbir.com>",
    to,
    subject,
    react,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** Absolute URL for links inside e-mails. */
export const appUrl = (path: string) => new URL(path, process.env.AUTH_URL ?? "https://app.hedeflerbir.com").toString();
