import type { CalendarEvent } from "@/lib/calendar";

export function appointmentCalendarEvent(appointment: {
  id: string;
  startTime: Date;
  endTime: Date;
  meetingLink: string | null;
  /** The other participant, as the viewer sees it. */
  withName: string;
}): CalendarEvent {
  return {
    uid: `appointment-${appointment.id}`,
    title: `Mentorluk seansı · ${appointment.withName}`,
    start: appointment.startTime,
    end: appointment.endTime,
    description: "HedeflerBir mentorluk görüşmesi",
    location: appointment.meetingLink,
  };
}

export const appointmentIcsHref = (appointmentId: string) => `/api/calendar/appointment/${appointmentId}`;
