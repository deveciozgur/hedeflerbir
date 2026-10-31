import "server-only";
import { db } from "@/server/db";
import { BADGES, EARLY_SUBMISSION_HOURS, earnedBadgeCodes, type StudentStats } from "../domain/badges";

const HOUR = 3_600_000;

export async function computeStudentStats(studentId: string): Promise<StudentStats> {
  const [submissions, attendances, watched, mentorSessions, completedProjects] = await Promise.all([
    db.submission.findMany({
      where: { studentId },
      select: { status: true, grade: true, submittedAt: true, assignment: { select: { dueDate: true, maxScore: true } } },
    }),
    db.sessionAttendance.findMany({ where: { studentId }, select: { status: true } }),
    db.lessonView.count({ where: { userId: studentId, completed: true } }),
    db.appointment.count({ where: { studentId, status: "COMPLETED" } }),
    db.studentProjectProgress.count({ where: { studentId, OR: [{ status: "COMPLETED" }, { completionPercentage: { gte: 100 } }] } }),
  ]);

  const counted = attendances.filter((a) => a.status !== "EXCUSED");
  return {
    submitted: submissions.length,
    earlySubmissions: submissions.filter(
      (s) => s.assignment.dueDate.getTime() - s.submittedAt.getTime() >= EARLY_SUBMISSION_HOURS * HOUR,
    ).length,
    gradedPercentages: submissions
      .filter((s) => s.status === "GRADED" && s.grade !== null)
      .map((s) => ((s.grade ?? 0) / s.assignment.maxScore) * 100),
    attendance: { present: counted.filter((a) => a.status === "PRESENT").length, counted: counted.length },
    watchedRecordings: watched,
    completedMentorSessions: mentorSessions,
    completedProjects,
  };
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
