import { db } from "@/server/db";
import { getSessionUser } from "@/server/auth/guards";
import { buildIcs } from "@/lib/calendar";
import { sessionCalendarEvent } from "@/modules/learning/domain/calendar-event";

/** .ics for a live session: enrolled students, the course instructor or an admin. */
export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { sessionId } = await params;
  const session = await db.courseSession.findFirst({
    where: {
      id: sessionId,
      ...(user.role === "ADMIN"
        ? {}
        : { course: { OR: [{ instructorId: user.id }, { enrollments: { some: { studentId: user.id } } }] } }),
    },
    select: { id: true, title: true, scheduleDate: true, durationMinutes: true, meetingUrl: true, course: { select: { title: true } } },
  });
  if (!session) return new Response("Not found", { status: 404 });

  const ics = buildIcs(sessionCalendarEvent({ ...session, courseTitle: session.course.title }));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hedeflerbir-ders-${session.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
