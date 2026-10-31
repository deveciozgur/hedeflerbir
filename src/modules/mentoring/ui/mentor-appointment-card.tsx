"use client";

import { CheckCircle2, Mail, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime, formatRelative, formatTime } from "@/lib/format";
import type { ActionResult } from "@/lib/action-result";
import { fullName } from "@/lib/utils";
import { cancelAppointmentAction, completeAppointmentAction } from "../application/mentoring.actions";
import type { MentorAppointmentRow } from "../application/mentor-portal.queries";
import { APPOINTMENT_STATUS_LABELS, canCancel, canComplete } from "../domain/appointment-policy";
import { appointmentCalendarEvent, appointmentIcsHref } from "../domain/calendar-event";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

const STATUS_VARIANT = { CONFIRMED: "brand", COMPLETED: "success", CANCELLED: "outline" } as const;

/** Session card with the requesting team's brief (members, departments, focus area). Sessions run on external links. */
export function MentorAppointmentCard({ appointment: a, showActions = true }: { appointment: MentorAppointmentRow; showActions?: boolean }) {
  const { team } = a;
  const title = team.name ?? fullName(team.members[0] ?? { name: "Katılımcı", surname: "" });
  const cancellable = showActions && canCancel(a).allowed;
  const completable = showActions && canComplete(a).allowed;

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-soft" aria-hidden>
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              <time dateTime={a.startTime.toISOString()}>
                {formatDateTime(a.startTime)} - {formatTime(a.endTime)}
              </time>
              {a.status === "CONFIRMED" ? ` · ${formatRelative(a.startTime)}` : null}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[a.status]}>{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Target className="size-3.5" aria-hidden /> Çalışma alanı
            </h3>
            <p className="text-sm text-pretty">{team.focusArea ?? "Takım çalışma alanını henüz belirtmedi."}</p>
            {a.notes ? (
              <div className="mt-2 rounded-lg bg-muted/60 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Talep notu</p>
                <p className="text-sm whitespace-pre-wrap">{a.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-medium text-muted-foreground">Katılımcılar ({team.members.length})</h3>
            <ul className="flex flex-col gap-2">
              {team.members.map((member) => (
                <li key={member.id} className="flex items-center gap-2.5">
                  <UserAvatar user={member} className="size-7" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{fullName(member)}</span>
                    {member.department ? <span className="block truncate text-xs text-muted-foreground">{member.department}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {a.status === "CONFIRMED" && a.startTime > new Date() ? (
            <AddToCalendar
              event={appointmentCalendarEvent({ id: a.id, startTime: a.startTime, endTime: a.endTime, meetingLink: null, withName: title })}
              icsHref={appointmentIcsHref(a.id)}
            />
          ) : null}
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${team.contactEmail}`}>
              <Mail aria-hidden /> İletişim
            </a>
          </Button>
          {completable ? <AppointmentActionButton kind="complete" name={title} action={() => completeAppointmentAction(a.id)} /> : null}
          {cancellable ? <AppointmentActionButton kind="cancel" name={title} action={() => cancelAppointmentAction(a.id)} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentActionButton({
  kind,
  name,
  action,
}: {
  kind: "complete" | "cancel";
  name: string;
  action: () => Promise<ActionResult>;
}) {
  return kind === "complete" ? (
    <ConfirmActionButton
      label={
        <>
          <CheckCircle2 aria-hidden /> Tamamlandı
        </>
      }
      title="Seansı tamamlandı olarak işaretle"
      description={`${name} ile yapılan seans tamamlandı olarak kaydedilecek ve analitiklere yansıyacak.`}
      confirmLabel="Tamamlandı olarak işaretle"
      successMessage="Seans tamamlandı"
      action={action}
    />
  ) : (
    <ConfirmActionButton
      label="İptal et"
      title="Seansı iptal et"
      description={`${name} ile seans iptal edilecek, slot kapatılacak ve katılımcıya e-posta gönderilecek.`}
      confirmLabel="Seansı iptal et"
      successMessage="Seans iptal edildi"
      destructive
      action={action}
    />
  );
}
