import "server-only";
import { db } from "@/server/db";
import { BADGES, badgeProgress, earnedBadgeCodes, type BadgeIcon, type StudentStats } from "../domain/badges";

export async function computeStudentStats(studentId: string): Promise<StudentStats> {
  const me = await db.user.findUnique({ where: { id: studentId }, select: { teamId: true } });
  const [attendances, mentorSessions] = await Promise.all([
    db.sessionAttendance.findMany({ where: { studentId }, select: { status: true, session: { select: { badgeCode: true } } } }),
    // A team's mentoring session counts for every member of that team.
    db.appointment.count({
      where: { status: "COMPLETED", OR: [{ studentId }, ...(me?.teamId ? [{ teamId: me.teamId }] : [])] },
    }),
  ]);

  const counted = attendances.filter((a) => a.status !== "EXCUSED");
  return {
    attendedBadgeCodes: attendances.flatMap((a) => (a.status === "PRESENT" && a.session.badgeCode ? [a.session.badgeCode] : [])),
    completedMentorSessions: mentorSessions,
    attendance: { present: counted.filter((a) => a.status === "PRESENT").length, counted: counted.length },
  };
}

export interface BadgeView {
  code: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  awardedAt: Date | null;
  progress: number;
}

/** All programme badges in catalog order, earned (with date) or locked (with progress). */
export async function getBadgeShowcase(studentId: string): Promise<{ badges: BadgeView[]; stats: StudentStats }> {
  const [awarded, stats] = await Promise.all([
    db.userBadge.findMany({ where: { userId: studentId }, select: { awardedAt: true, badge: { select: { code: true } } } }),
    computeStudentStats(studentId),
  ]);
  const awardedAt = new Map(awarded.map((b) => [b.badge.code, b.awardedAt]));
  return {
    stats,
    badges: BADGES.map((b) => ({
      code: b.code,
      name: b.name,
      description: b.description,
      icon: b.icon,
      awardedAt: awardedAt.get(b.code) ?? null,
      progress: awardedAt.has(b.code) ? 1 : badgeProgress(b, stats),
    })),
  };
}

/** Grants (or, for admins correcting a mistake, revokes) one badge by hand. */
export async function setBadge(studentId: string, code: string, awarded: boolean): Promise<void> {
  const badge = BADGES.find((b) => b.code === code);
  if (!badge) throw new Error(`Unknown badge ${code}`);
  const row = await db.badge.upsert({
    where: { code },
    create: { code, name: badge.name, description: badge.description, icon: badge.icon },
    update: { name: badge.name, description: badge.description, icon: badge.icon },
    select: { id: true },
  });
  if (!awarded) {
    await db.userBadge.deleteMany({ where: { userId: studentId, badgeId: row.id } });
    return;
  }
  const existing = await db.userBadge.findUnique({ where: { userId_badgeId: { userId: studentId, badgeId: row.id } } });
  if (existing) return;
  await db.$transaction([
    db.userBadge.create({ data: { userId: studentId, badgeId: row.id } }),
    db.notification.create({ data: { userId: studentId, type: "SYSTEM", title: `Yeni rozet: ${badge.name}`, body: badge.description, href: "/profile" } }),
  ]);
}

/**
 * Evaluates the catalog for one student and grants anything newly earned (with a notification).
 * Idempotent and append-only: badges are never revoked, so re-grading can't take one away.
 * Call it after the triggering mutation, typically inside `after()`.
 */
export async function awardBadges(studentId: string): Promise<string[]> {
  const student = await db.user.findFirst({ where: { id: studentId, role: "STUDENT" }, select: { id: true } });
  if (!student) return [];

  const earned = earnedBadgeCodes(await computeStudentStats(studentId));
  if (earned.length === 0) return [];

  const held = new Set(
    (await db.userBadge.findMany({ where: { userId: studentId }, select: { badge: { select: { code: true } } } })).map((b) => b.badge.code),
  );
  const fresh = BADGES.filter((b) => earned.includes(b.code) && !held.has(b.code));
  if (fresh.length === 0) return [];

  await db.$transaction(async (tx) => {
    for (const badge of fresh) {
      const row = await tx.badge.upsert({
        where: { code: badge.code },
        create: { code: badge.code, name: badge.name, description: badge.description, icon: badge.icon },
        update: { name: badge.name, description: badge.description, icon: badge.icon },
        select: { id: true },
      });
      await tx.userBadge.upsert({
        where: { userId_badgeId: { userId: studentId, badgeId: row.id } },
        create: { userId: studentId, badgeId: row.id },
        update: {},
      });
    }
    await tx.notification.createMany({
      data: fresh.map((badge) => ({
        userId: studentId,
        type: "SYSTEM" as const,
        title: `Yeni rozet: ${badge.name}`,
        body: badge.description,
        href: "/profile",
      })),
    });
  });

  return fresh.map((b) => b.code);
}

/** Fire-and-forget wrapper for `after()` callbacks — badge failures must never surface to the user. */
export async function awardBadgesSafely(studentIds: readonly string[]): Promise<void> {
  for (const id of studentIds) {
    await awardBadges(id).catch((error: unknown) => console.error("Badge evaluation failed", id, error));
  }
}
