import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { Role } from "@/modules/identity/domain/role";
import type { PersonRecord, PersonSummary } from "../domain/person";

const personSelect = {
  id: true,
  name: true,
  surname: true,
  avatarUrl: true,
  role: true,
  profile: { select: { school: true, department: true, bio: true, title: true, expertiseArea: true } },
} satisfies Prisma.UserSelect;

type PersonRow = Prisma.UserGetPayload<{ select: typeof personSelect }>;

const toSummary = ({ profile, ...user }: PersonRow): PersonSummary => ({
  ...user,
  school: profile?.school ?? null,
  department: profile?.department ?? null,
  about: profile?.bio ?? null,
  title: profile?.title ?? null,
  expertiseArea: profile?.expertiseArea ?? null,
});

const byName = [{ name: "asc" as const }, { surname: "asc" as const }];

/** Active users of one role, e.g. all participants or mentors; `exceptId` leaves the viewer out. */
export async function listPeople(role: Role, exceptId?: string): Promise<PersonSummary[]> {
  const rows = await db.user.findMany({
    where: { role, isActive: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    orderBy: byName,
    select: personSelect,
  });
  return rows.map(toSummary);
}

export interface MyTeam {
  name: string;
  /** "Projede çözmek istediğiniz sorun" */
  focusArea: string | null;
  representative: PersonSummary | null;
  /** Every active member, the viewer included. */
  members: PersonSummary[];
}

/** The student's team ("Ekibim", read-only); null when the student has no team yet. */
export async function getMyTeam(studentId: string): Promise<MyTeam | null> {
  const me = await db.user.findUnique({ where: { id: studentId }, select: { teamId: true } });
  if (!me?.teamId) return null;
  const team = await db.team.findUnique({
    where: { id: me.teamId },
    select: {
      name: true,
      focusArea: true,
      representative: { select: personSelect },
      members: { where: { isActive: true }, orderBy: byName, select: personSelect },
    },
  });
  if (!team) return null;
  return {
    name: team.name,
    focusArea: team.focusArea,
    representative: team.representative ? toSummary(team.representative) : null,
    members: team.members.map(toSummary),
  };
}

export interface AdminParticipant extends PersonRecord {
  /** Badges currently held (UserBadge rows), for the manual award panel. */
  badgeCodes: string[];
}

export async function listParticipantsForAdmin(): Promise<AdminParticipant[]> {
  const rows = await db.user.findMany({
    where: { role: "STUDENT", isActive: true },
    orderBy: byName,
    select: {
      ...personSelect,
      email: true,
      profile: { select: { ...personSelect.profile.select, city: true, goals: true, socialLinks: true } },
      team: { select: { name: true, focusArea: true } },
      representedTeam: { select: { id: true } },
      badges: { select: { badge: { select: { code: true } } } },
      attendances: {
        where: { session: { course: { status: { not: "DRAFT" } } } },
        orderBy: { session: { scheduleDate: "desc" } },
        take: 12,
        select: { status: true, session: { select: { title: true, scheduleDate: true } } },
      },
    },
  });
  return rows.map(({ email, profile, team, representedTeam, badges, attendances, ...row }) => {
    const links = (profile?.socialLinks ?? {}) as Record<string, unknown>;
    return {
      ...toSummary({ ...row, profile }),
      email,
      city: profile?.city ?? null,
      goals: profile?.goals ?? null,
      socialLinks: Object.fromEntries(Object.entries(links).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")),
      team,
      isRepresentative: representedTeam !== null,
      attendance: attendances.map((a) => ({ title: a.session.title, date: a.session.scheduleDate, status: a.status })),
      badgeCodes: badges.map((b) => b.badge.code),
    };
  });
}
