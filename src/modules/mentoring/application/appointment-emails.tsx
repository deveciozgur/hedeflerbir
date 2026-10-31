import "server-only";
import { appUrl, sendEmail } from "@/server/email";
import { TransactionalEmail } from "@/server/email/templates/transactional-email";
import { formatDateTime, formatTime } from "@/lib/format";

interface Party {
  name: string;
  surname: string;
  email: string;
}

export interface AppointmentEmailContext {
  student: Party;
  mentor: Party;
  startTime: Date;
  endTime: Date;
  meetingLink: string | null;
  notes?: string | null;
}

const when = (ctx: AppointmentEmailContext) => `${formatDateTime(ctx.startTime)} – ${formatTime(ctx.endTime)}`;

const fullName = (p: Party) => `${p.name} ${p.surname}`;

/** Booking confirmation: mentor gets the alert, student gets the receipt. Failures are logged, never thrown. */
export async function sendAppointmentBookedEmails(ctx: AppointmentEmailContext): Promise<void> {
  const meeting = ctx.meetingLink ? [{ label: "Görüşme bağlantısı", value: ctx.meetingLink }] : [];
  const results = await Promise.allSettled([
    sendEmail({
      to: ctx.mentor.email,
      subject: `Yeni mentorluk seansı: ${fullName(ctx.student)}`,
      react: (
        <TransactionalEmail
          preview={`${fullName(ctx.student)} ${formatDateTime(ctx.startTime)} için seans aldı`}
          heading="Yeni bir seans rezerve edildi"
          greeting={`Merhaba ${ctx.mentor.name},`}
          intro={`${fullName(ctx.student)} seninle bir mentorluk seansı planladı. Katılımcının hedeflerini ve ilerlemesini seanstan önce inceleyebilirsin.`}
          details={[
            { label: "Katılımcı", value: fullName(ctx.student) },
            { label: "Zaman", value: when(ctx) },
            ...meeting,
            ...(ctx.notes ? [{ label: "Katılımcının notu", value: ctx.notes }] : []),
          ]}
          cta={{ label: "Randevuyu görüntüle", href: appUrl("/mentor/appointments") }}
        />
      ),
    }),
    sendEmail({
      to: ctx.student.email,
      subject: `Seansın onaylandı: ${fullName(ctx.mentor)}`,
      react: (
        <TransactionalEmail
          preview={`${fullName(ctx.mentor)} ile seansın ${formatDateTime(ctx.startTime)} tarihinde`}
          heading="Mentorluk seansın onaylandı"
          greeting={`Merhaba ${ctx.student.name},`}
          intro={`${fullName(ctx.mentor)} ile seansın takvime eklendi. Görüşmeden önce sormak istediklerini not almayı unutma.`}
          details={[{ label: "Mentor", value: fullName(ctx.mentor) }, { label: "Zaman", value: when(ctx) }, ...meeting]}
          cta={{ label: "Seanslarım", href: appUrl("/mentors") }}
        />
      ),
    }),
  ]);
  logFailures(results);
}

export async function sendAppointmentCancelledEmail(
  ctx: AppointmentEmailContext,
  cancelledBy: "STUDENT" | "MENTOR",
): Promise<void> {
  const [recipient, actor, href] =
    cancelledBy === "STUDENT"
      ? [ctx.mentor, ctx.student, "/mentor/appointments"]
      : [ctx.student, ctx.mentor, "/mentors"];

  const results = await Promise.allSettled([
    sendEmail({
      to: recipient.email,
      subject: `Seans iptal edildi: ${formatDateTime(ctx.startTime)}`,
      react: (
        <TransactionalEmail
          preview={`${fullName(actor)} seansı iptal etti`}
          heading="Mentorluk seansı iptal edildi"
          greeting={`Merhaba ${recipient.name},`}
          intro={`${fullName(actor)}, aşağıdaki seansı iptal etti.`}
          details={[{ label: "Zaman", value: when(ctx) }]}
          cta={{ label: "Takvimi aç", href: appUrl(href) }}
        />
      ),
    }),
  ]);
  logFailures(results);
}

function logFailures(results: PromiseSettledResult<void>[]) {
  for (const result of results) {
    if (result.status === "rejected") console.error("Appointment e-mail failed", result.reason);
  }
}
