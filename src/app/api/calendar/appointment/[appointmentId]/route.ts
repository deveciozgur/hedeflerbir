import { db } from "@/server/db";
import { getSessionUser } from "@/server/auth/guards";
import { buildIcs } from "@/lib/calendar";
import { fullName } from "@/lib/utils";
import { appointmentCalendarEvent } from "@/modules/mentoring/domain/calendar-event";

/** .ics for a mentoring appointment: only its student or mentor. */
export async function GET(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { appointmentId } = await params;
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, status: "CONFIRMED", OR: [{ studentId: user.id }, { mentorId: user.id }] },
    select: {
      id: true,
      meetingLink: true,
      studentId: true,
      slot: { select: { startTime: true, endTime: true } },
      student: { select: { name: true, surname: true } },
      mentor: { select: { name: true, surname: true } },
    },
  });
  if (!appointment) return new Response("Not found", { status: 404 });

  const withName = fullName(appointment.studentId === user.id ? appointment.mentor : appointment.student);
  const ics = buildIcs(appointmentCalendarEvent({ id: appointment.id, ...appointment.slot, meetingLink: appointment.meetingLink, withName }));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hedeflerbir-seans-${appointment.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
