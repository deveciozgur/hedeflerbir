import "server-only";
import { db } from "@/server/db";
import { fullName, splitTags } from "@/lib/utils";
import { percentage } from "../domain/analytics";

export interface Distribution {
  label: string;
  value: number;
}

const tally = (values: Array<string | null | undefined>, empty = "Belirtilmemiş"): Distribution[] => {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = raw?.trim() || empty;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "tr"));
};

export interface ProgramReports {
  participants: number;
  demographics: { departments: Distribution[]; cities: Distribution[]; teams: Distribution[] };
  attendance: Array<{ id: string; title: string; date: Date; present: number; counted: number; rate: number | null }>;
  overallAttendance: number | null;
  mentoring: {
    byTeam: Array<{ team: string; completed: number; cancelled: number; upcoming: number }>;
    completed: number;
    total: number;
  };
  expertise: { instructors: Distribution[]; mentors: Distribution[] };
}

export async function getProgramReports(now: Date = new Date()): Promise<ProgramReports> {
  const [students, sessions, appointments, experts] = await Promise.all([
    db.user.findMany({
      where: { role: "STUDENT", isActive: true },
      select: { profile: { select: { department: true, city: true } }, team: { select: { name: true } } },
    }),
    db.courseSession.findMany({
      where: { scheduleDate: { lt: now }, course: { status: { not: "DRAFT" } } },
      orderBy: { scheduleDate: "asc" },
      select: { id: true, title: true, scheduleDate: true, attendances: { select: { status: true } } },
    }),
    db.appointment.findMany({
      select: { status: true, slot: { select: { endTime: true } }, team: { select: { name: true } }, student: { select: { name: true, surname: true } } },
    }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "MENTOR"] }, isActive: true },
      select: { role: true, profile: { select: { expertiseArea: true } } },
    }),
  ]);

  const attendance = sessions.map((s) => {
    const counted = s.attendances.filter((a) => a.status !== "EXCUSED");
    const present = counted.filter((a) => a.status === "PRESENT").length;
    return { id: s.id, title: s.title, date: s.scheduleDate, present, counted: counted.length, rate: percentage(present, counted.length) };
  });
  const totals = attendance.reduce((acc, a) => ({ present: acc.present + a.present, counted: acc.counted + a.counted }), { present: 0, counted: 0 });

  const byTeam = new Map<string, { team: string; completed: number; cancelled: number; upcoming: number }>();
  for (const a of appointments) {
    const team = a.team?.name ?? fullName(a.student);
    const row = byTeam.get(team) ?? { team, completed: 0, cancelled: 0, upcoming: 0 };
    if (a.status === "COMPLETED") row.completed++;
    else if (a.status === "CANCELLED") row.cancelled++;
    else if (a.slot.endTime > now) row.upcoming++;
    byTeam.set(team, row);
  }

  const expertiseOf = (role: "INSTRUCTOR" | "MENTOR") => tally(experts.filter((e) => e.role === role).flatMap((e) => splitTags(e.profile?.expertiseArea)));

  return {
    participants: students.length,
    demographics: {
      departments: tally(students.map((s) => s.profile?.department)),
      cities: tally(students.map((s) => s.profile?.city)),
      teams: tally(students.map((s) => s.team?.name), "Takımsız"),
    },
    attendance,
    overallAttendance: percentage(totals.present, totals.counted),
    mentoring: {
      byTeam: [...byTeam.values()].sort((a, b) => b.completed - a.completed || a.team.localeCompare(b.team, "tr")),
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      total: appointments.filter((a) => a.status !== "CANCELLED").length,
    },
    expertise: { instructors: expertiseOf("INSTRUCTOR"), mentors: expertiseOf("MENTOR") },
  };
}
