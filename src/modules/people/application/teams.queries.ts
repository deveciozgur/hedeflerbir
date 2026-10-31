import "server-only";
import { db } from "@/server/db";

export interface TeamRow {
  id: string;
  name: string;
  focusArea: string | null;
  memberCount: number;
  completedSessions: number;
}

export async function listTeams(): Promise<TeamRow[]> {
  const rows = await db.team.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      focusArea: true,
      _count: { select: { members: { where: { isActive: true } }, appointments: { where: { status: "COMPLETED" } } } },
    },
  });
  return rows.map(({ _count, ...team }) => ({ ...team, memberCount: _count.members, completedSessions: _count.appointments }));
}
