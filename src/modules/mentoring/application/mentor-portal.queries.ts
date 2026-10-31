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

export interface TeamMemberBrief {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  department: string | null;
}

/** The requesting team as the mentor sees it before a session (or the contact alone for a legacy 1:1 booking). */
export interface TeamBrief {
  name: string | null;
  focusArea: string | null;
  contactEmail: string;
  members: TeamMemberBrief[];
}

export interface MentorAppointmentRow {
  id: string;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  mentorName: string;
  team: TeamBrief;
}

export type AppointmentPhase = "upcoming" | "past";

const memberSelect = { id: true, name: true, surname: true, avatarUrl: true, profile: { select: { department: true } } } as const;

/** Appointments with the requesting team's brief: members, departments and focus area. */
export const getMentorAppointments = (mentorId: string, phase: AppointmentPhase) => listAppointments(phase, mentorId);

/** All mentors' sessions (admin) or one mentor's. */
export async function listAppointments(phase: AppointmentPhase, mentorId?: string): Promise<MentorAppointmentRow[]> {
  const now = new Date();
  const byMentor = mentorId ? { mentorId } : {};
  const rows = await db.appointment.findMany({
    where:
      phase === "upcoming"
        ? { ...byMentor, status: "CONFIRMED", slot: { endTime: { gt: now } } }
        : { ...byMentor, OR: [{ status: { not: "CONFIRMED" } }, { slot: { endTime: { lte: now } } }] },
    orderBy: { slot: { startTime: phase === "upcoming" ? "asc" : "desc" } },
    take: phase === "past" ? 50 : undefined,
    select: {
      id: true,
      status: true,
      notes: true,
      slot: { select: { startTime: true, endTime: true } },
      mentor: { select: { name: true, surname: true } },
      student: { select: { email: true, ...memberSelect } },
      team: { select: { name: true, focusArea: true, members: { where: { isActive: true }, orderBy: { name: "asc" }, select: memberSelect } } },
    },
  });

  const toMember = ({ profile, ...m }: { id: string; name: string; surname: string; avatarUrl: string | null; profile: { department: string | null } | null }) => ({
    ...m,
    department: profile?.department ?? null,
  });

  return rows.map(({ slot, student, team, mentor, ...appointment }) => ({
    ...appointment,
    mentorName: `${mentor.name} ${mentor.surname}`,
    startTime: slot.startTime,
    endTime: slot.endTime,
    team: {
      name: team?.name ?? null,
      focusArea: team?.focusArea ?? null,
      contactEmail: student.email,
      members: team ? team.members.map(toMember) : [toMember(student)],
    },
  }));
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
