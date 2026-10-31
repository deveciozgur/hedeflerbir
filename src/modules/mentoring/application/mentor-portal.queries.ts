import "server-only";
import { db } from "@/server/db";
import type { AppointmentStatus } from "../domain/appointment-policy";

const SCHEDULE_HORIZON_DAYS = 60;

export interface MentorSlotRow {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  bookedBy: string | null;
}

export async function getMentorSchedule(mentorId: string): Promise<MentorSlotRow[]> {
  const now = new Date();
  const slots = await db.mentorSlot.findMany({
    where: { mentorId, endTime: { gt: now }, startTime: { lte: new Date(now.getTime() + SCHEDULE_HORIZON_DAYS * 86_400_000) } },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      isBooked: true,
      appointments: {
        where: { status: "CONFIRMED" },
        take: 1,
        select: { student: { select: { name: true, surname: true } } },
      },
    },
  });

  return slots.map(({ appointments, ...slot }) => {
    const student = appointments[0]?.student;
    return { ...slot, bookedBy: student ? `${student.name} ${student.surname}` : null };
  });
}

export interface StudentBrief {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  goals: string | null;
  projects: Array<{ title: string; completionPercentage: number }>;
  submissions: { submitted: number; graded: number; averagePercentage: number | null };
}

export interface MentorAppointmentRow {
  id: string;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  meetingLink: string | null;
  notes: string | null;
  student: StudentBrief;
}

export type AppointmentPhase = "upcoming" | "past";

/** Appointments with a pre-session student brief: goals, project progress and assignment performance. */
export async function getMentorAppointments(mentorId: string, phase: AppointmentPhase): Promise<MentorAppointmentRow[]> {
  const now = new Date();
  const rows = await db.appointment.findMany({
    where:
      phase === "upcoming"
        ? { mentorId, status: "CONFIRMED", slot: { endTime: { gt: now } } }
        : { mentorId, OR: [{ status: { not: "CONFIRMED" } }, { slot: { endTime: { lte: now } } }] },
    orderBy: { slot: { startTime: phase === "upcoming" ? "asc" : "desc" } },
    take: phase === "past" ? 50 : undefined,
    select: {
      id: true,
      status: true,
      meetingLink: true,
      notes: true,
      slot: { select: { startTime: true, endTime: true } },
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          avatarUrl: true,
          profile: { select: { goals: true } },
          projectProgress: {
            orderBy: { project: { endDate: "asc" } },
            select: { completionPercentage: true, project: { select: { title: true } } },
          },
          submissions: { select: { status: true, grade: true, assignment: { select: { maxScore: true } } } },
        },
      },
    },
  });

  return rows.map(({ slot, student, ...appointment }) => {
    const graded = student.submissions.filter((s) => s.status === "GRADED" && s.grade !== null);
    const averagePercentage = graded.length
      ? Math.round(graded.reduce((sum, s) => sum + ((s.grade ?? 0) / s.assignment.maxScore) * 100, 0) / graded.length)
      : null;

    return {
      ...appointment,
      startTime: slot.startTime,
      endTime: slot.endTime,
      student: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        email: student.email,
        avatarUrl: student.avatarUrl,
        goals: student.profile?.goals ?? null,
        projects: student.projectProgress.map((p) => ({ title: p.project.title, completionPercentage: p.completionPercentage })),
        submissions: { submitted: student.submissions.length, graded: graded.length, averagePercentage },
      },
    };
  });
}

export interface MentorOverview {
  upcomingCount: number;
  openSlotCount: number;
  completedThisMonth: number;
  next: MentorAppointmentRow[];
}

export async function getMentorOverview(mentorId: string): Promise<MentorOverview> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [upcoming, openSlotCount, completedThisMonth] = await Promise.all([
    getMentorAppointments(mentorId, "upcoming"),
    db.mentorSlot.count({ where: { mentorId, isBooked: false, startTime: { gt: now } } }),
    db.appointment.count({ where: { mentorId, status: "COMPLETED", slot: { startTime: { gte: monthStart } } } }),
  ]);
  return { upcomingCount: upcoming.length, openSlotCount, completedThisMonth, next: upcoming.slice(0, 3) };
}
