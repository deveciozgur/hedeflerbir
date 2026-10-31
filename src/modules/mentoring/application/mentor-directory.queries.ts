import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { parseSocialLinks } from "@/modules/identity/domain/profile";
import { BOOKING_HORIZON_DAYS } from "../domain/availability";
import { topUpTemplateSlots } from "./weekly-availability.service";

const horizon = (now: Date) => new Date(now.getTime() + BOOKING_HORIZON_DAYS * 86_400_000);
/** Every future slot in the booking window, booked or not; bookings expose only a flag, never who. */
const visibleSlots = (now: Date) => ({ startTime: { gt: now, lte: horizon(now) } });

export interface BookableSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface MentorProfileModel {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  title: string | null;
  expertiseArea: string | null;
  bio: string | null;
  socialLinks: ReturnType<typeof parseSocialLinks>;
  slots: BookableSlot[];
  nextAvailable: Date | null;
  openSlotCount: number;
}

const mentorSelect = (now: Date) =>
  ({
    id: true,
    name: true,
    surname: true,
    email: true,
    avatarUrl: true,
    profile: { select: { title: true, expertiseArea: true, bio: true, socialLinks: true } },
    mentorSlots: {
      where: visibleSlots(now),
      orderBy: { startTime: "asc" },
      select: { id: true, startTime: true, endTime: true, isBooked: true },
    },
  }) as const;

type MentorRow = {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatarUrl: string | null;
  profile: { title: string | null; expertiseArea: string | null; bio: string | null; socialLinks: unknown } | null;
  mentorSlots: BookableSlot[];
};

function toModel(m: MentorRow): MentorProfileModel {
  const open = m.mentorSlots.filter((s) => !s.isBooked);
  return {
    id: m.id,
    name: m.name,
    surname: m.surname,
    email: m.email,
    avatarUrl: m.avatarUrl,
    title: m.profile?.title ?? null,
    expertiseArea: m.profile?.expertiseArea ?? null,
    bio: m.profile?.bio ?? null,
    socialLinks: parseSocialLinks(m.profile?.socialLinks),
    slots: m.mentorSlots,
    nextAvailable: open[0]?.startTime ?? null,
    openSlotCount: open.length,
  };
}

/** Directory payload: everything the card and its booking modal need, so opening a mentor costs no round-trip. */
export async function listMentors(): Promise<MentorProfileModel[]> {
  await topUpTemplateSlots();
  const now = new Date();
  const mentors = await db.user.findMany({
    where: { role: "MENTOR", isActive: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
    select: mentorSelect(now),
  });
  return mentors.map(toModel);
}

export async function getMentorDetail(mentorId: string): Promise<MentorProfileModel> {
  await topUpTemplateSlots([mentorId]);
  const mentor = await db.user.findFirst({
    where: { id: mentorId, role: "MENTOR", isActive: true },
    select: mentorSelect(new Date()),
  });
  if (!mentor) notFound();
  return toModel(mentor);
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
