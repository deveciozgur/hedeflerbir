import "server-only";
import { db } from "@/server/db";

export interface TeamMemberOption {
  id: string;
  name: string;
  surname: string;
  avatarUrl: string | null;
}

export interface TeamRow {
  id: string;
  name: string;
  /** "Projede çözmek istediğiniz sorun" */
  focusArea: string | null;
  representativeId: string | null;
  members: TeamMemberOption[];
  completedSessions: number;
}

const memberSelect = { id: true, name: true, surname: true, avatarUrl: true } as const;
const byName = [{ name: "asc" as const }, { surname: "asc" as const }];

export async function listTeams(): Promise<TeamRow[]> {
  const rows = await db.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      focusArea: true,
      representativeId: true,
      members: { where: { isActive: true }, orderBy: byName, select: memberSelect },
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
    },
  });
  return rows.map(({ _count, ...team }) => ({ ...team, completedSessions: _count.appointments }));
}

export interface TeamCandidate extends TeamMemberOption {
  teamId: string | null;
}

/** Every active participant, with their current team, for the members picker. */
export const listTeamCandidates = (): Promise<TeamCandidate[]> =>
  db.user.findMany({ where: { role: "STUDENT", isActive: true }, orderBy: byName, select: { ...memberSelect, teamId: true } });
