import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { Role } from "@/modules/identity/domain/role";
import type { PersonSummary } from "../domain/person";

const personSelect = {
  id: true,
  name: true,
  surname: true,
  avatarUrl: true,
  role: true,
  profile: { select: { department: true, city: true, bio: true, title: true, expertiseArea: true } },
  team: { select: { name: true, focusArea: true } },
} satisfies Prisma.UserSelect;

type PersonRow = Prisma.UserGetPayload<{ select: typeof personSelect }>;

const toSummary = ({ profile, team, ...user }: PersonRow): PersonSummary => ({
  ...user,
  department: profile?.department ?? null,
  city: profile?.city ?? null,
  about: profile?.bio ?? null,
  title: profile?.title ?? null,
  expertiseArea: profile?.expertiseArea ?? null,
  team,
});

const byName = [{ name: "asc" as const }, { surname: "asc" as const }];

/** Active users of one role, e.g. all participants or mentors (admin views). */
export async function listPeople(role: Role): Promise<PersonSummary[]> {
  const rows = await db.user.findMany({ where: { role, isActive: true }, orderBy: byName, select: personSelect });
  return rows.map(toSummary);
}

/** Participants enrolled in any of the instructor's courses. */
export async function listInstructorParticipants(instructorId: string): Promise<PersonSummary[]> {
  const rows = await db.user.findMany({
    where: { role: "STUDENT", isActive: true, enrollments: { some: { course: { instructorId } } } },
    orderBy: byName,
    select: personSelect,
  });
  return rows.map(toSummary);
}

/** The student's team and teammates ("Ekibim"); null when the student has no team yet. */
export async function getMyTeam(studentId: string): Promise<{ name: string; focusArea: string | null; members: PersonSummary[] } | null> {
  const me = await db.user.findUnique({ where: { id: studentId }, select: { team: { select: { id: true, name: true, focusArea: true } } } });
  if (!me?.team) return null;
  const rows = await db.user.findMany({
    where: { teamId: me.team.id, isActive: true, id: { not: studentId } },
    orderBy: byName,
    select: personSelect,
  });
  return { name: me.team.name, focusArea: me.team.focusArea, members: rows.map(toSummary) };
}

export interface AdminParticipant extends PersonSummary {
  teamId: string | null;
  /** Badges currently held (UserBadge rows), for the manual award panel. */
  badgeCodes: string[];
}

export async function listParticipantsForAdmin(): Promise<AdminParticipant[]> {
  const rows = await db.user.findMany({
    where: { role: "STUDENT", isActive: true },
    orderBy: byName,
    select: { ...personSelect, teamId: true, badges: { select: { badge: { select: { code: true } } } } },
  });
  return rows.map(({ teamId, badges, ...row }) => ({ ...toSummary(row), teamId, badgeCodes: badges.map((b) => b.badge.code) }));
}
