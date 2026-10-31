import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { appBaseUrl, configured, warnOnce } from "@/server/config";

export interface EmailMessage {
  to: string;
  subject: string;
  react: ReactElement;
}

let client: Resend | undefined;

const DEFAULT_FROM = "HedeflerBir <noreply@hedeflerbir.com>";

/**
 * Transactional e-mail port. Callers schedule it with `after()`, so delivery never blocks the request.
 *
 * Without a real RESEND_API_KEY nothing is sent and nothing throws:
 * - development prints the plain-text body (links included) to the console;
 * - production logs only recipient + subject — bodies may carry one-time links (password reset)
 *   and must never land in server logs.
 */
export async function sendEmail({ to, subject, react }: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!configured(apiKey)) {
    if (process.env.NODE_ENV === "production") {
      warnOnce("resend", "RESEND_API_KEY is not set — transactional e-mails are skipped.");
      console.info(`[email:skipped] → ${to} · ${subject}`);
      return;
    }
    const text = await render(react, { plainText: true });
    console.info(`[email:dev] → ${to} · ${subject}\n${text}\n[/email:dev]`);
    return;
  }

  client ??= new Resend(apiKey);
  const from = configured(process.env.EMAIL_FROM) ? process.env.EMAIL_FROM : DEFAULT_FROM;
  const { error } = await client.emails.send({ from, to, subject, react });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/** Absolute URL for links inside e-mails. */
export const appUrl = (path: string) => new URL(path, appBaseUrl()).toString();

/** Whether e-mails actually leave the server (a real RESEND_API_KEY is set). */
export const emailDeliveryConfigured = () => configured(process.env.RESEND_API_KEY);
