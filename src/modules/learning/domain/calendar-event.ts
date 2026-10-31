import type { CalendarEvent } from "@/lib/calendar";
import { sessionEnd } from "./curriculum";

export function sessionCalendarEvent(session: {
  id: string;
  title: string;
  scheduleDate: Date;
  durationMinutes: number;
  meetingUrl: string | null;
  courseTitle: string;
}): CalendarEvent {
  return {
    uid: `session-${session.id}`,
    title: `${session.title} · ${session.courseTitle}`,
    start: session.scheduleDate,
    end: sessionEnd(session),
    description: `HedeflerBir canlı dersi: ${session.courseTitle}`,
    location: session.meetingUrl,
  };
}

export const sessionIcsHref = (sessionId: string) => `/api/calendar/session/${sessionId}`;
