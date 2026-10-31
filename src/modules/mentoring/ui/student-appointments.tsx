"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import { AddToCalendar } from "@/components/ui/add-to-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime, formatTime } from "@/lib/format";
import { fullName } from "@/lib/utils";
import { cancelAppointmentAction } from "../application/mentoring.actions";
import type { StudentAppointment } from "../application/mentor-directory.queries";
import { canCancel, CANCELLATION_CUTOFF_HOURS } from "../domain/appointment-policy";
import { appointmentCalendarEvent, appointmentIcsHref } from "../domain/calendar-event";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

export function StudentAppointments({ appointments }: { appointments: StudentAppointment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yaklaşan seansların</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {appointments.map((a) => {
            const cancellable = canCancel({ status: "CONFIRMED", startTime: a.startTime }).allowed;
            return (
              <li key={a.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <Link href={`/mentors/${a.mentor.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <UserAvatar user={a.mentor} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{fullName(a.mentor)}</span>
                    <time dateTime={a.startTime.toISOString()} className="block text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(a.startTime)} - {formatTime(a.endTime)}
                    </time>
                  </span>
                </Link>
                <div className="flex flex-wrap gap-2">
                  <AddToCalendar
                    event={appointmentCalendarEvent({ id: a.id, startTime: a.startTime, endTime: a.endTime, meetingLink: a.meetingLink, withName: fullName(a.mentor) })}
                    icsHref={appointmentIcsHref(a.id)}
                  />
                  {a.meetingLink ? (
                    <Button asChild size="sm" variant="secondary">
                      <a href={a.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Video aria-hidden /> Katıl
                      </a>
                    </Button>
                  ) : null}
                  {cancellable ? (
                    <ConfirmActionButton
                      label="İptal et"
                      title="Seansı iptal et"
                      description={`${fullName(a.mentor)} ile ${formatDateTime(a.startTime)} tarihindeki seansın iptal edilecek ve mentora bildirim gönderilecek.`}
                      confirmLabel="Seansı iptal et"
                      successMessage="Seans iptal edildi"
                      destructive
                      action={() => cancelAppointmentAction(a.id)}
                    />
                  ) : (
                    <span className="self-center text-xs text-muted-foreground">
                      Son {CANCELLATION_CUTOFF_HOURS} saatte iptal edilemez
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
