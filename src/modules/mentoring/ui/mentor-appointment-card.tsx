"use client";

import { CheckCircle2, Mail, Target, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

/** Appointment with the pre-session student brief (goals, projects, assignment performance). */
export function MentorAppointmentCard({ appointment: a }: { appointment: MentorAppointmentRow }) {
  const { student } = a;
  const cancellable = canCancel(a).allowed;
  const completable = canComplete(a).allowed;

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={student} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{fullName(student)}</p>
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
              <Target className="size-3.5" aria-hidden /> Hedefleri
            </h3>
            <p className="text-sm text-pretty">{student.goals ?? "Katılımcı henüz hedef eklemedi."}</p>
            {a.notes ? (
              <div className="mt-2 rounded-lg bg-muted/60 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Seans için notu</p>
                <p className="text-sm whitespace-pre-wrap">{a.notes}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-medium text-muted-foreground">İlerleme</h3>
            {student.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Dahil olduğu proje yok.</p>
            ) : (
              student.projects.map((project) => (
                <div key={project.title} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="truncate">{project.title}</span>
                    <span className="tabular-nums text-muted-foreground">%{project.completionPercentage}</span>
                  </div>
                  <Progress value={project.completionPercentage} aria-label={`${project.title} ilerlemesi`} />
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              {student.submissions.submitted} ödev teslimi · {student.submissions.graded} değerlendirildi
              {student.submissions.averagePercentage !== null ? ` · ort. %${student.submissions.averagePercentage}` : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          {a.status === "CONFIRMED" && a.meetingLink ? (
            <Button asChild size="sm" variant="brand">
              <a href={a.meetingLink} target="_blank" rel="noopener noreferrer">
                <Video aria-hidden /> Görüşmeye katıl
              </a>
            </Button>
          ) : null}
          {a.status === "CONFIRMED" && a.startTime > new Date() ? (
            <AddToCalendar
              event={appointmentCalendarEvent({ id: a.id, startTime: a.startTime, endTime: a.endTime, meetingLink: a.meetingLink, withName: fullName(student) })}
              icsHref={appointmentIcsHref(a.id)}
            />
          ) : null}
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${student.email}`}>
              <Mail aria-hidden /> E-posta
            </a>
          </Button>
          {completable ? (
            <AppointmentActionButton kind="complete" name={fullName(student)} action={() => completeAppointmentAction(a.id)} />
          ) : null}
          {cancellable ? (
            <AppointmentActionButton kind="cancel" name={fullName(student)} action={() => cancelAppointmentAction(a.id)} />
          ) : null}
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
