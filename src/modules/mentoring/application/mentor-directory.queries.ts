import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { parseSocialLinks } from "@/modules/identity/domain/profile";
import { BOOKING_HORIZON_DAYS } from "../domain/availability";

const horizon = (now: Date) => new Date(now.getTime() + BOOKING_HORIZON_DAYS * 86_400_000);
const openSlots = (now: Date) => ({ isBooked: false, startTime: { gt: now, lte: horizon(now) } });

export interface MentorCardModel {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
  title: string | null;
  expertiseArea: string | null;
  nextAvailable: Date | null;
  openSlotCount: number;
}

export async function listMentors(): Promise<MentorCardModel[]> {
  const now = new Date();
  const mentors = await db.user.findMany({
    where: { role: "MENTOR", isActive: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: {
      id: true,
      name: true,
      surname: true,
      avatarUrl: true,
      profile: { select: { title: true, expertiseArea: true } },
      mentorSlots: { where: openSlots(now), orderBy: { startTime: "asc" }, take: 1, select: { startTime: true } },
      _count: { select: { mentorSlots: { where: openSlots(now) } } },
    },
  });

  return mentors.map((m) => ({
    id: m.id,
    name: m.name,
    surname: m.surname,
    avatarUrl: m.avatarUrl,
    title: m.profile?.title ?? null,
    expertiseArea: m.profile?.expertiseArea ?? null,
    nextAvailable: m.mentorSlots[0]?.startTime ?? null,
    openSlotCount: m._count.mentorSlots,
  }));
}

export interface OpenSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

export interface MentorDetail {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  title: string | null;
  expertiseArea: string | null;
  bio: string | null;
  socialLinks: ReturnType<typeof parseSocialLinks>;
  slots: OpenSlot[];
}

export async function getMentorDetail(mentorId: string): Promise<MentorDetail> {
  const now = new Date();
  const mentor = await db.user.findFirst({
    where: { id: mentorId, role: "MENTOR", isActive: true },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      avatarUrl: true,
      profile: { select: { title: true, expertiseArea: true, bio: true, socialLinks: true } },
      mentorSlots: {
        where: openSlots(now),
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, endTime: true },
      },
    },
  });
  if (!mentor) notFound();

  return {
    id: mentor.id,
    name: mentor.name,
    surname: mentor.surname,
    email: mentor.email,
    avatarUrl: mentor.avatarUrl,
    title: mentor.profile?.title ?? null,
    expertiseArea: mentor.profile?.expertiseArea ?? null,
    bio: mentor.profile?.bio ?? null,
    socialLinks: parseSocialLinks(mentor.profile?.socialLinks),
    slots: mentor.mentorSlots,
  };
}

export interface StudentAppointment {
  id: string;
  startTime: Date;
  endTime: Date;
  meetingLink: string | null;
  mentor: { id: string; name: string; surname: string; avatarUrl: string | null };
}

export async function getStudentUpcomingAppointments(studentId: string): Promise<StudentAppointment[]> {
  const rows = await db.appointment.findMany({
    where: { studentId, status: "CONFIRMED", slot: { endTime: { gt: new Date() } } },
    orderBy: { slot: { startTime: "asc" } },
    select: {
      id: true,
      meetingLink: true,
      slot: { select: { startTime: true, endTime: true } },
      mentor: { select: { id: true, name: true, surname: true, avatarUrl: true } },
    },
  });
  return rows.map(({ slot, ...rest }) => ({ ...rest, startTime: slot.startTime, endTime: slot.endTime }));
}
