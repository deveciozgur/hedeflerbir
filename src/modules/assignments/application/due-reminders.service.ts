import "server-only";
import { db } from "@/server/db";

const DUE_SOON_MS = 48 * 60 * 60 * 1000;

/**
 * "Assignment due soon" notifications without a scheduler: run when the student opens the dashboard,
 * one reminder per (student, assignment), only for assignments due in the next 48 hours and not yet submitted.
 */
export async function remindDueAssignments(studentId: string): Promise<void> {
  const now = new Date();
  const due = await db.assignment.findMany({
    where: {
      dueDate: { gt: now, lte: new Date(now.getTime() + DUE_SOON_MS) },
      course: { status: { not: "DRAFT" }, enrollments: { some: { studentId, status: "ACTIVE" } } },
      submissions: { none: { studentId } },
    },
    select: { id: true, title: true },
  });
  if (due.length === 0) return;

  const hrefs = due.map((a) => `/assignments/${a.id}`);
  const already = await db.notification.findMany({
    where: { userId: studentId, type: "ASSIGNMENT_DUE", href: { in: hrefs } },
    select: { href: true },
  });
  const sent = new Set(already.map((n) => n.href));
  const fresh = due.filter((a) => !sent.has(`/assignments/${a.id}`));
  if (fresh.length === 0) return;

  await db.notification.createMany({
    data: fresh.map((a) => ({
      userId: studentId,
      type: "ASSIGNMENT_DUE" as const,
      title: "Ödev teslimi yaklaşıyor",
      body: `${a.title} için son 48 saat.`,
      href: `/assignments/${a.id}`,
    })),
  });
}
